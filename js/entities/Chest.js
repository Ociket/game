export class Chest {
    constructor(x, y, chestType = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.collected = false;
        this.chestType = chestType;
    }

    canCollect(player) {
        if (this.collected) return false;
        const dx = this.x - player.x, dy = this.y - player.y;
        return Math.hypot(dx, dy) < player.radius + this.radius;
    }

    draw(ctx, screenX, screenY) {
        if (this.collected) return;
        if (this.chestType === 'evolution') {
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(screenX - 8, screenY - 4, 16, 10);
            ctx.fillStyle = '#6c3483';
            ctx.fillRect(screenX - 6, screenY - 10, 12, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(screenX - 2, screenY - 2, 4, 4);
            return;
        }
        ctx.fillStyle = '#ffa502';
        ctx.fillRect(screenX - 8, screenY - 4, 16, 10);
        ctx.fillStyle = '#cc7a00';
        ctx.fillRect(screenX - 6, screenY - 10, 12, 6);
        ctx.fillStyle = 'white';
        ctx.fillRect(screenX - 2, screenY - 2, 4, 4);
    }
}