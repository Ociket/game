export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        // отключаем сглаживание для пиксельности
        this.ctx.imageSmoothingEnabled = false;

        this.scenes = {};
        this.currentScene = null;
        this.lastTime = 0;
        this.running = false;
    }

    addScene(name, scene) {
        this.scenes[name] = scene;
    }

    switchScene(name) {
        if (this.currentScene && this.currentScene.destroy) {
            this.currentScene.destroy();
        }
        this.currentScene = this.scenes[name];
        if (this.currentScene.init) {
            this.currentScene.init();
        }
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    loop(now) {
        if (!this.running) return;
        const delta = (now - this.lastTime) / 1000;
        this.lastTime = now;

        const clampedDelta = Math.min(delta, 0.05); // защита от больших скачков

        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(clampedDelta);
        }

        // очистка
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.currentScene && this.currentScene.draw) {
            this.currentScene.draw(this.ctx);
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}