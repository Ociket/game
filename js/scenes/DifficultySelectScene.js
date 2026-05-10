// js/scenes/DifficultySelectScene.js
import { DIFFICULTIES } from '../modes/DifficultyConfig.js';
import { isDifficultyUnlocked, getDifficultyWins } from '../data/metaProgress.js';
import { LOCALE_STRINGS } from '../data/config.js';

export class DifficultySelectScene {
    constructor(game) {
        this.game = game;
        this.container = null;
    }

    init() {
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
        title.textContent = this.t('diffSelectTitle');
        title.style.cssText = 'color:#ffd966;margin-bottom:8px;font-size:14px;text-shadow:0 0 8px #ffd966;';
        this.container.appendChild(title);

        const hint = document.createElement('div');
        hint.style.cssText = 'font-size:9px;color:#aaa;margin-bottom:15px;';
        hint.textContent = this.t('diffHint');
        this.container.appendChild(hint);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:12px;max-width:600px;width:100%;';

        Object.values(DIFFICULTIES).forEach(diff => {
            const unlocked = isDifficultyUnlocked(diff.id);
            const wins = getDifficultyWins(diff.id);

            const card = document.createElement('div');
            card.style.cssText = `
                border:3px solid ${unlocked ? diff.color : '#333'};
                padding:12px;text-align:center;cursor:pointer;
                background:rgba(0,0,0,0.6);transition:0.2s;
                display:flex;flex-direction:column;gap:6px;
                opacity:${unlocked ? 1 : 0.5};
            `;
            card.onmouseenter = () => { if(unlocked) card.style.boxShadow = `0 0 12px ${diff.color}`; };
            card.onmouseleave = () => { card.style.boxShadow = 'none'; };

            card.innerHTML = `
    <strong style="color:${diff.color};font-size:11px;">${this.t('diff' + diff.id.charAt(0).toUpperCase() + diff.id.slice(1))}</strong>
    <p style="font-size:7px;color:#bbb;line-height:1.2;">${this.t('diff' + diff.id.charAt(0).toUpperCase() + diff.id.slice(1) + 'Desc')}</p>
    ${unlocked 
      ? `<p style="font-size:6px;color:#6ab04c;">${this.t('diffUnlocked')} ${wins > 0 ? `(${this.t('diffWins')}${wins})` : ''}</p>`
      : `<p style="font-size:6px;color:#e17055;">${this.t('diffLocked')}</p>`
    }
`;

            card.addEventListener('click', () => {
                if (!unlocked) return;
                this.game.selectedDifficulty = diff.id;
                this.game.selectedMode = 'normal';
                this.game.switchScene('characterSelect');
            });

            grid.appendChild(card);
        });

        this.container.appendChild(grid);

        const back = document.createElement('button');
        back.textContent = '◀ ' + this.t('backToMenu');
        back.style.cssText = 'margin-top:15px;padding:8px 16px;background:#4a6fa5;border:none;font-family:inherit;font-size:10px;color:white;cursor:pointer;';
        back.addEventListener('click', () => this.game.switchScene('modeSelect'));
        this.container.appendChild(back);

        document.getElementById('gameContainer').appendChild(this.container);
    }

    destroy() {
        if (this.container) { this.container.remove(); this.container = null; }
    }
    update() {}
    draw() {}
    t(key) {
    const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
    const lang = settings.language || 'ru';
    return (LOCALE_STRINGS[lang] || LOCALE_STRINGS['ru'])[key] || key;
}
}