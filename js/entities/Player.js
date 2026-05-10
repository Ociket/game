// js/entities/Player.js
import { CONFIG } from '../data/config.js';
import { GameItem } from '../items/GameItem.js';

export class Player {
    constructor(x, y, meta = {}) {
        this.x = x;
        this.y = y;
        this.radius = 12;

        this.baseMaxHp = CONFIG.player.startHp + (meta.maxHpBonus || 0);
        this.baseMaxHp = Math.max(1, this.baseMaxHp); // минимум 1 HP
        this.maxHp = this.baseMaxHp;
        this.hp = this.maxHp;

        this.baseSpeed = CONFIG.player.speed + (meta.speedBonus || 0) * 10;
        this.speed = this.baseSpeed;

        this.invincibleUntil = 0;

        // Hurt-анимация (2 кадра моргания)
        this.hurtAnimActive = false;
        this.hurtFrameIndex = 0;
        this.hurtTimer = 0;
        this.hurtFrameDuration = 0.08;
        this.hurtTotalDuration = 0.3;
        this.hurtFrames = [];

        // Death-анимация (8 кадров)
        this.deathFrames = [];
        this.isDead = false;
        this.deathTimer = 0;
        this.deathFrameDuration = 0.075;
        this.deathFrameIndex = 0;
        this.deathFinished = false;   // чтобы Game Over показался один раз

        this.level = 1;
        this.currentXP = 0;
        this.xpToNextLevel = CONFIG.xp.baseXpToLevel;

        this.permanentDamageBonus = meta.damageBonus || 0;
        this.permanentAttackSpeedBonus = (meta.attackSpeedBonus || 0) * 0.05;
        this.permanentCritChance = meta.critChance ? meta.critChance * 0.02 : 0;   // 2% за уровень
this.permanentLifesteal = meta.lifesteal ? meta.lifesteal * 0.02 : 0;      // 2% за уровень
this.permanentEliteDamage = meta.eliteDamage ? meta.eliteDamage * 0.08 : 0; // 8% за уровень
// Прямые бонусы от персонажа (не умножаются деревом)
this.charCritChance = meta.charCritChance || 0;
this.charMagnetBonus = meta.charMagnetBonus || 0;
this.charLifesteal = meta.charLifesteal || 0;
this.permanentProjectileResist = meta.projectileResist ? 1 - meta.projectileResist * 0.06 : 1; // множитель
this.hasRevive = meta.revive > 0;
this.startExpBonus = (meta.startExp || 0) * 0.2;  // +20% опыта при старте
this.extraItemSlot = meta.extraItemSlot || 0;

        this.baseMagnetRadius = 80 + (meta.magnetRadius || 0) * 15;
        this.magnetRadius = this.baseMagnetRadius;
        this.magnetRadius += this.charMagnetBonus;

        this.tempDamageBonus = 0;
        this.tempAttackSpeedBonus = 0;

        this.weapons = [];
        this.items = [];
        this.elixirHealAmount = 0;   // сколько HP за тик
        this.elixirCooldown = 5;     // интервал (сек)
        this.elixirTimer = 0;        // таймер до следующего тика
        this._onHeal = null;         // колбэк для отображения зелёных чисел
        this._onCrystalEarned = null; // Колбэк для выдачи кристаллов при убийствах

        this.armor = 0;
        this.luck = 0;
        this.cooldownReduction = 0;
        this.expMultiplier = 1;
        this.regen = 0;
        
        this.critChance = 0;
        this.reflectChance = 0;
        this.thorns = 0;
        this.killCount = 0;  // для Кольца кристалла

        this.sprites = {
            idle: [],
            walk: [],
            run: [],
            crouch: [],
            jump: [],
            vanish: []
        };
        this.currentState = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.12;
        this.facingLeft = false;
        this.lastMoveX = 0;
        this.lastMoveY = 0;
    }

    loadSprites() {
        const base = 'assets/player/';

        // Idle
        const idleImg = new Image();
        idleImg.src = base + 'player_idle.png';
        idleImg.onerror = () => {
            idleImg.src = base + 'player_walk_0.png';
        };
        this.sprites.idle = [idleImg];

        // Walk (4 кадра)
        for (let i = 0; i < 4; i++) {
            const img = new Image();
            img.src = base + `player_walk_${i}.png`;
            this.sprites.walk.push(img);
        }

        // Hurt (2 кадра)
        for (let i = 0; i < 2; i++) {
            const img = new Image();
            img.src = base + `player_hurt_${i}.png`;
            this.hurtFrames.push(img);
        }

        // Death (8 кадров)
        for (let i = 0; i < 8; i++) {
            const img = new Image();
            img.src = base + `player_death_${i}.png`;
            this.deathFrames.push(img);
        }
    }

