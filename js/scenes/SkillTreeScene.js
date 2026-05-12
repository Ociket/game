// js/scenes/SkillTreeScene.js
import { getBlueCrystals, purchaseUpgrade, getUpgradeCost, getPermanentUpgrades, addBlueCrystals, resetAllUpgrades } from '../data/metaProgress.js';

const SKILL_TREE = {
    root: { id: 'root', icon: '💠', name: 'Исток', isRoot: true },
    branches: [
        {
            id: 'combat',
            name: 'БОЙ',
            color: '#e74c3c',
            description: 'Увеличивает урон и шанс критического удара',
            ultimate: {
                id: 'ultimate_combat', icon: '💥', name: 'Берсерк',
                desc: 'Удваивает весь урон на 5 секунд после получения урона', cost: 500
            },
            altUltimate: {
                id: 'ultimate_combat_alt', icon: '🗡️', name: 'Кровавая ярость',
                desc: '+50% урона, но -20% здоровья', cost: 500
            },
            nodes: [
                { id: 'damageBonus', icon: '⚔️', name: 'Урон', desc: '+5% урона' },
                { id: 'attackSpeedBonus', icon: '🏹', name: 'Скор. атаки', desc: '-5% перезарядки' },
                { id: 'critChance', icon: '🎯', name: 'Крит', desc: '+2% крит. шанса' },
                { id: 'eliteDamage', icon: '💀', name: 'Элиты', desc: '+8% урона элитам' }
            ]
        },
        {
            id: 'defense',
            name: 'ЗАЩИТА',
            color: '#3498db',
            description: 'Повышает живучесть и регенерацию',
            ultimate: {
                id: 'ultimate_defense', icon: '✨', name: 'Несокрушимость',
                desc: 'Даёт 3 секунды неуязвимости при смертельном ударе (раз в 60 сек)', cost: 500
            },
            altUltimate: {
                id: 'ultimate_defense_alt', icon: '🛡️', name: 'Живой бастион',
                desc: '+30% брони, но -10% скорости', cost: 500
            },
            nodes: [
                { id: 'maxHpBonus', icon: '❤️', name: 'Здоровье', desc: '+5 HP' },
                { id: 'revive', icon: '🔄', name: 'Возрожд.', desc: 'Одно воскрешение', maxLevel: 1 },
                { id: 'projectileResist', icon: '🛡', name: 'Броня', desc: '-6% урона снарядов' },
                { id: 'regen', icon: '💧', name: 'Реген', desc: '+1 HP/с', fakeId: true }
            ]
        },
        {
            id: 'magic',
            name: 'МАГИЯ',
            color: '#9b59b6',
            description: 'Усиливает магические способности и сбор ресурсов',
            ultimate: {
                id: 'ultimate_magic', icon: '🌌', name: 'Магический поток',
                desc: 'Удваивает весь получаемый опыт на 10 секунд (раз в 45 сек)', cost: 500
            },
            altUltimate: {
                id: 'ultimate_magic_alt', icon: '🔮', name: 'Проклятие',
                desc: '+50% урона врагам, но -20% опыта', cost: 500
            },
            nodes: [
                { id: 'magnetRadius', icon: '🧲', name: 'Магнит', desc: '+15 радиуса' },
                { id: 'startExp', icon: '📖', name: 'Опыт', desc: '+20% старт. опыта', maxLevel: 3 },
                { id: 'extraItemSlot', icon: '🎒', name: 'Слот', desc: '+1 слот предметов', maxLevel: 1 },
                { id: 'lifesteal', icon: '🩸', name: 'Вамп.', desc: '+2% вампиризма' }
            ]
        },
        {
            id: 'utility',
            name: 'УТИЛИТЫ',
            color: '#2ecc71',
            description: 'Улучшает передвижение и общие характеристики',
            ultimate: {
                id: 'ultimate_utility', icon: '⚡', name: 'Мастерство',
                desc: 'Сокращает время перезарядки всех оружий на 50% на 10 сек (раз в 60 сек)', cost: 500
            },
            altUltimate: {
                id: 'ultimate_utility_alt', icon: '👟', name: 'Стремительность',
                desc: '+100% скорости на 5 сек при получении урона', cost: 500
            },
            nodes: [
                { id: 'speedBonus', icon: '💨', name: 'Скорость', desc: '+10% скорости' },
                // Исправлено: уникальный ID, чтобы не перезаписывать узел из ветки БОЙ
                { id: 'utilityAttackSpeed', icon: '⚡', name: 'Перезар.', desc: '-5% кулдауна' },
                { id: 'luck', icon: '🍀', name: 'Удача', desc: '+5% удачи', fakeId: true },
                { id: 'thornNecklace', icon: '🌿', name: 'Шипы', desc: '+10% отражения', fakeId: true }
            ]
        }
    ]
};

