// js/scenes/CharacterSelectScene.js
import { CONFIG, LOCALE_STRINGS } from '../data/config.js';
import { getBlueCrystals, addBlueCrystals, isCharacterUnlocked, unlockCharacter, setSelectedCharacter } from '../data/metaProgress.js';
import { getDailyConfig } from '../modes/DailyChallenge.js';

export class CharacterSelectScene {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.boundOnResize = this.onResize.bind(this);
    }

    // Вспомогательный метод для строк интерфейса
    t(key) {
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        const lang = settings.language || 'ru';
        const strings = LOCALE_STRINGS[lang] || LOCALE_STRINGS['ru'];
        return strings[key] || key;
    }

    // Локализованное название/описание персонажа
    locChar(char, field = 'name') {
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        const lang = settings.language || 'ru';
        if (field === 'name') return char['name_' + lang] || char.name_ru || char.id;
        if (field === 'desc') return char['desc_' + lang] || char.desc_ru || '';
        return char[field] || '';
    }

    init() {
        if (this.container) this.container.remove();

        this.container = document.createElement('div');
        this.container.id = 'characterSelectScreen';
        this.container.style.cssText = `
            position:absolute;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.92);display:flex;flex-direction:column;
            align-items:center;justify-content:flex-start;z-index:100;
            font-family:'Press Start 2P',monospace;color:white;
            overflow-y:auto;padding:10px;box-sizing:border-box;
        `;

        const title = document.createElement('h1');
        title.textContent = this.t('charSelectTitle');
        title.style.cssText = 'color:#ffd966;margin:8px 0;font-size:14px;text-shadow:0 0 8px #ffd966;text-align:center;';
        this.container.appendChild(title);

        this.buildInfoPanel();
        this.buildGrid();

        const backBtn = document.createElement('button');
        backBtn.textContent = '◀ ' + this.t('backToMenu');
        backBtn.style.cssText = `
            margin:12px 0 20px;padding:8px 20px;background:#4a6fa5;border:none;
            font-family:inherit;font-size:10px;color:white;cursor:pointer;
        `;
        backBtn.addEventListener('click', () => {
            const mode = this.game.selectedMode || 'normal';
            this.game.switchScene(mode === 'normal' ? 'difficultySelect' : 'modeSelect');
        });
        this.container.appendChild(backBtn);

        document.getElementById('gameContainer').appendChild(this.container);
        window.addEventListener('resize', this.boundOnResize);
    }

    buildInfoPanel() {
        const info = document.createElement('div');
        info.style.cssText = 'margin:4px 0 8px;font-size:9px;color:#aaa;text-align:center;';
        const mode = this.game.selectedMode || 'normal';
        let html = `${this.t('crystals')}: <span style="color:#7fb4ff;">${getBlueCrystals()}</span>`;

        if (mode === 'daily') {
            const daily = getDailyConfig();
            html += `<br><span style="color:#ffd966;">${this.t('dailyWeapon')} ${daily.loadout.weapons.join(', ')} • ${this.t('dailyItems')} ${daily.loadout.items.join(', ')}</span>`;
        } else if (mode === 'endless') {
            html += `<br><span style="color:#e67e22;">${this.t('infoEndless')}</span>`;
        } else if (mode === 'normal') {
            html += `<br><span style="color:#4a6fa5;">${this.t('infoDifficulty').replace('{diff}', (this.game.selectedDifficulty || 'normal').toUpperCase())}</span>`;
        }
        info.innerHTML = html;
        this.container.appendChild(info);
    }

    buildGrid() {
        const oldGrid = this.container.querySelector('.character-grid');
    if (oldGrid) oldGrid.remove();
        const grid = document.createElement('div');
        grid.className = 'character-grid';
        const w = window.innerWidth;
        const cols = w < 600 ? 2 : 4;
        grid.style.cssText = `
            display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px;
            max-width:700px;width:100%;margin:0 auto;
        `;

        CONFIG.characters.forEach(ch => {
            const unlocked = isCharacterUnlocked(ch.id);
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.style.cssText = `
                border:2px solid ${unlocked ? '#6ab04c' : '#4a6fa5'};
                padding:8px;text-align:center;cursor:pointer;
                background:rgba(0,0,0,0.6);transition:all 0.2s;
                display:flex;flex-direction:column;align-items:center;gap:4px;
                font-size:9px;color:white;
            `;
            card.onmouseenter = () => { card.style.borderColor = '#ffd966'; card.style.boxShadow = '0 0 8px #ffd966'; };
            card.onmouseleave = () => { card.style.borderColor = unlocked ? '#6ab04c' : '#4a6fa5'; card.style.boxShadow = 'none'; };

            const daily = getDailyConfig();
            const isDailyBonus = this.game.selectedMode === 'daily' && ch.startWeapon === daily.loadout.weapon;

            const charName = this.locChar(ch);
            const charDesc = this.locChar(ch, 'desc');

            card.innerHTML = `
                <strong style="font-size:11px;color:#ffd966;">${charName}</strong>
                <p style="font-size:7px;color:#bbb;margin:2px 0;line-height:1.1;">${charDesc}</p>
                ${unlocked
                    ? `<p style="color:#6ab04c;font-size:8px;margin:0;">${this.t('charUnlocked')}</p>`
                    : `<p style="color:#e17055;font-size:8px;margin:0;">${this.t('charLocked')}${ch.cost}</p>`
                }
                ${isDailyBonus ? `<p style="color:#ffd966;font-size:6px;margin-top:2px;">${this.t('dailyBonusInfo')}</p>` : ''}
            `;

            card.addEventListener('click', () => {
                if (!unlocked) {
                         if (getBlueCrystals() >= ch.cost) {
                        addBlueCrystals(-ch.cost);
                        unlockCharacter(ch.id);
                        this.init();
                    } else {
                        this._showInfoPopup(this.t('notEnoughCrystals'));
                    }
                } else {
                    setSelectedCharacter(ch.id);
                    this.game.selectedWeapon = ch.startWeapon;
                    this.game.switchScene('game');
                }
            });
            grid.appendChild(card);
        });
        this.container.appendChild(grid);
    }

    onResize() {
        const grid = this.container.querySelector('.character-grid');
        if (grid) grid.remove();
        this.buildGrid();
    }
    _showInfoPopup(message) {
        const old = document.getElementById('infoPopup');
        if (old) old.remove();
        const popup = document.createElement('div');
        popup.id = 'infoPopup';
        popup.style.cssText = `
            position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
            background:rgba(0,0,0,0.95); border:3px solid #f3c26b; padding:24px;
            z-index:120; font-family:'Press Start 2P',monospace; color:white;
            font-size:12px; text-align:center; max-width:320px;
        `;
        popup.innerHTML = `<p style="margin-bottom:16px;">${message}</p>
            <button id="infoPopupClose" style="
                padding:8px 20px; background:#f3c26b; border:none;
                font-family:inherit; font-size:12px; cursor:pointer; color:#000;
            ">OK</button>`;
        document.getElementById('gameContainer').appendChild(popup);
        document.getElementById('infoPopupClose').addEventListener('click', () => popup.remove());
    }
    destroy() {
        if (this.container) { this.container.remove(); this.container = null; }
        window.removeEventListener('resize', this.boundOnResize);
    }

    update(delta) {}
    draw(ctx) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
}