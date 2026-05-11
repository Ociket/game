// js/entities/Enemy.js
import { CONFIG } from '../data/config.js';

// ---------- Кеш загруженных спрайтов ----------
const spriteCache = {};

function loadSprites(folder, count = 16) {
    if (spriteCache[folder]) return spriteCache[folder];
    const images = [];
    for (let i = 0; i < count; i++) {
        const img = new Image();
        img.src = `assets/enemies/${folder}/${i}.png`;
        images.push(img);
    }
    spriteCache[folder] = images;
    return images;
}

function getFolder(type, isElite, isBoss, phase) {
    if (isBoss) return phase === 2 ? 'boss_p2' : 'boss_p1';
    if (isElite) return 'elite';
    return type; // basic, fast, shooter, tank, bomber, summoner
}

export class Enemy {
    constructor(x, y, type = 'basic', isElite = false, isBoss = false, waveLevel = 0, scene = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.isElite = isElite;
        this.isBoss = isBoss;
        this.scene = scene;

        const baseCfg = CONFIG.enemies.types[this.type] || CONFIG.enemies.types.basic;
        const eliteMult = this.isElite ? CONFIG.enemies.eliteMultiplier : 1;
        const scaling = CONFIG.enemies.enemyScaling || { hpPerWave: 0, damagePerWave: 0, speedPerWave: 0 };

        if (this.isBoss) {
            this.radius = CONFIG.boss.radius;
            this.displaySize = 64;
            this.maxHp = CONFIG.boss.hp;
            this.hp = CONFIG.boss.hp;
            this.speed = CONFIG.boss.speed;
            this.damage = CONFIG.boss.damage;
            this.expGiven = CONFIG.boss.exp;
            this.phase = 1;
            this.bossShootTimer = 0;
            this.bossShootInterval = 999;
        } else {
            this.maxHp = baseCfg.hp * eliteMult;
            this.damage = baseCfg.damage * eliteMult;
            this.speed = baseCfg.speed;
            this.expGiven = baseCfg.exp * (this.isElite ? 3 : 1);
            this.radius = baseCfg.radius;
            this.displaySize = this.isElite ? 32 : 32;

            if (waveLevel > 0) {
                this.maxHp = Math.floor(this.maxHp * (1 + scaling.hpPerWave * waveLevel));
                this.damage = Math.floor(this.damage * (1 + scaling.damagePerWave * waveLevel));
                this.speed = Math.floor(this.speed * (1 + scaling.speedPerWave * waveLevel));
            }
            this.hp = this.maxHp;

            if (this.isElite) {
                this.speed = Math.floor(this.speed * 1.2);
            }
        }

        this.color = baseCfg.color;
        this.flashTimer = 0;
        this.shootTimer = 0;
        this.summonTimer = 0;
        this.converted = false;
        this.slowFactor = 1;
        this._bleed = null;
        this._burn = null;

        // ---------- Анимация спрайтов ----------
        const folder = getFolder(type, isElite, isBoss, this.phase || 1);
        this.sprites = loadSprites(folder, 16);
        this.animSpeed = 0.12;      // секунд на кадр
        this.animTimer = 0;
        this.animState = 'idle';    // idle, move, attack, special
        this.animStateTimer = 0;    // для однократных состояний
        this.currentSpriteIndex = 0;

        // Определяем наборы кадров для каждого состояния
        this.animFrames = this._defineAnimationFrames(type, isElite, isBoss);

        this.facingLeft = false;
        this.lastDx = 0;
    }

