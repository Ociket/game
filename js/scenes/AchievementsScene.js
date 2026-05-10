// js/scenes/AchievementsScene.js
import { getAllAchievements, getUnlockedAchievements } from '../data/achievements.js';
import { LOCALE_STRINGS } from '../data/config.js';

export class AchievementsScene {
    constructor(game) {
        this.game = game;
        this.container = null;
    }

    init() {
        if (this.container) this.container.remove();
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position:absolute; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.92); display:flex; flex-direction:column;
            align-items:center; padding:20px; z-index:100;
            font-family:'Press Start 2P',monospace; color:white;
            overflow-y:auto;
        `;

        const title = document.createElement('h2');
        title.textContent = this.t('achievementsTitle');
        title.style.cssText = 'color:#ffd966; margin-bottom:15px;';
        this.container.appendChild(title);

        const list = document.createElement('div');
        const all = getAllAchievements();
        const unlocked = getUnlockedAchievements();
        const lang = this._getLang();

        all.forEach(ach => {
            const isUnlocked = !!unlocked[ach.id];
            const card = document.createElement('div');
            card.style.cssText = `
                display:flex; align-items:center; gap:10px; width:100%;
                max-width:500px; padding:8px; background:#1a1a2e;
                margin:4px 0; border-left:4px solid ${isUnlocked ? '#6ab04c' : '#4a6fa5'};
            `;
            const icon = isUnlocked ? ach.icon : '🔒';
            const name = isUnlocked || !ach.hidden
                ? (ach['name_' + lang] || ach.name_ru)
                : '???';
            const desc = isUnlocked || !ach.hidden
                ? (ach['desc_' + lang] || ach.desc_ru)
                : '???';

            card.innerHTML = `
                <span style="font-size:24px;">${icon}</span>
                <div style="flex:1">
                    <strong style="font-size:11px; color:${isUnlocked ? '#ffd966' : '#aaa'}">${name}</strong>
                    <p style="font-size:8px; color:#bbb; margin:2px 0;">${desc}</p>
                </div>
            `;
            list.appendChild(card);
        });

        this.container.appendChild(list);

        const backBtn = document.createElement('button');
        backBtn.textContent = '◀ ' + (this.t('back') || 'НАЗАД');
        backBtn.style.cssText = `
            margin-top:15px; padding:10px 20px; background:#4a6fa5;
            border:none; font-family:inherit; font-size:14px; color:white;
            cursor:pointer;
        `;
        backBtn.addEventListener('click', () => this.game.switchScene('menu'));
        this.container.appendChild(backBtn);

        document.getElementById('gameContainer').appendChild(this.container);
    }

    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }

    update() {}
    draw(ctx) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }

    _getLang() {
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        return settings.language || 'ru';
    }

    t(key) {
        const lang = this._getLang();
        const strings = LOCALE_STRINGS[lang] || LOCALE_STRINGS['ru'];
        return strings[key] || key;
    }
}