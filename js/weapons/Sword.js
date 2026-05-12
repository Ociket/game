// js/weapons/Sword.js
import { Weapon } from './Weapon.js';
import { CONFIG } from '../data/config.js';
import { formatUpgrade } from '../utils/UpgradeText.js'; // <-- новый импорт

// ---------- Снаряд кровавого разреза (эволюция) ----------
class BloodSlashProjectile {
    constructor(x, y, dirX, dirY, damage, speed, maxRange, width, scene, weaponType) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.damage = damage;
        this.speed = speed;
        this.maxRange = maxRange;
        this.travelled = 0;
        this.active = true;
        this.width = width;
        this.scene = scene;
        this.weaponType = weaponType;
        this.angle = Math.atan2(dirY, dirX);
        this.particles = [];
        this.hitEnemies = new Set();
    }

        update(delta) {
        if (!this.active) return;

        this.x += this.dirX * this.speed * delta;
        this.y += this.dirY * this.speed * delta;
        this.travelled += this.speed * delta;

        if (this.scene && this.scene.particlesEnabled && this.particles.length < this.scene.maxParticles && Math.random() < 0.7) {
            const maxNew = Math.min(2, this.scene.maxParticles - this.particles.length);
            for (let i = 0; i < maxNew; i++) {
                const offset = (Math.random() - 0.5) * this.width * 0.8;
                const perpX = -this.dirY * offset;
                const perpY =  this.dirX * offset;
                this.particles.push({
                    x: this.x + perpX,
                    y: this.y + perpY,
                    age: 0,
                    life: 0.3 + Math.random() * 0.2,
                    size: 2 + Math.random() * 3,
                    color: '#ff3333'
                });
            }
        }
        for (const p of this.particles) p.age += delta;
        this.particles = this.particles.filter(p => p.age < p.life);

                if (!this.scene) return;
        for (const enemy of this.scene.enemies) {
            if (enemy.hp <= 0 || this.hitEnemies.has(enemy)) continue;

            const ex = enemy.x - this.x;
            const ey = enemy.y - this.y;
            const proj = ex * this.dirX + ey * this.dirY;
            if (proj < 0 || proj > this.maxRange) continue;

            const perpDist = Math.abs(-ex * this.dirY + ey * this.dirX);
            if (perpDist < enemy.radius + this.width / 2) {
                enemy.hp -= this.damage;
                this.scene.addDamageText(enemy.x, enemy.y - 10, this.damage.toFixed(1), '#cc0000');
                if (this.weaponType) {
                    this.scene.stats.recordWeaponDamage(this.weaponType, this.damage);
                }
                this.hitEnemies.add(enemy);
                enemy.flashTimer = 0.1;
            }
        }

        if (this.travelled >= this.maxRange) this.active = false;
    }

    draw(ctx, screenX, screenY) {
        const alpha = 1 - Math.min(this.travelled / this.maxRange, 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        const arcRadius = this.width * 0.5;
        const arcThickness = this.width * 0.4;
        const outerRadius = arcRadius + arcThickness / 2;
        const innerRadius = arcRadius - arcThickness / 2;
        const arcAngle = Math.PI / 3;
        const startAngle = -arcAngle / 2;
        const endAngle = arcAngle / 2;

        const centerOffsetX = -arcRadius * 0.5;
        const centerOffsetY = 0;

        const gradient = ctx.createRadialGradient(
            centerOffsetX, centerOffsetY, innerRadius,
            centerOffsetX, centerOffsetY, outerRadius
        );
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(100, 0, 0, 0.3)');

        ctx.beginPath();
        ctx.arc(centerOffsetX, centerOffsetY, outerRadius, startAngle, endAngle);
        ctx.arc(centerOffsetX, centerOffsetY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();

        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerOffsetX, centerOffsetY, arcRadius, startAngle, endAngle);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.stroke();

        ctx.restore();

        for (const p of this.particles) {
            const pAlpha = 1 - p.age / p.life;
            ctx.globalAlpha = pAlpha * 0.8 * alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

// ---------- Оружие Меч ----------
export class Sword extends Weapon {
    constructor(owner) {
        super(owner, CONFIG.weapons.sword, 'Sword');
        this.swingRadius = this.config.range || 32;
        this.swingDuration = this.config.swingDuration || 0.2;
        this.isSwinging = false;
        this.swingTimer = 0;
        this.particles = [];
        this.damageColor = '#ff4444';
        this.evoDamageColor = '#8b0000';
    }

    // ---------- Система улучшений (локализована) ----------
    getUpgradeModules() {
        const lang = this._getLang(); // метод из базового Weapon
        return [
            { stat: 'damage',         value: 1,    cost: 1, format: v => formatUpgrade('damage', v, lang) },
            { stat: 'damage',         value: 1,    cost: 1, format: v => formatUpgrade('damage', v, lang) },
            { stat: 'damage',         value: 1,    cost: 1, format: v => formatUpgrade('damage', v, lang) },
            { stat: 'cooldown',       value: -0.1, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
            { stat: 'cooldown',       value: -0.1, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
            { stat: 'swingRadius',   value: 8,    cost: 3, format: v => formatUpgrade('swingRadius', v, lang) },
            { stat: 'swingDuration', value: 0.05, cost: 3, format: v => formatUpgrade('swingDuration', v, lang) },
        ];
    }

    _applySingle({ id, value }) {
        switch (id) {
            case 'swingRadius':
                this.swingRadius += value;
                this.config.range = this.swingRadius;
                break;
            case 'swingDuration':
                this.swingDuration += value;
                this.config.swingDuration = this.swingDuration;
                break;
            default:
                super._applySingle({ id, value });
                break;
        }
    }

    

    applyEvolution(player) {
        super.applyEvolution(player);
        this.damageColor = this.evoDamageColor;
        this.swingRadius += 8;
        this.swingDuration *= 0.8;
    }

    attack(enemies, scene) {
        if (!this.canAttack()) return;
        this.swingTimer = this.swingDuration;
        this.cooldownTimer = this.getCooldown();
        this.isSwinging = true;
        this.applyDamage(enemies, scene);
    }

    applyDamage(enemies, scene) {
        if (!this.isSwinging) return;
        const dx = this.owner.lastMoveX || 1;
        const dy = this.owner.lastMoveY || 0;
        const len = Math.hypot(dx, dy) || 1;
        const dirX = dx / len;
        const dirY = dy / len;

        const hitEnemies = [];
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            const ex = enemy.x - this.owner.x;
            const ey = enemy.y - this.owner.y;
            const dist = Math.hypot(ex, ey);
            if (dist < this.swingRadius + enemy.radius) {
                const dot = (ex * dirX + ey * dirY) / (dist || 1);
                if (dot > 0.3) hitEnemies.push(enemy);
            }
        }

        const dmg = this.getDamage();
        for (const enemy of hitEnemies) {
            enemy.hp -= dmg;
            scene.addDamageText(enemy.x, enemy.y - 10, dmg.toFixed(1), this.damageColor);
            scene.stats.recordWeaponDamage(this.weaponType, dmg);

            if (this.isEvolved && this.config.healOnKill && enemy.hp <= 0) {
                this.owner.heal(this.config.healOnKill);
                scene.addDamageText(this.owner.x, this.owner.y - 20, `+${this.config.healOnKill} HP`, '#6ab04c');
            }
            enemy.flashTimer = 0.1;
        }

        if (hitEnemies.length > 0 && scene.particlesEnabled) {
            const angle = Math.atan2(dirY, dirX);
            const maxNew = Math.min(12, scene.maxParticles - this.particles.length);
            for (let i = 0; i < maxNew; i++) {
                const spread = (Math.random() - 0.5) * 1.5;
                const speed = 80 + Math.random() * 100;
                this.particles.push({
                    x: this.owner.x + Math.cos(angle) * this.swingRadius * 0.5,
                    y: this.owner.y + Math.sin(angle) * this.swingRadius * 0.5,
                    vx: Math.cos(angle + spread) * speed,
                    vy: Math.sin(angle + spread) * speed,
                    life: 0.2 + Math.random() * 0.2,
                    age: 0,
                    color: this.isEvolved ? '#cc0000' : '#ff4444'
                });
            }
        }

        if (this.isEvolved && Math.random() < 0.05) {
            const slashSpeed = 500;
            const slashRange = 180;
            const width = this.swingRadius;
            const angle = Math.atan2(dirY, dirX);

            scene.projectiles.push(new BloodSlashProjectile(
                this.owner.x + Math.cos(angle) * this.swingRadius * 0.8,
                this.owner.y + Math.sin(angle) * this.swingRadius * 0.8,
                Math.cos(angle),
                Math.sin(angle),
                dmg,
                slashSpeed,
                slashRange,
                width,
                scene,
                this.weaponType
            ));
        }
    }

    update(delta) {
        super.update(delta);
        if (this.swingTimer > 0) {
            this.swingTimer -= delta;
            if (this.swingTimer <= 0) this.isSwinging = false;
        }
        for (const p of this.particles) {
            p.age += delta;
            p.x += p.vx * delta;
            p.y += p.vy * delta;
        }
        this.particles = this.particles.filter(p => p.age < p.life);
    }

    drawEffect(ctx, screenX, screenY) {
        if (this.swingTimer <= 0 && this.particles.length === 0) return;
        const alpha = Math.max(0, this.swingTimer / this.swingDuration);
        const dx = this.owner.lastMoveX || 1;
        const dy = this.owner.lastMoveY || 0;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.globalAlpha = alpha * 0.8;
        ctx.shadowColor = this.isEvolved ? '#8b0000' : '#ff0000';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.swingRadius, angle - 0.8, angle + 0.8);
        ctx.stroke();

        ctx.shadowBlur = 10;
        ctx.strokeStyle = this.isEvolved ? '#a00000' : this.damageColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.swingRadius - 2, angle - 0.7, angle + 0.7);
        ctx.stroke();

        for (const p of this.particles) {
            const pAlpha = 1 - p.age / p.life;
            ctx.globalAlpha = pAlpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}