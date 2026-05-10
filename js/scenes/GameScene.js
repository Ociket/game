// js/scenes/GameScene.js
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Chest } from '../entities/Chest.js';
import { Input } from '../engine/Input.js';
import { World } from '../world/World.js';
import { CONFIG, LOCALE, LOCALE_STRINGS } from '../data/config.js';
import { getPermanentUpgrades, addBlueCrystals, getBlueCrystals, getSelectedCharacter, recordDifficultyWin } from '../data/metaProgress.js';
import { distance, randomRange } from '../utils.js';
import { Sword } from '../weapons/Sword.js';
import { Staff } from '../weapons/Staff.js';
import { Aura } from '../weapons/Aura.js';
import { Bone } from '../weapons/Bone.js';
import { GameItem } from '../items/GameItem.js';
import { ICONS } from '../data/icons.js';
import { Daggers } from '../weapons/Daggers.js';
import { Lightning } from '../weapons/Lightning.js';
import { Bow } from '../weapons/Bow.js';
import { Skulls } from '../weapons/Skulls.js';
import { VirtualJoystick } from '../engine/VirtualJoystick.js';
import { DamageText } from '../entities/DamageText.js';
import { GameStats } from '../data/GameStats.js';
import { saveMetaProgress } from '../data/metaProgress.js';
import { DIFFICULTIES } from '../modes/DifficultyConfig.js';
import { getDailyConfig, isDailyCompleted, markDailyCompleted } from '../modes/DailyChallenge.js';
import { checkRunAchievements, getAchievementsForSDK } from '../data/achievements.js';
// Добавить импорт (в начало файла)
import { submitScore, getPlayerName } from '../data/leaderboard.js';

export class GameScene {
    constructor(game) {
        this.lang = 'ru';
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.input = new Input();
        this.joystick = null;
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.xpOrbs = [];
        this.blueOrbs = [];
        this.chests = [];
        this.damageTexts = [];
        this.frostBursts = [];
        this.convertedAllies = [];
        this.world = null;
        this.score = 0;
        this.rawEarnedBlue = 0;
        this.earnedBlue = 0;
        this.stats = new GameStats();
        this.roundTime = CONFIG.timer.roundDuration;
        this.elapsedTime = 0;
        this.spawnTimer = 0;
        this.paused = false;
        this.levelUpActive = false;
        this.chestMenuActive = false;
        this.bossSpawned = false;
        this.inBossFight = false;
        this.waveLevel = 0;
        this.waveTimer = 0;
        this.cameraX = 0;
        this.cameraZoom = 1.0;
        this.cameraY = 0;
        this.worldReady = false;
        this.lastDelta = 1/60;
        this.deathAnimationPlaying = false;
        this.deathAnimationCompleted = false;
        this.deathTimer = 0;
        this.deathAnimDuration = 1.2;
        this.potSpawnTimer = 0;
        this.evolutionBossTimer = 0;
        this.bossFlash = 0;
        this.maxParticles = 300;
        this.showBossWarning = 0;
        this.evolutionBossInterval = 240;
        this.currentMaxEnemies = CONFIG.enemies.maxEnemies;
        this.seenWeapons = new Set();
        this.seenItems = new Set();
        this.container = null;
        this.hudElements = {};
        this.weaponIconsDiv = null;
        this.itemIconsDiv = null;
        this.lastWeaponsHTML = '';
        this.lastItemsHTML = '';
        this.levelUpScreen = null;
        this.levelUpOptionsContainer = null;
        this.chestScreen = null;
        this.chestOptionsContainer = null;
        this.gameOverScreen = null;
        this.pauseScreen = null;
        this.confirmDialog = null;
        this.escWasPressed = false;
        this.gameSpeed = 1;
        this.lastEnemyDieSFX = 0;
    }

    // Получение текущего языка из настроек
    _getLang() {
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        return settings.language || 'ru';
    }

    // Вспомогательный метод для строк интерфейса
    t(key) {
        const lang = this._getLang();
        const strings = LOCALE_STRINGS[lang] || LOCALE_STRINGS['ru'];
        return strings[key] || key;
    }

    // Локализованное название оружия
    locWeapon(weaponType, field = 'name') {
        const lang = this._getLang();
        const w = LOCALE.weapons[weaponType];
        if (!w) return weaponType;
        if (field === 'name') return w['name_' + lang] || w.name_ru || weaponType;
        if (field === 'desc') return w['desc_' + lang] || w.desc_ru || '';
        return w[field] || weaponType;
    }

    // Локализованное название предмета
    locItem(itemType, field = 'name') {
        const lang = this._getLang();
        const i = LOCALE.items[itemType];
        if (!i) return itemType;
        if (field === 'name') return i['name_' + lang] || i.name_ru || itemType;
        if (field === 'desc') return i['desc_' + lang] || i.desc_ru || '';
        return i[field] || itemType;
    }

    async init() {
        // Полный сброс состояния
        this.paused = false;
        this.levelUpActive = false;
        this.chestMenuActive = false;
        this.deathAnimationPlaying = false;
        this.deathAnimationCompleted = false;
        this.deathTimer = 0;
        this.bossSpawned = false;
        this.inBossFight = false;
        this.bossFlash = 0;
        this.showBossWarning = 0;
        this.roundTime = CONFIG.timer.roundDuration;
        this.elapsedTime = 0;
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.waveLevel = 0;
        this.currentMaxEnemies = CONFIG.enemies.maxEnemies;
        this.currentEndlessMultiplier = 1.0;
        this.potSpawnTimer = 0;
        this.evolutionBossTimer = 0;
        this.gameSpeed = 1;
        this.score = 0;
        this.rawEarnedBlue = 0;
        this.earnedBlue = 0;
        this.stats = new GameStats();
        this.seenWeapons.clear();
        this.seenItems.clear();
        this.xpOrbs = [];
        this.blueOrbs = [];
        this.chests = [];
        this.damageTexts = [];
        this.frostBursts = [];
        this.convertedAllies = [];
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.worldReady = false;
        this.worldError = false;
        if (this.container) { this.container.remove(); this.container = null; }

        // Мета и персонаж
        const meta = getPermanentUpgrades();
        const characterId = getSelectedCharacter();
        const charConfig = CONFIG.characters.find(c => c.id === characterId) || CONFIG.characters[0];
        if (charConfig.bonuses.armor) meta.armorBonus = (meta.armorBonus || 0) + charConfig.bonuses.armor;
        if (charConfig.bonuses.hpBonus) meta.maxHpBonus = (meta.maxHpBonus || 0) + charConfig.bonuses.hpBonus;
        if (charConfig.bonuses.speed) meta.speedBonus = (meta.speedBonus || 0) + charConfig.bonuses.speed / 10;
        if (charConfig.bonuses.cooldownReduction) meta.cooldownReductionBonus = (meta.cooldownReductionBonus || 0) + charConfig.bonuses.cooldownReduction;
        if (charConfig.bonuses.expMultiplier) meta.experienceMultiplier = charConfig.bonuses.expMultiplier;
        if (charConfig.bonuses.lifesteal) meta.lifesteal = charConfig.bonuses.lifesteal;
        if (charConfig.bonuses.damageBonus) meta.damageBonus = (meta.damageBonus || 0) + charConfig.bonuses.damageBonus;
        if (charConfig.bonuses.critChance) meta.charCritChance = (meta.charCritChance || 0) + charConfig.bonuses.critChance;
        if (charConfig.bonuses.magnetRadius) meta.charMagnetBonus = (meta.charMagnetBonus || 0) + charConfig.bonuses.magnetRadius;
        if (charConfig.bonuses.lifesteal) meta.charLifesteal = (meta.charLifesteal || 0) + charConfig.bonuses.lifesteal;

        this.player = new Player(1500, 1500, meta);
        if (!this.joystick) {
            this.joystick = new VirtualJoystick(this.canvas);
        }
        this.handleResize();

        // Режим и сложность
        const mode = this.game.selectedMode || 'normal';
        const diffId = this.game.selectedDifficulty || 'normal';
        const diffCfg = DIFFICULTIES[diffId] || DIFFICULTIES.normal;
        let mods = { ...diffCfg.modifiers };
        this.dailyRun = false;
        this.endlessRun = false;
        this.chestsDisabled = false;
        if (mode === 'daily') {
            this.dailyRun = true;
            this.chestsDisabled = true;
            const daily = getDailyConfig();
            this.game.dailyConfig = daily;
            mods = { ...mods, ...daily.modifiers };
        } else if (mode === 'endless') {
            this.endlessRun = true;
        }

        this.spawnIntervalMult = mods.spawnIntervalMult || 1.0;
        this.enemyHpMult = mods.enemyHpMult || 1.0;
        this.enemyDmgMult = mods.enemyDmgMult || 1.0;
        this.xpMult = mods.xpMult || 1.0;
        this.eliteChanceMult = mods.eliteChanceMult || 1.0;
        this.crystalBonusMult = mods.crystalBonus || 1.0;

        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        const quality = settings.graphicsQuality || 'medium';
        this.particlesEnabled = settings.particlesEnabled !== false;
        if (quality === 'low') {
            this.currentMaxEnemies = Math.floor(this.currentMaxEnemies * 0.6);
            this.maxParticles = 30;
            this.particlesEnabled = false;
        } else if (quality === 'medium') {
            this.currentMaxEnemies = Math.floor(this.currentMaxEnemies * 0.8);
            this.maxParticles = 100;
        } else {
            this.maxParticles = 300;
        }

        if (this.player.startExpBonus > 0) {
            this.player.currentXP += Math.floor(this.player.xpToNextLevel * this.player.startExpBonus);
        }

        // Стартовый лут
        if (this.dailyRun) {
            const daily = this.game.dailyConfig;
            for (const wType of daily.loadout.weapons) {
                this.player.addWeapon(this.createWeaponInstance(wType));
                this.seenWeapons.add(wType);
            }
            for (const iType of daily.loadout.items) {
                this.player.addItem(new GameItem(iType, CONFIG.items[iType]));
                this.seenItems.add(iType);
            }
        } else {
            const weaponType = this.game.selectedWeapon || 'Sword';
            this.player.addWeapon(this.createWeaponInstance(weaponType));
            this.seenWeapons.add(weaponType);
        }

        this.player.loadSprites();
        this.player._onCrystalEarned = (amount) => {
            this.rawEarnedBlue += amount;
            this.stats.recordBlueCrystal(amount);
            this.addDamageText(this.player.x, this.player.y - 20, `+${amount} 💎`, '#7fb4ff');
        };
        this.player._onHeal = (amount) => {
            this.addDamageText(this.player.x, this.player.y - 20, `+${amount.toFixed(1)}`, '#6ab04c');
            this.stats.recordHealing(amount);
        };
        this.createUI();
        if (window.AudioManager) window.AudioManager.playMusic('game_loop');

        // Мир
        this.world = new World();
        try {
            await this.world.init(0);
            this.worldReady = true;
            for (let i = 0; i < 5; i++) this.spawnEnemy('basic');
        } catch (err) {
            console.error('Не удалось загрузить мир:', err);
            this.worldReady = false;
            this.worldError = true;
        }
    }

