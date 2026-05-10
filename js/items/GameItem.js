// js/items/GameItem.js
import { CONFIG } from '../data/config.js';

export class GameItem {
    constructor(type, config) {
        this.type = type;
        this.config = config;
        this.level = 0;
        this.upgrades = []; // { rarity, multiplier }
    }

    applyUpgrade(rarity, multiplier) {
        this.upgrades.push({ rarity, multiplier });
        this.level++;
    }

    getValue() {
        const keys = Object.keys(this.config);
        // Для предметов с одним числом (старое поведение)
        if (keys.length === 1) {
            const baseValue = this.config[keys[0]] || 0;
            const totalMultiplier = 1 + this.upgrades.reduce((sum, u) => sum + (u.multiplier - 1), 0);
            return baseValue * totalMultiplier;
        }
        // Для elixir (healAmount & cooldown)
        const baseHeal = this.config.healAmount || 0;
        const baseCD = this.config.cooldown || 5;
        const totalMult = 1 + this.upgrades.reduce((sum, u) => sum + (u.multiplier - 1), 0);
        return [baseHeal * totalMult, Math.max(1.0, baseCD / totalMult)];
    }

    generateUpgradeDescription(rarity) {
        // Определяем текущий язык
        const settings = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
        const lang = settings.language || 'ru';
        const mult = CONFIG.upgrades.rarities[rarity].multiplier;

        if (this.type === 'elixir') {
            const [curHeal, curCD] = this.getValue();
            const newHeal = curHeal * mult;
            const newCD = curCD / mult;
            const healDiff = newHeal - curHeal;
            const cdDiff = newCD - curCD;
            if (lang === 'en') {
                return `Regen: +${healDiff.toFixed(1)} HP\nCooldown: ${cdDiff.toFixed(1)} sec`;
            } else {
                return `Регенерация: +${healDiff.toFixed(1)} HP\nПерезарядка: ${cdDiff.toFixed(1)} сек`;
            }
        } else {
            // Одиночная характеристика – определяем её название
            const statKey = Object.keys(this.config)[0];
            const currentVal = this.getValue();
            const newVal = currentVal * mult;
            const diff = newVal - currentVal;

            const statNames = {
                ru: {
                    hpBonus: 'здоровья',
                    armor: 'брони',
                    speedBonus: 'скорости',
                    magnetBonus: 'радиуса подбора',
                    expBonus: 'опыта',
                    damageBonus: 'урона',
                    luck: 'удачи',
                    cooldownReduction: 'перезарядки',
                    experienceMultiplier: 'множителя опыта',
                    killsForCrystal: 'убийств на кристалл',
                    critChanceBonus: 'шанса крита',
                    reflectChance: 'отражения',
                    thorns: 'шипов'
                },
                en: {
                    hpBonus: 'health',
                    armor: 'armor',
                    speedBonus: 'speed',
                    magnetBonus: 'pickup radius',
                    expBonus: 'experience',
                    damageBonus: 'damage',
                    luck: 'luck',
                    cooldownReduction: 'cooldown',
                    experienceMultiplier: 'XP multiplier',
                    killsForCrystal: 'kills per crystal',
                    critChanceBonus: 'crit chance',
                    reflectChance: 'reflection',
                    thorns: 'thorns'
                }
            };
            const statName = (statNames[lang] && statNames[lang][statKey]) || statKey;
            // Форматируем прирост (всегда положительный или отрицательный?)
            // Большинство предметов увеличивают характеристику, поэтому показываем "+"
            return `+${diff.toFixed(1)} ${statName}`;
        }
    }

    getBonusValue(rarity) {
        const mult = CONFIG.upgrades.rarities[rarity].multiplier;
        const baseVal = Object.values(this.config)[0];
        return Math.round(baseVal * (mult - 1));
    }

    getStatName() {
        // Этот метод больше не нужен, но оставлен для совместимости
        const keys = Object.keys(this.config);
        // ... (можно удалить или оставить пустым)
        return keys[0] || '';
    }
}