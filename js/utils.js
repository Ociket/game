// js/utils.js
export function distance(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
}

export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}