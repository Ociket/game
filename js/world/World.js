// js/world/World.js
import { CONFIG } from '../data/config.js';
import { randomRange } from '../utils.js';
import { AssetLoader } from '../engine/AssetLoader.js';

export class World {
    constructor() {
        this.tileSize = 16;
        this.tileScale = 2;                // тайлы рисуются в 2 раза крупнее
        this.tilesPerRow = 17;
        this.currentTheme = 0;
        this.themeAtlases = [null, null, null];

        this.mapCols = Math.ceil(CONFIG.world.width / this.tileSize);
        this.mapRows = Math.ceil(CONFIG.world.height / this.tileSize);

        this.objects = [];
        this.pots = [];
        this.houses = [];
        this.cemeteries = [];
    }

    async init(themeIndex) {
        this.currentTheme = themeIndex;
        if (!this.themeAtlases[themeIndex]) {
            const themeName = ['bw', 'pink', 'green'][themeIndex];
            this.themeAtlases[themeIndex] = await AssetLoader.loadTheme(themeName);
        }
        this.generateMap();
    }

    setTheme(index) {
        if (index >= 0 && index < this.themeAtlases.length && this.themeAtlases[index]) {
            this.currentTheme = index;
        }
    }

    // --------------- Вспомогательные методы ---------------
    alignToGrid(coord) {
        return Math.round(coord / this.tileSize) * this.tileSize;
    }

    isPath(x, y) {
        return this.objects.some(obj => obj.type === 'path' && obj.x === x && obj.y === y);
    }

    isCellBlocked(x, y) {
        return this.objects.some(obj => obj.x === x && obj.y === y && (obj.collidable || obj.type === 'path'));
    }

    markCell(x, y) {}

    // ------------------------ Генерация карты ------------------------
    generateMap() {
        const { width, height } = CONFIG.world;
        const objectTiles = CONFIG.locations.sharedObjectTiles;
        const tileW = this.tileSize;

        this.objects = [];
        this.pots = [];
        this.houses = [];
        this.cemeteries = [];

        this.spawnBigHouses(objectTiles, width, height, 10);
        this.spawnCemeteries(objectTiles, width, height);
        this.spawnTreeClusters(objectTiles, width, height, 28);

        const decoTypes = ['sign', 'stairs_down', 'log'];
        for (let i = 0; i < 25; i++) {
            const x = randomRange(80, width - 80);
            const y = randomRange(80, height - 80);
            const alignedX = this.alignToGrid(x);
            const alignedY = this.alignToGrid(y);
            const type = decoTypes[Math.floor(Math.random() * decoTypes.length)];
            const tileIdx = objectTiles[type];
            if (tileIdx === undefined) continue;
            if (!this.isCellBlocked(alignedX, alignedY)) {
                this.objects.push({ x: alignedX, y: alignedY, size: tileW, type, tileIdx, collidable: true, rotate: false });
                this.markCell(alignedX, alignedY);
            }
        }

        for (let i = 0; i < 15; i++) {
            const x = randomRange(80, width - 80);
            const y = randomRange(80, height - 80);
            const alignedX = this.alignToGrid(x);
            const alignedY = this.alignToGrid(y);
            if (!this.isCellBlocked(alignedX, alignedY)) {
                const idx = objectTiles['log'];
                if (idx !== undefined) {
                    this.objects.push({ x: alignedX, y: alignedY, size: tileW, type: 'log', tileIdx: idx, collidable: true, rotate: false });
                    this.markCell(alignedX, alignedY);
                }
            }
        }

        this.buildRoadsBetweenHouses(width, height);

        for (let i = 0; i < 10; i++) {
            const x = randomRange(50, width - 50);
            const y = randomRange(50, height - 50);
            const alignedX = this.alignToGrid(x);
            const alignedY = this.alignToGrid(y);
            if (!this.isCellBlocked(alignedX, alignedY)) {
                this.pots.push({ x: alignedX, y: alignedY, size: tileW, active: true });
                this.markCell(alignedX, alignedY);
            }
        }
        this.updatePathTiles();
    }

    // -------------------- Большие дома --------------------
    spawnBigHouses(tiles, worldW, worldH, count) {
        for (let i = 0; i < count; i++) {
            const x = this.alignToGrid(randomRange(200, worldW - 200));
            const y = this.alignToGrid(randomRange(200, worldH - 200));
            this.placeBigHouse(tiles, worldW, worldH, x, y);
        }
    }

