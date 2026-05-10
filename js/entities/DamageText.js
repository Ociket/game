// js/entities/DamageText.js
export class DamageText {
    constructor(x, y, text, color = '#ff6b6b', isPlayerDamage = false) {
        this.x = x;
        this.y = y;
        // Автоформатирование чисел
        if (typeof text === 'number') {
            this.text = text.toFixed(1);
        } else if (typeof text === 'string') {
            const match = text.match(/^(-?\d+\.?\d*)(.*)/);
            if (match) {
                this.text = parseFloat(match[1]).toFixed(1) + match[2];
            } else {
                this.text = text;
            }
        } else {
            this.text = String(text);
        }
        this.color = color;
        this.life = isPlayerDamage ? 0.8 : 0.6; // Время жизни
        this.age = 0;
        this.vy = isPlayerDamage ? -40 : -30; // Скорость движения вверх
        this.isPlayerDamage = isPlayerDamage;
    }

    update(delta) {
        this.age += delta;
        this.y += this.vy * delta;
        return this.age < this.life; // true = оставить, false = удалить
    }

    draw(ctx, screenX, screenY) {
        // 1. Рассчитываем базовую прозрачность (угасание со временем)
        const alpha = 1 - (this.age / this.life);
        if (alpha <= 0) return;

        ctx.save();
        // 2. Делаем текст ЧУТЬ ПРОЗРАЧНЕЕ (базовая прозрачность 0.7 вместо 1.0)
        // Умножаем на 0.7, чтобы он не был слишком "жирным"
        ctx.globalAlpha = alpha * 0.6; 
        
        // 3. Делаем шрифт ЧУТЬ МЕНЬШЕ (12px и 16px вместо 14px и 18px)
        ctx.font = this.isPlayerDamage ? 'bold 14px "Press Start 2P"' : 'bold 10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // ЧЕРННАЯ ОБВОДКА (контраст)
        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = 2; // Немного уменьшил обводку под новый размер шрифта
        ctx.lineJoin = 'round';      
        ctx.strokeText(this.text, screenX, screenY);

        // САМ ТЕКСТ (яркий цвет)
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color; // Неоновое свечение
        ctx.shadowBlur = 6;
        ctx.fillText(this.text, screenX, screenY);

        ctx.restore();
    }
}