    addWeapon(weaponInstance) {
        if (this.weapons.length >= CONFIG.chest.maxWeapons) return false;
        this.weapons.push(weaponInstance);
        return true;
    }

    addItem(itemInstance) {
    // Было:
    // if (this.items.length >= CONFIG.chest.maxItems) return false;
    // Стало:
    if (this.items.length >= this.maxItems) return false;  // учитывает extraItemSlot
    this.items.push(itemInstance);
    this.applyItemOnPickup(itemInstance);
    this.recalculateStats();
    return true;
}

    applyItemOnPickup(item) {
        const val = item.getValue();
        if (item.config.hpBonus) {
            this.maxHp += val;
            this.hp += val;
        }
    }

    recalculateStats() {
        this.speed = this.baseSpeed;
        this.magnetRadius = this.baseMagnetRadius;
        this.armor = 0;
        this.luck = 0;
        this.cooldownReduction = 0;
        this.expMultiplier = 1;
        this.regen = 0;
        this.tempDamageBonus = 0;
        this.lifesteal = 0;
        this.lifesteal += this.charLifesteal;
        this.critChance = 0;
        this.critChance += this.charCritChance;
        this.reflectChance = 0;
        this.thorns = 0;

        let bonusHp = 0;

        for (const item of this.items) {
            const val = item.getValue();
            if (item.type === 'elixir') {
    const [heal, cd] = item.getValue();
    this.elixirHealAmount = heal;
    this.elixirCooldown = cd;
}
            if (item.config.hpBonus) bonusHp += val;
            if (item.config.speedBonus) this.speed += val;
            if (item.config.magnetBonus) this.magnetRadius += val;
            if (item.config.armor) this.armor += val;
            if (item.config.luck) this.luck += val;
            if (item.config.cooldownReduction) this.cooldownReduction += val;
            if (item.config.expBonus) this.expMultiplier += val;
            if (item.config.experienceMultiplier) this.expMultiplier += val;
            if (item.config.regen) this.regen += val;
            if (item.config.damageBonus) this.tempDamageBonus += val;
            
if (item.config.critChanceBonus) this.critChance += val;
if (item.config.reflectChance) this.reflectChance += val;
if (item.config.thorns) this.thorns += val;
        }

        this.maxHp = this.baseMaxHp + bonusHp;
        if (this.hp > this.maxHp) {
            this.hp = this.maxHp;
        }
    }
    updateElixir(delta) {
    if (this.isDead || this.elixirHealAmount <= 0) return;
    this.elixirTimer += delta;
    while (this.elixirTimer >= this.elixirCooldown) {
        this.elixirTimer -= this.elixirCooldown;
        if (this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + this.elixirHealAmount);
            if (this._onHeal) {
                this._onHeal(this.elixirHealAmount);
            }
        }
    }
}
heal(amount) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
}
            move(dx, dy, delta) {
        if (this.isDead) return;

        // Обрабатываем ввод
        let inputX = dx;
        let inputY = dy;

        // Если есть ввод, нормализуем вектор (делаем длину 1)
        if (inputX !== 0 || inputY !== 0) {
            const len = Math.hypot(inputX, inputY);
            // Нормализованные значения (-1 до 1)
            this.lastMoveX = inputX / len;
            this.lastMoveY = inputY / len;
            
            // Анимация
            if (inputX < 0) this.facingLeft = true;
            else if (inputX > 0) this.facingLeft = false;
            this.currentState = 'walk';
        } else {
            this.currentState = 'idle';
        }

        // Движение (используем исходный ввод, умноженный на скорость)
        this.x += (inputX || 0) * this.speed * delta;
        this.y += (inputY || 0) * this.speed * delta;

        // Границы мира
        this.x = Math.min(Math.max(this.x, this.radius), CONFIG.world.width - this.radius);
        this.y = Math.min(Math.max(this.y, this.radius), CONFIG.world.height - this.radius);
    }

    takeDamage(rawAmount) {
        if (this.isDead) return false;
        const now = performance.now() / 1000;
        if (now < this.invincibleUntil) return false;

        const damage = Math.max(1, rawAmount - this.armor);
        this.hp -= damage;
        this.invincibleUntil = now + CONFIG.player.invincibleFrames;

        if (this.hp <= 0) {
            this.startDeath();
            return true;
        }

        this.startHurtAnimation();
        return true;
    }

    startHurtAnimation() {
        this.hurtAnimActive = true;
        this.hurtTimer = 0;
        this.hurtFrameIndex = 0;
    }

    startDeath() {
        this.isDead = true;
        this.deathTimer = 0;
        this.deathFrameIndex = 0;
        this.hurtAnimActive = false;
    }

    gainXP(amount) {
        if (this.isDead) return false;
        const multiplied = amount * this.expMultiplier;
        this.currentXP += multiplied;
        if (this.currentXP >= this.xpToNextLevel) {
            this.currentXP -= this.xpToNextLevel;
            this.level++;
            this.xpToNextLevel = CONFIG.xp.baseXpToLevel + (this.level - 1) * CONFIG.xp.xpIncreasePerLevel;
            return true;
        }
        return false;
    }
    addKill(count = 1) {
    if (this.isDead) return;
    this.killCount += count;
    const ring = this.items.find(item => item.type === 'crystalRing');
    if (!ring) return;
    const killsNeeded = ring.config.killsForCrystal || 20;
    while (this.killCount >= killsNeeded) {
        this.killCount -= killsNeeded;
        if (this._onCrystalEarned) this._onCrystalEarned(1);
    }
}

    updateRegen(delta) {
        if (this.isDead) return;
        if (this.regen > 0 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + this.regen * delta);
        }
    }

    updateAnimation(delta) {
        if (this.isDead) {
            this.deathTimer += delta;
            if (this.deathTimer >= this.deathFrameDuration * 8) {
                this.deathFrameIndex = 7;
            } else {
                this.deathFrameIndex = Math.floor(this.deathTimer / this.deathFrameDuration);
            }
            return;
        }

        if (this.hurtAnimActive) {
            this.hurtTimer += delta;
            if (this.hurtTimer >= this.hurtTotalDuration) {
                this.hurtAnimActive = false;
            } else {
                this.hurtFrameIndex = Math.floor(this.hurtTimer / this.hurtFrameDuration) % 2;
            }
        }

        if (this.currentState === 'walk') {
            this.animTimer += delta;
            if (this.animTimer >= this.animSpeed) {
                this.animTimer = 0;
                const frames = this.sprites.walk;
                if (frames.length > 0) {
                    this.animFrame = (this.animFrame + 1) % frames.length;
                }
            }
        } else {
            this.animFrame = 0;
            this.animTimer = 0;
        }
    }
