// js/weapons/Skulls.js
import { Weapon } from './Weapon.js';
import { distance } from '../utils.js';
import { CONFIG } from '../data/config.js';
import { formatUpgrade } from '../utils/UpgradeText.js';

export class Skulls extends Weapon {
    constructor(owner) {
        super(owner, CONFIG.weapons.skulls, 'Skulls');

        // Уникальные параметры (начальные значения из конфига)
        this.skullCount = this.config.count || 2;
        this.orbitRadius = this.config.orbitRadius || 50;
        this.orbitSpeed = this.config.orbitSpeed || 2.5;
        this.skullDuration = this.config.duration || 4.0;

        // Визуал
        this.damageColor = '#857185';
        this.glowColor = '#98889e';

        this.activeSkulls = [];
        this.state = 'cooldown';
        this.stateTimer = this.config.cooldown;
        this.angleOffset = 0;

        // Эволюция
        this.soulHealChance = 0;         // 0 до эволюции
        this.soulHealAmount = 0.5;
    }

    // ---------- Система улучшений ----------
    getUpgradeModules() {
    const lang = this._getLang();
    return [
        { stat: 'damage', value: 1, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'damage', value: 1, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'damage', value: 1, cost: 1, format: v => formatUpgrade('damage', v, lang) },
        { stat: 'cooldown', value: -0.2, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
        { stat: 'cooldown', value: -0.2, cost: 1, format: v => formatUpgrade('cooldown', v, lang) },
        { stat: 'skullCount', value: 1, cost: 6, format: v => formatUpgrade('skullCount', v, lang) },
        { stat: 'orbitRadius', value: 10, cost: 2, format: v => formatUpgrade('orbitRadius', v, lang) },
        { stat: 'orbitSpeed', value: 0.5, cost: 2, format: v => formatUpgrade('orbitSpeed', v, lang) },
        { stat: 'skullDuration', value: 1.0, cost: 3, format: v => formatUpgrade('skullDuration', v, lang) },
    ];
}

    _applySingle({ id, value }) {
        switch (id) {
            case 'skullCount':
                this.skullCount += value;
                this.config.count = this.skullCount;
                break;
            case 'orbitRadius':
                this.orbitRadius += value;
                this.config.orbitRadius = this.orbitRadius;
                break;
            case 'orbitSpeed':
                this.orbitSpeed += value;
                this.config.orbitSpeed = this.orbitSpeed;
                break;
            case 'skullDuration':
                this.skullDuration += value;
                this.config.duration = this.skullDuration;
                break;
            default:
                super._applySingle({ id, value });
                break;
        }
    }

    // ---------- Эволюция ----------
    

    applyEvolution(player) {
        super.applyEvolution(player);
        this.skullCount += 1;                   // +1 череп
        this.orbitSpeed *= 1.3;                 // +30% скорости орбиты
        this.soulHealChance = 0.1;              // 10% шанс исцеления при убийстве
        this.config.count = this.skullCount;
        this.config.orbitSpeed = this.orbitSpeed;
        // Визуал меняется через drawEffect
    }

    // ---------- Боевая логика ----------
    activate() {
        this.activeSkulls = [];
        const count = this.skullCount;
        const duration = this.skullDuration;
        for (let i = 0; i < count; i++) {
            this.activeSkulls.push({
                angle: (i / count) * Math.PI * 2 + this.angleOffset,
                hp: duration,
                maxHp: duration,
                wobble: Math.random() * Math.PI * 2
            });
        }
        this.state = 'active';
        this.stateTimer = duration;
        this.angleOffset += 0.5;
    }

    update(delta) {
        super.update(delta);

        if (this.state === 'active') {
            this.stateTimer -= delta;
            const speed = this.orbitSpeed;
            const radius = this.orbitRadius;

            for (const skull of this.activeSkulls) {
                skull.angle += speed * delta;
                skull.hp -= delta;
                skull.wobble += delta * 5;
                skull.x = this.owner.x + Math.cos(skull.angle) * radius;
                skull.y = this.owner.y + Math.sin(skull.angle) * radius;
            }

            this.activeSkulls = this.activeSkulls.filter(s => s.hp > 0);
            if (this.activeSkulls.length === 0 || this.stateTimer <= 0) {
                this.state = 'cooldown';
                this.stateTimer = this.config.cooldown;
                this.activeSkulls = [];
            }
        } else {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this.activate();
            }
        }
    }

    attack(enemies, scene) {
        if (this.state !== 'active') return;
        const dmg = this.getDamage();
        let lifesteal = this.owner.lifesteal || 0;
        if (this.isEvolved && this.config.lifesteal) lifesteal += this.config.lifesteal;
        const hitCost = this.config.hitCost;

        for (const skull of this.activeSkulls) {
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                const dist = Math.hypot(skull.x - enemy.x, skull.y - enemy.y);
                if (dist < this.owner.radius + enemy.radius + 12) {
                    enemy.hp -= dmg;
                    scene.stats.recordWeaponDamage(this.weaponType, dmg);
                    scene.addDamageText(enemy.x, enemy.y - 15, dmg.toFixed(1), this.damageColor);

                    // Вампиризм от предметов/персонажа
                    if (lifesteal > 0) this.owner.heal(dmg * lifesteal);

                    // Лечение при убийстве (эволюция)
                    if (enemy.hp <= 0 && this.isEvolved && Math.random() < this.soulHealChance) {
                        this.owner.heal(this.soulHealAmount);
                        scene.addDamageText(this.owner.x, this.owner.y - 20, `+${this.soulHealAmount} HP`, '#6ab04c');
                    }

                    skull.hp -= hitCost;
                    enemy.flashTimer = 0.1;
                    if (skull.hp <= 0) break;
                }
            }
        }
    }

    drawEffect(ctx, screenX, screenY) {
        if (this.state !== 'active') return;

        for (const skull of this.activeSkulls) {
            const pulse = 0.8 + 0.2 * Math.sin(performance.now() / 300 + skull.wobble);
            const size = 10 + 2 * Math.sin(skull.wobble);

            ctx.save();
            ctx.translate(skull.x, skull.y);
            ctx.globalAlpha = pulse * (this.isEvolved ? 0.7 : 1.0); // полупрозрачность после эволюции

            // Внешнее свечение (фиолетовое после эволюции)
            ctx.shadowColor = this.isEvolved ? '#9b59b6' : this.glowColor;
            ctx.shadowBlur = 25 * pulse;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();

            // Глазницы
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-4, -2, 3, 0, Math.PI * 2);
            ctx.arc(4, -2, 3, 0, Math.PI * 2);
            ctx.fill();

            // Неоновые зрачки (цвет меняется при эволюции)
            ctx.shadowColor = this.isEvolved ? '#ffffff' : this.damageColor;
            ctx.shadowBlur = this.isEvolved ? 10 : 8;
            ctx.fillStyle = this.isEvolved ? '#ffffff' : this.damageColor;
            ctx.beginPath();
            ctx.arc(-4, -2, 1.5, 0, Math.PI * 2);
            ctx.arc(4, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Рот
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000000';
            const mouthY = 4;
            ctx.fillRect(-4, mouthY, 3, 2);
            ctx.fillRect(-1, mouthY, 3, 2);
            ctx.fillRect(3, mouthY, 3, 2);

            ctx.restore();
        }
    }
}