// js/modes/DifficultyConfig.js
export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: '🍼 Лёгкая прогулка',
    color: '#6ab04c',
    desc: 'Враги почти не кусаются. Идеально для кофе с печенькой ☕',
    modifiers: {
      enemyHpMult: 0.7,
      enemyDmgMult: 0.8,
      xpMult: 1.2,
      spawnIntervalMult: 1.2,
      eliteChanceMult: 0.5,
      crystalBonus: 0.8
    },
    unlockReq: null
  },
  normal: {
    id: 'normal',
    name: '⚔️ Нормальный замес',
    color: '#4a6fa5',
    desc: 'Как в детстве: страшно, но весело. Баланс для всех.',
    modifiers: {
      enemyHpMult: 1.0,
      enemyDmgMult: 1.0,
      xpMult: 1.0,
      spawnIntervalMult: 1.0,
      eliteChanceMult: 1.0,
      crystalBonus: 1.0
    },
    unlockReq: { wins: 'easy', count: 1 }
  },
  hard: {
    id: 'hard',
    name: '🔥 Адская кухня',
    color: '#e67e22',
    desc: 'Враги злые, ты злишься. Идеальный баланс боли и удовольствия.',
    modifiers: {
      enemyHpMult: 1.5,
      enemyDmgMult: 1.3,
      xpMult: 0.8,
      spawnIntervalMult: 0.75,
      eliteChanceMult: 1.5,
      crystalBonus: 1.2
    },
    unlockReq: { wins: 'normal', count: 1 }
  },
  insane: {
    id: 'insane',
    name: '💀 Мазохист-ран',
    color: '#c0392b',
    desc: 'Если после этого ты ещё улыбаешься — мы гордимся. Или вызовем врача.',
    modifiers: {
      enemyHpMult: 2.0,
      enemyDmgMult: 1.6,
      xpMult: 0.6,
      spawnIntervalMult: 0.5,
      eliteChanceMult: 2.0,
      crystalBonus: 1.5
    },
    unlockReq: { wins: 'hard', count: 1 }
  },
  apocalypse: {
    id: 'apocalypse',
    name: '🌋 Режим: БОГ',
    color: '#8e44ad',
    desc: 'Только для тех, кто прошёл всё остальное и хочет плакать. Награда: +50% кристаллов.',
    modifiers: {
      enemyHpMult: 3.0,
      enemyDmgMult: 2.0,
      xpMult: 0.4,
      spawnIntervalMult: 0.3,
      eliteChanceMult: 3.0,
      crystalBonus: 1.5
    },
    unlockReq: { wins: 'insane', count: 1 }
  }
};