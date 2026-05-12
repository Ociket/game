// js/weapons/Daggers.js
import { Weapon } from './Weapon.js';
import { CONFIG } from '../data/config.js';
import { distance } from '../utils.js';
import { formatUpgrade } from '../utils/UpgradeText.js';

// ---------- Снаряд кинжала ----------
export class DaggerProjectile {
    constructor(x, y, dirX, dirY, damage, speed, maxRange, scene, weapon = null) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.damage = damage;
        this.speed = speed;
        this.maxRange = maxRange;
        this.travelled = 0;
        this.active = true;
        this.radius = 4;
        this.scene = scene;
        this.weapon = weapon;                // ссылка на оружие для доступа к его параметрам

        // Визуал
        this.color = weapon && weapon.isEvolved ? '#b22222' : '#d4af37';
        this.innerColor = '#fff3b0';
        this.sparkleColor = '#ffea00';
        this.sparkles = [];
        this.hitEnemies = new Set();

        // Крит / кровотечение
        this.critChance = weapon ? (weapon.critChance || 0) : 0;
        this.critMultiplier = weapon ? (weapon.critMultiplier || 1.5) : 1.5;
    }

    update(delta) {
        if (!this.active) return;

        this.x += this.dirX * this.speed * delta;
        this.y += this.dirY * this.speed * delta;
        this.travelled += this.speed * delta;

        // Искры
                if (Math.random() < 0.5 && this.scene && this.scene.particlesEnabled && this.sparkles.length < this.scene.maxParticles) {
    this.sparkles.push({
        x: this.x, y: this.y,
        age: 0, life: 0.15,
        size: 1.5, color: this.sparkleColor
    });
}
        for (const s of this.sparkles) s.age += delta;
        this.sparkles = this.sparkles.filter(s => s.age < s.life);

        // Попадание
        for (const enemy of this.scene.enemies) {
            if (enemy.hp <= 0 || this.hitEnemies.has(enemy)) continue;
            if (distance(enemy.x, enemy.y, this.x, this.y) < enemy.radius + this.radius) {
                let finalDamage = this.damage;
                let dmgColor = this.color;
                let isCrit = false;

                if (Math.random() < this.critChance) {
                    finalDamage *= this.critMultiplier;
                    dmgColor = '#ffffff';
                    isCrit = true;
                }

                enemy.hp -= finalDamage;
                if (this.weapon) {
    this.scene.stats.recordWeaponDamage(this.weapon.weaponType, finalDamage);
}
                this.scene.addDamageText(enemy.x, enemy.y, finalDamage.toFixed(1), dmgColor);
                this.hitEnemies.add(enemy);
                enemy.flashTimer = 0.08;

                // Кровотечение (эволюция)
                if (isCrit && this.weapon && this.weapon.isEvolved && this.weapon.bleedPercent > 0) {
                    // Проверяем, не висит ли уже кровотечение на этом враге
                    if (!enemy._bleed) {
                        enemy._bleed = {
    ticksLeft: this.weapon.bleedTicks,
    tickDamage: this.weapon.getBleedDamage(enemy),
    interval: this.weapon.bleedDuration / this.weapon.bleedTicks,
    timer: 0,
    weaponType: this.weapon.weaponType   // ← добавили
};
                    } else {
                        // Обновляем/продлеваем кровотечение (но не складываем)
                        enemy._bleed.ticksLeft = this.weapon.bleedTicks;
                        enemy._bleed.tickDamage = this.weapon.getBleedDamage(enemy);
                        enemy._bleed.interval = this.weapon.bleedDuration / this.weapon.bleedTicks;
                    }
                }

                this.active = false;   // кинжал исчезает при попадании
                return;
            }
        }

        if (this.travelled >= this.maxRange) this.active = false;
    }

    draw(ctx, screenX, screenY) {
        for (const s of this.sparkles) {
            const alpha = Math.max(0, 1 - s.age / s.life);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(Math.atan2(this.dirY, this.dirX));

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -3);
        ctx.lineTo(-2, 1);
        ctx.lineTo(-4, 3);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 5;
        ctx.fillStyle = this.innerColor;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-2, -1.5);
        ctx.lineTo(-1, 0.5);
        ctx.lineTo(-2, 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// ---------- Оружие Кинжалы ----------
export class Daggers extends Weapon {
    constructor(owner) {
        super(owner, CONFIG.weapons.daggers, 'Daggers');

        // Уникальные параметры
        this.daggerCount = this.config.count || 1;      // начальное количество кинжалов
        this.critChance = this.config.critChance || 0;  // шанс крита (0..1)
        this.critMultiplier = 1.5;

        // Кровотечение (активно только после эволюции)
        this.bleedPercentNormal = 0.05;   // 5% от макс. HP обычных врагов
        this.bleedPercentElite = 0.01;    // 1% для элиток/боссов
        this.bleedTicks = 4;              // количество тиков
        this.bleedDuration = 3.0;         // секунд

        this.damageColor = '#ffff00';
        this.speedFactor = 0.5;           // быстрая атака
    }

    // ---------- Система улучшений ----------
    getUpgradeModules() {
    const lang = this._getLang();
    return [
        { stat: 'damage', value: 1, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'damage', value: 1, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'damage', value: 1, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'cooldown', value: -0.05, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
        { stat: 'cooldown', value: -0.05, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
        { stat: 'daggerCount', value: 1, cost: 4, format: v => formatUpgrade('daggerCount', v, lang) },
        { stat: 'critChance', value: 0.05, cost: 3, format: v => formatUpgrade('critChance', v, lang) },
    ];
}

    _applySingle({ id, value }) {
        switch (id) {
            case 'daggerCount':
                this.daggerCount += value;
                this.config.count = this.daggerCount;
                break;
            case 'critChance':
                this.critChance += value;
                this.config.critChance = this.critChance;
                break;
            default:
                super._applySingle({ id, value });
                break;
        }
    }

    // ---------- Эволюция ----------
    

    applyEvolution(player) {
        super.applyEvolution(player);
        this.daggerCount += 2;
        this.critChance += 0.15;
        this.config.count = this.daggerCount;
        this.config.critChance = this.critChance;
        // Визуал поменяется через DaggerProjectile (цвет)
        // Кровотечение активируется в DaggerProjectile при isEvolved = true
    }

    // Вспомогательная функция расчёта урона кровотечения
    getBleedDamage(enemy) {
        if (!this.isEvolved) return 0;
        const maxHp = enemy.maxHp || 10;   // предполагаем, что у Enemy есть maxHp
        const percent = (enemy.isElite || enemy.isBoss) ? this.bleedPercentElite : this.bleedPercentNormal;
        return Math.ceil(maxHp * percent);
    }

    // ---------- Атака ----------
    attack(enemies, scene) {
        if (!this.canAttack()) return;

        const dirX = this.owner.lastMoveX;
        const dirY = this.owner.lastMoveY;
        if (dirX === 0 && dirY === 0) return;

        const baseAngle = Math.atan2(dirY, dirX);
        const count = this.daggerCount;
        const totalSpread = count > 1 ? 0.4 : 0;
        const dmg = this.getDamage();
        const speed = this.config.speed || 500;
        const range = this.config.range || 150;

        for (let i = 0; i < count; i++) {
            let angle = baseAngle;
            if (count > 1) {
                const offset = (i - (count - 1) / 2) * (totalSpread / (count - 1));
                angle += offset;
            }
            const vx = Math.cos(angle);
            const vy = Math.sin(angle);

            scene.projectiles.push(new DaggerProjectile(
                this.owner.x,
                this.owner.y,
                vx,
                vy,
                dmg,
                speed,
                range,
                scene,
                this   // передаём ссылку на оружие
            ));
        }

        this.cooldownTimer = this.getCooldown() * this.speedFactor;
    }
}