// js/weapons/Bow.js
import { Weapon } from './Weapon.js';
import { CONFIG } from '../data/config.js';
import { distance } from '../utils.js';
import { formatUpgrade } from '../utils/UpgradeText.js';

// ---------- Снаряд стрелы ----------
export class BowProjectile {
    constructor(x, y, targetX, targetY, damage, speed, maxRange, scene,
                pierceCount = 3, dotTicks = 2, dotDamage = 0, dotInterval = 0.5,
                bowWeapon = null) {
        this.x = x;
        this.y = y;
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.hypot(dx, dy) || 1;
        this.dirX = dx / dist;
        this.dirY = dy / dist;

        this.damage = damage;
        this.speed = speed;
        this.maxRange = maxRange;
        this.travelled = 0;
        this.active = true;
        this.radius = 5;
        this.scene = scene;
        this.bowWeapon = bowWeapon;   // ссылка на лук

        // Визуал (меняется после эволюции)
        this.color = bowWeapon && bowWeapon.isEvolved ? '#6b8c42' : '#59c5a8';
        this.pulseTimer = 0;
        this.trail = [];
        this.trailColor = '#4d8377';

        // Пробитие и яд
        this.pierceCount = pierceCount;
        this.hitEnemies = new Set();
        this.dotTicks = dotTicks;
        this.dotDamage = dotDamage;
        this.dotInterval = dotInterval;
        this.dotTimer = 0;

        // Самонаведение (активируется после эволюции)
        this.homingStarted = false;   // включается после 50% дистанции
        this.homingStrength = 0.3;    // сила доворота

        // Взрыв (только при эволюции)
        this.explodes = bowWeapon && bowWeapon.isEvolved ? true : false;
        this.explosionRadius = 30;
        this.explosionDamagePercent = 0.5;
        this.hasExploded = false;
    }

    update(delta) {
        if (!this.active) return;

        // Самонаведение после 50% пути
        if (this.bowWeapon && this.bowWeapon.isEvolved && !this.homingStarted && this.travelled > this.maxRange * 0.5) {
            this.homingStarted = true;
        }

        if (this.homingStarted && this.scene && this.scene.enemies) {
            let closest = null;
            let closestDist = 80; // радиус захвата цели
            for (const enemy of this.scene.enemies) {
                if (enemy.hp <= 0 || enemy.converted) continue;
                const d = distance(this.x, this.y, enemy.x, enemy.y);
                if (d < closestDist) {
                    closestDist = d;
                    closest = enemy;
                }
            }
            if (closest) {
                const dx = closest.x - this.x;
                const dy = closest.y - this.y;
                const len = Math.hypot(dx, dy) || 1;
                // Плавный доворот вектора направления
                this.dirX += (dx / len - this.dirX) * this.homingStrength * delta * 5;
                this.dirY += (dy / len - this.dirY) * this.homingStrength * delta * 5;
                const mag = Math.hypot(this.dirX, this.dirY);
                this.dirX /= mag;
                this.dirY /= mag;
            }
        }

        // Движение
        this.x += this.dirX * this.speed * delta;
        this.y += this.dirY * this.speed * delta;
        this.travelled += this.speed * delta;
        this.pulseTimer += delta;

        // Трассер
                if (Math.random() < 0.3 && this.scene && this.scene.particlesEnabled && this.trail.length < this.scene.maxParticles) {
    this.trail.push({
        x: this.x, y: this.y,
        life: 0.6, age: 0,
        size: 1 + Math.random() * 1,
        color: this.trailColor
    });
}
        for (const p of this.trail) p.age += delta;
        this.trail = this.trail.filter(p => p.age < p.life);

        // Яд (DoT)
        if (this.dotDamage > 0 && this.dotTicks > 0) {
            this.dotTimer += delta;
            if (this.dotTimer >= this.dotInterval && this.hitEnemies.size > 0) {
                this.dotTimer = 0;
                for (const enemy of this.hitEnemies) {
                    if (enemy.hp > 0) {
                        enemy.hp -= this.dotDamage;
                        this.scene.addDamageText(enemy.x, enemy.y - 10, this.dotDamage.toFixed(1), this.color);
                        // Учёт урона яда в статистике лука
                        if (this.bowWeapon) {
                            this.scene.stats.recordWeaponDamage(this.bowWeapon.weaponType, this.dotDamage);
                        }
                    }
                }
                this.dotTicks--;
            }
        }

        // Пробитие и попадание
        for (const enemy of this.scene.enemies) {
            if (enemy.hp <= 0 || enemy.converted || this.hitEnemies.has(enemy)) continue;
            if (distance(enemy.x, enemy.y, this.x, this.y) < enemy.radius + this.radius) {
                enemy.hp -= this.damage;
                this.scene.addDamageText(enemy.x, enemy.y - 10, this.damage.toFixed(1), this.color);
                // Учёт прямого урона стрелы
                if (this.bowWeapon) {
                    this.scene.stats.recordWeaponDamage(this.bowWeapon.weaponType, this.damage);
                }
                this.hitEnemies.add(enemy);
                enemy.flashTimer = 0.1;
                this.pierceCount--;

                // Взрыв при попадании (эволюция)
                if (this.explodes && !this.hasExploded) {
                    this.explode(this.scene);
                    this.hasExploded = true;
                    this.active = false;
                    return;
                }

                if (this.pierceCount <= 0) {
                    this.active = false;
                    return;
                }
            }
        }

        // Если стрела не попала ни в кого и пролетела всю дистанцию – тоже взрываем (если эволюция)
        if (this.travelled >= this.maxRange) {
            if (this.explodes && !this.hasExploded) {
                this.explode(this.scene);
                this.hasExploded = true;
            }
            this.active = false;
        }
    }