export class SkillTreeScene {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.container = null;
        this.tapStartPos = { x: 0, y: 0 };
this.tapStartTime = 0;
this.hasMoved = false;
// Обработчики событий (чтобы правильно удалять)
this._onMouseDown = null;
this._onMouseMove = null;
this._onMouseUp = null;
this._onWheel = null;
this._onTouchStart = null;
this._onTouchMove = null;
this._onTouchEnd = null;
this.lastMouseX = 0;
this.lastMouseY = 0;
this.selectedNode = null;   // узел, для которого открыт тултип
this.tooltipFixedX = 0;
this.tooltipFixedY = 0;
this.tooltipFixed = false;
this.lastTapTime = 0;       // время последнего тапа

        // Камера
        this.camera = {
            x: 0, y: 0, zoom: 1.0,
            minZoom: 0.5, maxZoom: 2.0,
            targetZoom: 1.0, targetX: 0, targetY: 0
        };

        // Управление
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.cameraStart = { x: 0, y: 0 };
        this.lastPinchDist = 0;         // для пинч-зума
        this.pinchStartZoom = 1;

        // Данные
        this.nodePositions = {};
        this.branchLabels = [];
        this.hoveredNode = null;
        this.tooltip = {
            show: false, x: 0, y: 0, text: '', cost: 0,
            canBuy: false, branchProgress: { current: 0, max: 0 }
        };

        // Анимация
        this.particles = [];
        this.time = 0;

