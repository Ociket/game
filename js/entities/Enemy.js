// js/entities/Enemy.js
import { CONFIG } from '../data/config.js';

export class Enemy {
    constructor(x, y, type = 'basic', isElite = false, isBoss = false, waveLevel = 0, scene = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.isElite = isElite;
        this.isBoss = isBoss;
        this.scene = scene;   // сохраняем для отображения урона от эффектов

        const baseCfg = CONFIG.enemies.types[this.type] || CONFIG.enemies.types.basic;
        const eliteMult = this.isElite ? CONFIG.enemies.eliteMultiplier : 1;
        const scaling = CONFIG.enemies.enemyScaling || { hpPerWave: 0, damagePerWave: 0, speedPerWave: 0 };

        if (this.isBoss) {
            this.radius = CONFIG.boss.radius;
            this.maxHp = CONFIG.boss.hp;
            this.hp = CONFIG.boss.hp;
            this.speed = CONFIG.boss.speed;
            this.damage = CONFIG.boss.damage;
            this.expGiven = CONFIG.boss.exp;
            this.phase = 1;
            this.baseColor = '#d63031';
            this.phase2Color = '#8e44ad';
            this.bossShootTimer = 0;
            this.bossShootInterval = 999;
        } else {
            // Базовые значения всегда умножаются на eliteMult
            this.maxHp = baseCfg.hp * eliteMult;
            this.damage = baseCfg.damage * eliteMult;
            this.speed = baseCfg.speed;
            this.expGiven = baseCfg.exp * (this.isElite ? 3 : 1);
            this.radius = baseCfg.radius; 

            // Применяем волновой скейлинг
            if (waveLevel > 0) {
                this.maxHp = Math.floor(this.maxHp * (1 + scaling.hpPerWave * waveLevel));
                this.damage = Math.floor(this.damage * (1 + scaling.damagePerWave * waveLevel));
                this.speed = Math.floor(this.speed * (1 + scaling.speedPerWave * waveLevel));
            }

            this.hp = this.maxHp;

            // Дополнительные модификаторы для элиток
            if (this.isElite) {
                // двойной урон
                this.speed = Math.floor(this.speed * 1.2);      // +20% скорости
            }
        }

        this.color = this.isBoss ? this.baseColor : (this.isElite ? '#ffd700' : baseCfg.color);
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.flashTimer = 0;
        this.shootTimer = 0;
        this.summonTimer = 0;
        this.converted = false;
        this.slowFactor = 1;

        // Кровотечение
        this._bleed = null;   // { ticksLeft, tickDamage, interval, timer }
        this._burn = null;   // { ticksLeft, tickDamage, interval, timer }
    }

    update(delta, targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const len = Math.hypot(dx, dy);
if (len > 1) {
    const speed = this.speed * (this.slowFactor || 1);
    this.x += (dx / len) * speed * delta;
    this.y += (dy / len) * speed * delta;
}
        if (this.isElite) {
            this.glowIntensity += 0.05 * this.glowDirection;
            if (this.glowIntensity > 1.0) { this.glowIntensity = 1.0; this.glowDirection = -1; }
            else if (this.glowIntensity < 0.3) { this.glowIntensity = 0.3; this.glowDirection = 1; }
        }

        if (this.flashTimer > 0) this.flashTimer -= delta;

        // Логика фаз Босса
        if (this.isBoss) {
            this.checkBossPhase(targetX, targetY, delta);
        }

        // Обновление эффектов (кровотечение)
        this.updateEffects(delta);
    }

    checkBossPhase(tx, ty, delta) {
        if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
            this.phase = 2;
            this.speed *= 1.3;
            this.damage = Math.floor(this.damage * 1.2);
            this.color = this.phase2Color;
            this.bossShootInterval = 1.5;
            this.radius = CONFIG.boss.radius * 1.2;
        }

        if (this.phase === 2) {
            this.bossShootTimer += delta;
            if (this.bossShootTimer >= this.bossShootInterval) {
                this.bossShootTimer = 0;
                // Возвращаем строку, чтобы GameScene знал, что нужно стрелять
                return 'shoot';
            }
        }
        return null;
    }

    updateEffects(delta) {
    // Обработка кровотечения
    if (this._bleed && this.scene) {
        const bleed = this._bleed;
        bleed.timer += delta;
        while (bleed.timer >= bleed.interval && bleed.ticksLeft > 0) {
            this.hp -= bleed.tickDamage;
            this.scene.addDamageText(this.x, this.y - 10, bleed.tickDamage.toFixed(1), '#cc0000');
            if (bleed.weaponType) {
    this.scene.stats.recordWeaponDamage(bleed.weaponType, bleed.tickDamage);
}
            bleed.timer -= bleed.interval;
            bleed.ticksLeft--;
        }
        if (bleed.ticksLeft <= 0) {
            this._bleed = null;
        }
    } else if (this._bleed && !this.scene) {
        const bleed = this._bleed;
        bleed.timer += delta;
        while (bleed.timer >= bleed.interval && bleed.ticksLeft > 0) {
            this.hp -= bleed.tickDamage;
            bleed.timer -= bleed.interval;
            bleed.ticksLeft--;
        }
        if (bleed.ticksLeft <= 0) {
            this._bleed = null;
        }
    }

    // Обработка горения (должна быть отдельно)
    if (this._burn) {
        const burn = this._burn;
        burn.timer += delta;
        while (burn.timer >= burn.interval && burn.ticksLeft > 0) {
            this.hp -= burn.tickDamage;
            if (this.scene) this.scene.addDamageText(this.x, this.y - 10, burn.tickDamage.toFixed(1), '#e67e22');
            if (burn.weaponType) {
    this.scene.stats.recordWeaponDamage(burn.weaponType, burn.tickDamage);
}
            burn.timer -= burn.interval;
            burn.ticksLeft--;
        }
        if (burn.ticksLeft <= 0) {
            this._burn = null;
        }
    }
}

   

    draw(ctx, screenX, screenY) {
        if (this.flashTimer > 0) {
            ctx.save();
            ctx.fillStyle = '#ff4444';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius + 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        if (this.isBoss) {
            // Неоновое свечение для Босса
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 25;
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX - this.radius, screenY - this.radius, this.radius * 2, this.radius * 2);
            
            // Глаза
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.fillRect(screenX - 6, screenY - 4, 4, 4);
            ctx.fillRect(screenX + 4, screenY - 4, 4, 4);
            
            // Полоска фазы
            ctx.fillStyle = '#000';
            ctx.fillRect(screenX - this.radius, screenY - this.radius - 8, this.radius * 2, 4);
            ctx.fillStyle = this.phase === 1 ? '#d63031' : '#8e44ad';
            const phaseProgress = this.phase === 1 ? this.hp / this.maxHp : (this.hp / this.maxHp) * 2 - 1;
            ctx.fillRect(screenX - this.radius, screenY - this.radius - 8, this.radius * 2 * Math.max(0, phaseProgress), 4);
            
            if (this.phase === 2) {
                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText('FURY', screenX, screenY - this.radius - 12);
            }
        } else if (this.isElite) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10 + this.glowIntensity * 6;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
    // Обычные враги (неоновый контур)
    if (this.converted) {
        ctx.shadowColor = '#d88ae7';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ee96e7';
    } else {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.color;
    }
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();
}
        ctx.restore();
    }
}