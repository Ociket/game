// js/scenes/SettingsScene.js
import { LOCALE_STRINGS } from '../data/config.js';

// Дефолтные настройки
const defaultSettings = {
    language: 'ru',
    musicVolume: 0.5,
    sfxVolume: 0.7,
    particlesEnabled: true,
    graphicsQuality: 'medium' // low, medium, high
};

function loadSettings() {
    const raw = localStorage.getItem('pixelSurvivors_settings');
    if (raw) {
        try { return { ...defaultSettings, ...JSON.parse(raw) }; } catch(e) {}
    }
    return { ...defaultSettings };
}

function saveSettings(settings) {
    localStorage.setItem('pixelSurvivors_settings', JSON.stringify(settings));
}

// Полный сброс всего прогресса (всех данных игры)
function resetAllProgress() {
    // Список ключей, которые использует игра
    const keys = [
        'pixelSurvivors_blueCrystals',
        'pixelSurvivors_upgrades',
        'pixelSurvivors_lastDaily',
        'pixelSurvivors_unlockedCharacters',
        'ps_diffUnlocks',
        'ps_diffWins',
        'ps_lastSaveTs',
        'pixelSurvivors_achievements', // если будут достижения
        'pixelSurvivors_settings'      // сбросим и настройки? Лучше оставить настройки, но для полного сброса можно и их, но обычно сбрасывают только прогресс.
    ];
    // Удаляем всё, кроме настроек (или можно и настройки сбросить по желанию)
    keys.forEach(key => localStorage.removeItem(key));
    // Перезагрузим страницу, чтобы всё подхватилось
    location.reload();
}

export class SettingsScene {
    constructor(game) {
        this.game = game;
        this.settings = loadSettings();
        this.container = null;
    }

    t(key) {
        const lang = this.settings.language || 'ru';
        return (LOCALE_STRINGS[lang] && LOCALE_STRINGS[lang][key]) || key;
    }

    init() {
        if (this.container) this.container.remove();
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position:absolute; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.92); display:flex; flex-direction:column;
            align-items:center; justify-content:center; z-index:100;
            font-family:'Press Start 2P', monospace; color:white; padding:20px;
        `;

        const title = document.createElement('h2');
        title.textContent = this.t('settings');
        title.style.cssText = 'color:#ffd966; margin-bottom:20px;';
        this.container.appendChild(title);

        // === Язык ===
        this.addSettingRow(this.t('language'), () => {
            const btn = document.createElement('button');
            btn.textContent = this.settings.language === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English';
            btn.style.cssText = 'background:#4a6fa5; color:white; border:none; padding:4px 12px; font-family:inherit; font-size:12px; cursor:pointer;';
            btn.addEventListener('click', () => {
                this.settings.language = this.settings.language === 'ru' ? 'en' : 'ru';
                saveSettings(this.settings);
                // Перерисовываем сцену заново, чтобы обновить все тексты
                this.init();
                // Также можно уведомить другие сцены о смене языка
                if (this.game.currentScene && this.game.currentScene.updateLocale) {
                    this.game.currentScene.updateLocale();
                }
            });
            return btn;
        });

        // === Громкость музыки ===
        this.addSettingRow(this.t('musicVolume'), () => this.createSlider(
            this.settings.musicVolume,
            (val) => {
                this.settings.musicVolume = val;
                saveSettings(this.settings);
                if (window.AudioManager) window.AudioManager.setVolume('music', val);
            }
        ));

        // === Громкость звуков ===
        this.addSettingRow(this.t('sfxVolume'), () => this.createSlider(
            this.settings.sfxVolume,
            (val) => {
                this.settings.sfxVolume = val;
                saveSettings(this.settings);
                if (window.AudioManager) window.AudioManager.setVolume('sfx', val);
            }
        ));

        // === Частицы ===
        this.addSettingRow(this.t('particles'), () => {
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = this.settings.particlesEnabled;
            cb.style.width = '20px'; cb.style.height = '20px';
            cb.addEventListener('change', () => {
                this.settings.particlesEnabled = cb.checked;
                saveSettings(this.settings);
            });
            return cb;
        });

        // === Графика ===
        this.addSettingRow(this.t('graphics'), () => {
            const select = document.createElement('select');
            select.style.cssText = 'font-family:inherit; font-size:12px; background:#222; color:white; padding:4px;';
            ['low', 'medium', 'high'].forEach(level => {
                const opt = document.createElement('option');
                opt.value = level;
                opt.textContent = this.t(level);
                select.appendChild(opt);
            });
            select.value = this.settings.graphicsQuality;
            select.addEventListener('change', () => {
                this.settings.graphicsQuality = select.value;
                saveSettings(this.settings);
                window.__graphicsQuality = select.value;
            });
            return select;
        });

        // === Сброс прогресса ===
        const resetBtn = document.createElement('button');
        resetBtn.textContent = this.t('resetProgress');
        resetBtn.style.cssText = 'margin-top:20px; padding:10px 20px; background:#d63031; border:2px solid #fab1a0; font-family:inherit; font-size:12px; color:white; cursor:pointer;';
        resetBtn.addEventListener('click', () => {
            if (confirm(this.t('confirmResetPrompt'))) {  // используем ключ 'confirmResetPrompt', который нужно добавить в LOCALE_STRINGS
                resetAllProgress();
            }
        });
        this.container.appendChild(resetBtn);

        // Кнопка Назад
        const backBtn = document.createElement('button');
        backBtn.textContent = '← ' + this.t('back');
        backBtn.style.cssText = 'margin-top:10px; padding:10px 20px; background:#4a6fa5; border:none; font-family:inherit; font-size:14px; color:white; cursor:pointer;';
        backBtn.addEventListener('click', () => {
            this.game.switchScene('menu');
        });
        this.container.appendChild(backBtn);

        document.getElementById('gameContainer').appendChild(this.container);
    }

    addSettingRow(labelText, controlFactory) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; width:100%; max-width:500px; margin:10px 0;';
        const label = document.createElement('span');
        label.textContent = labelText;
        label.style.cssText = 'font-size:12px; flex:1;';
        row.appendChild(label);
        const control = controlFactory();
        row.appendChild(control);
        this.container.appendChild(row);
    }

    createSlider(value, onChange) {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.step = 1;
        slider.value = value * 100;
        slider.style.width = '150px';
        const display = document.createElement('span');
        display.textContent = Math.round(value * 100) + '%';
        display.style.marginLeft = '10px';
        display.style.fontSize = '12px';
        slider.addEventListener('input', () => {
            const v = slider.value / 100;
            display.textContent = Math.round(v * 100) + '%';
            onChange(v);
        });
        const wrapper = document.createElement('span');
        wrapper.appendChild(slider);
        wrapper.appendChild(display);
        return wrapper;
    }

    destroy() {
        if (this.container) { this.container.remove(); this.container = null; }
    }

    update() {}
    draw(ctx) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
}