// js/engine/VirtualJoystick.js
export class VirtualJoystick {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.radius = options.radius || 60;
        this.innerRadius = options.innerRadius || 25;
        // Позиция базы джойстика в координатах canvas
        this.baseX = options.x || 100;
        this.baseY = options.y || canvas.height - 100;
        this.active = false;
        this.touchId = null;
        this.stickX = this.baseX;
        this.stickY = this.baseY;
        this.deltaX = 0;
        this.deltaY = 0;

        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);

        canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        canvas.addEventListener('touchend', this._onTouchEnd);
        canvas.addEventListener('touchcancel', this._onTouchEnd);
    }

    _getCanvasCoords(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    _onTouchStart(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            const pos = this._getCanvasCoords(touch);
            const dist = Math.hypot(pos.x - this.baseX, pos.y - this.baseY);
            // Можно активировать, даже если касание не точно по джойстику — например, левая половина экрана
            // Но для простоты: касание в любом месте левой половины активирует джойстик
            if (pos.x < this.canvas.width * 0.5 && !this.active) {
                this.active = true;
                this.touchId = touch.identifier;
                // Перемещаем базу под палец
                this.baseX = pos.x;
                this.baseY = pos.y;
                this.stickX = pos.x;
                this.stickY = pos.y;
                break;
            }
        }
    }

    _onTouchMove(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.touchId && this.active) {
                const pos = this._getCanvasCoords(touch);
                let dx = pos.x - this.baseX;
                let dy = pos.y - this.baseY;
                const dist = Math.hypot(dx, dy);
                const maxDist = this.radius - this.innerRadius;
                if (dist > maxDist) {
                    dx = (dx / dist) * maxDist;
                    dy = (dy / dist) * maxDist;
                }
                this.stickX = this.baseX + dx;
                this.stickY = this.baseY + dy;
                this.deltaX = dx / maxDist;
                this.deltaY = dy / maxDist;
                break;
            }
        }
    }

    _onTouchEnd(e) {
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.touchId) {
                this.active = false;
                this.touchId = null;
                this.deltaX = 0;
                this.deltaY = 0;
                this.stickX = this.baseX;
                this.stickY = this.baseY;
                break;
            }
        }
    }

    getMoveVector() {
        return { x: this.deltaX, y: this.deltaY };
    }

 draw(ctx) {
    const isPortrait = this.canvas.height > this.canvas.width;
    if (!this.active && !isPortrait) return;

    const alpha = this.active ? 0.7 : 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Внешний круг – тёмный с яркой белой обводкой
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.baseX, this.baseY, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Внутренний рычажок – белый с чёрной обводкой
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.stickX, this.stickY, this.innerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

    destroy() {
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        this.canvas.removeEventListener('touchmove', this._onTouchMove);
        this.canvas.removeEventListener('touchend', this._onTouchEnd);
        this.canvas.removeEventListener('touchcancel', this._onTouchEnd);
    }
}