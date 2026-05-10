// js/scenes/MenuScene.js
import { getBlueCrystals, addBlueCrystals } from '../data/metaProgress.js';
import { LOCALE_STRINGS } from '../data/config.js';
import { getLeaderboard, getPlayerName } from '../data/leaderboard.js';

export class MenuScene {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.atlas = null;
        this.offsetX = 0;
        this.tileSize = 16;
        this.tilesPerRow = 17;
        this.grassTiles = [0, 17, 34];
        this.treeTiles = [13, 14, 15, 16, 30];
        this.bgCanvas = null;
    }

    init() {
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        this.lang = settings.language || 'ru';
        if (window.__themeAtlases && window.__themeAtlases[0]) {
            this.atlas = window.__themeAtlases[0];
            this.createBackground();
        }

        const btnStart = this.t('start');
        const btnUpgrade = this.t('upgrade');
        const btnSettings = this.t('settings');
        const achievementsText = this.t('achievementsBtn') !== 'achievementsBtn'
            ? this.t('achievementsBtn')
            : (this.lang === 'en' ? '🏆 ACHIEVEMENTS' : '🏆 ДОСТИЖЕНИЯ');
        const leaderboardTitle = this.t('leaderboardTitle');
        const crystalsLabel = this.t('crystals');

        this.container = document.createElement('div');
        this.container.id = 'menuScreen';
        this.container.innerHTML = `
            <div class="menu-panel">
                <h1>${this.t('menuTitle')}</h1>
                <button id="startBtn">${btnStart}</button>
                <button id="upgradeBtn">${btnUpgrade}</button>
                <button id="settingsBtn">${btnSettings}</button>
                <button id="achievementsBtn">${achievementsText}</button>
                <button id="fullscreenMenuBtn" style="display:none;">⛶ ПОЛНЫЙ ЭКРАН</button>
                
                <div class="crystals">${crystalsLabel}: <span id="crystalsCount">0</span></div>
            </div>
            <div id="leaderboardPanel" class="leaderboard-panel">
                <h3>${leaderboardTitle}</h3>
                <ol id="leaderboardList"></ol>
            </div>
        `;
        document.getElementById('gameContainer').appendChild(this.container);

        if (window.AudioManager) window.AudioManager.playMusic('menu_theme');

        // Уведомление о глобальных достижениях
        if (window.__pendingAchievement) {
            alert(`🏆 Достижение: ${window.__pendingAchievement} разблокировано!`);
            window.__pendingAchievement = null;
        }

        this.updateCrystals();
        this.renderLeaderboard();

        // Обработчики
        document.getElementById('startBtn').addEventListener('click', () => {
            this.game.selectedMode = null;
            this.game.selectedDifficulty = null;
            this.game.switchScene('modeSelect');
        });
        document.getElementById('upgradeBtn').addEventListener('click', () => this.game.switchScene('skilltree'));
        document.getElementById('settingsBtn').addEventListener('click', () => this.game.switchScene('settings'));
        document.getElementById('achievementsBtn').addEventListener('click', () => this.game.switchScene('achievements'));
        const fsMenuBtn = document.getElementById('fullscreenMenuBtn');
if (this.game.sdk?.isReady && this.game.sdk.ysdk?.screen?.fullscreen) {
    fsMenuBtn.style.display = 'block';
    fsMenuBtn.addEventListener('click', () => {
        this.game.sdk.toggleFullscreen();
    });
}
        
    }

    renderLeaderboard() {
        const list = document.getElementById('leaderboardList');
        if (!list) return;
        const board = getLeaderboard();
        const playerName = getPlayerName();
        list.innerHTML = board.map(entry => {
            const isMe = entry.name === playerName;
            const className = (isMe ? 'current-player' : '') + (entry.isBot ? ' bot' : '');
            return `<li class="${className}">${entry.name}: ${entry.kills}</li>`;
        }).join('');
    }
    createBackground() {
        const canvas = this.game.canvas;
        const w = canvas.width * 2;
        const h = canvas.height;
        const rawCanvas = document.createElement('canvas');
        rawCanvas.width = w; rawCanvas.height = h;
        const ctx = rawCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const tileW = this.tileSize;
        const tilesPerRow = this.tilesPerRow;
        for (let y = 0; y < h; y += tileW) {
            for (let x = 0; x < w; x += tileW) {
                const tileIdx = this.grassTiles[Math.floor(Math.random() * this.grassTiles.length)];
                const srcX = (tileIdx % tilesPerRow) * tileW;
                const srcY = Math.floor(tileIdx / tilesPerRow) * tileW;
                ctx.drawImage(this.atlas, srcX, srcY, tileW, tileW, x, y, tileW, tileW);
            }
        }
        const treeCount = 25;
        const used = new Set();
        for (let i = 0; i < treeCount; i++) {
            let tx, ty;
            do {
                tx = Math.floor(Math.random() * (w / tileW)) * tileW;
                ty = Math.floor(Math.random() * (h / tileW)) * tileW;
            } while (used.has(`${tx},${ty}`));
            used.add(`${tx},${ty}`);
            const tileIdx = this.treeTiles[i % this.treeTiles.length];
            const srcX = (tileIdx % tilesPerRow) * tileW;
            const srcY = Math.floor(tileIdx / tilesPerRow) * tileW;
            ctx.drawImage(this.atlas, srcX, srcY, tileW, tileW, tx, ty, tileW, tileW);
        }

        const blurred = document.createElement('canvas');
        blurred.width = w; blurred.height = h;
        const blurCtx = blurred.getContext('2d');
        blurCtx.filter = 'blur(4px)';
        blurCtx.drawImage(rawCanvas, 0, 0);
        this.bgCanvas = blurred;
    }

    updateCrystals() {
        const span = document.getElementById('crystalsCount');
        if (span) span.textContent = getBlueCrystals();
    }

    destroy() {
        if (this.container) { this.container.remove(); this.container = null; }
    }

    update(delta) { this.offsetX += 15 * delta; }

    draw(ctx) {
        if (!this.bgCanvas) {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
            return;
        }
        const w = this.game.canvas.width, h = this.game.canvas.height, bgW = this.bgCanvas.width;
        const dx = Math.floor(this.offsetX) % (bgW / 2);
        ctx.drawImage(this.bgCanvas, -dx, 0, w, h, 0, 0, w, h);
        ctx.drawImage(this.bgCanvas, -dx + bgW / 2, 0, w, h, 0, 0, w, h);
    }

    t(key) {
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        const lang = settings.language || 'ru';
        const strings = LOCALE_STRINGS[lang] || LOCALE_STRINGS['ru'];
        return strings[key] || key;
    }
}