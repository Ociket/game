// js/weapons/Aura.js
import { Weapon } from './Weapon.js';
import { distance } from '../utils.js';
import { CONFIG } from '../data/config.js';
import { formatUpgrade } from '../utils/UpgradeText.js';

export class Aura extends Weapon {
    constructor(owner) {
        super(owner, CONFIG.weapons.aura, 'Aura');
        // Уникальный параметр: радиус ауры (начальное значение из конфига)
        this.auraRadius = this.config.radius || 60;
        this.damageColor = '#00c3ff';
        this.pulseParticles = [];

        // Эволюция
        this.convertChance = 0;          // шанс обращения врага (0 до эволюции)
    }

    // ---------- Система улучшений ----------
    getUpgradeModules() {
    const lang = this._getLang();
    return [
        { stat: 'damage', value: 0.5, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'damage', value: 0.5, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'damage', value: 0.5, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'cooldown', value: -0.05, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
        { stat: 'cooldown', value: -0.05, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
        { stat: 'auraRadius', value: 10, cost: 3, format: v => formatUpgrade('auraRadius', v, lang) },
    ];
}

    _applySingle({ id, value }) {
        switch (id) {
            case 'auraRadius':
                this.auraRadius += value;
                this.config.radius = this.auraRadius; // синхронизируем
                break;
            default:
                super._applySingle({ id, value });
                break;
        }
    }

    // ---------- Эволюция ----------
    

    applyEvolution(player) {
        super.applyEvolution(player);
        this.auraRadius += 20;              // +20 к радиусу
        this.config.cooldown *= 0.8;        // -20% перезарядки
        this.convertChance = 0.01;          // 1% шанс обращения
        this.config.radius = this.auraRadius;
        // Визуал станет золотым (поменяем цвет в drawEffect)
    }

    // ---------- Боевая логика ----------
    attack(enemies, scene) {
        if (!this.canAttack()) return;
        let hit = false;
        const dmg = this.getDamage();
        const radius = this.auraRadius;

        for (const enemy of enemies) {
            if (enemy.hp <= 0 || enemy.converted) continue; // не бьем уже союзников
            if (distance(this.owner.x, this.owner.y, enemy.x, enemy.y) < radius + enemy.radius) {
                enemy.hp -= dmg;
                scene.stats.recordWeaponDamage(this.weaponType, dmg);

                // Попытка обращения (только для обычных врагов, не элит/босс)
                if (this.isEvolved && !enemy.isElite && !enemy.isBoss && !enemy.converted) {
                    if (Math.random() < this.convertChance && typeof scene.convertEnemy === 'function') {
                        scene.convertEnemy(enemy);
                        continue; // этот враг перестал быть врагом, не наносим искры
                    }
                }

                if (scene && scene.particlesEnabled && this.pulseParticles.length < scene.maxParticles) {
    const maxNew = Math.min(3, scene.maxParticles - this.pulseParticles.length);
    for (let i = 0; i < maxNew; i++) {
        const angle = Math.atan2(this.owner.y - enemy.y, this.owner.x - enemy.x);
        this.pulseParticles.push({
            x: enemy.x, y: enemy.y,
            vx: Math.cos(angle) * 150, vy: Math.sin(angle) * 150,
            life: 0.3, age: 0, size: 3, color: this.isEvolved ? '#ee7cf1' : this.damageColor
        });
    }
}
                scene.addDamageText(enemy.x, enemy.y - 10, dmg.toFixed(1), this.isEvolved ? '#e36eee' : this.damageColor);
                enemy.flashTimer = 0.1;
                hit = true;
            }
        }
        if (hit) this.cooldownTimer = this.getCooldown();
    }

    update(delta) {
        super.update(delta);
        for (const p of this.pulseParticles) {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.age += delta;
        }
        this.pulseParticles = this.pulseParticles.filter(p => p.age < p.life);
    }

    drawEffect(ctx, screenX, screenY) {
        const radius = this.auraRadius;
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 200);
        const color = this.isEvolved ? '#f359f3' : this.damageColor;
        ctx.save();
        ctx.globalAlpha = 0.4 * pulse;
        ctx.shadowColor = color;
        ctx.shadowBlur = 30;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.6 * pulse;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius - 5, 0, Math.PI * 2);
        ctx.stroke();
        for (const p of this.pulseParticles) {
            const alpha = 1 - p.age / p.life;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}