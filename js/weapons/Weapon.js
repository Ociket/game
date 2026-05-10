// js/weapons/Weapon.js
import { CONFIG } from '../data/config.js';

export class Weapon {
    constructor(owner, config, weaponType = null) {
        this.owner = owner;
        this.config = { ...config };
        this.weaponType = weaponType;
        this.cooldownTimer = 0;
        this.level = 0;
        this.isEvolved = false;
    }

    canAttack() { return this.cooldownTimer <= 0; }
    attack(enemies, scene) {}
    update(delta) { if (this.cooldownTimer > 0) this.cooldownTimer -= delta; }

    getDamage() {
        let dmg = this.config.damage || 0;
        if (this.owner && this.owner.tempDamageBonus) dmg += this.owner.tempDamageBonus;
        return dmg;
    }

    getCooldown() {
        const reduction = this.owner ? (this.owner.cooldownReduction || 0) : 0;
        return Math.max(0.1, (this.config.cooldown || 0.5) - reduction);
    }

    // Вспомогательный метод для получения текущего языка
    _getLang() {
        try {
            const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
            return settings.language || 'ru';
        } catch { return 'ru'; }
    }

    // ------ Система улучшений ------
    static RARITY_BUDGETS = { common: 2, uncommon: 4, epic: 6, legendary: 10 };

    getUpgradeModules() { return []; }

    getUpgradeOptions(rarity) {
        const budget = Weapon.RARITY_BUDGETS[rarity];
        const allModules = this.getUpgradeModules();
        if (!allModules.length) return [];

        const commonModules = allModules.filter(m => m.cost < 3);
        const rareModules = allModules.filter(m => m.cost >= 3);
        const rareChance = { common: 0.3, uncommon: 0.6, epic: 0.9, legendary: 1.0 }[rarity];

        const selectedStats = new Set();
        const selectedModules = [];
        let remaining = budget;

        if (rareModules.length > 0 && Math.random() < rareChance) {
            const affordableRare = rareModules.filter(m => m.cost <= remaining);
            if (affordableRare.length > 0) {
                const picked = affordableRare[Math.floor(Math.random() * affordableRare.length)];
                selectedModules.push(picked);
                selectedStats.add(picked.stat);
                remaining -= picked.cost;
            }
        }

        const availableCommon = commonModules.filter(m => !selectedStats.has(m.stat));
        while (remaining > 0) {
            const affordable = availableCommon.filter(m => m.cost <= remaining);
            if (affordable.length === 0) break;
            const picked = affordable[Math.floor(Math.random() * affordable.length)];
            selectedModules.push(picked);
            selectedStats.add(picked.stat);
            remaining -= picked.cost;
        }

        const grouped = {};
        for (const mod of selectedModules) {
            const stat = mod.stat;
            if (!grouped[stat]) {
                grouped[stat] = {
                    id: stat,
                    value: 0,
                    format: mod.format,
                };
            }
            grouped[stat].value += mod.value;
        }

        return Object.values(grouped).map(g => ({
            id: g.id,
            value: g.value,
            name: g.format(g.value)   // здесь format = наша локализованная функция
        }));
    }

    applyUpgradeSet(upgradesArray) {
        for (const upg of upgradesArray) {
            this._applySingle(upg);
        }
        this.level++;
    }

    _applySingle({ id, value }) {
        switch (id) {
            case 'damage':
                this.config.damage = (this.config.damage || 0) + value;
                break;
            case 'cooldown':
                this.config.cooldown = Math.max(0.1, (this.config.cooldown || 0) + value);
                break;
            case 'range':
                this.config.range = (this.config.range || 0) + value;
                break;
            case 'projectiles':
                this.config.projectiles = (this.config.projectiles || 1) + value;
                break;
            default: break;
        }
    }

    canEvolve(player) {
        if (!this.weaponType || this.level < 8) return false;
        const evoData = CONFIG.evolutions?.[this.weaponType];
        if (!evoData) return false;
        // Если requiredItem не указан (null/undefined) – эволюция доступна без предмета
if (!evoData.requiredItem) return true;
// Иначе проверяем наличие предмета нужного уровня
return player.items.some(it => it.type === evoData.requiredItem && it.level >= (evoData.requiredItemLevel || 5));
    }

    applyEvolution(player) {
        this.isEvolved = true;
        const evoData = CONFIG.evolutions?.[this.weaponType];
        if (!evoData) return false;
        Object.keys(evoData.newConfig || {}).forEach(key => {
            this.config[key] = evoData.newConfig[key];
        });
        return true;
    }
}