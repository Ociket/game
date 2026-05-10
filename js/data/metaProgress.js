import { DIFFICULTIES } from '../modes/DifficultyConfig.js';

// --- Константы и дефолтное состояние ---
const defaultUpgrades = {
  maxHpBonus: 0, speedBonus: 0, damageBonus: 0, attackSpeedBonus: 0,
  magnetRadius: 0, revive: 0, startExp: 0, critChance: 0,
  projectileResist: 0, extraItemSlot: 0, lifesteal: 0, eliteDamage: 0
};

let blueCrystals = 0;
let permanentUpgrades = { ...defaultUpgrades };

let unlockedCharacters = ['knight'];
let selectedCharacter = 'knight';

let diffUnlocks = { easy: true, normal: true, hard: false, insane: false, apocalypse: false };
let diffWins = { easy: 0, normal: 0, hard: 0, insane: 0, apocalypse: 0 };

// --- Локальное сохранение/загрузка ---
export function loadMetaProgress() {
  const savedCrystals = localStorage.getItem('pixelSurvivors_blueCrystals');
  if (savedCrystals) blueCrystals = parseInt(savedCrystals) || 0;

  const savedUpgrades = localStorage.getItem('pixelSurvivors_upgrades');
  if (savedUpgrades) {
    try {
      const parsed = JSON.parse(savedUpgrades);
      permanentUpgrades = { ...defaultUpgrades, ...parsed };
    } catch (e) { console.warn('Failed to parse upgrades:', e); }
  }
}

export function saveMetaProgress() {
  localStorage.setItem('pixelSurvivors_blueCrystals', blueCrystals);
  localStorage.setItem('pixelSurvivors_upgrades', JSON.stringify(permanentUpgrades));
  localStorage.setItem('ps_lastSaveTs', Date.now().toString());
  scheduleCloudSync();
}

// --- Кристаллы и апгрейды ---
export function getBlueCrystals() { return blueCrystals; }
import { checkGlobalAchievement } from './achievements.js'; // импорт

export function addBlueCrystals(amount) {
    blueCrystals += amount;
    saveMetaProgress();
    
    // Проверка глобальных достижений
    checkGlobalAchievement('rich', blueCrystals, (reward) => {
        // не обязательно добавлять ещё раз, так как основной счёт уже изменён,
        // но можем показать уведомление (только нужно иметь доступ к сцене)
        // Можно просто вывести alert или записать в отдельную очередь.
        // Пока оставим пустым.
    });
}

export function getUpgradeCost(upgradeId) {
  const current = permanentUpgrades[upgradeId] || 0;
  return 10 + current * 5;
}

export function purchaseUpgrade(upgradeId) {
  const cost = getUpgradeCost(upgradeId);
  if (blueCrystals >= cost) {
    blueCrystals -= cost;
    permanentUpgrades[upgradeId] = (permanentUpgrades[upgradeId] || 0) + 1;
    saveMetaProgress();
    return true;
  }
  return false;
}

export function getPermanentUpgrades() { return { ...permanentUpgrades }; }

export function resetAllUpgrades() {
  let refund = 0;
  for (const key of Object.keys(permanentUpgrades)) {
    const level = permanentUpgrades[key] || 0;
    for (let i = 0; i < level; i++) refund += 10 + i * 5;
    permanentUpgrades[key] = 0;
  }
  saveMetaProgress();
  return refund;
}

// --- Персонажи ---
export function loadUnlockedCharacters() {
  const saved = localStorage.getItem('pixelSurvivors_unlockedCharacters');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) unlockedCharacters = parsed;
    } catch (e) {}
  }
  if (!unlockedCharacters.includes('knight')) unlockedCharacters.push('knight');
}

export function saveUnlockedCharacters() {
  localStorage.setItem('pixelSurvivors_unlockedCharacters', JSON.stringify(unlockedCharacters));
}
export function getUnlockedCharacters() { return [...unlockedCharacters]; }
export function isCharacterUnlocked(id) { return unlockedCharacters.includes(id); }
export function unlockCharacter(id) {
  if (!unlockedCharacters.includes(id)) {
    unlockedCharacters.push(id);
    saveUnlockedCharacters();
    return true;
  }
  return false;
}
export function getSelectedCharacter() { return selectedCharacter; }
export function setSelectedCharacter(id) { selectedCharacter = id; }

