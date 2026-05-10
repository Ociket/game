// js/modes/DailyChallenge.js
function hashDate() {
    const d = new Date().toISOString().slice(0, 10);
    let h = 0;
    for (let i = 0; i < d.length; i++) h = ((h << 5) - h + d.charCodeAt(i)) | 0;
    return Math.abs(h) + Date.parse(d);
}

function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

export function getDailyConfig() {
    const seed = hashDate();
    const rng = seededRandom(seed);
    const weapons = ['Sword','Staff','Aura','Bone','Daggers','Lightning','Bow','Skulls'];
    const items = ['heart','shield','boots','magnet','amplifier','elixir','clover','hourglass'];

    // 🎲 Рандом 1-3 оружия
    const shuffledW = [...weapons].sort(() => rng() - 0.5);
    const wCount = 1 + Math.floor(rng() * 3); // 1, 2 или 3
    const dailyWeapons = shuffledW.slice(0, wCount);

    // 🎲 Рандом 1-3 предметов
    const shuffledI = [...items].sort(() => rng() - 0.5);
    const iCount = 1 + Math.floor(rng() * 3); // 1, 2 или 3
    const dailyItems = shuffledI.slice(0, iCount);

    return {
        id: new Date().toISOString().slice(0, 10),
        mode: 'daily',
        loadout: { weapons: dailyWeapons, items: dailyItems },
        modifiers: { spawnIntervalMult: 0.85, enemyHpMult: 1.15, xpMult: 1.3, chestsDisabled: true },
        reward: 60
    };
}

export function isDailyCompleted() {
    return localStorage.getItem('pixelSurvivors_lastDaily') === getDailyConfig().id;
}

export function markDailyCompleted() {
    localStorage.setItem('pixelSurvivors_lastDaily', getDailyConfig().id);
}