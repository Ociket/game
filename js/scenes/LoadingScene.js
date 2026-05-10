// js/scenes/LoadingScene.js
export class LoadingScene {
    constructor(game, onComplete) {
        this.game = game;
        this.onComplete = onComplete; // колбэк после загрузки
        this.container = null;
        this.progress = 0;
        this.totalAssets = 0;
    }

    init() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position:absolute; top:0; left:0; width:100%; height:100%;
            background: black; display:flex; flex-direction:column;
            align-items:center; justify-content:center; z-index:200;
            font-family:'Press Start 2P',monospace; color:white;
        `;
        this.container.innerHTML = `
            <h2>Загрузка...</h2>
            <div style="width:200px; height:20px; border:2px solid #fff; margin:20px 0;">
                <div id="loadBar" style="width:0%; height:100%; background:#f3c26b;"></div>
            </div>
            <p id="loadText">0%</p>
        `;
        document.getElementById('gameContainer').appendChild(this.container);
        this.loadAssets();
    }

    async loadAssets() {
        const assets = [
            // список всех тем, звуков, картинок, которые нужно загрузить до старта
            { type: 'theme', name: 'bw' },
            { type: 'theme', name: 'pink' },
            { type: 'theme', name: 'green' },
        ];
        this.totalAssets = assets.length;
        let loaded = 0;

        for (const asset of assets) {
            try {
                await this.loadAsset(asset);
                loaded++;
                this.setProgress(loaded / this.totalAssets);
            } catch (e) {
                console.warn(`Failed to load ${asset.name}`, e);
                loaded++;
                this.setProgress(loaded / this.totalAssets);
            }
        }

        if (this.onComplete) this.onComplete();
    }

    async loadAsset(asset) {
        if (asset.type === 'theme') {
            const { AssetLoader } = await import('../engine/AssetLoader.js');
            const atlas = await AssetLoader.loadTheme(asset.name);
            if (!window.__themeAtlases) window.__themeAtlases = [];
            const index = asset.name === 'bw' ? 0 : asset.name === 'pink' ? 1 : 2;
            window.__themeAtlases[index] = atlas;
        }
        // можно добавить загрузку звуков, но они загружаются в AudioManager позже
    }

    setProgress(value) {
        this.progress = value;
        const bar = document.getElementById('loadBar');
        const text = document.getElementById('loadText');
        if (bar) bar.style.width = (value * 100) + '%';
        if (text) text.textContent = Math.floor(value * 100) + '%';
    }

    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }

    update() {}
    draw(ctx) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
}