// --- Сложности ---
export function isDifficultyUnlocked(id) { return !!diffUnlocks[id]; }
export function unlockDifficulty(id) {
  if (!diffUnlocks[id]) {
    diffUnlocks[id] = true;
    localStorage.setItem('ps_diffUnlocks', JSON.stringify(diffUnlocks));
  }
}
export function recordDifficultyWin(diffId) {
  diffWins[diffId] = (diffWins[diffId] || 0) + 1;
  localStorage.setItem('ps_diffWins', JSON.stringify(diffWins));
  const ids = ['easy', 'normal', 'hard', 'insane', 'apocalypse'];
  const idx = ids.indexOf(diffId);
  if (idx >= 0 && idx < ids.length - 1) {
    const nextId = ids[idx + 1];
    if (!diffUnlocks[nextId]) unlockDifficulty(nextId);
  }
}
export function getDifficultyWins(id) { return diffWins[id] || 0; }

// Инициализация дефолтов сложностей
(function initDifficultyDefaults() {
  const saved = localStorage.getItem('ps_diffUnlocks');
  if (!saved) localStorage.setItem('ps_diffUnlocks', JSON.stringify(diffUnlocks));
})();

// --- Облачная синхронизация ---
let cloudSyncTimeout = null;

function scheduleCloudSync() {
  if (!window.game?.sdk?.isReady) return;
  if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
  
  cloudSyncTimeout = setTimeout(async () => {
    const payload = {
      blueCrystals,
      permanentUpgrades,
      unlockedChars: unlockedCharacters,
      diffUnlocks,
      diffWins,
      timestamp: Date.now()
    };
    try {
      await window.game.sdk.saveCloud(payload);
    } catch (e) { console.warn('[Cloud] Sync error:', e); }
  }, 1500);
}

export async function initCloudSync() {
  if (!window.game?.sdk?.isReady) {
    console.log('[Cloud] SDK не готов, работаем локально.');
    return;
  }
  try {
    const cloud = await window.game.sdk.loadCloud();
    if (!cloud || !cloud.timestamp) return saveMetaProgress(); // Облако пустое → пушим локаль

    const localTs = parseInt(localStorage.getItem('ps_lastSaveTs') || '0');
    if (cloud.timestamp > localTs) {
      mergeCloudData(cloud);
      console.log('[Cloud] Применены данные из облака (новее локальных)');
    } else {
      saveMetaProgress();
      console.log('[Cloud] Локальные данные новее, отправляем в облако');
    }
  } catch (e) {
    console.warn('[Cloud] Init sync failed:', e);
  }
}

function mergeCloudData(data) {
  if (data.blueCrystals !== undefined) blueCrystals = data.blueCrystals;
  if (data.permanentUpgrades) permanentUpgrades = { ...defaultUpgrades, ...data.permanentUpgrades };
  
  if (Array.isArray(data.unlockedChars)) {
    const merged = [...new Set([...unlockedCharacters, ...data.unlockedChars])];
    unlockedCharacters = merged;
    saveUnlockedCharacters();
  }
  if (data.diffUnlocks) {
    Object.assign(diffUnlocks, data.diffUnlocks);
    localStorage.setItem('ps_diffUnlocks', JSON.stringify(diffUnlocks));
  }
  if (data.diffWins) {
    Object.assign(diffWins, data.diffWins);
    localStorage.setItem('ps_diffWins', JSON.stringify(diffWins));
  }
  
  localStorage.setItem('ps_lastSaveTs', data.timestamp.toString());
  localStorage.setItem('pixelSurvivors_blueCrystals', blueCrystals);
  localStorage.setItem('pixelSurvivors_upgrades', JSON.stringify(permanentUpgrades));
}