    createUI() {
        if (this.container) this.container.remove();
        this.container = document.createElement('div');
        this.container.id = 'gameUI';
        this.container.innerHTML = `
            <div id="pauseButton" style="position:absolute; top:10px; right:10px; z-index:20; cursor:pointer; color:white; font-size:24px; user-select:none;">✖</div>
            <button id="fullscreenBtn" style="position:absolute; top:50px; right:10px; z-index:20; font-family:'Press Start 2P'; font-size:16px; background:#333; color:#fff; border:1px solid #666; cursor:pointer; display:none;">⛶</button>
            <div id="timerPanel"><span id="timerVal">15:00</span></div>
            <div class="hud">
                <div>❤️ <span id="hpVal">0</span></div>
                <div>💀 <span id="scoreVal">0</span></div>
                <div>⭐ ${this.t('level')} <span id="levelVal">1</span></div>
                <progress id="xpBar" value="0" max="100"></progress>
                <div>💎 <span id="blueVal">0</span></div>
            </div>
            <div class="equipment-panel">
                <div class="equipment-row" id="weaponIcons"></div>
                <div class="equipment-row" id="itemIcons"></div>
            </div>
            <div id="levelUpScreen" class="level-up hidden">
                <h2>${this.t('levelUpTitle')}</h2>
                <div id="levelUpOptions"></div>
            </div>
            <div id="chestScreen" class="level-up hidden">
                <h2>${this.t('chestTitle')}</h2>
                <p>${this.t('chestSelect')}</p>
                <div id="chestOptions"></div>
            </div>
            <div id="gameOverScreen" class="game-over hidden">
                <h2>${this.t('gameOverTitle')}</h2>
                <p>${this.t('resultsCrystals')}: <span id="earnedBlue">0</span></p>
                <button id="restartBtn">${this.t('restart')}</button>
                <button id="menuBtn">${this.t('menu')}</button>
            </div>
            <div id="pauseScreen" class="level-up hidden">
                <h2>${this.t('pause')}</h2>
                <div id="statsContainer" style="font-size:10px; text-align:left; margin-bottom:10px;"></div>
                <button id="resumeBtn">${this.t('resume')}</button>
                <button id="pauseMenuBtn">${this.t('mainMenu')}</button>
                <button id="pauseSettingsBtn">${this.t('settings')}</button>
            </div>
            <div id="confirmDialog" class="level-up hidden">
                <h2>${this.t('confirmTitle')}</h2>
                <p>${this.t('confirmText')}</p>
                <button id="confirmYes">${this.t('confirmYes')}</button>
                <button id="confirmNo">${this.t('confirmNo')}</button>
            </div>
        `;
        document.getElementById('gameContainer').appendChild(this.container);

        this.hudElements = {
            hp: document.getElementById('hpVal'),
            score: document.getElementById('scoreVal'),
            timer: document.getElementById('timerVal'),
            level: document.getElementById('levelVal'),
            xpBar: document.getElementById('xpBar'),
            blue: document.getElementById('blueVal')
        };
        this.weaponIconsDiv = document.getElementById('weaponIcons');
        this.itemIconsDiv = document.getElementById('itemIcons');
        this.levelUpScreen = document.getElementById('levelUpScreen');
        this.levelUpOptionsContainer = document.getElementById('levelUpOptions');
        this.chestScreen = document.getElementById('chestScreen');
        this.chestOptionsContainer = document.getElementById('chestOptions');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.confirmDialog = document.getElementById('confirmDialog');

        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('menuBtn').addEventListener('click', () => this.goToMenu());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('pauseMenuBtn').addEventListener('click', () => this.confirmDialog.classList.remove('hidden'));
        document.getElementById('pauseSettingsBtn').addEventListener('click', () => this.showPauseSettings());
        document.getElementById('confirmYes').addEventListener('click', () => { this.destroy(); this.game.switchScene('menu'); });
        document.getElementById('confirmNo').addEventListener('click', () => this.confirmDialog.classList.add('hidden'));
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        const fullscreenBtn = document.getElementById('fullscreenBtn');
if (this.game.sdk?.isReady && this.game.sdk.ysdk?.screen?.fullscreen) {
    fullscreenBtn.style.display = 'block';
    fullscreenBtn.addEventListener('click', () => {
        this.game.sdk.toggleFullscreen();
    });
}
        

        const totalSec = Math.ceil(Math.max(0, this.roundTime));
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        if (this.hudElements.timer) this.hudElements.timer.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    spawnEnemy(type = 'basic', isElite = false) {
        if (this.enemies.length >= this.currentMaxEnemies) return;
        const angle = Math.random() * Math.PI * 2;
        const dist = 600 + Math.random() * 100;
        let x = this.player.x + Math.cos(angle) * dist;
        let y = this.player.y + Math.sin(angle) * dist;
        x = Math.min(Math.max(x, 50), CONFIG.world.width - 50);
        y = Math.min(Math.max(y, 50), CONFIG.world.height - 50);

        this.enemies.push(new Enemy(x, y, type, isElite, false, this.waveLevel, this));
        const enemy = this.enemies[this.enemies.length - 1];
        const finalHpMult = this.enemyHpMult * this.currentEndlessMultiplier;
        const finalDmgMult = this.enemyDmgMult * this.currentEndlessMultiplier;
        if (finalHpMult !== 1.0) {
            enemy.maxHp = Math.floor(enemy.maxHp * finalHpMult);
            enemy.hp = enemy.maxHp;
        }
        if (finalDmgMult !== 1.0) {
            enemy.damage = Math.max(1, Math.floor(enemy.damage * finalDmgMult));
        }
    }

    spawnEnemyAt(x, y, type = 'basic', isElite = false) {
        if (this.enemies.length >= this.currentMaxEnemies) return;
        this.enemies.push(new Enemy(x, y, type, isElite, false, this.waveLevel, this));
    }

    spawnBoss() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 500;
        let x = this.player.x + Math.cos(angle) * dist;
        let y = this.player.y + Math.sin(angle) * dist;
        x = Math.min(Math.max(x, 100), CONFIG.world.width - 100);
        y = Math.min(Math.max(y, 100), CONFIG.world.height - 100);
        this.enemies.push(new Enemy(x, y, 'basic', false, true, 0, this));
        this.inBossFight = true;
        this.bossSpawned = true;
        this.enemies = this.enemies.filter(e => e.isBoss);
        this.bossFlash = 1.0;
        this.showBossWarning = 2.5;
        if (window.AudioManager) {
            window.AudioManager.playSFX('boss_warning');
            window.AudioManager.playMusic('boss_fight');
        }
    }

