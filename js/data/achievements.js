// js/data/achievements.js

// ============= СПИСОК ДОСТИЖЕНИЙ =============
const ACHIEVEMENTS_LIST = [
  // ---------- обычные ----------
  {
    id: 'first_blood',
    name_ru: 'Первая кровь',
    name_en: 'First Blood',
    desc_ru: 'Убить 100 врагов за один забег.',
    desc_en: 'Kill 100 enemies in one run.',
    icon: '⚔️',
    condition: { type: 'run', stat: 'totalKills', target: 100 },
    reward: 10,
    hidden: false
  },
  {
    id: 'survivor',
    name_ru: 'Выживший',
    name_en: 'Survivor',
    desc_ru: 'Продержаться 10 минут в одном забеге.',
    desc_en: 'Survive 10 minutes in one run.',
    icon: '⏳',
    condition: { type: 'run', stat: 'elapsedTime', target: 600 }, // секунды
    reward: 20,
    hidden: false
  },
  {
    id: 'level_master',
    name_ru: 'Мастер уровней',
    name_en: 'Level Master',
    desc_ru: 'Достигнуть 20-го уровня за забег.',
    desc_en: 'Reach level 20 in one run.',
    icon: '⭐',
    condition: { type: 'run', stat: 'playerLevel', target: 20 },
    reward: 15,
    hidden: false
  },
  {
    id: 'heavy_hitter',
    name_ru: 'Тяжёлый удар',
    name_en: 'Heavy Hitter',
    desc_ru: 'Нанести 5000 урона за один забег.',
    desc_en: 'Deal 5000 damage in one run.',
    icon: '💥',
    condition: { type: 'run', stat: 'totalDamageDealt', target: 5000 },
    reward: 15,
    hidden: false
  },
  {
    id: 'boss_slayer',
    name_ru: 'Истребитель боссов',
    name_en: 'Boss Slayer',
    desc_ru: 'Победить финального босса.',
    desc_en: 'Defeat the final boss.',
    icon: '👹',
    condition: { type: 'run', stat: 'bossDefeated', target: 1 }, // будем выставлять в GameScene
    reward: 25,
    hidden: false
  },

  {
    id: 'rich',
    name_ru: 'Богач',
    name_en: 'Rich',
    desc_ru: 'Накопить 1000 синих кристаллов (всего).',
    desc_en: 'Accumulate 1000 blue crystals (total).',
    icon: '💎',
    condition: { type: 'global', stat: 'totalCrystals', target: 1000 },
    reward: 50,
    hidden: false
  },
  {
    id: 'arms_race',
    name_ru: 'Гонка вооружений',
    name_en: 'Arms Race',
    desc_ru: 'Заполнить все слоты оружия (3 шт.) и предметов (3 шт.) в одном забеге.',
    desc_en: 'Fill all weapon (3) and item (3) slots in one run.',
    icon: '🔫',
    condition: { type: 'run', stat: 'fullLoadout', target: 1 },
    reward: 20,
    hidden: false
  },
  {
    id: 'evolution',
    name_ru: 'Эволюция',
    name_en: 'Evolution',
    desc_ru: 'Эволюционировать любое оружие.',
    desc_en: 'Evolve any weapon.',
    icon: '✨',
    condition: { type: 'run', stat: 'evolvedWeapon', target: 1 },
    reward: 20,
    hidden: false
  },
  {
    id: 'pacifist',
    name_ru: 'Пацифист',
    name_en: 'Pacifist',
    desc_ru: 'Пройти забег, не получив ни единого урона.',
    desc_en: 'Complete a run without taking any damage.',
    icon: '🕊️',
    condition: { type: 'run', stat: 'totalDamageTaken', target: 0, comparison: 'equal' },
    reward: 40,
    hidden: false
  },

  // ---------- скрытые ----------
  {
    id: 'bloodbath',
    name_ru: 'Кровавая баня',
    name_en: 'Bloodbath',
    desc_ru: 'Нанести 20000 урона за один забег.',
    desc_en: 'Deal 20000 damage in one run.',
    icon: '🩸',
    condition: { type: 'run', stat: 'totalDamageDealt', target: 20000 },
    reward: 40,
    hidden: true
  },
  {
    id: 'undying',
    name_ru: 'Бессмертный',
    name_en: 'Undying',
    desc_ru: 'Воспользоваться воскрешением и победить.',
    desc_en: 'Use revive and win.',
    icon: '💀',
    condition: { type: 'run', stat: 'usedRevive', target: 1 },
    reward: 30,
    hidden: true
  },
  {
    id: 'turned',
    name_ru: 'Это... живое?',
    name_en: 'It’s... alive?',
    desc_ru: 'Обратить врага с помощью Святой ауры.',
    desc_en: 'Convert an enemy using Holy Aura.',
    icon: '🌀',
    condition: { type: 'run', stat: 'convertedEnemy', target: 1 },
    reward: 25,
    hidden: true
  },
  {
    id: 'lightning_rod',
    name_ru: 'Громоотвод',
    name_en: 'Lightning Rod',
    desc_ru: 'Поразить цепной молнией 20 врагов за одно применение.',
    desc_en: 'Chain lightning hits 20 enemies in one cast.',
    icon: '🌩️',
    condition: { type: 'run', stat: 'maxChain', target: 20 },
    reward: 35,
    hidden: true
  }
];