    // ------------------------------------------------------------------
    //  Определение анимационных кадров на основе описания
    // ------------------------------------------------------------------
    _defineAnimationFrames(type, isElite, isBoss) {
        const frames = { idle: [], move: [], attack: [], special: [] };

        // ─────────── basic ───────────
        if (type === 'basic') {
            frames.idle = [0, 1, 2, 3, 6, 8, 9];
            frames.move = [4, 5, 7, 11, 14];
            // attack и special не заданы
        }
        // ─────────── fast ───────────
        else if (type === 'fast') {
            frames.idle = [1, 4, 6, 7, 11, 13];
            frames.move = [0, 2, 3, 5, 8, 9, 12];
        }
        // ─────────── shooter ───────────
        else if (type === 'shooter') {
            frames.idle = [0, 1, 2, 14];
            frames.move = [12, 13, 15];
            frames.attack = [4, 5, 6, 7];
            frames.special = [8, 9, 10, 11];
        }
        // ─────────── summoner ───────────
        else if (type === 'summoner') {
            frames.idle = [0, 1, 2, 12, 13];
            frames.move = [8, 9, 10, 11];
            frames.attack = [4, 5, 6, 7];
            // special нет
        }
        // ─────────── tank ───────────
        else if (type === 'tank') {
            frames.idle = [0, 1, 2, 3];
            frames.move = [8, 9, 10, 11];
            frames.attack = [4, 5, 6, 7];
            frames.special = [12, 13, 14, 15];
        }
        // ─────────── bomber ───────────
        else if (type === 'bomber') {
            frames.idle = [0, 2, 3];
            frames.move = [0, 2, 3];      // нет явных кадров движения
            frames.attack = [4, 5, 6, 7];
            frames.special = [8, 9, 10, 11];
        }
        // ─────────── elite ───────────
        else if (isElite) {
            frames.idle = [0, 1, 2, 3];
            frames.move = [8, 9, 10, 11];
            frames.attack = [4, 5, 6, 7];
            frames.special = [12, 13, 14, 15];
        }
        // ─────────── босс, фаза 1 ───────────
        else if (isBoss && this.phase === 1) {
            frames.idle = [0, 8, 9, 15];
            frames.move = [3, 4, 5, 6, 7];
            frames.attack = [1, 2, 4, 5];
            frames.special = [10, 11, 12, 13, 14];
        }
        // ─────────── босс, фаза 2 ───────────
        else if (isBoss && this.phase === 2) {
            frames.idle = [0, 2, 11, 12, 14];
            frames.move = [6, 7, 8, 9, 10];
            frames.attack = [1, 3, 4, 5];
            frames.special = [13, 15];
        }
        // fallback
        else {
            frames.idle = Array.from({ length: 16 }, (_, i) => i);
        }

        // Убираем пустые массивы → null, чтобы потом использовать idle
        for (const state in frames) {
            if (frames[state].length === 0) frames[state] = null;
        }
        return frames;
    }

    // ------------------------------------------------------------------
    //  Определение текущего состояния анимации
    // ------------------------------------------------------------------
    _determineAnimationState() {
        // Если активен таймер специального состояния – не меняем
        if (this.animStateTimer > 0) {
            return this.animState;
        }

        // Приоритет: special → attack → move → idle

        // Особая анимация для элитников и танков при низком здоровье
        if (this.isElite && this.hp / this.maxHp < 0.3 && this.animFrames.special) {
            return 'special';
        }
        if (this.type === 'tank' && this.hp / this.maxHp < 0.5 && this.animFrames.special) {
            return 'special';
        }

        // Атака / стрельба / призыв
        if ((this.type === 'shooter' && this.shootTimer > 0) ||
            (this.type === 'summoner' && this.summonTimer > 0) ||
            (this.type === 'bomber' && this.shootTimer > 0) ||
            (this.isBoss && this.phase === 2 && this.bossShootTimer > 0 && this.bossShootInterval)) {
            if (this.animFrames.attack) return 'attack';
        }

        // Движение
        if (Math.abs(this.lastDx) > 0.01 || Math.abs(this.lastDx) > 0.01) {
            if (this.animFrames.move) return 'move';
        }

        return 'idle';
    }