    placeBigHouse(tiles, worldW, worldH, x, y) {
        const tileW = this.tileSize;
        const w = 3, h = 5;

        for (let row = 0; row < h; row++) {
            for (let col = 0; col < w; col++) {
                const tx = x + col * tileW;
                const ty = y + row * tileW;
                if (tx < tileW || tx > worldW - tileW || ty < tileW || ty > worldH - tileW) return;
                if (this.isCellBlocked(tx, ty)) return;
            }
        }

        const bottomRow = [
            tiles.house_big_wall_left || 92,
            (() => {
                const vars = [tiles.house_big_wall_mid || 93, tiles.door_closed || 117, tiles.window_shutters || 111, tiles.window_open || 112];
                return vars[Math.floor(Math.random() * vars.length)];
            })(),
            tiles.house_big_wall_right || 94
        ];
        const midRow = [tiles.house_big_mid_left || 130, tiles.house_big_mid_mid || 131, tiles.house_big_mid_right || 132];
        const roofRow = [tiles.house_big_roof_left || 113, tiles.house_big_roof_mid || 114, tiles.house_big_roof_right || 115];
        const topRow = [tiles.house_big_top_left || 96, tiles.house_big_top_mid || 97, tiles.house_big_top_right || 98];
        const spireTile = tiles.roof_top || 80;

        const rowsData = [
            { offset: 4, tiles: bottomRow },
            { offset: 3, tiles: midRow },
            { offset: 2, tiles: roofRow },
            { offset: 1, tiles: topRow },
        ];

        for (const { offset, tiles: rowTiles } of rowsData) {
            for (let col = 0; col < w; col++) {
                const tx = x + col * tileW;
                const ty = y + offset * tileW;
                this.objects.push({ x: tx, y: ty, size: tileW, type: 'house', tileIdx: rowTiles[col], collidable: true, rotate: false });
                this.markCell(tx, ty);
            }
        }

        const spireX = x + 1 * tileW;
        const spireY = y;
        this.objects.push({ x: spireX, y: spireY, size: tileW, type: 'house_spire', tileIdx: spireTile, collidable: false, rotate: false });
        this.markCell(spireX, spireY);

        this.houses.push({
            x: x,
            y: y + 4 * tileW,
            w: w * tileW,
            h: h * tileW,
        });
    }

    // -------------------- Кладбища, деревья, дороги --------------------
    spawnCemeteries(tiles, worldW, worldH) {
        const count = 6 + Math.floor(Math.random() * 3);
        for (let c = 0; c < count; c++) {
            const centerX = this.alignToGrid(randomRange(200, worldW - 200));
            const centerY = this.alignToGrid(randomRange(200, worldH - 200));
            const radius = randomRange(2.5, 5) * this.tileSize;
            const graveCount = Math.floor(randomRange(8, 18));

            for (let i = 0; i < graveCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * radius;
                const gx = this.alignToGrid(centerX + Math.cos(angle) * r);
                const gy = this.alignToGrid(centerY + Math.sin(angle) * r);

                if (this.isCellBlocked(gx, gy)) continue;

                const graveTypes = ['gravestone_1', 'gravestone_2', 'grave'];
                const type = graveTypes[Math.floor(Math.random() * graveTypes.length)];
                const tileIdx = tiles[type];
                if (tileIdx !== undefined) {
                    this.objects.push({ x: gx, y: gy, size: this.tileSize, type, tileIdx, collidable: true, rotate: false });
                    this.markCell(gx, gy);
                }
            }
        }
    }

    spawnTreeClusters(tiles, worldW, worldH, clusterCount) {
        for (let c = 0; c < clusterCount; c++) {
            const mainX = this.alignToGrid(randomRange(150, worldW - 150));
            const mainY = this.alignToGrid(randomRange(150, worldH - 150));
            const subCenters = [];
            const subCenterCount = 2 + Math.floor(Math.random() * 3);
            for (let s = 0; s < subCenterCount; s++) {
                const offX = (Math.random() - 0.5) * 6 * this.tileSize;
                const offY = (Math.random() - 0.5) * 6 * this.tileSize;
                subCenters.push({
                    x: this.alignToGrid(mainX + offX),
                    y: this.alignToGrid(mainY + offY),
                    radius: randomRange(1.5, 3.5) * this.tileSize
                });
            }

            const treeCount = Math.floor(randomRange(12, 24));
            for (let i = 0; i < treeCount; i++) {
                const sub = subCenters[Math.floor(Math.random() * subCenters.length)];
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * sub.radius;
                const tx = this.alignToGrid(sub.x + Math.cos(angle) * r);
                const ty = this.alignToGrid(sub.y + Math.sin(angle) * r);

                if (this.isCellBlocked(tx, ty)) continue;

                const treeTypes = ['tree_single_1', 'tree_single_2', 'tree_single_3', 'tree_pine', 'tree_double'];
                const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                const tileIdx = tiles[treeType];
                if (tileIdx !== undefined) {
                    this.objects.push({ x: tx, y: ty, size: this.tileSize, type: treeType, tileIdx, collidable: true, rotate: false });
                    this.markCell(tx, ty);
                }
            }
        }
    }