get maxItems() {
    return CONFIG.chest.maxItems + this.extraItemSlot;
}
    draw(ctx, screenX, screenY) {
        // Анимация смерти
        if (this.isDead && this.deathFrames.length >= 8) {
            const frame = this.deathFrames[this.deathFrameIndex];
            if (frame && frame.complete) {
                const w = frame.width;
                const h = frame.height;
                ctx.save();
                if (this.facingLeft) {
                    ctx.translate(screenX, screenY);
                    ctx.scale(-1, 1);
                    ctx.drawImage(frame, -w / 2, -h / 2);
                } else {
                    ctx.drawImage(frame, screenX - w / 2, screenY - h / 2);
                }
                ctx.restore();
            } else {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(screenX - this.radius, screenY - this.radius, this.radius * 2, this.radius * 2);
            }
            return;
        }

        // Hurt-анимация
        if (this.hurtAnimActive && this.hurtFrames.length >= 2) {
            const hurtImg = this.hurtFrames[this.hurtFrameIndex];
            if (hurtImg && hurtImg.complete) {
                const w = hurtImg.width;
                const h = hurtImg.height;
                ctx.save();
                if (this.facingLeft) {
                    ctx.translate(screenX, screenY);
                    ctx.scale(-1, 1);
                    ctx.drawImage(hurtImg, -w / 2, -h / 2);
                } else {
                    ctx.drawImage(hurtImg, screenX - w / 2, screenY - h / 2);
                }
                ctx.restore();
            } else {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(screenX - this.radius, screenY - this.radius, this.radius * 2, this.radius * 2);
            }
        } else {
            // Обычная отрисовка
            let frames = [];
            if (this.currentState === 'walk' && this.sprites.walk.length > 0) {
                frames = this.sprites.walk;
            } else if (this.sprites.idle.length > 0) {
                frames = this.sprites.idle;
            }

            const img = frames[this.animFrame % frames.length] || frames[0];
            if (!img || !img.complete) {
                ctx.fillStyle = '#6ab04c';
                ctx.fillRect(screenX - this.radius, screenY - this.radius, this.radius * 2, this.radius * 2);
            } else {
                const w = img.width;
                const h = img.height;
                ctx.save();
                if (this.facingLeft) {
                    ctx.translate(screenX, screenY);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, -w / 2, -h / 2);
                } else {
                    ctx.drawImage(img, screenX - w / 2, screenY - h / 2);
                }
                ctx.restore();
            }
        }

        // Полоска здоровья (не рисуется при смерти)
        if (!this.isDead) {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(screenX - this.radius, screenY - this.radius - 6, this.radius * 2, 3);
            ctx.fillStyle = '#6ab04c';
            const hpPercent = this.hp / this.maxHp;
            ctx.fillRect(screenX - this.radius, screenY - this.radius - 6, this.radius * 2 * hpPercent, 3);
        }
    }
}