    showLevelUpMenu() {
        if (window.AudioManager) window.AudioManager.playSFX('level_up');
        this.levelUpActive = true;
        this.levelUpScreen.classList.remove('hidden');
        const container = this.levelUpOptionsContainer;
        container.innerHTML = '<div class="selection-container"></div>';
        const selContainer = container.firstChild;

        const allOptions = [];

        // Оружие
        for (const weapon of this.player.weapons) {
            if (weapon.level >= CONFIG.upgrades.maxPerItem) continue;
            if (typeof weapon.getUpgradeOptions === 'function') {
                const rarities = this.generateOptionRarities();
                for (const rarity of rarities) {
                    const upgrades = weapon.getUpgradeOptions(rarity);
                    if (!upgrades.length) continue;
                    const localeName = this.locWeapon(weapon.constructor.name);
                    allOptions.push({
                        type: 'weapon_new',
                        target: weapon,
                        rarity,
                        upgrades,
                        name: localeName
                    });
                }
            } else {
                // Старая система (если осталась)
                const rarities = this.generateOptionRarities();
                for (const rarity of rarities) {
                    const params = weapon.generateUpgradeParams(rarity);
                    const desc = this.buildWeaponUpgradeDesc(weapon, rarity, params);
                    allOptions.push({
                        type: 'weapon_old',
                        target: weapon,
                        rarity,
                        params,
                        name: this.locWeapon(weapon.constructor.name),
                        desc
                    });
                }
            }
        }

        // Предметы
        for (const item of this.player.items) {
            if (item.level >= CONFIG.upgrades.maxPerItem) continue;
            const rarities = this.generateOptionRarities();
            for (const rarity of rarities) {
                const desc = item.generateUpgradeDescription(rarity);
                allOptions.push({
                    type: 'item',
                    target: item,
                    rarity,
                    multiplier: CONFIG.upgrades.rarities[rarity].multiplier,
                    name: this.locItem(item.type),
                    desc
                });
            }
        }

        // Новое оружие
        if (!this.dailyRun && this.player.weapons.length < CONFIG.chest.maxWeapons && Math.random() < 0.2) {
            const availableNewWeapons = ['Sword','Staff','Aura','Bone','Daggers','Lightning','Bow','Skulls'].filter(
                w => !this.player.weapons.some(we => we.constructor.name === w)
            );
            if (availableNewWeapons.length > 0) {
                const wType = availableNewWeapons[Math.floor(Math.random() * availableNewWeapons.length)];
                allOptions.push({
                    type: 'new_weapon',
                    weaponType: wType,
                    name: this.locWeapon(wType),
                    desc: this.locWeapon(wType, 'desc')
                });
            }
        }

        // Новые предметы
        if (!this.dailyRun && this.player.items.length < this.player.maxItems && Math.random() < 0.2) {
            const availableNewItems = Object.keys(CONFIG.items).filter(
                key => !this.player.items.some(it => it.type === key)
            );
            if (availableNewItems.length > 0) {
                const itemKey = availableNewItems[Math.floor(Math.random() * availableNewItems.length)];
                allOptions.push({
                    type: 'new_item',
                    itemKey: itemKey,
                    name: this.locItem(itemKey),
                    desc: this.locItem(itemKey, 'desc')
                });
            }
        }

        // Эволюция
        for (const weapon of this.player.weapons) {
            if (weapon.level >= 8 && !weapon.isEvolved && typeof weapon.canEvolve === 'function' && weapon.canEvolve(this.player)) {
                const evoData = CONFIG.evolutions?.[weapon.weaponType];
                if (!evoData) continue;
                allOptions.push({
                    type: 'evolution',
                    weapon: weapon,
                    name: evoData.evolvedWeapon || this.t('evolution'),
                    desc: this._locEvolutionDesc(weapon.weaponType),
                    icon: null
                });
            }
        }

        const selected = allOptions.sort(() => Math.random() - 0.5).slice(0, 3);

        for (const opt of selected) {
            const card = document.createElement('div');
            card.className = 'selection-card';
            const rarityBorderColors = {
                common: '#ffffff',
                uncommon: '#6ab04c',
                epic: '#be2edd',
                legendary: '#f0932b'
            };
            card.style.borderColor = (opt.rarity && rarityBorderColors[opt.rarity]) || '#4a6fa5';
            card.style.borderWidth = '3px';

            let iconSrc = '';
            if (opt.type === 'weapon_new' || opt.type === 'weapon_old') {
                const wType = opt.target.constructor.name;
                iconSrc = ICONS.weapons[wType] || '';
            } else if (opt.type === 'new_weapon') {
                iconSrc = ICONS.weapons[opt.weaponType] || '';
            } else if (opt.type === 'item') {
                iconSrc = ICONS.items[opt.target.type] || '';
            } else if (opt.type === 'new_item') {
                iconSrc = ICONS.items[opt.itemKey] || '';
            } else if (opt.type === 'evolution') {
                iconSrc = ICONS.weapons[opt.weapon.constructor.name] || '';
            }

            const rarityText = opt.rarity
                ? `<p style="color:#ffd966; font-size:9px; margin:4px 0;">${LOCALE.rarities[opt.rarity]}</p>`
                : '';

            let bodyHtml = '';
            if (opt.type === 'weapon_new') {
                const paramsHtml = opt.upgrades.map(u => `<div style="font-size:9px; margin:2px 0; color:#ccc;">${u.name}</div>`).join('');
                bodyHtml = `
                    <strong style="font-size:11px;">${opt.name}</strong>
                    ${paramsHtml}
                    ${rarityText}
                `;
            } else if (opt.type === 'weapon_old' || opt.type === 'item') {
                bodyHtml = `
                    <strong style="font-size:11px;">${opt.name}</strong>
                    <p style="font-size:9px; margin:4px 0; color:#ccc;">${opt.desc}</p>
                    ${rarityText}
                `;
            } else if (opt.type === 'new_weapon' || opt.type === 'new_item') {
                bodyHtml = `
                    <strong style="font-size:11px;">${opt.name}</strong>
                    <p style="font-size:9px; margin:4px 0; color:#ccc;">${opt.desc || ''}</p>
                `;
            } else if (opt.type === 'evolution') {
                bodyHtml = `
                    <strong style="font-size:11px; color:#ff9900;">${this.t('evolution')}</strong>
                    <p style="font-size:9px; margin:4px 0; color:#ccc;">${opt.name}</p>
                    <p style="font-size:9px; margin:4px 0; color:#ccc;">${opt.desc}</p>
                `;
            }

            card.innerHTML = `
                ${iconSrc ? `<img src="${iconSrc}" class="card-icon" alt="${opt.name}" />` : ''}
                ${bodyHtml}
            `;

            card.addEventListener('click', () => {
                if (opt.type === 'weapon_new') {
                    opt.target.applyUpgradeSet(opt.upgrades);
                } else if (opt.type === 'weapon_old') {
                    opt.target.applyUpgradePackage(opt.rarity, opt.params);
                } else if (opt.type === 'item') {
                    opt.target.applyUpgrade(opt.rarity, opt.multiplier);
                    this.player.recalculateStats();
                } else if (opt.type === 'new_weapon') {
                    const wp = this.createWeaponInstance(opt.weaponType);
                    this.player.addWeapon(wp);
                    this.seenWeapons.add(opt.weaponType);
                } else if (opt.type === 'new_item') {
                    const item = new GameItem(opt.itemKey, CONFIG.items[opt.itemKey]);
                    this.player.addItem(item);
                    this.seenItems.add(opt.itemKey);
                } else if (opt.type === 'evolution') {
    opt.weapon.applyEvolution(this.player);
    this.stats.evolvedWeapon = 1;
}
                this.levelUpActive = false;
                this.levelUpScreen.classList.add('hidden');
            });

            selContainer.appendChild(card);
        }

        const rerollBtn = document.createElement('button');
        rerollBtn.textContent = this.t('reroll');
        rerollBtn.style.marginTop = '12px';
        rerollBtn.style.padding = '8px 16px';
        rerollBtn.style.fontFamily = '"Press Start 2P", monospace';
        rerollBtn.style.fontSize = '11px';
        rerollBtn.style.background = '#4a6fa5';
        rerollBtn.style.color = 'white';
        rerollBtn.style.border = 'none';
        rerollBtn.style.cursor = 'pointer';
        rerollBtn.style.display = 'block';
        rerollBtn.style.width = '100%';
        rerollBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.tryRewardedReroll(() => this.showLevelUpMenu());
        });
        selContainer.appendChild(rerollBtn);
    }

    generateOptionRarities() {
        const result = [];
        for (let i = 0; i < 3; i++) {
            const rand = Math.random();
            let cumulative = 0;
            for (const [name, r] of Object.entries(CONFIG.upgrades.rarities)) {
                cumulative += r.chance;
                if (rand <= cumulative) { result.push(name); break; }
            }
        }
        return result;
    }

    buildWeaponUpgradeDesc(weapon, rarity, params) {
    const lang = this._getLang();
    const parts = [];
    if (params.damage) parts.push(`⚔️ +${params.damage} ${lang === 'en' ? 'damage' : 'урона'}`);
    if (params.cooldown) parts.push(`🏹 ${lang === 'en' ? 'cooldown' : 'перезарядка'} -${Math.abs(params.cooldown).toFixed(1)} ${lang === 'en' ? 'sec' : 'сек'}`);
    if (params.range) parts.push(`📏 +${params.range} ${lang === 'en' ? 'range' : 'дальности'}`);
    return parts.join('\n');
}

    showChestMenu(chest) {
        if (this.dailyRun) {
            chest.collected = true;
            this.chests = this.chests.filter(c => c !== chest);
            return;
        }
        if (window.AudioManager) window.AudioManager.playSFX('chest_open');
        this.chestMenuActive = true;
        this.chestScreen.classList.remove('hidden');
        const container = this.chestOptionsContainer;
        container.innerHTML = '<div class="selection-container"></div>';
        const selContainer = container.firstChild;

        const options = [];
        const maxW = CONFIG.chest.maxWeapons;
        const maxI = this.player.maxItems;
        const availableWeapons = (this.player.weapons.length >= maxW) ? [] :
            ['Sword','Staff','Aura','Bone','Daggers','Lightning','Bow','Skulls'].filter(w => !this.player.weapons.some(we => we.constructor.name === w));
        for (const w of availableWeapons) {
            const isNew = !this.seenWeapons.has(w);
            options.push({
                type: 'weapon',
                weaponType: w,
                name: this.locWeapon(w),
                desc: isNew ? this.locWeapon(w, 'desc') : '',
                isNew
            });
        }
        const availableItems = Object.keys(CONFIG.items).filter(key =>
            !this.player.items.some(it => it.type === key) &&
            this.player.items.length < this.player.maxItems
        );
        for (const key of availableItems) {
            const isNew = !this.seenItems.has(key);
            options.push({
                type: 'item',
                itemKey: key,
                name: this.locItem(key),
                desc: isNew ? this.locItem(key, 'desc') : '',
                isNew
            });
        }

        let selected = [];
        if (options.length === 0) {
            selected = [
                { type: 'heal', name: '❤️ ' + this.t('heal'), desc: this.t('healDesc'), icon: '' },
                { type: 'xp', name: '⭐ ' + this.t('xp'), desc: this.t('xpDesc'), icon: '' }
            ];
        } else {
            selected = options.sort(() => Math.random() - 0.5).slice(0, 3);
        }

        for (const opt of selected) {
            const card = document.createElement('div');
            card.className = 'selection-card';
            let iconSrc = '';
            if (opt.type === 'weapon') iconSrc = ICONS.weapons[opt.weaponType] || '';
            else if (opt.type === 'item') iconSrc = ICONS.items[opt.itemKey] || '';
            card.innerHTML = `
                ${iconSrc ? `<img src="${iconSrc}" alt="${opt.name}" class="card-icon" />` : ''}
                <strong>${opt.name}</strong>
                <p>${opt.desc || ''}</p>
                <p style="color:#7fb4ff;">${opt.isNew ? this.t('newItem') || 'Новое!' : ''}</p>
            `;
            card.addEventListener('click', () => {
                if (opt.type === 'heal') {
                    this.player.hp = this.player.maxHp;
                } else if (opt.type === 'xp') {
                    const levelledUp = this.player.gainXP(5);
                    if (levelledUp) {
                        chest.collected = true;
                        this.chests = this.chests.filter(c => c !== chest);
                        this.chestMenuActive = false;
                        this.chestScreen.classList.add('hidden');
                        this.showLevelUpMenu();
                        return;
                    }
                } else if (opt.type === 'weapon') {
                    const wp = this.createWeaponInstance(opt.weaponType);
                    this.player.addWeapon(wp);
                    this.seenWeapons.add(opt.weaponType);
                } else if (opt.type === 'item') {
                    const item = new GameItem(opt.itemKey, CONFIG.items[opt.itemKey]);
                    this.player.addItem(item);
                    this.seenItems.add(opt.itemKey);
                }
                chest.collected = true;
                this.chests = this.chests.filter(c => c !== chest);
                this.chestMenuActive = false;
                this.chestScreen.classList.add('hidden');
            });
            selContainer.appendChild(card);
        }
        const rerollBtn = document.createElement('button');
        rerollBtn.textContent = this.t('reroll');
        rerollBtn.style.marginTop = '12px';
        rerollBtn.style.padding = '8px 16px';
        rerollBtn.style.fontFamily = '"Press Start 2P", monospace';
        rerollBtn.style.fontSize = '11px';
        rerollBtn.style.background = '#4a6fa5';
        rerollBtn.style.color = 'white';
        rerollBtn.style.border = 'none';
        rerollBtn.style.cursor = 'pointer';
        rerollBtn.style.display = 'block';
        rerollBtn.style.width = '100%';
        rerollBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.tryRewardedReroll(() => this.showChestMenu(chest));
        });
        selContainer.appendChild(rerollBtn);
    }

    showEvolutionMenu(chest) {
        this.chestMenuActive = true;
        this.chestScreen.classList.remove('hidden');
        const container = this.chestOptionsContainer;
        container.innerHTML = '<div class="selection-container"></div>';
        const selContainer = container.firstChild;

        const evoOptions = [];
        for (const weapon of this.player.weapons) {
            if (weapon.canEvolve(this.player)) {
                const evoData = CONFIG.evolutions[weapon.weaponType];
                evoOptions.push({
                    type: 'evolution',
                    weapon: weapon,
                    name: evoData.evolvedWeapon,
                    desc: this._locEvolutionDesc(weapon.weaponType),
                    icon: ICONS.weapons[weapon.weaponType] || ''
                });
            }
        }

        let selectedOptions = [];
        if (evoOptions.length > 0) {
            selectedOptions = evoOptions.sort(() => Math.random() - 0.5).slice(0, 3);
        } else {
            selectedOptions = [
                { type: 'xp', name: this.t('xp'), desc: this.t('xpDesc'), icon: '' },
                { type: 'crystals', name: this.t('crystalsShort'), desc: this.t('crystalsDesc'), icon: '' },
                { type: 'legendaryUpgrade', name: this.t('legendaryUpgrade'), desc: this.t('legendaryUpgradeDesc'), icon: '' }
            ];
        }

        for (const opt of selectedOptions) {
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.innerHTML = `
                ${opt.icon ? `<img src="${opt.icon}" class="card-icon" />` : ''}
                <strong>${opt.name}</strong>
                <p>${opt.desc}</p>
            `;
            card.addEventListener('click', () => {
                if (opt.type === 'evolution') {
    opt.weapon.applyEvolution(this.player);
    this.stats.evolvedWeapon = 1;
} else if (opt.type === 'xp') {
                    if (this.player.gainXP(10)) {
                        chest.collected = true;
                        this.chests = this.chests.filter(c => c !== chest);
                        this.chestMenuActive = false;
                        this.chestScreen.classList.add('hidden');
                        this.showLevelUpMenu();
                        return;
                    }
                } else if (opt.type === 'crystals') {
                    this.earnedBlue += 3;
                    addBlueCrystals(3);
                } else if (opt.type === 'legendaryUpgrade') {
                    const candidates = [
                        ...this.player.weapons.filter(w => w.level < 8),
                        ...this.player.items.filter(i => i.level < 10)
                    ];
                    if (candidates.length > 0) {
                        const target = candidates[Math.floor(Math.random() * candidates.length)];
                        if (target instanceof GameItem) {
                            target.applyUpgrade('legendary', CONFIG.upgrades.rarities.legendary.multiplier);
                            this.player.recalculateStats();
                        } else {
                            const params = target.generateUpgradeParams('legendary');
                            target.applyUpgradePackage('legendary', params);
                        }
                    } else {
                        if (this.player.gainXP(10)) {
                            chest.collected = true;
                            this.chests = this.chests.filter(c => c !== chest);
                            this.chestMenuActive = false;
                            this.chestScreen.classList.add('hidden');
                            this.showLevelUpMenu();
                            return;
                        }
                    }
                }
                chest.collected = true;
                this.chests = this.chests.filter(c => c !== chest);
                this.chestMenuActive = false;
                this.chestScreen.classList.add('hidden');
            });
            selContainer.appendChild(card);
        }
        const rerollBtn = document.createElement('button');
        rerollBtn.textContent = this.t('reroll');
        rerollBtn.style.marginTop = '12px';
        rerollBtn.style.padding = '8px 16px';
        rerollBtn.style.fontFamily = '"Press Start 2P", monospace';
        rerollBtn.style.fontSize = '11px';
        rerollBtn.style.background = '#4a6fa5';
        rerollBtn.style.color = 'white';
        rerollBtn.style.border = 'none';
        rerollBtn.style.cursor = 'pointer';
        rerollBtn.style.display = 'block';
        rerollBtn.style.width = '100%';
        rerollBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.tryRewardedReroll(() => this.showEvolutionMenu(chest));
        });
        selContainer.appendChild(rerollBtn);
    }

    showVictory() {
    if (window.AudioManager) window.AudioManager.playSFX('victory_jingle');
    this.paused = true;
    
    // ======= ВСТАВИТЬ ЭТИ ТРИ СТРОКИ =======
    this.stats.elapsedTime = this.elapsedTime;
    this.stats.playerLevel = this.player.level;
    this.stats.bossDefeated = 1;
    // =====================================
    if (this.container) this.container.querySelectorAll('.game-over-overlay').forEach(o => o.remove());
    this.gameOverScreen.classList.remove('hidden');
    const weaponsBreakdown = this._formatWeaponDamage();
    const sessionCrystals = this.earnedBlue;

        this.gameOverScreen.innerHTML = `
            <h2>${this.t('victoryTitle')}</h2>
            <div style="font-size:12px;margin-bottom:8px;">${this.t('results')}</div>
            <div style="text-align:left;font-size:11px;margin:12px 0;line-height:1.6;">
                <div>${this.t('resultsDamage')} <span style="color:#ffd966;">${this.stats.totalDamageDealt.toFixed(1)}</span></div>
                ${weaponsBreakdown}
                <div>${this.t('resultsKills')} <span style="color:#ffd966;">${this.stats.totalKills}</span></div>
                <div>${this.t('resultsCrystals')} <span style="color:#7fb4ff;">${sessionCrystals}</span></div>
                <div>${this.t('resultsDamageTaken')} <span style="color:#e17055;">${this.stats.totalDamageTaken.toFixed(1)}</span></div>
                <div>${this.t('resultsHealing')} <span style="color:#6ab04c;">${this.stats.totalHealingReceived.toFixed(1)}</span></div>
            </div>
            <button id="restartBtn">${this.t('restart')}</button>
            <button id="menuBtn">${this.t('menu')}</button>
        `;
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('menuBtn').addEventListener('click', () => this.goToMenu());

        addBlueCrystals(sessionCrystals);
        saveMetaProgress();
        if (this.player.weapons.length >= CONFIG.chest.maxWeapons &&
    this.player.items.length >= CONFIG.chest.maxItems) {
    this.stats.fullLoadout = 1;
}
        // Проверка достижений
const lang = this._getLang();
const newAchievements = checkRunAchievements(this.stats, (amount) => {
    this.earnedBlue += amount;
    addBlueCrystals(amount);
});

// Показываем всплывающие уведомления
// Показываем всплывающие уведомления и синхронизируем с SDK
newAchievements.forEach(ach => {
    const achName = ach['name_' + lang] || ach.name_ru || ach.id;
    this.addDamageText(this.player.x, this.player.y - 35, `🏆 ${achName}`, '#ffd966');
    // Разблокируем достижение в Яндекс.Играх
    if (this.game.sdk?.isReady) {
        this.game.sdk.unlockAchievement(ach.id);
    }
});
        if (this.dailyRun && !isDailyCompleted()) {
            addBlueCrystals(this.game.dailyConfig.reward);
            markDailyCompleted();
        }
        recordDifficultyWin(this.game.selectedDifficulty || 'normal');
    }

    showGameOver() {
        if (window.AudioManager) window.AudioManager.playSFX('gameover_jingle');
        this.paused = true;
        this.stats.elapsedTime = this.elapsedTime;
        // Отправка счета в лидерборд (только для бесконечного режима)
if (this.endlessRun) {
    const kills = this.stats.totalKills;
    const playerName = getPlayerName();
    submitScore(playerName, kills);               // локальная таблица
    // Отправка в Яндекс.Лидерборд
    if (this.game.sdk?.isReady) {
        this.game.sdk.setLeaderboardScore('kills', kills);
    }
}
this.stats.playerLevel = this.player.level;
        this.container.querySelectorAll('.game-over-overlay').forEach(o => o.remove());
        this.gameOverScreen.classList.remove('hidden');

        const weaponsBreakdown = this._formatWeaponDamage();
        const sessionCrystals = this.earnedBlue;

        this.gameOverScreen.innerHTML = `
            <h2>${this.t('gameOverTitle')}</h2>
            <div style="font-size:12px;margin-bottom:8px;">${this.t('results')}</div>
            <div style="text-align:left;font-size:11px;margin:12px 0;line-height:1.6;">
                <div>${this.t('resultsDamage')} <span style="color:#ffd966;">${this.stats.totalDamageDealt.toFixed(1)}</span></div>
                ${weaponsBreakdown}
                <div>${this.t('resultsKills')} <span style="color:#ffd966;">${this.stats.totalKills}</span></div>
                <div>${this.t('resultsCrystals')} <span style="color:#7fb4ff;">${sessionCrystals}</span></div>
                <div>${this.t('resultsDamageTaken')} <span style="color:#e17055;">${this.stats.totalDamageTaken.toFixed(1)}</span></div>
                <div>${this.t('resultsHealing')} <span style="color:#6ab04c;">${this.stats.totalHealingReceived.toFixed(1)}</span></div>
            </div>
            <button id="reviveBtn">${this.t('revive')}</button>
            <button id="restartBtn">${this.t('restart')}</button>
            <button id="menuBtn">${this.t('menu')}</button>
        `;

        document.getElementById('reviveBtn').addEventListener('click', () => this.tryRevive());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('menuBtn').addEventListener('click', () => this.goToMenu());

        addBlueCrystals(sessionCrystals);
        saveMetaProgress();
        if (this.player.weapons.length >= CONFIG.chest.maxWeapons &&
    this.player.items.length >= CONFIG.chest.maxItems) {
    this.stats.fullLoadout = 1;
}
        // Проверка достижений
const lang = this._getLang();
const newAchievements = checkRunAchievements(this.stats, (amount) => {
    this.earnedBlue += amount;
    addBlueCrystals(amount);
});

// Показываем всплывающие уведомления и синхронизируем с SDK
newAchievements.forEach(ach => {
    const achName = ach['name_' + lang] || ach.name_ru || ach.id;
    this.addDamageText(this.player.x, this.player.y - 35, `🏆 ${achName}`, '#ffd966');
    // Разблокируем достижение в Яндекс.Играх
    if (this.game.sdk?.isReady) {
        this.game.sdk.unlockAchievement(ach.id);
    }
});
    }

    async tryRevive() {
        const sdk = this.game.sdk;
        if (!sdk || !sdk.isReady) {
            alert(this.t('adsOnlyYandex'));
            return;
        }
        const rewarded = await sdk.showRewarded();
        if (rewarded) {
            this.player.hp = Math.floor(this.player.maxHp * 0.5);
            this.stats.usedRevive = 1;
            this.player.isDead = false;
            this.player.hasRevive = false;
            this.deathAnimationPlaying = false;
            this.deathTimer = 0;
            this.deathAnimationCompleted = false;
            this.gameOverScreen.classList.add('hidden');
            this.paused = false;
            this.addDamageText(this.player.x, this.player.y - 20, this.t('revive'), '#6ab04c');
        }
    }

    async tryRewardedReroll(callback) {
        const sdk = this.game.sdk;
        if (!sdk || !sdk.isReady) {
            alert(this.t('adsOnlyYandex'));
            return;
        }
        const rewarded = await sdk.showRewarded();
        if (rewarded && typeof callback === 'function') {
            callback();
        }
    }

    async restart() {
        if (this.container) {
            this.container.querySelectorAll('.game-over-overlay, .game-over').forEach(el => el.classList.add('hidden'));
        }
        this.deathAnimationCompleted = false;
        this.deathAnimationPlaying = false;
        this.deathTimer = 0;
        this.paused = false;
        await this.showInterstitial();
        this.game.switchScene('game');
    }

    async showInterstitial() {
        const sdk = this.game.sdk;
        if (!sdk || !sdk.isReady || !sdk.ysdk?.adv) return Promise.resolve();
        try {
            await sdk.showInterstitial();
        } catch (e) {
            console.warn('Interstitial failed:', e);
        }
    }

    goToMenu() {
        this.destroy();
        this.showInterstitial().finally(() => {
            this.game.switchScene('menu');
            setTimeout(() => {
                if (window.AudioManager) window.AudioManager.playMusic('menu_theme');
            }, 150);
        });
    }

    togglePause() {
    if (this.levelUpActive || this.chestMenuActive) return;
    this.paused = !this.paused;
    if (this.paused) {
        this.pauseScreen.classList.remove('hidden');
        this.updateStatsDisplay();
        this.confirmDialog.classList.add('hidden');
        // Останавливаем музыку при паузе
        if (window.AudioManager) window.AudioManager.mute();
    } else {
        this.pauseScreen.classList.add('hidden');
        this.confirmDialog.classList.add('hidden');
        // Возобновляем музыку при снятии паузы
        if (window.AudioManager) window.AudioManager.unmute();
    }
}

    _formatWeaponDamage() {
        let html = '';
        for (const [type, dmg] of Object.entries(this.stats.weaponDamage)) {
            const name = this.locWeapon(type);
            html += `<div style="padding-left: 10px;">⚡ ${name}: <span style="color:#ffd966;">${Math.floor(dmg)}</span></div>`;
        }
        return html;
    }

    update(delta) {
        if (!this.player || !this.worldReady) return;
        this.lastDelta = delta;
        delta *= this.gameSpeed;
        if (this.paused || this.levelUpActive || this.chestMenuActive || this.deathAnimationCompleted) return;

        this.cameraX = Math.round(this.player.x - (this.canvas.width / 2) / this.cameraZoom);
        this.cameraY = Math.round(this.player.y - (this.canvas.height / 2) / this.cameraZoom);

        // Смерть / воскрешение
        if (this.player && this.player.isDead) {
            if (!this.deathAnimationPlaying) {
                if (this.player.hasRevive) {
                    this.player.hp = Math.floor(this.player.maxHp * 0.5);
                    this.player.isDead = false;
                    this.player.hasRevive = false;
                    this.deathAnimationPlaying = false;
                    this.addDamageText(this.player.x, this.player.y - 20, this.t('revive'), '#6ab04c');
                    this.deathTimer = 0;
                } else {
                    this.deathAnimationPlaying = true;
                    this.deathTimer = 0;
                }
            }
        }
        if (this.deathAnimationPlaying) {
            const effective = delta * 0.2;
            this.deathTimer += delta;
            this.player.updateAnimation(effective);
            if (this.deathTimer >= this.deathAnimDuration) {
                this.showGameOver();
                this.deathAnimationPlaying = false;
                this.deathAnimationCompleted = true;
            }
            return;
        }

        const escDown = this.input.isDown('escape');
        if (escDown && !this.escWasPressed) this.togglePause();
        this.escWasPressed = escDown;
        if (this.paused || this.levelUpActive || this.chestMenuActive) return;

        this.potSpawnTimer += delta;
        if (this.potSpawnTimer >= 15) { this.potSpawnTimer = 0; this.spawnPot(); }
        this.player.updateElixir(delta);

        let mx = 0, my = 0;
        const keyX = (this.input.isDown('a') ? -1 : 0) + (this.input.isDown('d') ? 1 : 0);
        const keyY = (this.input.isDown('w') ? -1 : 0) + (this.input.isDown('s') ? 1 : 0);
        if (keyX !== 0 || keyY !== 0) {
            mx = keyX;
            my = keyY;
        } else if (this.joystick) {
            const joy = this.joystick.getMoveVector();
            mx = joy.x;
            my = joy.y;
        }
        const mag = Math.hypot(mx, my);
        if (mag > 1) { mx /= mag; my /= mag; }
        this.player.move(mx, my, delta);
        this.world.resolveCollision(this.player);
        this.world.checkPotCollision(this.player, this);
        this.player.updateAnimation(delta);

        // Таймеры и волны
        if (!this.bossSpawned && !this.inBossFight) {
            if (this.endlessRun) {
                this.elapsedTime += delta;
                if (this.hudElements.timer) {
                    const totalSec = Math.floor(this.elapsedTime);
                    const min = Math.floor(totalSec / 60);
                    const sec = totalSec % 60;
                    this.hudElements.timer.textContent = `+${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                }
            } else {
                this.roundTime -= delta;
                if (this.roundTime <= 0) this.spawnBoss();
            }
            if (this.bossFlash > 0) this.bossFlash = Math.max(0, this.bossFlash - delta * 2);
            if (this.showBossWarning > 0) this.showBossWarning = Math.max(0, this.showBossWarning - delta);

            this.waveTimer += delta;
            if (this.waveTimer >= 120) {
                this.waveTimer = 0;
                this.waveLevel++;
                this.currentMaxEnemies = 200 + this.waveLevel * 20;
            }
            if (this.endlessRun) {
                this.currentEndlessMultiplier = 1 + Math.floor(this.elapsedTime / 120) * 0.15;
                this.spawnIntervalMult = Math.max(0.3, 1.0 - (this.elapsedTime / 600) * 0.5);
            }
        }

        // Спавн врагов
        if (!this.inBossFight) {
            this.evolutionBossTimer += delta;
            if (this.evolutionBossTimer >= this.evolutionBossInterval) {
                this.evolutionBossTimer = 0;
                this.spawnEnemy('shooter', false);
            }
            this.spawnTimer += delta;
            const interval = CONFIG.enemies.spawnInterval / (1 + this.waveLevel * 0.1);
            if (this.spawnTimer >= interval) {
                this.spawnTimer = 0;
                let types = ['basic'];
                if (this.waveLevel < 2) types = ['basic'];
                else if (this.waveLevel < 4) types = ['basic', 'fast'];
                else if (this.waveLevel < 6) types = ['fast', 'tank', 'shooter'];
                else if (this.waveLevel < 8) types = ['tank', 'shooter', 'bomber'];
                else types = ['shooter', 'bomber', 'summoner'];
                const type = types[Math.floor(Math.random() * types.length)];
                const eliteChance = CONFIG.enemies.eliteChance + this.player.luck * 0.05;
                this.spawnEnemy(type, Math.random() < eliteChance);
            }
        }

        // Обновление врагов
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(delta, this.player.x, this.player.y);
            if (enemy.isBoss) {
                const phaseAction = enemy.checkBossPhase ? enemy.checkBossPhase(this.player.x, this.player.y, delta) : null;
                if (enemy.phase === 2 && phaseAction === 'shoot') {
                    const baseAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
                    for (let j = -1; j <= 1; j++) {
                        const angle = baseAngle + j * 0.4;
                        this.enemyProjectiles.push({
                            x: enemy.x, y: enemy.y,
                            vx: Math.cos(angle) * 150,
                            vy: Math.sin(angle) * 150,
                            damage: enemy.damage,
                            radius: 6,
                            color: enemy.phase2Color || '#ff7675',
                            reflected: false,
                            hit: false
                        });
                    }
                }
            }
            if (enemy.type === 'shooter') {
                enemy.shootTimer += delta;
                const cfg = CONFIG.enemies.types.shooter;
                if (enemy.shootTimer >= cfg.shootInterval) {
                    enemy.shootTimer = 0;
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    this.enemyProjectiles.push({
                        x: enemy.x, y: enemy.y,
                        vx: (dx / dist) * cfg.bulletSpeed,
                        vy: (dy / dist) * cfg.bulletSpeed,
                        damage: cfg.bulletDamage,
                        radius: 4,
                        color: '#a29bfe',
                        reflected: false,
                        hit: false
                    });
                }
            }
            if (enemy.type === 'summoner') {
                enemy.summonTimer += delta;
                const cfg = CONFIG.enemies.types.summoner;
                if (enemy.summonTimer >= cfg.summonInterval) {
                    enemy.summonTimer = 0;
                    for (let k = 0; k < 2; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 40;
                        this.spawnEnemyAt(enemy.x + Math.cos(angle) * dist, enemy.y + Math.sin(angle) * dist, 'basic');
                    }
                }
            }
            if (distance(this.player.x, this.player.y, enemy.x, enemy.y) < this.player.radius + enemy.radius) {
                if (this.player.takeDamage(enemy.damage)) {
                    if (window.AudioManager) window.AudioManager.playSFX('player_hurt');
                    this.addDamageText(this.player.x, this.player.y - 10, enemy.damage, '#ff4444');
                    this.stats.recordDamageTaken(enemy.damage);
                    if (this.player.thorns > 0) {
                        enemy.hp -= enemy.damage * this.player.thorns;
                        this.addDamageText(enemy.x, enemy.y - 10, (enemy.damage * this.player.thorns).toFixed(1), '#ff8c00');
                    }
                }
            }
        }

        // Frost bursts
        for (let i = this.frostBursts.length - 1; i >= 0; i--) {
            const fb = this.frostBursts[i];
            fb.timer += delta;
            if (fb.timer >= fb.duration) {
                this.frostBursts.splice(i, 1);
                continue;
            }
            for (const enemy of this.enemies) {
                if (enemy.hp <= 0) continue;
                if (distance(enemy.x, enemy.y, fb.x, fb.y) < fb.radius + enemy.radius) {
                    if (!fb.enemiesAffected.has(enemy)) {
                        fb.enemiesAffected.add(enemy);
                        enemy.slowFactor = fb.slowFactor;
                    }
                    if (Math.floor(fb.timer * 5) > Math.floor((fb.timer - delta) * 5)) {
                        enemy.hp -= fb.tickDamage;
                        this.addDamageText(enemy.x, enemy.y - 10, fb.tickDamage.toFixed(1), '#5b8dee');
                        if (fb.weaponType) {
                            this.stats.recordWeaponDamage(fb.weaponType, fb.tickDamage);
                        }
                    }
                }
            }
        }
        for (const enemy of this.enemies) {
            if (!this.frostBursts.some(fb => distance(enemy.x, enemy.y, fb.x, fb.y) < fb.radius + enemy.radius)) {
                enemy.slowFactor = 1;
            }
        }

        // Converted allies
        for (const ally of this.convertedAllies) {
            this.updateConvertedAlly(ally, delta);
        }
        this.convertedAllies = this.convertedAllies.filter(ally => ally.hp > 0);
        for (const enemy of this.enemies) {
            if (enemy.hp <= 0 || enemy.converted) continue;
            for (const ally of this.convertedAllies) {
                if (ally.hp <= 0) continue;
                const dist = distance(enemy.x, enemy.y, ally.x, ally.y);
                if (dist < enemy.radius + ally.radius) {
                    ally.hp -= enemy.damage;
                    this.addDamageText(ally.x, ally.y - 10, enemy.damage.toFixed(1), '#ff4444');
                    enemy.hp -= ally.damage;
                    this.addDamageText(enemy.x, enemy.y - 10, ally.damage.toFixed(1), '#ff69b4');
                    enemy.flashTimer = 0.1;
                    ally.flashTimer = 0.1;
                }
            }
        }

        // Weapons
        for (const weapon of this.player.weapons) {
            if (weapon && typeof weapon.update === 'function') {
                weapon.update(delta);
                weapon.attack(this.enemies, this);
            }
        }

        // Projectiles
        for (const proj of this.projectiles) proj.update(delta);
        this.projectiles = this.projectiles.filter(p => p.active);

        // Enemy projectiles
        for (const bullet of this.enemyProjectiles) {
            bullet.x += bullet.vx * delta;
            bullet.y += bullet.vy * delta;
        }
        this.enemyProjectiles = this.enemyProjectiles.filter(b => {
            return b.x > 0 && b.x < CONFIG.world.width && b.y > 0 && b.y < CONFIG.world.height;
        });

        // Enemy bullets hit player
        for (const bullet of this.enemyProjectiles) {
            if (bullet.reflected) continue;
            if (Math.hypot(this.player.x - bullet.x, this.player.y - bullet.y) < this.player.radius + bullet.radius) {
                if (Math.random() < this.player.reflectChance) {
                    bullet.vx *= -1; bullet.vy *= -1; bullet.damage *= 1.5; bullet.color = '#00ff00'; bullet.reflected = true;
                } else {
                    const reducedDamage = Math.floor(bullet.damage * (this.player.permanentProjectileResist || 1));
                    if (this.player.takeDamage(reducedDamage)) {
                        if (window.AudioManager) window.AudioManager.playSFX('player_hurt');
                        this.addDamageText(this.player.x, this.player.y - 10, reducedDamage, '#ff4444');
                    }
                    this.stats.recordDamageTaken(reducedDamage);
                    bullet.hit = true;
                }
            }
        }

        // Reflected bullets
        for (const bullet of this.enemyProjectiles) {
            if (!bullet.reflected) continue;
            for (const enemy of this.enemies) {
                if (enemy.hp <= 0) continue;
                if (Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < enemy.radius + bullet.radius) {
                    enemy.hp -= bullet.damage;
                    this.addDamageText(enemy.x, enemy.y - 10, bullet.damage.toFixed(1), '#00ff00');
                    bullet.hit = true;
                    break;
                }
            }
        }
        this.enemyProjectiles = this.enemyProjectiles.filter(b => !b.hit);

        // Kills
        const defeated = this.enemies.filter(e => e.hp <= 0);
        for (const enemy of defeated) {
            const now = performance.now() / 1000;
            if (window.AudioManager && now - this.lastEnemyDieSFX > 0.1) {
                window.AudioManager.playSFX('enemy_die');
                this.lastEnemyDieSFX = now;
            }
            this.score += enemy.expGiven;
            this.rawEarnedBlue += enemy.isElite ? CONFIG.enemies.blueCrystalsDrop : 0;
            if (enemy.isElite) this.stats.recordBlueCrystal(CONFIG.enemies.blueCrystalsDrop);
            if (enemy.isBoss) {
                this.rawEarnedBlue += CONFIG.boss.blueCrystalsGiven;
                this.stats.recordBlueCrystal(CONFIG.boss.blueCrystalsGiven);
            }
            for (let i = 0; i < enemy.expGiven; i++) {
                this.xpOrbs.push({ x: enemy.x + randomRange(-10, 10), y: enemy.y + randomRange(-10, 10), value: 1 });
            }
            if (!this.chestsDisabled && enemy.isElite && Math.random() < CONFIG.enemies.eliteChestChance) {
                this.chests.push(new Chest(enemy.x, enemy.y));
            }
            if (!this.chestsDisabled && enemy.isElite && enemy.type === 'shooter') {
                this.chests.push(new Chest(enemy.x, enemy.y, 'evolution'));
            }
            if (enemy.type === 'bomber' && enemy.hp <= 0) {
                const cfg = CONFIG.enemies.types.bomber;
                const distToPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
                if (distToPlayer < cfg.explosionRadius) {
                    this.player.takeDamage(cfg.explosionDamage);
                    this.addDamageText(this.player.x, this.player.y - 10, cfg.explosionDamage, '#e74c3c');
                    this.stats.recordDamageTaken(cfg.explosionDamage);
                }
            }
            if (enemy.isBoss) {
                this.inBossFight = false;
                this.bossSpawned = false;
                this.roundTime = 0;
                this.showVictory();
            }
            this.player.addKill(1);
            this.stats.recordKill();
        }
        this.enemies = this.enemies.filter(e => e.hp > 0);

        // Chests
        for (const chest of this.chests) {
            if (!chest.collected && chest.canCollect(this.player)) {
                if (chest.chestType === 'evolution') this.showEvolutionMenu(chest);
                else this.showChestMenu(chest);
            }
        }

        this.collectOrbs();
        this.damageTexts = this.damageTexts.filter(t => t.update(delta));
        this.updateUI();
    }

    handleResize() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (this.joystick) {
            const isPortrait = h > w;
            this.joystick.baseX = isPortrait ? w / 2 : 120;
            this.joystick.baseY = isPortrait ? h - 130 : h - 100;
            this.joystick.radius = isPortrait ? 70 : 60;
            this.joystick.innerRadius = isPortrait ? 30 : 25;
            this.joystick.active = false;
            this.joystick.touchId = null;
        }
         // Адаптивный зум: мир выглядит одинаково крупно на любых экранах
    const baseWidth = 800;  // эталонная ширина (старого канваса)
    const portraitZoom = 1.5;
    const landscapeZoom = Math.max(1.2, window.innerWidth / baseWidth);
    this.cameraZoom = (h > w) ? portraitZoom : landscapeZoom;
    }

    spawnPot() {
        if (!this.world) return;
        const x = randomRange(50, CONFIG.world.width - 50);
        const y = randomRange(50, CONFIG.world.height - 50);
        if (!this.world.isCellBlocked(x, y)) {
            this.world.pots.push({ x, y, size: this.world.tileSize, active: true });
        }
    }

    collectOrbs() {
        const magnet = this.player.magnetRadius;
        for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
            const orb = this.xpOrbs[i];
            const d = distance(this.player.x, this.player.y, orb.x, orb.y);
            if (d < this.player.radius + 6) {
                if (window.AudioManager && Math.random() < 0.3) {
                    window.AudioManager.playSFX('xp_pickup');
                }
                const leveled = this.player.gainXP(Math.floor(orb.value * (this.xpMult || 1)));
                this.xpOrbs.splice(i, 1);
                if (leveled && !this.paused && !this.levelUpActive && !this.chestMenuActive) {
                    this.showLevelUpMenu();
                }
            } else if (d < magnet) {
                const a = Math.atan2(orb.y - this.player.y, orb.x - this.player.x);
                orb.x -= Math.cos(a) * 4;
                orb.y -= Math.sin(a) * 4;
            }
        }
        for (let i = this.blueOrbs.length - 1; i >= 0; i--) {
            const orb = this.blueOrbs[i];
            if (distance(this.player.x, this.player.y, orb.x, orb.y) < this.player.radius + 8) {
                this.rawEarnedBlue += orb.value;
                this.stats.recordBlueCrystal(orb.value);
                this.blueOrbs.splice(i, 1);
            }
        }
    }

    updateUI() {
        if (this.hudElements.hp) this.hudElements.hp.textContent = this.player.hp.toFixed(1);
        if (this.hudElements.score) this.hudElements.score.textContent = this.score;
        if (this.hudElements.timer) {
            if (this.endlessRun) {
                const totalSec = Math.floor(this.elapsedTime);
                const min = Math.floor(totalSec / 60);
                const sec = totalSec % 60;
                this.hudElements.timer.textContent = `+${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
            } else {
                const totalSec = Math.ceil(Math.max(0, this.roundTime));
                const min = Math.floor(totalSec / 60);
                const sec = totalSec % 60;
                this.hudElements.timer.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
            }
        }
        if (this.hudElements.level) this.hudElements.level.textContent = this.player.level;
        if (this.hudElements.xpBar) this.hudElements.xpBar.value = (this.player.currentXP / this.player.xpToNextLevel) * 100;
        if (this.hudElements.blue) {
            this.earnedBlue = Math.floor(this.rawEarnedBlue * this.crystalBonusMult);
            this.hudElements.blue.textContent = this.earnedBlue;
        }

        let weaponsHTML = '';
        this.player.weapons.forEach(w => {
            const iconSrc = ICONS.weapons[w.constructor.name] || '';
            weaponsHTML += `
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <img src="${iconSrc}" class="equipment-icon" title="${w.constructor.name} (${this.t('level')} ${w.level})" style="border-color:#4a6fa5;" />
                    <span style="font-size:8px; color:#fff; font-weight:bold; font-family:'Press Start 2P'; background:rgba(0,0,0,0.8); padding:0 2px;">${this.t('level')} ${w.level}</span>
                </div>`;
        });
        if (weaponsHTML !== this.lastWeaponsHTML) {
            if (this.weaponIconsDiv) this.weaponIconsDiv.innerHTML = weaponsHTML || '';
            this.lastWeaponsHTML = weaponsHTML;
        }

        let itemsHTML = '';
        this.player.items.forEach(item => {
            const iconSrc = ICONS.items[item.type] || '';
            itemsHTML += `
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <img src="${iconSrc}" class="equipment-icon" title="${item.type} (${this.t('level')} ${item.level})" style="border-color:#4a6fa5;" />
                    <span style="font-size:8px; color:#fff; font-weight:bold; font-family:'Press Start 2P'; background:rgba(0,0,0,0.8); padding:0 2px;">${this.t('level')} ${item.level}</span>
                </div>`;
        });
        if (itemsHTML !== this.lastItemsHTML) {
            if (this.itemIconsDiv) this.itemIconsDiv.innerHTML = itemsHTML || '';
            this.lastItemsHTML = itemsHTML;
        }
    }

    updateStatsDisplay() {
        const container = document.getElementById('statsContainer');
        if (!container) return;
        const p = this.player;
        let html = `<strong>${this.t('statsHeader')}</strong><br>`;
        html += `${this.t('statHP')} ${Math.floor(p.hp)} / ${p.maxHp}<br>`;
        html += `${this.t('statDamage')}${p.tempDamageBonus.toFixed(1)}<br>`;
        html += `${this.t('statArmor')} ${p.armor}<br>`;
        html += `${this.t('statSpeed')} ${p.speed.toFixed(0)}<br>`;
        html += `${this.t('statMagnet')} ${p.magnetRadius.toFixed(0)}<br>`;
        html += `${this.t('statLuck')} ${p.luck.toFixed(2)}<br>`;
        html += `${this.t('statCooldown')}${p.cooldownReduction.toFixed(2)}с<br>`;
        html += `${this.t('statExpMult')} ${p.expMultiplier.toFixed(2)}<br>`;
        html += `${this.t('statRegen')} ${this.player.elixirHealAmount.toFixed(1)} HP (${this.t('every')} ${this.player.elixirCooldown.toFixed(1)}с)<br>`;
        html += `${this.t('statCrystals')} ${this.earnedBlue}<br>`;
        html += `${this.t('statWave')} ${this.waveLevel}`;
        container.innerHTML = html;
    }

    draw(ctx) {
        if (!this.worldReady) {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '16px "Press Start 2P"';
            ctx.textAlign = 'center';
            if (this.worldError) ctx.fillText(this.t('mapError'), this.canvas.width / 2, this.canvas.height / 2);
            else ctx.fillText(this.t('loading'), this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        ctx.save();
        if (this.bossFlash > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${this.bossFlash * 0.4})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.deathAnimationPlaying) {
            const progress = Math.min(1, this.deathTimer / this.deathAnimDuration);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * progress})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            const zoom = 1 + 1.5 * progress;
            const sx = this.canvas.width / 2, sy = this.canvas.height / 2;
            ctx.translate(sx, sy);
            ctx.scale(zoom, zoom);
            ctx.translate(-sx, -sy);
            ctx.translate(-(this.player.x - this.canvas.width / 2), -(this.player.y - this.canvas.height / 2));
            if (this.world) this.world.draw(ctx, this.cameraX, this.cameraY, this.canvas.width, this.canvas.height);
            this.player.draw(ctx, this.player.x, this.player.y);
            ctx.globalAlpha = 0.5 * progress;
            ctx.fillStyle = 'black';
            ctx.fillRect(this.cameraX, this.cameraY, this.canvas.width, this.canvas.height);
            ctx.globalAlpha = 1;
            if (this.showBossWarning > 0) {
                ctx.fillStyle = 'red';
                ctx.font = '40px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText(this.t('bossWarning'), this.canvas.width / 2, this.canvas.height / 2 - 40);
            }
            ctx.restore();
            if (this.joystick) this.joystick.draw(ctx);
            return;
        }

        ctx.scale(this.cameraZoom, this.cameraZoom);
        const snapX = Math.round(this.cameraX * this.cameraZoom) / this.cameraZoom;
        const snapY = Math.round(this.cameraY * this.cameraZoom) / this.cameraZoom;
        ctx.translate(-snapX, -snapY);

        if (this.world) this.world.draw(ctx, snapX, snapY, this.canvas.width / this.cameraZoom, this.canvas.height / this.cameraZoom);

        ctx.fillStyle = '#ffd966';
        for (const orb of this.xpOrbs) ctx.fillRect(orb.x - 2, orb.y - 2, 4, 4);
        ctx.fillStyle = '#6c5ce7';
        for (const orb of this.blueOrbs) ctx.fillRect(orb.x - 3, orb.y - 3, 6, 6);

        for (const chest of this.chests) chest.draw(ctx, chest.x, chest.y);
        for (const enemy of this.enemies) enemy.draw(ctx, enemy.x, enemy.y);
        for (const ally of this.convertedAllies) ally.draw(ctx, ally.x, ally.y);

        for (const fb of this.frostBursts) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(fb.timer * 15) * 0.1;
            ctx.fillStyle = 'rgba(91, 141, 238, 0.25)';
            ctx.shadowColor = '#aedcf1';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        for (const b of this.enemyProjectiles) {
            ctx.fillStyle = b.color || '#ff4444';
            ctx.fillRect(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2);
        }

        for (const weapon of this.player.weapons) {
            if (weapon.drawEffect) weapon.drawEffect(ctx, this.player.x, this.player.y);
        }

        for (const p of this.projectiles) p.draw(ctx, p.x, p.y);

        this.drawDamageTexts(ctx);

        this.player.draw(ctx, this.player.x, this.player.y);

        if (this.showBossWarning > 0 && !this.deathAnimationPlaying) {
            ctx.fillStyle = 'red';
            ctx.font = '40px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(this.t('bossWarning'), this.canvas.width / 2, this.canvas.height / 2);
        }

        ctx.restore();

        if (this.joystick) this.joystick.draw(ctx);
    }

    createWeaponInstance(type) {
        switch (type) {
            case 'Sword': return new Sword(this.player);
            case 'Staff': return new Staff(this.player);
            case 'Aura': return new Aura(this.player);
            case 'Bone': return new Bone(this.player);
            case 'Daggers': return new Daggers(this.player);
            case 'Lightning': return new Lightning(this.player);
            case 'Bow': return new Bow(this.player);
            case 'Skulls': return new Skulls(this.player);
            default: return new Sword(this.player);
        }
    }

    destroy() {
        if (this.container) { this.container.remove(); this.container = null; }
        this.input.reset();
        if (this.joystick) { this.joystick.destroy(); this.joystick = null; }
    }

    addDamageText(worldX, worldY, text, color) {
        if (typeof text !== 'string') text = String(text);
        const isPlayerDamage = color === '#6ab04c';
        if (!isPlayerDamage && color !== '#7fb4ff' && color !== '#6ab04c' && color !== '#ffd966') {
            if (window.AudioManager && Math.random() < 0.5) {
                window.AudioManager.playSFX('weapon_hit');
            }
        }
        this.damageTexts.push(new DamageText(worldX, worldY, text, color, isPlayerDamage));
        let numValue = 0;
        const match = text.match(/[-+]?\d+(\.\d+)?/);
        if (match) numValue = parseFloat(match[0]);
        if (isPlayerDamage) {
            this.stats.recordHealing(numValue);
        }
    }

    addFrostBurst(x, y, radius, duration, tickDamage, slowFactor, weaponType) {
        this.frostBursts.push({
            x, y, radius, duration, timer: 0,
            tickDamage, slowFactor,
            enemiesAffected: new Set(),
            weaponType: weaponType
        });
    }

    convertEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
        this.enemies.splice(index, 1);
        enemy.converted = true;
        this.convertedAllies.push(enemy);
        this.stats.convertedEnemy = 1;
    }
}

    updateConvertedAlly(ally, delta) {
        let closest = null;
        let closestDist = Infinity;
        for (const enemy of this.enemies) {
            if (enemy.hp <= 0 || enemy.converted) continue;
            const d = distance(ally.x, ally.y, enemy.x, enemy.y);
            if (d < closestDist) {
                closestDist = d;
                closest = enemy;
            }
        }
        if (!closest) return;
        const dx = closest.x - ally.x;
        const dy = closest.y - ally.y;
        const len = Math.hypot(dx, dy);
        if (len > 1) {
            ally.x += (dx / len) * ally.speed * delta;
            ally.y += (dy / len) * ally.speed * delta;
        }
    }

    drawDamageTexts(ctx) {
        for (const dt of this.damageTexts) {
            dt.draw(ctx, dt.x, dt.y);
        }
    }
    async sendAchievementsToSDK() {
    if (!this.game.sdk?.isReady) return;
    const achievements = getAchievementsForSDK();
    try {
        await this.game.sdk.player.setStats({ achievements });
    } catch (e) {
        console.warn('Achievements sync failed:', e);
    }
}
// js/scenes/GameScene.js

