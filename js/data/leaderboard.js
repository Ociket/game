// js/data/leaderboard.js
const STORAGE_KEY = 'ps_leaderboard';
const PLAYER_NAME_KEY = 'ps_playerName';

const BOT_NAMES = ['Destroyer', 'Cyborg_X', 'Slayer99', 'PixelLord', 'NoobMaster'];

function generateInitialBoard() {
    return BOT_NAMES.map((name, i) => ({
        name,
        kills: Math.floor(100 + Math.random() * 4900),
        isBot: true
    })).sort((a, b) => b.kills - a.kills);
}

export function loadLeaderboard() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try { return JSON.parse(raw); } catch (e) {}
    }
    const initial = generateInitialBoard();
    saveLeaderboard(initial);
    return initial;
}

function saveLeaderboard(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Синхронизируем таблицу с облаком
    if (window.game?.sdk?.isReady) {
        window.game.sdk.saveCloud({ leaderboard: data }).catch(() => {});
    }
}

export function getLeaderboard() {
    return loadLeaderboard();
}

export function submitScore(playerName, kills) {
    const board = loadLeaderboard();
    const existing = board.find(e => e.name === playerName && !e.isBot);
    if (existing) {
        if (kills > existing.kills) {
            existing.kills = kills;
        } else {
            return false;
        }
    } else {
        board.push({ name: playerName, kills, isBot: false });
    }
    board.sort((a, b) => b.kills - a.kills);
    if (board.length > 10) board.pop();
    saveLeaderboard(board);
    return true;
}

export function getPlayerName() {
    return localStorage.getItem(PLAYER_NAME_KEY) || 'Player';
}

// Теперь только для внутреннего использования (из initPlayerName)
function setPlayerName(name) {
    localStorage.setItem(PLAYER_NAME_KEY, name);
    if (window.game?.sdk?.isReady) {
        window.game.sdk.saveCloud({ playerName: name }).catch(() => {});
    }
}

// Вызывается один раз при старте игры
export async function initPlayerName() {
    const sdk = window.game?.sdk;
    if (sdk?.isReady && sdk.player) {
        try {
            const data = await sdk.player.getData(['publicName']);
            if (data && data.publicName) {
                setPlayerName(data.publicName);
                return data.publicName;
            }
        } catch (e) {
            console.warn('Не удалось получить имя из SDK:', e);
        }
    }
    // Fallback для локального тестирования
    return getPlayerName();
}

// Загрузка данных из облака
export async function loadFromCloud() {
    if (!window.game?.sdk?.isReady) return;
    try {
        const cloud = await window.game.sdk.loadCloud();
        if (cloud && cloud.leaderboard) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud.leaderboard));
        }
        if (cloud && cloud.playerName) {
            localStorage.setItem(PLAYER_NAME_KEY, cloud.playerName);
        }
    } catch (e) {
        console.warn('Cloud leaderboard load failed:', e);
    }
}