// js/weapons/Staff.js
import { Weapon } from './Weapon.js';
import { CONFIG } from '../data/config.js';
import { distance } from '../utils.js';
import { formatUpgrade } from '../utils/UpgradeText.js';

// ---------- Снаряд посоха ----------
export class StaffProjectile {
    constructor(x, y, dirX, dirY, baseDamage, speed, maxRange, explosionRadius, scene, staffWeapon = null) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.baseDamage = baseDamage;
        this.speed = speed;
        this.maxRange = maxRange;
        this.travelled = 0;
        this.active = true;
        this.scene = scene;
        this.staffWeapon = staffWeapon;   // ссылка на посох

        // Визуал (меняется после эволюции)
        this.color = staffWeapon && staffWeapon.isEvolved ? '#5b8dee' : '#6c5696';
        this.innerColor = '#624599';
        this.explosionColor = staffWeapon && staffWeapon.isEvolved ? '#3a6ea5' : '#643bb1';
        this.radius = 4;
        this.maxRadius = 12;
        this.rotation = 0;
        this.hitEnemies = new Set();

        // Механика роста урона (0.5x → 1.5x)
        this.currentDamage = baseDamage * 0.5;
        this.explosionRadius = explosionRadius;

        this.isExploding = false;
        this.explosionTimer = 0;
        this.explosionDuration = 0.2;

        // Эволюция: ледяная буря
        this.frostBurstChance = (staffWeapon && staffWeapon.isEvolved) ? (staffWeapon.frostBurstChance || 0.25) : 0;
    }

    update(delta) {
        if (!this.active) return;

        if (this.isExploding) {
            this.explosionTimer += delta;
            if (this.explosionTimer >= this.explosionDuration) {
                // Попытка создать ледяную бурю (только при эволюции)
                if (this.frostBurstChance > 0 && Math.random() < this.frostBurstChance) {
                    // Добавляем эффект ледяной бури в сцену
                    this.scene.addFrostBurst(
                        this.x, this.y,
                        this.explosionRadius * 1.5,
                        2.0,                          // длительность 2 сек
                        this.baseDamage * 0.05,       // урон в тик (15% от базового)
                        0.3                           // замедление на 40%
                    );
                }
                this.active = false;
            }
            return;
        }

        // Полёт
        this.x += this.dirX * this.speed * delta;
        this.y += this.dirY * this.speed * delta;
        this.travelled += this.speed * delta;
        this.rotation += delta * 2;

        const growthFactor = Math.min(this.travelled / this.maxRange, 1);
        this.radius = 4 + growthFactor * (this.maxRadius - 4);
        this.currentDamage = this.baseDamage * (0.5 + growthFactor * 1.0);   // 0.5x → 1.5x

        // Попадание → взрыв
        for (const enemy of this.scene.enemies) {
            if (enemy.hp <= 0 || this.hitEnemies.has(enemy)) continue;
            if (distance(enemy.x, enemy.y, this.x, this.y) < enemy.radius + this.radius) {
                this.hitEnemies.add(enemy);
                this.triggerExplosion();
                return;
            }
        }

        if (this.travelled >= this.maxRange) {
            this.triggerExplosion();
        }
    }

    triggerExplosion() {
    this.isExploding = true;
    for (const enemy of this.scene.enemies) {
        if (enemy.hp <= 0) continue;
        if (distance(enemy.x, enemy.y, this.x, this.y) < this.explosionRadius + enemy.radius) {
            enemy.hp -= this.currentDamage;
            this.scene.addDamageText(enemy.x, enemy.y - 10, this.currentDamage.toFixed(1), this.color);
            // ▼ ДОБАВИТЬ ▼
            if (this.staffWeapon) {
                this.scene.stats.recordWeaponDamage(this.staffWeapon.weaponType, this.currentDamage);
            }
            enemy.flashTimer = 0.1;
        }
    }
    // Попытка ледяной бури
    if (this.frostBurstChance > 0 && Math.random() < this.frostBurstChance) {
        // ИЗМЕНИТЬ: добавить weaponType последним аргументом
        this.scene.addFrostBurst(
            this.x, this.y,
            this.explosionRadius * 1.5,
            2.0,
            this.baseDamage * 0.05,
            0.3,
            this.staffWeapon.weaponType   // ← новый аргумент
        );
    }
    // ...
}

    draw(ctx, screenX, screenY) {
        if (this.isExploding) {
            const progress = this.explosionTimer / this.explosionDuration;
            const ringRadius = this.explosionRadius * progress;
            const alpha = 1 - progress;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = this.explosionColor;
            ctx.shadowBlur = 20 * alpha;
            ctx.strokeStyle = this.explosionColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 5;
        ctx.fillStyle = this.innerColor;
        ctx.beginPath();
        ctx.arc(this.radius * 0.3, 0, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, 0, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ---------- Оружие Посох ----------
export class Staff extends Weapon {
    constructor(owner) {
        super(owner, CONFIG.weapons.staff, 'Staff');
        this.staffRange = this.config.range || 340;
        this.explosionRadius = this.config.explosionRadius || 30;
        this.frostBurstChance = 0;   // активируется после эволюции
        this.damageColor = '#6ed355';
    }

    // ---------- Система улучшений ----------
    getUpgradeModules() {
    const lang = this._getLang();
    return [
        { stat: 'damage', value: 1, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'damage', value: 1, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'damage', value: 1, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'cooldown', value: -0.1, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
        { stat: 'cooldown', value: -0.1, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
        { stat: 'staffRange', value: 20, cost: 1, format: v => formatUpgrade('staffRange', v, lang) },
        { stat: 'staffRange', value: 40, cost: 2, format: v => formatUpgrade('staffRange', v, lang) },
        { stat: 'explosionRadius', value: 5, cost: 2, format: v => formatUpgrade('explosionRadius', v, lang) },
        { stat: 'explosionRadius', value: 10, cost: 4, format: v => formatUpgrade('explosionRadius', v, lang) },
    ];
}

    _applySingle({ id, value }) {
        switch (id) {
            case 'staffRange':
                this.staffRange += value;
                this.config.range = this.staffRange;
                break;
            case 'explosionRadius':
                this.explosionRadius += value;
                this.config.explosionRadius = this.explosionRadius;
                break;
            default:
                super._applySingle({ id, value });
                break;
        }
    }

    // ---------- Эволюция ----------
    

    applyEvolution(player) {
        super.applyEvolution(player);
        this.frostBurstChance = 0.05;   // 25% шанс ледяной бури при взрыве
        this.explosionRadius += 10;     // +10 к радиусу взрыва
    }

    // ---------- Атака ----------
    attack(enemies, scene) {
        if (!this.canAttack()) return;

        const dirX = this.owner.lastMoveX;
        const dirY = this.owner.lastMoveY;
        if (dirX === 0 && dirY === 0) return;

        const dmg = this.getDamage();
        const speed = this.config.speed || 250;

        scene.projectiles.push(new StaffProjectile(
            this.owner.x, this.owner.y,
            dirX, dirY,
            dmg, speed,
            this.staffRange,
            this.explosionRadius,
            scene,
            this
        ));

        this.cooldownTimer = this.getCooldown();
    }
}