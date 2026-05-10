// js/scenes/ModeSelectScene.js
import { isDailyCompleted, getDailyConfig } from '../modes/DailyChallenge.js';
import { LOCALE, LOCALE_STRINGS } from '../data/config.js';

export class ModeSelectScene {
    constructor(game) {
        this.game = game;
        this.container = null;
    }

    init() {
        this.renderModeSelect();
    }

    // ── Общая функция перевода ──
    t(key) {
        const lang = this._getLang();
        const strings = LOCALE_STRINGS[lang] || LOCALE_STRINGS['ru'];
        return strings[key] || key;
    }

    // ── Вспомогательные методы ──
    _getLang() {
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        return settings.language || 'ru';
    }

    _locWeaponName(key) {
        const lang = this._getLang();
        const w = LOCALE.weapons[key];
        if (!w) return key;
        return w['name_' + lang] || w.name_ru || key;
    }

    _locItemName(key) {
        const lang = this._getLang();
        const i = LOCALE.items[key];
        if (!i) return key;
        return i['name_' + lang] || i.name_ru || key;
    }

    // ── Экран выбора режимов ──
    renderModeSelect() {
        if (this.container) this.container.remove();

        this.container = document.createElement('div');
        this.container.style.cssText = `
            position:absolute;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.92);display:flex;flex-direction:column;
            align-items:center;justify-content:center;z-index:100;
            font-family:'Press Start 2P',monospace;color:white;padding:10px;
            overflow-y:auto;
        `;

        const title = document.createElement('h1');
        title.textContent = this.t('modeSelectTitle');
        title.style.cssText = 'color:#ffd966;margin-bottom:15px;font-size:14px;text-shadow:0 0 8px #ffd966;text-align:center;';
        this.container.appendChild(title);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;max-width:700px;width:100%;';

        const modes = [
            {
                id: 'normal',
                name: this.t('modeNormal'),
                color: '#4a6fa5',
                desc: this.t('modeNormalDesc'),
                action: () => {
                    this.game.selectedMode = 'normal';
                    this.game.switchScene('difficultySelect');
                }
            },
            {
                id: 'daily',
                name: this.t('modeDaily'),
                color: '#9b59b6',
                desc: isDailyCompleted() ? this.t('modeDailyCompleted') : this.t('modeDailyDesc'),
                locked: isDailyCompleted(),
                action: () => this.renderDailyInfo()
            },
            {
                id: 'endless',
                name: this.t('modeEndless'),
                color: '#e67e22',
                desc: this.t('modeEndlessDesc'),
                action: () => {
                    this.game.selectedMode = 'endless';
                    this.game.switchScene('characterSelect');
                }
            }
        ];

        modes.forEach(mode => {
            const card = document.createElement('div');
            card.style.cssText = `
                border:3px solid ${mode.locked ? '#333' : mode.color};
                padding:16px;text-align:center;cursor:${mode.locked ? 'default' : 'pointer'};
                background:rgba(0,0,0,0.6);transition:0.2s;
                display:flex;flex-direction:column;gap:8px;
                opacity:${mode.locked ? 0.6 : 1};
            `;
            if (!mode.locked) {
                card.onmouseenter = () => { card.style.boxShadow = `0 0 15px ${mode.color}`; card.style.transform = 'scale(1.02)'; };
                card.onmouseleave = () => { card.style.boxShadow = 'none'; card.style.transform = 'scale(1)'; };
                card.addEventListener('click', mode.action);
            }

            card.innerHTML = `
                <strong style="font-size:12px;color:${mode.locked ? '#666' : mode.color};">${mode.name}</strong>
                <p style="font-size:8px;color:#bbb;line-height:1.4;margin:0;">${mode.desc}</p>
            `;
            grid.appendChild(card);
        });

        this.container.appendChild(grid);

        const back = document.createElement('button');
        back.textContent = '◀ ' + this.t('backToMenu');
        back.style.cssText = 'margin-top:20px;padding:10px 20px;background:#4a6fa5;border:none;font-family:inherit;font-size:10px;color:white;cursor:pointer;';
        back.addEventListener('click', () => this.game.switchScene('menu'));
        this.container.appendChild(back);

        document.getElementById('gameContainer').appendChild(this.container);
    }

    // ── Экран деталей Ежедневного забега ──
    renderDailyInfo() {
        if (!this.container) return;
        const daily = getDailyConfig();

        // Очищаем текущий контент, но оставляем контейнер
        this.container.innerHTML = '';

        const title = document.createElement('h1');
        title.textContent = this.t('dailyTitle');
        title.style.cssText = 'color:#ffd966;margin-bottom:10px;font-size:14px;text-shadow:0 0 8px #ffd966;text-align:center;';
        this.container.appendChild(title);

        const infoBox = document.createElement('div');
        infoBox.style.cssText = `
            background:rgba(0,0,0,0.7);border:2px solid #9b59b6;padding:20px;
            max-width:500px;width:100%;text-align:center;margin-bottom:20px;
            display:flex;flex-direction:column;gap:10px;
        `;

        infoBox.innerHTML = `
            <p style="font-size:10px;color:#aaa;margin:0;">${this.t('dailyDate')} ${daily.id}</p>
            <div style="border-top:1px solid #444;padding-top:10px;margin-top:5px;">
                <p style="font-size:9px;color:#ffd966;margin:5px 0;">${this.t('dailyWeapon')}</p>
                <p style="font-size:11px;color:#fff;margin:5px 0;">
                    ${daily.loadout.weapons.map(w => this._locWeaponName(w)).join(', ')}
                </p>
                <p style="font-size:9px;color:#ffd966;margin:15px 0 5px;">${this.t('dailyItems')}</p>
                <p style="font-size:11px;color:#fff;margin:5px 0;">
                    ${daily.loadout.items.map(i => this._locItemName(i)).join(' + ')}
                </p>
            </div>
            <div style="border-top:1px solid #444;padding-top:10px;margin-top:10px;">
                <p style="font-size:10px;color:#6ab04c;">${this.t('dailyReward')}</p>
                <p style="font-size:8px;color:#aaa;margin-top:5px;">${this.t('dailyChestsDisabled')}</p>
            </div>
        `;
        this.container.appendChild(infoBox);

        const startBtn = document.createElement('button');
        startBtn.textContent = this.t('dailyStart');
        startBtn.style.cssText = `
            padding:12px 24px;background:#9b59b6;border:2px solid #ffd966;
            font-family:inherit;font-size:11px;color:white;cursor:pointer;
            transition:0.2s;margin-bottom:10px;
        `;
        startBtn.onmouseenter = () => { startBtn.style.background = '#a971c7'; startBtn.style.transform = 'scale(1.05)'; };
        startBtn.onmouseleave = () => { startBtn.style.background = '#9b59b6'; startBtn.style.transform = 'scale(1)'; };
        startBtn.addEventListener('click', () => {
            this.game.selectedMode = 'daily';
            this.game.selectedDifficulty = 'normal'; // безопасный дефолт
            this.game.switchScene('game');
        });
        this.container.appendChild(startBtn);

        const backBtn = document.createElement('button');
        backBtn.textContent = '◀ ' + this.t('dailyBack');
        backBtn.style.cssText = 'padding:8px 16px;background:#4a6fa5;border:none;font-family:inherit;font-size:9px;color:white;cursor:pointer;';
        backBtn.addEventListener('click', () => this.renderModeSelect());
        this.container.appendChild(backBtn);
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