    buildRoadsBetweenHouses(worldW, worldH) {
        if (this.houses.length < 2) return;

        const connected = new Set();
        for (let i = 0; i < this.houses.length; i++) {
            if (connected.has(i)) continue;
            let bestDist = Infinity;
            let bestJ = -1;
            for (let j = i + 1; j < this.houses.length; j++) {
                const a = this.houses[i];
                const b = this.houses[j];
                const ax = a.x + a.w / 2;
                const ay = a.y;
                const bx = b.x + b.w / 2;
                const by = b.y;
                const dist = Math.abs(ax - bx) + Math.abs(ay - by);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestJ = j;
                }
            }
            if (bestJ !== -1) {
                this.createLPath(this.houses[i], this.houses[bestJ], worldW, worldH);
                connected.add(i);
                connected.add(bestJ);
            }
        }
    }

    createLPath(a, b, worldW, worldH) {
        const tileW = this.tileSize;
        const startX = this.alignToGrid(a.x + a.w / 2);
        const startY = a.y;
        const endX = this.alignToGrid(b.x + b.w / 2);
        const endY = b.y;

        const midX = endX;
        const midY = startY;
        this.buildStraightPath(startX, startY, midX, midY, worldW, worldH);
        this.buildStraightPath(midX, midY, endX, endY, worldW, worldH);
    }

    buildStraightPath(x1, y1, x2, y2, worldW, worldH) {
        const step = this.tileSize;
        if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
            const dir = x1 < x2 ? step : -step;
            const fixedY = this.alignToGrid(y1);
            let x = x1;
            while ((dir > 0 && x <= x2) || (dir < 0 && x >= x2)) {
                const tx = this.alignToGrid(x);
                if (tx >= step && tx <= worldW - step && fixedY >= step && fixedY <= worldH - step) {
                    if (!this.isCellBlocked(tx, fixedY) && !this.isPath(tx, fixedY)) {
                        this.objects.push({ x: tx, y: fixedY, size: step, type: 'path', tileIdx: 0, collidable: false, rotate: false });
                    }
                }
                x += dir;
            }
        } else {
            const dir = y1 < y2 ? step : -step;
            const fixedX = this.alignToGrid(x1);
            let y = y1;
            while ((dir > 0 && y <= y2) || (dir < 0 && y >= y2)) {
                const ty = this.alignToGrid(y);
                if (ty >= step && ty <= worldH - step && fixedX >= step && fixedX <= worldW - step) {
                    if (!this.isCellBlocked(fixedX, ty) && !this.isPath(fixedX, ty)) {
                        this.objects.push({ x: fixedX, y: ty, size: step, type: 'path', tileIdx: 0, collidable: false, rotate: false });
                    }
                }
                y += dir;
            }
        }
    }

    updatePathTiles() {
        const tileW = this.tileSize;
        const pathObjects = this.objects.filter(o => o.type === 'path');
        const pathSet = new Set(pathObjects.map(o => `${o.x},${o.y}`));
        for (const obj of pathObjects) {
            const x = obj.x, y = obj.y;
            const N = pathSet.has(`${x},${y - tileW}`) ? 1 : 0;
            const E = pathSet.has(`${x + tileW},${y}`) ? 1 : 0;
            const S = pathSet.has(`${x},${y + tileW}`) ? 1 : 0;
            const W = pathSet.has(`${x - tileW},${y}`) ? 1 : 0;
            const mask = (N ? 1 : 0) | (E ? 2 : 0) | (S ? 4 : 0) | (W ? 8 : 0);
            obj.tileIdx = this.getPathTileFromMask(mask);
        }
    }

    getPathTileFromMask(mask) {
        const table = {
            0: 90, 1: 90, 2: 90, 4: 90, 8: 90,
            3: 102, 5: 104, 9: 103, 6: 85, 10: 87, 12: 86,
            7: 88, 11: 106, 13: 105, 14: 89, 15: 90
        };
        return table[mask] || 90;
    }

    // -------------------- Коллизии и взаимодействия --------------------
    isColliding(centerX, centerY, radius) {
        return this.objects.some(obj => {
            if (!obj.collidable) return false;
            const ox = obj.x + obj.size / 2;
            const oy = obj.y + obj.size / 2;
            return Math.hypot(centerX - ox, centerY - oy) < radius + obj.size / 2;
        });
    }

    resolveCollision(player) {
        const r = player.radius;
        for (const obj of this.objects) {
            if (!obj.collidable) continue;
            const ox = obj.x + obj.size / 2;
            const oy = obj.y + obj.size / 2;
            const dist = Math.hypot(player.x - ox, player.y - oy);
            const minDist = r + obj.size / 2;
            if (dist < minDist) {
                const angle = Math.atan2(player.y - oy, player.x - ox);
                const pushX = Math.cos(angle) * (minDist - dist);
                const pushY = Math.sin(angle) * (minDist - dist);
                player.x += pushX;
                player.y += pushY;
            }
        }
    }

    checkPotCollision(player, scene) {
        for (let i = this.pots.length - 1; i >= 0; i--) {
            const pot = this.pots[i];
            if (!pot.active) continue;
            const ox = pot.x + pot.size / 2;
            const oy = pot.y + pot.size / 2;
            const dist = Math.hypot(player.x - ox, player.y - oy);
            if (dist < player.radius + pot.size / 2) {
                pot.active = false;
                this.pots.splice(i, 1);
                const r = Math.random();
                if (r < 0.4) {
                    player.hp = Math.min(player.maxHp, player.hp + 5);
                    scene.addDamageText(player.x, player.y - 10, '+5 HP', '#6ab04c');
                } else if (r < 0.8) {
                    player.gainXP(2);
                    scene.addDamageText(player.x, player.y - 10, '+2 XP', '#ffd966');
                }
            }
        }
    }

    // -------------------- Отрисовка --------------------
    draw(ctx, cameraX, cameraY, viewWidth, viewHeight) {
        const atlas = this.themeAtlases[this.currentTheme];
        if (!atlas) {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, viewWidth, viewHeight);
            return;
        }

        const theme = CONFIG.locations.themes[this.currentTheme];
        const objectTiles = CONFIG.locations.sharedObjectTiles;
        const tileW = this.tileSize;
        const tilesPerRow = this.tilesPerRow;

        const occupied = new Set();
        for (const obj of this.objects) occupied.add(`${obj.x},${obj.y}`);
        for (const pot of this.pots) if (pot.active) occupied.add(`${pot.x},${pot.y}`);

        const startCol = Math.floor(cameraX / tileW);
        const endCol = Math.ceil((cameraX + viewWidth) / tileW);
        const startRow = Math.floor(cameraY / tileW);
        const endRow = Math.ceil((cameraY + viewHeight) / tileW);

        const grassTiles = theme.grassTiles;
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const worldX = col * tileW;
                const worldY = row * tileW;
                if (occupied.has(`${worldX},${worldY}`)) continue;

                const hash = Math.abs((row * 374761393 + col * 668265263) ^ 0x5bf03635);
                let grassIdx = (hash % 10 === 0) ? 4 : (hash >> 2) % 4;
                const grassTile = grassTiles[grassIdx];
                this.drawTile(ctx, atlas, grassTile, tilesPerRow, tileW, worldX, worldY);
            }
        }

        for (const obj of this.objects) {
            if (!this.isInView(obj, cameraX, cameraY, viewWidth, viewHeight)) continue;
            if (obj.rotate && obj.tileIdx) {
                ctx.save();
                const centerX = obj.x + tileW / 2;
                const centerY = obj.y + tileW / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate(Math.PI / 2);
                ctx.translate(-tileW / 2, -tileW / 2);
                this.drawTile(ctx, atlas, obj.tileIdx, tilesPerRow, tileW, 0, 0);
                ctx.restore();
            } else {
                this.drawTile(ctx, atlas, obj.tileIdx, tilesPerRow, tileW, obj.x, obj.y);
            }
        }

        for (const pot of this.pots) {
            if (!pot.active) continue;
            this.drawTile(ctx, atlas, objectTiles.pot, tilesPerRow, tileW, pot.x, pot.y);
        }
    }

    isInView(obj, cx, cy, vw, vh) {
        return !(obj.x + this.tileSize < cx || obj.x - this.tileSize > cx + vw ||
                 obj.y + this.tileSize < cy || obj.y - this.tileSize > cy + vh);
    }

    drawTile(ctx, atlas, tileIdx, tilesPerRow, tileW, worldX, worldY) {
        const srcX = (tileIdx % tilesPerRow) * tileW;
        const srcY = Math.floor(tileIdx / tilesPerRow) * tileW;
        ctx.drawImage(atlas, srcX, srcY, tileW, tileW, worldX, worldY, tileW, tileW);
    }
}