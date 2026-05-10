// js/weapons/Bone.js
import { Weapon } from './Weapon.js';
import { CONFIG } from '../data/config.js';
import { distance } from '../utils.js';
import { formatUpgrade } from '../utils/UpgradeText.js';

// ---------- Снаряд кости ----------
export class BoneProjectile {
    constructor(x, y, dirX, dirY, damage, speed, maxDist, scene, weapon = null) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.damage = damage;
        this.speed = speed;
        this.maxDist = maxDist;
        this.travelled = 0;
        this.active = true;
        this.radius = 6;
        this.scene = scene;
        this.weapon = weapon;                // ссылка на оружие Bone
        this.hitEnemies = new Set();
        this.color = weapon && weapon.isEvolved ? '#e67e22' : '#FF4500'; // оранжевый при эволюции
        this.angle = Math.atan2(dirY, dirX);
        this.trailParticles = [];

        this.critChance = weapon ? (weapon.critChance || 0) : 0;
        this.critMultiplier = weapon ? (weapon.critMultiplier || 1.5) : 1.5;
    }

    update(delta) {
        if (!this.active) return;
        this.x += this.dirX * this.speed * delta;
        this.y += this.dirY * this.speed * delta;
        this.travelled += this.speed * delta;
        this.angle += delta * 15;

        // Трассер
        if (Math.random() < 0.8 && this.scene.particlesEnabled && this.trailParticles.length < this.scene.maxParticles) {
    this.trailParticles.push({
        x: this.x, y: this.y,
        life: 0.3, age: 0, size: 2 + Math.random() * 3,
        color: this.weapon?.isEvolved ? '#ff8c00' : '#FF8C00'
    });
}
        for (const p of this.trailParticles) p.age += delta;
        this.trailParticles = this.trailParticles.filter(p => p.age < p.life);

        // Попадание и поджог
        for (const enemy of this.scene.enemies) {
            if (!enemy || enemy.hp <= 0 || this.hitEnemies.has(enemy)) continue;
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < enemy.radius + this.radius) {
                let finalDamage = this.damage;
                let color = this.color;
                if (this.critChance && Math.random() < this.critChance) {
                    finalDamage *= this.critMultiplier;
                    color = '#FFFF00';
                }
                enemy.hp -= finalDamage;
                this.scene.addDamageText(enemy.x, enemy.y - 10, finalDamage.toFixed(1), color);
                if (this.weapon) {
    this.scene.stats.recordWeaponDamage(this.weapon.weaponType, finalDamage);
}
                this.hitEnemies.add(enemy);
                enemy.flashTimer = 0.1;

                // Поджог (только при эволюции, шанс 20%)
                if (this.weapon && this.weapon.isEvolved && Math.random() < this.weapon.burnChance) {
                    // Если враг ещё не горит – зажечь
                    if (!enemy._burn) {
                        enemy._burn = {
                            ticksLeft: Math.floor(this.weapon.burnDuration / this.weapon.burnInterval),
                            tickDamage: this.damage * this.weapon.burnDamagePercent,
                            interval: this.weapon.burnInterval,
                            timer: 0,
                            weaponType: this.weapon.weaponType   // ← добавили
                            
                        };
                    }
                }
            }
        }

        if (this.travelled >= this.maxDist) this.active = false;
    }

    draw(ctx, screenX, screenY) {
        // Шлейф
        for (const p of this.trailParticles) {
            const alpha = 1 - p.age / p.life;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Сама кость
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;
        ctx.fillRect(-8, -3, 16, 6);
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-6, -1, 12, 2);
        ctx.restore();
    }
}

// ---------- Оружие Кость ----------
export class Bone extends Weapon {
    constructor(owner) {
        super(owner, CONFIG.weapons.bone, 'Bone');

        // Уникальные параметры
        this.boneCount = this.config.projectiles || 1;   // количество костей
        this.critChance = this.config.critChance || 0;
        this.critMultiplier = 1.5;
        this.boneRange = this.config.range || 280;

        // Поджог (активируется только после эволюции)
        this.burnChance = 0;                // 0.2 после эволюции
        this.burnDuration = 2.0;            // 2 секунды
        this.burnInterval = 0.5;            // раз в 0.5 сек
        this.burnDamagePercent = 0.1;       // 20% от урона кости за тик

        this.damageColor = '#FF4500';
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
        { stat: 'boneCount', value: 1, cost: 6, format: v => formatUpgrade('boneCount', v, lang) },
        { stat: 'critChance', value: 0.05, cost: 3, format: v => formatUpgrade('critChance', v, lang) },
        { stat: 'boneRange', value: 20, cost: 1, format: v => formatUpgrade('boneRange', v, lang) },
    ];
}

    _applySingle({ id, value }) {
        switch (id) {
            case 'boneCount':
                this.boneCount += value;
                this.config.projectiles = this.boneCount;
                break;
            case 'critChance':
                this.critChance += value;
                this.config.critChance = this.critChance;
                break;
            case 'boneRange':
                this.boneRange += value;
                this.config.range = this.boneRange;
                break;
            default:
                super._applySingle({ id, value });
                break;
        }
    }

    // ---------- Эволюция ----------
    

    applyEvolution(player) {
        super.applyEvolution(player);
        this.boneCount += 1;                // +1 кость
        this.boneRange += 40;               // +20% дальности (примерно)
        this.burnChance = 0.1;              // 20% шанс поджога
        this.config.projectiles = this.boneCount;
        this.config.range = this.boneRange;
        // Цвет поменяется в BoneProjectile (оранжевый)
    }

    // ---------- Атака ----------
    attack(enemies, scene) {
        if (!this.canAttack()) return;

        const dirX = this.owner.lastMoveX;
        const dirY = this.owner.lastMoveY;
        if (dirX === 0 && dirY === 0) return;

        const baseAngle = Math.atan2(dirY, dirX);
        const count = this.boneCount;
        const spread = 0.3;
        const dmg = this.getDamage();
        const speed = this.config.speed || 400;

        for (let i = 0; i < count; i++) {
            let angle = baseAngle;
            if (count > 1) {
                angle += (i - (count - 1) / 2) * spread;
            }
            const vx = Math.cos(angle);
            const vy = Math.sin(angle);

            scene.projectiles.push(new BoneProjectile(
                this.owner.x, this.owner.y,
                vx, vy,
                dmg, speed,
                this.boneRange,
                scene,
                this   // передаём ссылку на оружие
            ));
        }

        this.cooldownTimer = this.getCooldown();
    }
}