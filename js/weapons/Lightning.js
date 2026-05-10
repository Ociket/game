// js/weapons/Lightning.js
import { Weapon } from './Weapon.js';
import { CONFIG } from '../data/config.js';
import { distance } from '../utils.js';
import { formatUpgrade } from '../utils/UpgradeText.js';
export class Lightning extends Weapon {
    constructor(owner) {
        super(owner, CONFIG.weapons.lightning, 'Lightning');
        // Уникальные параметры
        this.chainCount = this.config.chain || 3;
        this.chainRange = this.config.chainRange || 100;
        this.bounceEnabled = false;   // активируется при эволюции
        this.smallLightningChance = 0; // 20% после эволюции

        // Цвета
        this.damageColor = '#00aaff';          // обычная молния – синий
        this.evoDamageColor = '#ff6600';       // эволюция – ярко-оранжевый (и для цифр, и для линий)

        this.chainPoints = [];
        this.chainTimer = 0;
        this.chainDuration = 0.25;
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
        { stat: 'chainCount', value: 1, cost: 6, format: v => formatUpgrade('chainCount', v, lang) },
        { stat: 'chainRange', value: 15, cost: 2, format: v => formatUpgrade('chainRange', v, lang) },
    ];
}

    _applySingle({ id, value }) {
        switch (id) {
            case 'chainCount':
                this.chainCount += value;
                this.config.chain = this.chainCount;
                break;
            case 'chainRange':
                this.chainRange += value;
                this.config.chainRange = this.chainRange;
                break;
            default:
                super._applySingle({ id, value });
                break;
        }
    }

    // ---------- Эволюция ----------
    

    applyEvolution(player) {
        super.applyEvolution(player);
        this.chainCount += 2;               // +2 цепи
        this.chainRange *= 1.25;            // +25% радиус цепи
        this.bounceEnabled = true;          // разрешаем повторный удар по той же цели
        this.smallLightningChance = 0.2;    // 20% шанс маленькой молнии
        this.damageColor = this.evoDamageColor; // меняем цвет цифр и визуала на оранжевый
        this.config.chain = this.chainCount;
        this.config.chainRange = this.chainRange;
        this.config.bounce = true;
    }

    // ---------- Боевая логика ----------
    attack(enemies, scene) {
        if (!this.canAttack() || enemies.length === 0) return;

        // Поиск ближайшего врага
        let current = null;
        let minDist = Infinity;
        for (const e of enemies) {
            if (e.hp <= 0 || e.converted) continue;
            const d = distance(this.owner.x, this.owner.y, e.x, e.y);
            if (d < minDist) { minDist = d; current = e; }
        }
        if (!current) return;

        const chained = new Set();
        const maxChain = this.chainCount;
        const chainRangeVal = this.chainRange;
        let chainCount = 0;
        const dmg = this.getDamage();
        const lifesteal = this.owner.lifesteal || 0;
        const chainPoints = [{ x: this.owner.x, y: this.owner.y }];
        const color = this.damageColor; // текущий цвет (синий или оранжевый)

        while (current && chainCount < maxChain) {
            // основной урон
            current.hp -= dmg;
scene.stats.recordWeaponDamage(this.weaponType, dmg);
            scene.addDamageText(current.x, current.y - 10, dmg.toFixed(1), color);

            // маленькие молнии (эволюция)
            if (this.isEvolved && Math.random() < this.smallLightningChance) {
                const extraDmg = dmg * 0.5;
                current.hp -= extraDmg;
                scene.stats.recordWeaponDamage(this.weaponType, extraDmg);
                scene.addDamageText(current.x, current.y - 20, extraDmg.toFixed(1), '#ffffff'); // дополнительный урон белым
            }

            if (lifesteal > 0) this.owner.heal(dmg * lifesteal);

            chained.add(current);
            chainPoints.push({ x: current.x, y: current.y });

            // Поиск следующей цели
            let next = null;
            let nearestDist = chainRangeVal;
            const allowBounce = this.bounceEnabled && this.config.bounce;
            for (const e of enemies) {
                if (e.hp <= 0 || e.converted) continue;
                if (!allowBounce && chained.has(e)) continue;   // без bounce не повторяемся
                if (e === current) continue;
                const d = distance(current.x, current.y, e.x, e.y);
                if (d < nearestDist) { nearestDist = d; next = e; }
            }
            current = next;
            chainCount++;
        }

        this.chainPoints = chainPoints;
        this.chainTimer = this.chainDuration;
        // Обновление статистики (максимальное количество целей)
if (scene && scene.stats) {
    const hitCount = this.chainPoints.length - 1; // исключаем игрока (первая точка)
    if (hitCount > scene.stats.maxChain) {
        scene.stats.maxChain = hitCount;
    }
}
        this.cooldownTimer = this.getCooldown();
    }

    update(delta) {
        super.update(delta);
        if (this.chainTimer > 0) {
            this.chainTimer -= delta;
            if (this.chainTimer <= 0) this.chainPoints = [];
        }
    }

    drawEffect(ctx) {
        if (this.chainPoints.length < 2 || this.chainTimer <= 0) return;
        const alpha = Math.min(1, this.chainTimer / this.chainDuration);
        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        const boltColor = this.damageColor; // цвет линий молнии
        for (let i = 0; i < this.chainPoints.length - 1; i++) {
            this.drawLightningSegment(ctx, this.chainPoints[i], this.chainPoints[i + 1], boltColor);
        }
        ctx.restore();
    }

    drawLightningSegment(ctx, p1, p2, color) {
        const segments = 6;
        const maxOffset = 12;
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const length = Math.hypot(dx, dy);
        if (length < 1) return;

        const nx = dx / length, ny = dy / length;
        const px = -ny, py = nx;

        const points = [p1];
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            let offset = (Math.random() - 0.5) * maxOffset * 2;
            offset *= Math.sin(t * Math.PI) * 0.8;
            points.push({
                x: p1.x + dx * t + px * offset,
                y: p1.y + dy * t + py * offset
            });
        }
        points.push(p2);

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
    }
}