// Удалите или оставьте (они больше не используются):
// _buildSettingRow(labelText, controlHTML) { ... }
// _createSliderHTML(value, category) { ... }

// Замените существующий метод showPauseSettings() на этот:
showPauseSettings() {
    // Удаляем старый оверлей, если есть
    const old = document.getElementById('pauseSettingsOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pauseSettingsOverlay';
    overlay.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.92); display: flex; flex-direction: column;
        align-items: center; justify-content: center; z-index: 110;
        font-family: 'Press Start 2P', monospace; color: white; padding: 20px;
    `;

    // Заголовок
    const title = document.createElement('h2');
    title.textContent = this.t('settings');
    title.style.cssText = 'color:#ffd966; margin-bottom:20px;';
    overlay.appendChild(title);

    const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');

    const list = document.createElement('div');
    list.style.cssText = 'max-width:500px; width:100%; display:flex; flex-direction:column; gap:15px;';

    // Громкость музыки
    list.appendChild(this._createSliderRow(
        'musicVolume',
        this.t('musicVolume'),
        settings.musicVolume ?? 0.5
    ));

    // Громкость звуков
    list.appendChild(this._createSliderRow(
        'sfxVolume',
        this.t('sfxVolume'),
        settings.sfxVolume ?? 0.7
    ));

    overlay.appendChild(list);

    // Кнопка "Назад"
    const backBtn = document.createElement('button');
    backBtn.textContent = '◀ ' + this.t('back');
    backBtn.style.cssText = 'margin-top:20px; padding:10px 20px; background:#4a6fa5; border:none; font-family:inherit; font-size:14px; color:white; cursor:pointer;';
    backBtn.addEventListener('click', () => overlay.remove());
    overlay.appendChild(backBtn);

    document.getElementById('gameContainer').appendChild(overlay);
}

// Убедитесь, что этот вспомогательный метод присутствует в классе:
_createSliderRow(key, labelText, value) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';

    const label = document.createElement('span');
    label.textContent = labelText;
    label.style.cssText = 'font-size:12px; flex:1;';
    row.appendChild(label);

    const percent = Math.round(value * 100);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 100;
    slider.value = percent;
    slider.step = 1;
    slider.style.width = '150px';
    slider.dataset.category = key;

    const display = document.createElement('span');
    display.textContent = percent + '%';
    display.style.cssText = 'margin-left:10px; font-size:12px;';

    slider.addEventListener('input', () => {
        const vol = slider.value / 100;
        display.textContent = Math.round(vol * 100) + '%';
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        settings[key] = vol;
        localStorage.setItem('pixelSurvivors_settings', JSON.stringify(settings));
        if (window.AudioManager) {
            if (key === 'musicVolume') window.AudioManager.setVolume('music', vol);
            else if (key === 'sfxVolume') window.AudioManager.setVolume('sfx', vol);
        }
    });

    const wrapper = document.createElement('span');
    wrapper.appendChild(slider);
    wrapper.appendChild(display);
    row.appendChild(wrapper);

    return row;
}

_buildSettingRow(labelText, controlHTML) {
    return `<div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; flex:1;">${labelText}</span>
        <span>${controlHTML}</span>
    </div>`;
}

_createSliderHTML(value, category) {
    const percent = Math.round(value * 100);
    return `<input type="range" min="0" max="100" value="${percent}" step="1" data-category="${category}" style="width:150px;">
            <span class="slider-value" style="margin-left:10px; font-size:12px;">${percent}%</span>`;
}
_locEvolutionDesc(baseWeaponType) {
    const evo = CONFIG.evolutions?.[baseWeaponType];
    if (!evo) return '';
    const lang = this._getLang();
    return evo['desc_' + lang] || evo.desc_ru || '';
}
}