    // ------------------------------------------------------------------
    //  Обновление анимации (вызывается из update)
    // ------------------------------------------------------------------
    _updateAnimation(delta) {
        const newState = this._determineAnimationState();
        if (newState !== this.animState) {
            this.animState = newState;
            this.animFrame = 0;
            this.animTimer = 0;
            // Устанавливаем таймер для состояний, которые не должны длиться вечно
            if (newState === 'attack' || newState === 'special') {
                this.animStateTimer = 0.8;
            } else {
                this.animStateTimer = 0;
            }
        } else if (this.animStateTimer > 0) {
            this.animStateTimer -= delta;
        }

        // Получаем массив кадров для текущего состояния
        let framesArray = this.animFrames[this.animState];
        if (!framesArray || framesArray.length === 0) {
            framesArray = this.animFrames.idle || [0];
        }

        this.animTimer += delta;
        if (this.animTimer >= this.animSpeed) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % framesArray.length;
        }

        // Реальный индекс спрайта
        const realIndex = framesArray[this.animFrame] || framesArray[0] || 0;
        this.currentSpriteIndex = realIndex;
    }

    // ------------------------------------------------------------------
    //  Основные методы (движение, атака, эффекты) – без изменений
    // ------------------------------------------------------------------
    update(delta, targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const len = Math.hypot(dx, dy);
        this.lastDx = dx;

        if (len > 1) {
            const speed = this.speed * (this.slowFactor || 1);
            this.x += (dx / len) * speed * delta;
            this.y += (dy / len) * speed * delta;
            this.facingLeft = dx < 0;
        }

        this._updateAnimation(delta);

        if (this.flashTimer > 0) this.flashTimer -= delta;

        if (this.isBoss) {
            this.checkBossPhase(targetX, targetY, delta);
        }

        this.updateEffects(delta);
    }

    checkBossPhase(tx, ty, delta) {
        if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
            this.phase = 2;
            this.speed *= 1.3;
            this.damage = Math.floor(this.damage * 1.2);
            this.bossShootInterval = 1.5;
            this.radius = CONFIG.boss.radius * 1.2;
            // Перезагружаем спрайты фазы 2
            this.sprites = loadSprites('boss_p2', 16);
            // Переопределяем кадры для новой фазы
            this.animFrames = this._defineAnimationFrames(this.type, this.isElite, true);
        }
        if (this.phase === 2) {
            this.bossShootTimer += delta;
            if (this.bossShootTimer >= this.bossShootInterval) {
                this.bossShootTimer = 0;
                return 'shoot';
            }
        }
        return null;
    }

    updateEffects(delta) {
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

    // ------------------------------------------------------------------
    //  Отрисовка
    // ------------------------------------------------------------------
    draw(ctx, screenX, screenY) {
        const sprite = this.sprites[this.currentSpriteIndex];
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.save();
            const size = this.displaySize || 64;
            const scale = Math.min(size / sprite.naturalWidth, size / sprite.naturalHeight);
            const drawW = sprite.naturalWidth * scale;
            const drawH = sprite.naturalHeight * scale;
            if (this.facingLeft) {
                ctx.translate(screenX, screenY);
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
                ctx.drawImage(sprite, screenX - drawW / 2, screenY - drawH / 2, drawW, drawH);
            }
            ctx.restore();
        } else {
            // Fallback: цветной круг
            ctx.save();
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = this.converted ? '#ee96e7' : this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Вспышка при уроне
        if (this.flashTimer > 0) {
            ctx.save();
            ctx.fillStyle = '#ff4444';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius + 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Полоска здоровья
        const barY = screenY - this.radius - 8;
        const barW = this.radius * 2;
        const barH = 4;
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX - barW / 2, barY, barW, barH);
        const hpPercent = this.hp / this.maxHp;
        let barColor = '#6ab04c';
        if (hpPercent < 0.3) barColor = '#e74c3c';
        else if (hpPercent < 0.6) barColor = '#f39c12';
        ctx.fillStyle = barColor;
        ctx.fillRect(screenX - barW / 2, barY, barW * Math.max(0, hpPercent), barH);

        // Босс: надпись фазы
        if (this.isBoss && this.phase === 2) {
            ctx.save();
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('FURY', screenX, screenY - this.radius - 16);
            ctx.restore();
        }
    }
}