    explode(scene) {
        for (const enemy of scene.enemies) {
            if (enemy.hp <= 0 || enemy.converted) continue;
            if (distance(this.x, this.y, enemy.x, enemy.y) < this.explosionRadius + enemy.radius) {
                const explosionDamage = this.damage * this.explosionDamagePercent;
                enemy.hp -= explosionDamage;
                scene.addDamageText(enemy.x, enemy.y - 10, explosionDamage.toFixed(1), '#6b8c42');
                // Учёт урона взрыва
                if (this.bowWeapon) {
                    scene.stats.recordWeaponDamage(this.bowWeapon.weaponType, explosionDamage);
                }
                enemy.flashTimer = 0.1;
            }
        }
    }

    draw(ctx, screenX, screenY) {
        for (const p of this.trail) {
            const alpha = Math.max(0, 1 - p.age / p.life);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 3;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(Math.atan2(this.dirY, this.dirX));
        const pulse = 0.7 + 0.3 * Math.sin(this.pulseTimer * 10);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 * pulse;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -3);
        ctx.lineTo(-4, 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-2, -1.5);
        ctx.lineTo(-2, 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// ---------- Оружие Лук ----------
export class Bow extends Weapon {
    constructor(owner) {
        super(owner, CONFIG.weapons.bow, 'Bow');
        // Уникальные параметры
        this.arrowCount = this.config.projectiles || 1;   // количество стрел
        this.pierceBase = 3;            // базовое пробитие
        this.dotTicks = 2;             // тики яда
        this.dotDamage = 0;            // урон яда (изначально 0, появляется после улучшения)
        this.dotInterval = 0.5;

        this.damageColor = '#80ffdb';   // обычный цвет (мятный)
        this.evoColor = '#6b8c42';      // цвет магического лука (зеленоватый)
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
        { stat: 'arrowCount', value: 1, cost: 6, format: v => formatUpgrade('arrowCount', v, lang) },
        { stat: 'pierce', value: 1, cost: 4, format: v => formatUpgrade('pierce', v, lang) },
        { stat: 'pierce', value: 2, cost: 6, format: v => formatUpgrade('pierce', v, lang) },
        { stat: 'dotTicks', value: 1, cost: 3, format: v => formatUpgrade('dotTicks', v, lang) },
        { stat: 'dotDamage', value: 0.5, cost: 2, format: v => formatUpgrade('dotDamage', v, lang) },
    ];
}

    _applySingle({ id, value }) {
        switch (id) {
            case 'arrowCount':
                this.arrowCount += value;
                this.config.projectiles = this.arrowCount;
                break;
            case 'pierce':
                this.pierceBase += value;
                break;
            case 'dotTicks':
                this.dotTicks += value;
                break;
            case 'dotDamage':
                this.dotDamage += value;
                break;
            default:
                super._applySingle({ id, value });
                break;
        }
    }

    // ---------- Эволюция ----------
   

    applyEvolution(player) {
        super.applyEvolution(player);
        this.arrowCount += 1;               // +1 стрела
        this.pierceBase += 2;               // немного пробития
        this.damageColor = this.evoColor;   // меняем цвет
        this.config.projectiles = this.arrowCount;
        // Самонаведение и взрыв включаются в BowProjectile при isEvolved = true
    }

    // ---------- Атака ----------
    attack(enemies, scene) {
        if (!this.canAttack() || enemies.length === 0) return;

        // Автоприцеливание на ближайшего врага
        let closest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            if (enemy.hp <= 0 || enemy.converted) continue;
            const d = distance(enemy.x, enemy.y, this.owner.x, this.owner.y);
            if (d < minDist && d <= this.config.range) {
                minDist = d;
                closest = enemy;
            }
        }
        if (!closest) return;

        const count = this.arrowCount;
        const baseAngle = Math.atan2(closest.y - this.owner.y, closest.x - this.owner.x);
        const speed = this.config.speed || 400;

        for (let i = 0; i < count; i++) {
            let angle = baseAngle;
            if (count > 1) {
                angle += (i - (count - 1) / 2) * 0.2;
            }
            const targetX = this.owner.x + Math.cos(angle) * this.config.range;
            const targetY = this.owner.y + Math.sin(angle) * this.config.range;

            scene.projectiles.push(new BowProjectile(
                this.owner.x, this.owner.y,
                targetX, targetY,
                this.getDamage(),
                speed,
                this.config.range,
                scene,
                this.pierceBase,
                this.dotTicks,
                this.dotDamage,
                this.dotInterval,
                this   // передаём ссылку на лук
            ));
        }

        this.cooldownTimer = this.getCooldown();
    }
}