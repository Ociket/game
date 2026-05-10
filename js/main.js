// js/main.js
import { ModeSelectScene } from './scenes/ModeSelectScene.js';
import { Game } from './engine/Game.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { SkillTreeScene } from './scenes/SkillTreeScene.js';
import { WeaponSelectScene } from './scenes/WeaponSelectScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { DifficultySelectScene } from './scenes/DifficultySelectScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { AchievementsScene } from './scenes/AchievementsScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { AssetLoader } from './engine/AssetLoader.js';
import { loadMetaProgress, loadUnlockedCharacters, initCloudSync } from './data/metaProgress.js';
import { loadFromCloud, initPlayerName } from './data/leaderboard.js';

const canvas = document.getElementById('gameCanvas');
const container = document.getElementById('gameContainer');

if (!canvas || !container) {
    console.error('Canvas или GameContainer не найдены в DOM');
}

const game = new Game(canvas);
window.game = game;

// Обработка кнопки "Назад" на мобильных устройствах
window.addEventListener('popstate', (e) => {
    if (game.currentScene && game.currentScene.togglePause) {
        game.currentScene.togglePause();
        window.history.pushState({}, '');
    }
});
window.history.pushState({}, '');

// Регистрация сцен
game.addScene('menu', new MenuScene(game));
game.addScene('modeSelect', new ModeSelectScene(game));
game.addScene('game', new GameScene(game));
game.addScene('skilltree', new SkillTreeScene(game));
game.addScene('weaponSelect', new WeaponSelectScene(game));
game.addScene('characterSelect', new CharacterSelectScene(game));
game.addScene('difficultySelect', new DifficultySelectScene(game));
game.addScene('settings', new SettingsScene(game));
game.addScene('achievements', new AchievementsScene(game));
game.addScene('tutorial', new TutorialScene(game));

// Определение ориентации экрана
function isPortrait() {
    return window.innerHeight > window.innerWidth;
}

// Установка физического размера канваса
function setCanvasSize() {
    if (isPortrait()) {
        canvas.width = 450;
        canvas.height = 800;
        container.style.width = '450px';
        container.style.height = '800px';
        container.classList.add('portrait');
    } else {
        canvas.width = 800;
        canvas.height = 600;
        container.style.width = '800px';
        container.style.height = '600px';
        container.classList.remove('portrait');
    }
}

// Масштабирование контейнера под окно браузера
function resizeGameContainer() {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    let scale;
    if (isPortrait()) {
        scale = Math.min(maxWidth / 450, maxHeight / 800);
    } else {
        scale = Math.min(maxWidth / 800, maxHeight / 600);
    }
    container.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// Первичная настройка
setCanvasSize();
resizeGameContainer();

// Обработка ресайза окна
window.addEventListener('resize', () => {
    setCanvasSize();
    resizeGameContainer();
    if (game.currentScene && typeof game.currentScene.handleResize === 'function') {
        game.currentScene.handleResize();
    }
});

// Инициализация и запуск игры
(async () => {
    try {
        // 1. Загрузка локальных сохранений
        loadMetaProgress();
        loadUnlockedCharacters();

        // 2. Инициализация звука
        const audioManager = new (await import('./engine/AudioManager.js')).AudioManager();
        await audioManager.init();
        if (window.AudioManager) window.AudioManager.playMusic('menu_theme');

        // 3. Инициализация Yandex SDK
        const sdk = new (await import('./sdk/YandexSDK.js')).YandexSDK();
        await sdk.init();
        game.sdk = sdk;
        // После game.sdk = sdk;
const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
if (!settings.language) {
    settings.language = sdk.lang === 'en' ? 'en' : 'ru'; // sdk.lang уже получен
    localStorage.setItem('pixelSurvivors_settings', JSON.stringify(settings));
}

        // 4. Синхронизация с облаком (основные данные)
        await initCloudSync();

        // 5. Загрузка лидерборда из облака и инициализация имени игрока
        await loadFromCloud();
        await initPlayerName();

        // 6. Загрузка первой темы (фон меню)
        const atlas0 = await AssetLoader.loadTheme('bw');
        window.__themeAtlases = window.__themeAtlases || [];
        window.__themeAtlases[0] = atlas0;

        // 7. Запускаем сцену загрузки, после завершения которой покажем обучение или меню
        import('./scenes/LoadingScene.js').then(({ LoadingScene }) => {
            const tutorialDone = localStorage.getItem('ps_tutorial_done');
            const nextScene = tutorialDone ? 'menu' : 'tutorial';
            const loading = new LoadingScene(game, () => {
                loading.destroy();
                game.switchScene(nextScene);
                game.start();
            });
            game.addScene('loading', loading);
            game.switchScene('loading');
        });
    } catch (err) {
        console.error('Ошибка при инициализации игры:', err);
        // Фоллбэк: запускаем игру даже если что-то пошло не так
        game.switchScene('menu');
        game.start();
    }
})();