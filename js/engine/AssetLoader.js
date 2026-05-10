// js/engine/AssetLoader.js
export class AssetLoader {
    static async loadTheme(theme) {
        const tileSize = 16;
        const cols = 17;
        const rows = 8;
        const totalTiles = 136;

        const atlas = document.createElement('canvas');
        atlas.width = cols * tileSize;
        atlas.height = rows * tileSize;
        const ctx = atlas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // фиолетовый фон-заглушка
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, atlas.width, atlas.height);

        let errorCount = 0;
        const MAX_ERRORS = 10;   // если 10 файлов не загрузились – прерываем всё

        const promises = [];
        for (let i = 0; i < totalTiles; i++) {
            const num = String(i).padStart(4, '0');
            const src = `assets/map/${theme}/tile_${num}.png`;

            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                const timeout = setTimeout(() => {
                    errorCount++;
                    if (errorCount >= MAX_ERRORS) {
                        reject(new Error(`Слишком много ошибок загрузки (${errorCount}).`));
                    } else {
                        resolve();
                    }
                }, 1000); // 1 секунда на файл

                img.onload = () => {
                    clearTimeout(timeout);
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    ctx.drawImage(img, col * tileSize, row * tileSize);
                    resolve();
                };

                img.onerror = () => {
                    clearTimeout(timeout);
                    errorCount++;
                    if (errorCount >= MAX_ERRORS) {
                        reject(new Error(`Слишком много ошибок загрузки (${errorCount}).`));
                    } else {
                        resolve(); // игнорируем одиночную ошибку
                    }
                };

                img.src = src;
            });

            promises.push(promise);
        }

        try {
            await Promise.all(promises);
        } catch (err) {
            console.error('Загрузка темы прервана:', err.message);
            // возвращаем частично заполненный атлас (с фиолетовыми дырами)
        }

        return atlas;
    }
}