        // Фоновые звезды
        this.stars = [];
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * 3000 - 1500,
                y: Math.random() * 3000 - 1500,
                size: 0.5 + Math.random() * 2.5,
                baseAlpha: 0.3 + Math.random() * 0.7,
                twinkleSpeed: 1 + Math.random() * 3,
                twinkleOffset: Math.random() * Math.PI * 2,
            });
        }
    }

    init() {
        this.calculateNodePositions();
        this.createUI();
        this.updateCrystalsDisplay();
        this.attachEvents();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'skillTreeUI';
        this.container.innerHTML = `
            <div class="tree-header">🌟 ДРЕВО НАВЫКОВ</div>
            <div class="tree-crystals">💎 <span id="treeCrystals">0</span></div>
            <div class="tree-controls">
                <button id="backFromTreeBtn" class="tree-btn primary">◀ НАЗАД</button>
                <button id="resetTreeBtn" class="tree-btn danger">🔄 СБРОС</button>
            </div>
            <div class="tree-help">🖱️ Колёсико – зум | Зажать и двигать – панорама</div>
        `;
        document.getElementById('gameContainer').appendChild(this.container);

        document.getElementById('backFromTreeBtn').addEventListener('click', () => this.game.switchScene('menu'));
        document.getElementById('resetTreeBtn').addEventListener('click', () => this.resetTree());
    }

    calculateNodePositions() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = 180;
        this.nodePositions['root'] = { x: cx, y: cy };

        const branchCount = SKILL_TREE.branches.length;
        const startAngle = Math.PI / 2 - 0.9;
        const endAngle = Math.PI / 2 + 0.9;
        const angleStep = (endAngle - startAngle) / (branchCount - 1);

        this.branchLabels = [];

        SKILL_TREE.branches.forEach((branch, idx) => {
            const angle = startAngle + idx * angleStep;

            branch.nodes.forEach((node, i) => {
                const dist = 120 + i * 85;
                const x = cx + Math.cos(angle) * dist;
                const y = cy + Math.sin(angle) * dist;
                this.nodePositions[node.id] = { x, y };
            });

            const firstNodePos = this.nodePositions[branch.nodes[0].id];
            this.branchLabels.push({
                text: branch.name,
                x: firstNodePos.x,
                y: firstNodePos.y - 40,
                color: branch.color
            });

            const lastNode = branch.nodes[branch.nodes.length - 1];
            const lastPos = this.nodePositions[lastNode.id];
            const baseAngle = Math.atan2(lastPos.y - cy, lastPos.x - cx);
            const ultDist = 120;
            const ultAngle1 = baseAngle - 0.3;
            this.nodePositions[branch.ultimate.id] = {
                x: lastPos.x + Math.cos(ultAngle1) * ultDist,
                y: lastPos.y + Math.sin(ultAngle1) * ultDist
            };
            const ultAngle2 = baseAngle + 0.3;
            if (branch.altUltimate) {
                this.nodePositions[branch.altUltimate.id] = {
                    x: lastPos.x + Math.cos(ultAngle2) * ultDist,
                    y: lastPos.y + Math.sin(ultAngle2) * ultDist
                };
            }
        });
    }

    getNodeAt(mx, my) {
        const worldX = (mx - this.camera.x) / this.camera.zoom;
        const worldY = (my - this.camera.y) / this.camera.zoom;

        const rootPos = this.nodePositions['root'];
        if (rootPos && Math.hypot(worldX - rootPos.x, worldY - rootPos.y) < 35)
            return SKILL_TREE.root;

        for (const branch of SKILL_TREE.branches) {
            for (const node of branch.nodes) {
                const pos = this.nodePositions[node.id];
                if (pos && Math.hypot(worldX - pos.x, worldY - pos.y) < 30)
                    return node;
            }
            const ultPos = this.nodePositions[branch.ultimate.id];
            if (ultPos && Math.hypot(worldX - ultPos.x, worldY - ultPos.y) < 35)
                return { ...branch.ultimate, isUltimate: true, branchId: branch.id };
            if (branch.altUltimate) {
                const altPos = this.nodePositions[branch.altUltimate.id];
                if (altPos && Math.hypot(worldX - altPos.x, worldY - altPos.y) < 35)
                    return { ...branch.altUltimate, isUltimate: true, branchId: branch.id, isAlt: true };
            }
        }
        return null;
    }

    getNodeLevel(node) {
        const upgrades = getPermanentUpgrades();
        return upgrades[node.id] || 0;
    }

    getBranchProgress(branch) {
        let completed = 0;
        branch.nodes.forEach(n => {
            if (this.getNodeLevel(n) >= (n.maxLevel || 10)) completed++;
        });
        return { current: completed, max: branch.nodes.length };
    }

    canPurchase(node) {
        if (node.isRoot) return false;

        if (node.isUltimate) {
            const branch = SKILL_TREE.branches.find(b =>
                b.ultimate.id === node.id || (b.altUltimate && b.altUltimate.id === node.id)
            );
            if (!branch) return false;

            // Все узлы ветки должны быть максимального уровня
            for (const n of branch.nodes) {
                if (this.getNodeLevel(n) < (n.maxLevel || 10)) return false;
            }

            // Нельзя взять обе финальные способности в одной ветке
            const otherUltId = (node.id === branch.ultimate.id)
                ? branch.altUltimate?.id
                : branch.ultimate.id;
            if (otherUltId && this.getNodeLevel({ id: otherUltId }) > 0) {
                return false;
            }

            const currentLevel = this.getNodeLevel(node);
            return currentLevel < (node.maxLevel || 1);
        } else {
    const branch = SKILL_TREE.branches.find(b => b.nodes.includes(node));
    if (!branch) return true;
    // Всегда проверяем, не достигнут ли максимальный уровень
    if (this.getNodeLevel(node) >= (node.maxLevel || 10)) return false;
    const idx = branch.nodes.indexOf(node);
    if (idx === 0) return true;   // первый узел доступен, если не максимум
    const prev = branch.nodes[idx - 1];
    return this.getNodeLevel(prev) > 0;
}
    }

    purchaseNode(node) {
    if (node.isRoot) return;
    const cost = node.isUltimate ? node.cost : getUpgradeCost(node.id);
    if (getBlueCrystals() < cost) return;
    if (!this.canPurchase(node)) return;

    if (purchaseUpgrade(node.id)) {
        this.updateCrystalsDisplay();
        // Автоматически обновляем тултип, чтобы показать новый уровень и цену
        if (this.hoveredNode === node) {
            this.updateTooltip(this.tooltipFixedX, this.tooltipFixedY);
        }
    }
}

        resetTree() {
    this._showConfirmDialog(
        'Вы уверены? Все навыки будут сброшены, кристаллы возвращены!',
        () => {
            const refund = resetAllUpgrades();
            addBlueCrystals(refund);
            this.updateCrystalsDisplay();
        }
    );
}

    updateCrystalsDisplay() {
        const el = document.getElementById('treeCrystals');
        if (el) el.textContent = getBlueCrystals();
    }

    attachEvents() {
    // --- Мышь ---
    this._onMouseDown = (e) => {
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.cameraStart = { x: this.camera.x, y: this.camera.y };
    };
    this.canvas.addEventListener('mousedown', this._onMouseDown);

    this._onMouseMove = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        if (this.isPanning) {
            this.camera.targetX = this.cameraStart.x + (e.clientX - this.panStart.x) * scaleX;
            this.camera.targetY = this.cameraStart.y + (e.clientY - this.panStart.y) * scaleY;
            return;
        }

        this.hoveredNode = this.getNodeAt(mouseX, mouseY);
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
        if (this.selectedNode !== this.hoveredNode) {
            this.selectedNode = null;
            this.tooltipFixed = false;
        }
        this.updateTooltip(mouseX, mouseY);
    };
    this.canvas.addEventListener('mousemove', this._onMouseMove);

    this._onMouseUp = (e) => {
        if (this.isPanning) {
            const dx = Math.abs(e.clientX - this.panStart.x);
            const dy = Math.abs(e.clientY - this.panStart.y);
            if (dx < 3 && dy < 3 && this.hoveredNode && this.tooltip.canBuy) {
                this.selectedNode = this.hoveredNode;
                this.tooltipFixed = true;
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;
                this.updateTooltip(mouseX, mouseY);
                this.purchaseNode(this.hoveredNode);
            }
        }
        this.isPanning = false;
    };
    this.canvas.addEventListener('mouseup', this._onMouseUp);

    this._onWheel = (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        this.camera.targetZoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, this.camera.targetZoom * factor));
    };
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });

    // --- Тач ---
    this._onTouchStart = (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.isPanning = true;
            this.hasMoved = false;
            const touch = e.touches[0];
            this.panStart = { x: touch.clientX, y: touch.clientY };
            this.tapStartPos = { x: touch.clientX, y: touch.clientY };
            this.tapStartTime = Date.now();
            this.cameraStart = { x: this.camera.x, y: this.camera.y };
        }
    };
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });

    this._onTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length === 1 && this.isPanning) {
            this.hasMoved = true;
            this.tooltip.show = false;
            this.selectedNode = null;
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.camera.targetX = this.cameraStart.x + (touch.clientX - this.panStart.x) * scaleX;
            this.camera.targetY = this.cameraStart.y + (touch.clientY - this.panStart.y) * scaleY;
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            if (this.lastPinchDist > 0) {
                const scale = dist / this.lastPinchDist;
                this.camera.targetZoom = Math.max(
                    this.camera.minZoom,
                    Math.min(this.camera.maxZoom, this.pinchStartZoom * scale)
                );
            }
        }
    };
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });

    this._onTouchEnd = (e) => {
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const dt = Date.now() - this.tapStartTime;
            const dx = touch.clientX - this.tapStartPos.x;
            const dy = touch.clientY - this.tapStartPos.y;
            const dist = Math.hypot(dx, dy);
            if (!this.hasMoved && dist < 5 && dt < 300) {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const tapX = (touch.clientX - rect.left) * scaleX;
                const tapY = (touch.clientY - rect.top) * scaleY;
                // Проверка попадания в кнопку «КУПИТЬ» в тултипе – логика остаётся
                if (this.tooltip.show && this.tooltip.canBuy && this.tooltip.btnW > 0) {
                    const { btnX, btnY, btnW, btnH } = this.tooltip;
                    if (tapX >= btnX && tapX <= btnX + btnW && tapY >= btnY && tapY <= btnY + btnH) {
                        if (this.hoveredNode) {
                            this.purchaseNode(this.hoveredNode);
                            this.updateTooltip(this.tooltipFixedX, this.tooltipFixedY);
                        }
                        this.isPanning = false;
                        this.hasMoved = false;
                        this.lastPinchDist = 0;
                        return;
                    }
                }
                const tappedNode = this.getNodeAt(tapX, tapY);
                if (tappedNode && !tappedNode.isRoot) {
                    this.hoveredNode = tappedNode;
                    this.updateTooltip(tapX, tapY);
                    if (this.selectedNode === tappedNode && this.tooltip.show) {
                        this.tooltip.show = false;
                        this.selectedNode = null;
                        this.tooltipFixed = false;
                    } else {
                        this.selectedNode = tappedNode;
                    }
                } else {
                    this.tooltip.show = false;
                    this.selectedNode = null;
                }
            }
        }
        this.isPanning = false;
        this.hasMoved = false;
        this.lastPinchDist = 0;
    };
    this.canvas.addEventListener('touchend', this._onTouchEnd);
}

    updateTooltip(mouseX, mouseY) {
    this.tooltip.show = false;
    if (!this.hoveredNode || this.hoveredNode.isRoot) return;

    const node = this.hoveredNode;
    const branch = SKILL_TREE.branches.find(b =>
        b.nodes.includes(node) || b.ultimate.id === node.id || (b.altUltimate && b.altUltimate.id === node.id)
    );

    // Определяем, показываем ли мы тултип для того же узла, что и раньше
    const sameNode = (this.selectedNode === node);

    // Координаты: если тултип уже зафиксирован для этого узла, не меняем их
    if (!sameNode || !this.tooltipFixed) {
        this.tooltip.x = mouseX + 20;
        this.tooltip.y = mouseY - 40;
        this.tooltipFixedX = this.tooltip.x;
        this.tooltipFixedY = this.tooltip.y;
        this.tooltipFixed = true;
    } else {
        this.tooltip.x = this.tooltipFixedX;
        this.tooltip.y = this.tooltipFixedY;
    }

    // Текст тултипа
    if (node.isUltimate) {
        const isMaxed = this.getNodeLevel(node) >= (node.maxLevel || 1);
        const canBuy = !isMaxed && this.canPurchase(node) && getBlueCrystals() >= node.cost;
        this.tooltip.text = `${node.icon} ${node.name}\n${node.desc}\nФинальная цель ветки «${branch?.name || ''}»`;
        this.tooltip.cost = node.cost;
        this.tooltip.canBuy = canBuy;
    } else {
        const lvl = this.getNodeLevel(node);
        const maxLvl = node.maxLevel || 10;
        const cost = getUpgradeCost(node.id);
        const canBuy = this.canPurchase(node) && lvl < maxLvl && getBlueCrystals() >= cost;
        this.tooltip.text = `${node.icon} ${node.name}\n${node.desc}\nУр. ${lvl}/${maxLvl}`;
        this.tooltip.cost = cost;
        this.tooltip.canBuy = canBuy;
    }
    this.tooltip.show = true;
}

    update(delta) {
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;
        this.camera.x += (this.camera.targetX - this.camera.x) * 0.1;
        this.camera.y += (this.camera.targetY - this.camera.y) * 0.1;
        this.time += delta;

        this.stars.forEach(star => {
            star.x += star.size * 0.3 * delta;
            if (star.x > 1500) star.x = -1500;
        });
    }

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(this.camera.x, this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);

        this.drawBackground(ctx);
        this.drawConnections(ctx);

        this.branchLabels.forEach(label => {
            ctx.save();
            ctx.font = '14px "Press Start 2P"';
            ctx.fillStyle = label.color;
            ctx.textAlign = 'center';
            ctx.shadowColor = label.color;
            ctx.shadowBlur = 8;
            ctx.fillText(label.text, label.x, label.y);
            ctx.restore();
        });

        const rootPos = this.nodePositions['root'];
        if (rootPos) this.drawNode(ctx, rootPos.x, rootPos.y, SKILL_TREE.root, true, '#ffd966');

        SKILL_TREE.branches.forEach(branch => {
            branch.nodes.forEach(node => {
                const pos = this.nodePositions[node.id];
                if (pos) this.drawNode(ctx, pos.x, pos.y, node, false, branch.color);
            });
            const ultPos = this.nodePositions[branch.ultimate.id];
            if (ultPos) this.drawNode(ctx, ultPos.x, ultPos.y, { ...branch.ultimate, isUltimate: true }, false, '#ffd700', true);
            if (branch.altUltimate) {
                const altPos = this.nodePositions[branch.altUltimate.id];
                if (altPos) this.drawNode(ctx, altPos.x, altPos.y, { ...branch.altUltimate, isUltimate: true, isAlt: true }, false, '#ffd700', true);
            }
        });

        ctx.restore();

        if (this.tooltip.show) this.drawTooltip(ctx);
    }

    drawBackground(ctx) {
        const grad = ctx.createRadialGradient(0, 0, 100, 0, 0, 1200);
        grad.addColorStop(0, '#1a1a3e');
        grad.addColorStop(0.7, '#0a0a1a');
        grad.addColorStop(1, '#020208');
        ctx.fillStyle = grad;
        ctx.fillRect(-1500, -1500, 3000, 3000);

        this.stars.forEach(star => {
            const alpha = star.baseAlpha * (0.6 + 0.4 * Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset));
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawConnections(ctx) {
        const rootPos = this.nodePositions['root'];
        if (!rootPos) return;

        SKILL_TREE.branches.forEach(branch => {
            const firstNode = branch.nodes[0];
            const firstPos = this.nodePositions[firstNode.id];
            if (firstPos) {
                this.drawCurve(ctx, rootPos.x, rootPos.y, firstPos.x, firstPos.y,
                    this.getNodeLevel(firstNode) > 0, branch.color);
            }

            for (let i = 0; i < branch.nodes.length - 1; i++) {
                const a = this.nodePositions[branch.nodes[i].id];
                const b = this.nodePositions[branch.nodes[i + 1].id];
                if (a && b) {
                    this.drawCurve(ctx, a.x, a.y, b.x, b.y,
                        this.getNodeLevel(branch.nodes[i + 1]) > 0, branch.color);
                }
            }

            const lastNode = branch.nodes[branch.nodes.length - 1];
            const lastPos = this.nodePositions[lastNode.id];
            if (lastPos) {
                const ultPos = this.nodePositions[branch.ultimate.id];
                if (ultPos) {
                    this.drawCurve(ctx, lastPos.x, lastPos.y, ultPos.x, ultPos.y,
                        this.getNodeLevel(branch.ultimate) > 0, '#ffd700', true);
                }
                if (branch.altUltimate) {
                    const altPos = this.nodePositions[branch.altUltimate.id];
                    if (altPos) {
                        this.drawCurve(ctx, lastPos.x, lastPos.y, altPos.x, altPos.y,
                            this.getNodeLevel(branch.altUltimate) > 0, '#ffd700', true);
                    }
                }
            }
        });
    }

    drawCurve(ctx, x1, y1, x2, y2, active, color, isUlt = false) {
        const dx = x2 - x1, dy = y2 - y1;
        const cp1x = x1 + dx * 0.4, cp1y = y1;
        const cp2x = x2 - dx * 0.4, cp2y = y2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);

        ctx.strokeStyle = active ? color : '#3a3a5c';
        ctx.lineWidth = isUlt ? 4 : (active ? 3 : 2);
        ctx.shadowColor = active ? color : 'transparent';
        ctx.shadowBlur = active ? 10 : 0;
        ctx.stroke();

        if (active) {
            const length = Math.hypot(dx, dy);
            const numDots = Math.max(2, Math.floor(length / 35));
            const phase = (this.time * 1.5) % 1;
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 4;
            for (let i = 0; i < numDots; i++) {
                const t = (i / numDots + phase) % 1;
                const px = Math.pow(1 - t, 3) * x1 + 3 * Math.pow(1 - t, 2) * t * cp1x + 3 * (1 - t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * x2;
                const py = Math.pow(1 - t, 3) * y1 + 3 * Math.pow(1 - t, 2) * t * cp1y + 3 * (1 - t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * y2;
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawNode(ctx, x, y, node, isRoot, color, isUlt = false) {
        const level = this.getNodeLevel(node);
        const maxLevel = node.maxLevel || (isUlt ? 1 : 10);
        const isMaxed = level >= maxLevel;
        const isAvailable = !isRoot && !isMaxed && this.canPurchase(node);
        const isHovered = this.hoveredNode === node || (this.hoveredNode?.id === node.id);
        const radius = isRoot ? 38 : (isUlt ? 35 : 28);

        ctx.save();
        ctx.translate(x, y);

        if (!isRoot && !isUlt) {
            const progress = level / maxLevel;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = '#1a1a3a';
            ctx.lineWidth = 3;
            ctx.stroke();
            if (progress > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, radius + 6, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowColor = 'transparent';
            }
        }

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, isMaxed ? '#1e3a1e' : '#1a1a2e');
        gradient.addColorStop(1, '#0a0a0a');
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = isRoot ? '#ffd966' :
                          isHovered ? '#ffffff' :
                          isMaxed ? color :
                          isAvailable ? color : '#4a6fa5';
        ctx.lineWidth = isUlt ? 4 : 3;
        if (isHovered) {
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
        }
        ctx.stroke();
        ctx.shadowColor = 'transparent';

        ctx.font = `${isRoot ? 28 : isUlt ? 24 : 20}px "Press Start 2P"`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillText(node.icon, 0, -2);
        ctx.shadowColor = 'transparent';

        if (isUlt) {
            ctx.font = '8px "Press Start 2P"';
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            ctx.fillText(node.name, 0, radius + 14);
        }

        ctx.restore();
    }

    drawTooltip(ctx) {
    const { x, y, text, cost, canBuy } = this.tooltip;
    const lines = text.split('\n');
    
    ctx.save();
    // Определяем размер шрифта в зависимости от типа устройства (портрет = мобильный)
    const isPortrait = this.canvas.height > this.canvas.width;
    const fontSize = isPortrait ? 10 : 14;
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    
    const lineHeight = fontSize + 8;
    const paddingX = 14;
    const paddingTop = 14;
    const paddingBottom = 10;
    const priceHeight = 25;
    
    // Максимальная ширина тултипа (ограничим 70% ширины канваса)
    const maxTooltipWidth = this.canvas.width * 0.7;
    
    // Разбиваем длинные строки на подстроки, помещающиеся в maxTooltipWidth
    const wrappedLines = [];
    lines.forEach(line => {
        const words = line.split(' ');
        let currentLine = '';
        words.forEach(word => {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxTooltipWidth - paddingX*2 && currentLine) {
                wrappedLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) wrappedLines.push(currentLine);
    });
    
    // Считаем ширину по самой длинной строке (с учётом цены)
    let maxTextWidth = 0;
    wrappedLines.forEach(line => {
        const w = ctx.measureText(line).width;
        if (w > maxTextWidth) maxTextWidth = w;
    });
    const priceText = `Цена: ${cost} 💎`;
    const priceWidth = ctx.measureText(priceText).width;
    maxTextWidth = Math.max(maxTextWidth, priceWidth);
    
    const boxWidth = Math.min(maxTextWidth + paddingX*2, maxTooltipWidth);
    
    // Высота окна
    const hasButton = canBuy;
    const buttonAreaHeight = hasButton ? 42 : 0;
    const boxHeight = wrappedLines.length * lineHeight + paddingTop + paddingBottom + priceHeight + buttonAreaHeight;
    
    // Располагаем окно так, чтобы не вылезло за экран
    let drawX, drawY;
if (this.tooltipFixed) {
    // используем сохранённые координаты без коррекции границ
    drawX = this.tooltipFixedX;
    drawY = this.tooltipFixedY;
} else {
    drawX = x;
    drawY = y;
    // корректируем, чтобы не вылезал за экран
    if (drawX + boxWidth > this.canvas.width) drawX = this.canvas.width - boxWidth - 8;
    if (drawY + boxHeight > this.canvas.height) drawY = this.canvas.height - boxHeight - 8;
    if (drawX < 8) drawX = 8;
    if (drawY < 8) drawY = 8;
}
    
    // Сохраняем реальные координаты, чтобы кнопка правильно обрабатывала клики
    this.tooltip.drawX = drawX;
    this.tooltip.drawY = drawY;
    this.tooltip.boxWidth = boxWidth;
    this.tooltip.boxHeight = boxHeight;
    
    // Фон
    ctx.fillStyle = '#000000';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(drawX, drawY, boxWidth, boxHeight);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    const bgGrad = ctx.createLinearGradient(drawX, drawY, drawX, drawY + boxHeight);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(drawX + 2, drawY + 2, boxWidth - 4, boxHeight - 4);
    
    // Рамка
    ctx.strokeStyle = '#ffd966';
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX + 1, drawY + 1, boxWidth - 2, boxHeight - 2);
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.strokeRect(drawX + 3, drawY + 3, boxWidth - 6, boxHeight - 6);
    
    // Текст
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    wrappedLines.forEach((line, i) => {
        ctx.fillText(line, drawX + paddingX, drawY + paddingTop + i * lineHeight);
    });
    
    // Разделитель
    const dividerY = drawY + paddingTop + wrappedLines.length * lineHeight + 4;
    ctx.strokeStyle = '#ffd966';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(drawX + paddingX, dividerY);
    ctx.lineTo(drawX + boxWidth - paddingX, dividerY);
    ctx.stroke();
    
    // Цена
    const priceY = dividerY + 18;
    ctx.fillStyle = canBuy ? '#ffd966' : '#888888';
    ctx.shadowBlur = canBuy ? 5 : 0;
    ctx.fillText(priceText, drawX + paddingX, priceY);
    
    // Кнопка «КУПИТЬ»
    if (hasButton) {
        const btnW = boxWidth - paddingX*2 - 4;
        const btnH = 30;
        const btnX = drawX + paddingX + 2;
        const btnY = priceY + 10;
        
        ctx.fillStyle = '#f3c26b';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#ffd966';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.font = `${fontSize-2}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('КУПИТЬ', btnX + btnW/2, btnY + btnH/2);
        
        // Сохраняем координаты кнопки для обработки кликов
        this.tooltip.btnX = btnX;
        this.tooltip.btnY = btnY;
        this.tooltip.btnW = btnW;
        this.tooltip.btnH = btnH;
    } else {
        this.tooltip.btnX = this.tooltip.btnY = this.tooltip.btnW = this.tooltip.btnH = 0;
    }
    
    ctx.restore();
}

    destroy() {
    if (this.container) {
        this.container.remove();
        this.container = null;
    }
    // Удаляем все обработчики с канваса
    if (this._onMouseDown) this.canvas.removeEventListener('mousedown', this._onMouseDown);
    if (this._onMouseMove) this.canvas.removeEventListener('mousemove', this._onMouseMove);
    if (this._onMouseUp) this.canvas.removeEventListener('mouseup', this._onMouseUp);
    if (this._onWheel) this.canvas.removeEventListener('wheel', this._onWheel);
    if (this._onTouchStart) this.canvas.removeEventListener('touchstart', this._onTouchStart);
    if (this._onTouchMove) this.canvas.removeEventListener('touchmove', this._onTouchMove);
    if (this._onTouchEnd) this.canvas.removeEventListener('touchend', this._onTouchEnd);
    // Обнуляем ссылки
    this._onMouseDown = null;
    this._onMouseMove = null;
    this._onMouseUp = null;
    this._onWheel = null;
    this._onTouchStart = null;
    this._onTouchMove = null;
    this._onTouchEnd = null;
}
    _showConfirmDialog(message, onConfirm) {
        const old = document.getElementById('confirmDialog');
        if (old) old.remove();
        const dialog = document.createElement('div');
        dialog.id = 'confirmDialog';
        dialog.style.cssText = `
            position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
            background:rgba(0,0,0,0.95); border:3px solid #e17055; padding:24px;
            z-index:130; font-family:'Press Start 2P',monospace; color:white;
            font-size:11px; text-align:center; max-width:360px;
        `;
        dialog.innerHTML = `
            <p style="margin-bottom:16px;">${message}</p>
            <button id="confirmYesBtn" style="
                padding:8px 16px; background:#d63031; border:none;
                font-family:inherit; font-size:12px; cursor:pointer; color:white; margin:4px;
            ">ДА</button>
            <button id="confirmNoBtn" style="
                padding:8px 16px; background:#636e72; border:none;
                font-family:inherit; font-size:12px; cursor:pointer; color:white; margin:4px;
            ">НЕТ</button>`;
        document.getElementById('gameContainer').appendChild(dialog);
        document.getElementById('confirmYesBtn').addEventListener('click', () => {
            dialog.remove();
            onConfirm();
        });
        document.getElementById('confirmNoBtn').addEventListener('click', () => dialog.remove());
    }

    
    handleResize() {
        this.calculateNodePositions();
    }
}