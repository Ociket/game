// js/scenes/WeaponSelectScene.js
import { CONFIG, LOCALE, LOCALE_STRINGS } from '../data/config.js';
import { ICONS } from '../data/icons.js';

export class WeaponSelectScene {
    constructor(game) {
        this.game = game;
        this.container = null;
    }

    t(key) {
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        const lang = settings.language || 'ru';
        return (LOCALE_STRINGS[lang] || LOCALE_STRINGS['ru'])[key] || key;
    }

    init() {
        if (this.container) this.container.remove();

        this.container = document.createElement('div');
        this.container.id = 'weaponSelectUI';
        this.container.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 100;
            font-family: 'Press Start 2P', monospace; color: white;
            overflow-y: auto; padding: 20px;
        `;

        const title = document.createElement('h1');
        title.textContent = this.t('weaponSelectTitle') || 'ВЫБОР ОРУЖИЯ';
        title.style.cssText = 'color: #00ffff; margin-bottom: 20px; text-shadow: 0 0 10px #00ffff; font-size: 18px;';
        this.container.appendChild(title);

        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-width: 900px;';

        // Обычное оружие
        const weaponTypes = ['Sword','Staff','Aura','Bone','Daggers','Lightning','Bow','Skulls'];
        weaponTypes.forEach(w => {
            const card = this.createCard(w, false);
            grid.appendChild(card);
        });

        // Эволюции (вторая фаза) – динамически из конфига
        if (CONFIG.evolutions) {
            Object.entries(CONFIG.evolutions).forEach(([baseWeapon, evoData]) => {
                const evoId = `evo_${baseWeapon}`;
                const card = this.createCard(evoId, true, baseWeapon);
                grid.appendChild(card);
            });
        }

        this.container.appendChild(grid);
        document.getElementById('gameContainer').appendChild(this.container);
    }

    createCard(weaponId, isEvo, baseWeapon) {
        const card = document.createElement('div');
        card.className = 'selection-card';
        card.style.cssText = `
            border: 3px solid ${isEvo ? '#ff9900' : '#4a6fa5'};
            padding: 10px;
            text-align: center;
            cursor: pointer;
            background: rgba(74, 111, 165, 0.2);
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            min-width: 120px;
        `;
        card.onmouseenter = () => { card.style.borderColor = isEvo ? '#ffcc00' : '#00ffff'; card.style.boxShadow = `0 0 15px ${isEvo ? '#ffcc00' : '#00ffff'}`; };
        card.onmouseleave = () => { card.style.borderColor = isEvo ? '#ff9900' : '#4a6fa5'; card.style.boxShadow = 'none'; };

        // Определяем локализованные имена
        let name = '';
        let desc = '';
        let iconSrc = '';
        if (isEvo) {
            const evoData = CONFIG.evolutions[baseWeapon];
            name = evoData.evolvedWeapon || `${baseWeapon}+`;
            desc = evoData.desc || '';
            iconSrc = ICONS.weapons[baseWeapon] || '';
        } else {
            const localeWeapon = LOCALE.weapons[weaponId];
            const lang = this._getLang();
            name = localeWeapon ? (localeWeapon['name_' + lang] || localeWeapon.name_ru || weaponId) : weaponId;
            desc = localeWeapon ? (localeWeapon['desc_' + lang] || localeWeapon.desc_ru || '') : '';
            iconSrc = ICONS.weapons[weaponId] || '';
        }

        card.innerHTML = `
            ${iconSrc ? `<img src="${iconSrc}" alt="${name}" style="width:40px; height:40px; image-rendering: pixelated;">` : ''}
            <strong style="font-size:10px; ${isEvo ? 'color:#ffaa00;' : 'color:#fff;'}">${isEvo ? '⭐ ' : ''}${name}</strong>
            <p style="font-size:7px; color:#aaa; margin:0; line-height:1.2;">${desc}</p>
        `;

        card.addEventListener('click', () => {
            this.game.selectedWeapon = weaponId;
            this.startGame();
        });

        return card;
    }

    _getLang() {
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        return settings.language || 'ru';
    }

    startGame() {
        if (this.container) this.container.remove();
        this.game.switchScene('game');
    }

    destroy() {
        if (this.container) this.container.remove();
    }
}