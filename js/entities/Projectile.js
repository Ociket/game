export class Projectile {
    constructor(x, y, targetEnemy, damage, speed = 400, pierce = false, type = 'magic') {
        this.x = x;
        this.y = y;
        this.target = targetEnemy;
        this.damage = damage;
        this.speed = speed;
        this.radius = type === 'bone' ? 5 : 4;
        this.pierce = pierce;
        this.active = true;
        this.type = type;
        this.hitEnemies = new Set();
        this.scene = null;
        this.damageColor = '#feca57';   // по умолчанию жёлтый
    }

    update(delta) {
        if (!this.target || this.target.hp <= 0 || !this.active) {
            if (this.pierce) {
                this.target = this.findNewTarget();
                if (!this.target) {
                    this.active = false;
                    return;
                }
            } else {
                this.active = false;
                return;
            }
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 8) {
            this.target.hp -= this.damage;
            this.hitEnemies.add(this.target);
            // Показываем урон
            if (this.scene) {
                this.scene.addDamageText(this.target.x, this.target.y - 10, this.damage.toFixed(1), this.damageColor);
            }

            if (this.pierce) {
                this.target = this.findNewTarget();
                if (!this.target) {
                    this.active = false;
                }
            } else {
                this.active = false;
            }
            return;
        }

        this.x += (dx / dist) * this.speed * delta;
        this.y += (dy / dist) * this.speed * delta;
    }

    findNewTarget() {
        if (!this.scene || !this.scene.enemies) return null;
        let closest = null;
        let minDist = Infinity;
        for (const enemy of this.scene.enemies) {
            if (enemy.hp <= 0 || this.hitEnemies.has(enemy)) continue;
            const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (d < minDist) {
                minDist = d;
                closest = enemy;
            }
        }
        return closest;
    }

    draw(ctx, screenX, screenY) {
        ctx.save();
        if (this.type === 'magic') {
            ctx.fillStyle = '#74b9ff';
            ctx.shadowColor = '#a0d8ff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
            ctx.fill();
            // внутреннее свечение
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 12;
            ctx.arc(screenX, screenY, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#feca57';
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}