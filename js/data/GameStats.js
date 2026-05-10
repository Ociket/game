// js/data/GameStats.js
import { CONFIG } from './config.js';

export class GameStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.totalDamageDealt = 0;
        this.totalKills = 0;
        this.blueCrystalsEarned = 0;
        this.totalDamageTaken = 0;
        this.totalHealingReceived = 0;
        this.weaponDamage = {};
        // НОВЫЕ ПОЛЯ ДЛЯ ДОСТИЖЕНИЙ
        this.playerLevel = 0;
        this.elapsedTime = 0;       // секунды
        this.bossDefeated = 0;      // 0/1
        this.fullLoadout = 0;       // 0/1
        this.evolvedWeapon = 0;     // 0/1
        this.usedRevive = 0;        // 0/1
        this.convertedEnemy = 0;    // 0/1
        this.maxChain = 0;          // максимальное количество целей одной молнии
    }

    /**
     * @param {string} weaponType – например 'Sword' или 'BloodSword' (эволюция)
     * @param {number} damage
     */
    recordWeaponDamage(weaponType, damage) {
        const baseType = this._getBaseWeaponType(weaponType);
        if (!this.weaponDamage[baseType]) {
            this.weaponDamage[baseType] = 0;
        }
        this.weaponDamage[baseType] += damage;
        this.totalDamageDealt += damage;
    }

    recordKill() {
        this.totalKills += 1;
    }

    recordBlueCrystal(amount = 1) {
        this.blueCrystalsEarned += amount;
    }

    recordDamageTaken(damage) {
        this.totalDamageTaken += damage;
    }

    recordHealing(amount) {
        this.totalHealingReceived += amount;
    }

    _getBaseWeaponType(type) {
        // Если это эволюция, то в CONFIG.evolutions найдётся запись, у которой evolvedWeapon === type
        const evoEntries = Object.entries(CONFIG.evolutions || {});
        for (const [base, evoData] of evoEntries) {
            if (evoData.evolvedWeapon === type) {
                return base;
            }
        }
        return type;
    }
}