// ============= ХРАНЕНИЕ =============
const STORAGE_KEY = 'ps_achievements';

export function loadAchievements() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveAchievements(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // синхронизация с облаком (если доступно)
  if (window.game?.sdk?.isReady) {
    window.game.sdk.saveCloud({ achievements: data }).catch(() => {});
  }
}

// ============= ПОЛУЧЕНИЕ РАЗБЛОКИРОВАННЫХ =============
export function getUnlockedAchievements() {
  return loadAchievements();
}

// ============= ПРОВЕРКА ДОСТИЖЕНИЙ ПОСЛЕ ЗАБЕГА =============
export function checkRunAchievements(runStats, addCrystalsCallback) {
  const unlocked = loadAchievements();
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS_LIST) {
    if (unlocked[ach.id]) continue;
    if (ach.condition.type !== 'run') continue;

    const statValue = runStats[ach.condition.stat];
    if (statValue === undefined) continue;

    let passed = false;
    if (ach.condition.comparison === 'less') {
      passed = statValue <= ach.condition.target;
    } else if (ach.condition.comparison === 'equal') {
      passed = statValue === ach.condition.target;
    } else {
      // по умолчанию >=
      passed = statValue >= ach.condition.target;
    }

    if (passed) {
      unlocked[ach.id] = Date.now();
      newlyUnlocked.push(ach);
      if (addCrystalsCallback) addCrystalsCallback(ach.reward);
    }
  }

  if (newlyUnlocked.length) {
    saveAchievements(unlocked);
  }
  return newlyUnlocked;
}

// ============= ПРОВЕРКА ГЛОБАЛЬНЫХ ДОСТИЖЕНИЙ =============
// Вызывается, например, при каждом увеличении общего количества кристаллов
export function checkGlobalAchievement(id, currentValue, addCrystalsCallback) {
  const unlocked = loadAchievements();
  if (unlocked[id]) return false;

  const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
  if (!ach || ach.condition.type !== 'global') return false;

  let passed = false;
  if (ach.condition.comparison === 'less') {
    passed = currentValue <= ach.condition.target;
  } else if (ach.condition.comparison === 'equal') {
    passed = currentValue === ach.condition.target;
  } else {
    passed = currentValue >= ach.condition.target;
  }

  if (passed) {
    unlocked[ach.id] = Date.now();
    saveAchievements(unlocked);
    if (addCrystalsCallback) addCrystalsCallback(ach.reward);
    return true;
  }
  return false;
}

// ============= ДЛЯ ОТПРАВКИ В SDK =============
export function getAchievementsForSDK() {
  const unlocked = loadAchievements();
  return ACHIEVEMENTS_LIST.map(a => ({
    id: a.id,
    name: a.name_ru,
    unlocked: !!unlocked[a.id]
  }));
}

// ============= ВСПОМОГАТЕЛЬНОЕ =============
export function getAchievementById(id) {
  return ACHIEVEMENTS_LIST.find(a => a.id === id);
}

export function getAllAchievements() {
  return ACHIEVEMENTS_LIST.map(a => ({ ...a }));
}