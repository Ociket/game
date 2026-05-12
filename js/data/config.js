// js/data/config.js
export const CONFIG = {
    world: { width: 3000, height: 3000 },
    player: { radius: 12, startHp: 20, speed: 180, invincibleFrames: 0.3, magnetRadius: 80 },
    weapons: {
        sword:     { damage: 5, cooldown: 0.40, range: 32 },
        staff:     { damage: 5, cooldown: 0.65, range: 340, speed: 450, explosionRadius: 40 },
        aura:      { damage: 1.8, cooldown: 0.45, radius: 60, knockback: 80 },
        bone:      { damage: 4, cooldown: 0.65, range: 280, speed: 400, pierce: true },
        daggers:   { damage: 3, cooldown: 0.30, range: 160, speed: 600, count: 2 },
        lightning: { damage: 5, cooldown: 1.20, range: 300, chain: 3, chainRange: 100 },
        bow: { damage: 6, cooldown: 0.9, range: 380, speed: 450, targeting: 'nearest' },
        skulls: { damage: 5, cooldown: 3.5, duration: 4.0, orbitRadius: 50, orbitSpeed: 2.5, count: 2, hitCost: 0.25 }
    },
    evolutions: {
    Sword: {
    requiredItem: 'heart',            // ← теперь требуется Яблоко
    requiredItemLevel: 5,
    evolvedWeapon: 'BloodSword',
    newConfig: { damage: 1.0, cooldown: 0, range: 0, healOnKill: 1 },
    desc_ru: 'Кровавый меч: шанс кровавого разреза, убийства исцеляют.',
    desc_en: 'Blood Sword: chance to cast a blood slash, kills heal.'
},
    Staff: {
        requiredItem: 'hourglass',
        requiredItemLevel: 5,
        evolvedWeapon: 'MagicStorm',
        newConfig: { damage: 6, cooldown: 0.6, range: 360, speed: 500, projectiles: 3, spread: 0.3 },
        desc_ru: 'Магическая буря: 3 снаряда веером + ледяная буря с уроном и замедлением.',
        desc_en: 'Magic Storm: 3 projectiles in a spread + ice storm with damage and slow.'
    },
    Aura: {
        requiredItem: 'shield',
        requiredItemLevel: 5,
        evolvedWeapon: 'HolyAura',
        newConfig: { damage: 4, cooldown: 0.35, radius: 90, healOnKill: 1 },
        desc_ru: 'Святая аура: +1 HP за убийство в радиусе, 1% шанс обратить врага в союзника.',
        desc_en: 'Holy Aura: +1 HP per kill in radius, 1% chance to convert an enemy into an ally.'
    },
    Bone: {
        requiredItem: 'clover',
        requiredItemLevel: 5,
        evolvedWeapon: 'BoneStorm',
        newConfig: { damage: 6, cooldown: 0.55, range: 300, speed: 450, projectiles: 2, critChance: 0.2, critMultiplier: 2 },
        desc_ru: 'Костяной шторм: 2 кости, 20% крит (x2), поджигает врагов.',
        desc_en: 'Bone Storm: 2 bones, 20% crit (x2), burns enemies.'
    },
    Daggers: {
        requiredItem: 'boots', requiredItemLevel: 5,
        evolvedWeapon: 'BloodDaggers',
        newConfig: { damage: 5, cooldown: 0.25, range: 180, speed: 650, count: 3, critChance: 0.25, critMultiplier: 2.5 },
        desc_ru: 'Кровавые кинжалы: 3 клинка, высочайший крит. шанс, крит вызывает кровотечение.',
        desc_en: 'Blood Daggers: 3 blades, high crit chance, crits cause bleeding.'
    },
    Lightning: {
        requiredItem: 'tome', requiredItemLevel: 5,
        evolvedWeapon: 'Storm',
        newConfig: { damage: 7, cooldown: 1.00, range: 350, chain: 5, chainRange: 130, bounce: true },
        desc_ru: 'Шторм: цепная молния на 5 целей, может бить одну цель дважды, шанс малых молний.',
        desc_en: 'Storm: chain lightning up to 5 targets, can hit same target twice, small lightning chance.'
    },
    Bow: {
        requiredItem: 'crystalRing', requiredItemLevel: 5,
        evolvedWeapon: 'MagicBow',
        newConfig: { damage: 9, cooldown: 0.8, range: 420, speed: 500, projectiles: 2, spread: 0.15, explode: true, explosionRadius: 35 },
        desc_ru: 'Магический лук: стрелы взрываются при попадании, самонаведение с половины пути.',
        desc_en: 'Magic Bow: arrows explode on hit, homing after 50% distance.'
    },
    Skulls: {
        requiredItem: 'elixir', requiredItemLevel: 5,
        evolvedWeapon: 'SoulSkulls',
        newConfig: { damage: 8, cooldown: 3.0, duration: 5.0, orbitRadius: 55, orbitSpeed: 3.0, count: 3, hitCost: 0.2, lifesteal: 0.05 },
        desc_ru: 'Черепа душ: больше черепов, дольше живут, лечат при убийстве врага.',
        desc_en: 'Soul Skulls: more skulls, longer duration, heals on kill.'
    }
},
    items: {
        heart:     { hpBonus: 10 },
        shield:    { armor: 2 },
        boots:     { speedBonus: 30 },
        magnet:    { magnetBonus: 50 },
        coin:      { expBonus: 0.4 },
        amplifier: { damageBonus: 0.5 },
        clover:    { luck: 0.15 },
        hourglass: { cooldownReduction: 0.15 },
        tome:      { experienceMultiplier: 0.25 },
        crystalRing: { killsForCrystal: 20 },
        elixir: { healAmount: 2, cooldown: 5.0 },
        claw:      { critChanceBonus: 0.25 },
        mirror:    { reflectChance: 0.1 },
        thornNecklace: { thorns: 0.2 }
    },
    characters: [
        {
            id: 'knight',
            name_ru: 'Рыцарь',
            name_en: 'Knight',
            desc_ru: '+2 брони, +15 HP. Стартовое оружие: Меч.',
            desc_en: '+2 armor, +15 HP. Starting weapon: Sword.',
            cost: 0,
            startWeapon: 'Sword',
            bonuses: { armor: 2, hpBonus: 15 }
        },
        {
            id: 'hunter',
            name_ru: 'Охотник',
            name_en: 'Hunter',
            desc_ru: '+30 скорости, -0.2 сек перезарядки. Стартовое оружие: Лук.',
            desc_en: '+30 speed, -0.2s cooldown. Starting weapon: Bow.',
            cost: 50,
            startWeapon: 'Bow',
            bonuses: { speed: 30, cooldownReduction: 0.2 }
        },
        {
            id: 'mage',
            name_ru: 'Маг',
            name_en: 'Mage',
            desc_ru: '+25% опыта, -10 HP. Стартовое оружие: Посох.',
            desc_en: '+25% XP, -10 HP. Starting weapon: Staff.',
            cost: 80,
            startWeapon: 'Staff',
            bonuses: { expMultiplier: 0.25, hpBonus: -10 }
        },
        {
            id: 'necromancer',
            name_ru: 'Некромант',
            name_en: 'Necromancer',
            desc_ru: '+5% вампиризма. Стартовое оружие: Черепа.',
            desc_en: '+5% lifesteal. Starting weapon: Skulls.',
            cost: 120,
            startWeapon: 'Skulls',
            bonuses: { lifesteal: 0.05 }
        },
        {
            id: 'assassin',
            name_ru: 'Ассасин',
            name_en: 'Assassin',
            desc_ru: '+10% крит. шанса. Стартовое оружие: Кинжалы.',
            desc_en: '+10% crit chance. Starting weapon: Daggers.',
            cost: 100,
            startWeapon: 'Daggers',
            bonuses: { critChance: 0.1 }
        },
        {
            id: 'monk',
            name_ru: 'Монах',
            name_en: 'Monk',
            desc_ru: '+20% радиуса подбора, +20 HP. Стартовое оружие: Аура.',
            desc_en: '+20% pickup radius, +20 HP. Starting weapon: Aura.',
            cost: 70,
            startWeapon: 'Aura',
            bonuses: { magnetRadius: 20, hpBonus: 20 }
        },
        {
            id: 'shaman',
            name_ru: 'Шаман',
            name_en: 'Shaman',
            desc_ru: '+15% урона, -10% скорости. Стартовое оружие: Молния.',
            desc_en: '+15% damage, -10% speed. Starting weapon: Lightning.',
            cost: 90,
            startWeapon: 'Lightning',
            bonuses: { damageBonus: 0.15, speedBonus: -10 }
        },
        {
            id: 'barbarian',
            name_ru: 'Варвар',
            name_en: 'Barbarian',
            desc_ru: '+10 урона, -20 HP. Стартовое оружие: Кость.',
            desc_en: '+10 damage, -20 HP. Starting weapon: Bone.',
            cost: 110,
            startWeapon: 'Bone',
            bonuses: { damageBonus: 10, hpBonus: -20 }
        }
    ],
    enemies: {
        types: {
            basic:   { hp: 8, speed: 80,  damage: 1, exp: 1, radius: 8,  color: '#e17055' },
            fast:    { hp: 8, speed: 150, damage: 1, exp: 1, radius: 6,  color: '#fdcb6e' },
            tank:    { hp: 25, speed: 50,  damage: 2, exp: 2, radius: 12, color: '#636e72' },
            shooter: { hp: 12, speed: 60,  damage: 1, exp: 2, radius: 8,  color: '#6c5ce7',
                       shootInterval: 2.0, bulletSpeed: 150, bulletDamage: 1 },
            bomber:  { hp: 8, speed: 110, damage: 4, exp: 2, radius: 7,  color: '#e74c3c',
                       explosionRadius: 60, explosionDamage: 6 },
            summoner:{ hp: 12, speed: 40,  damage: 1, exp: 3, radius: 12, color: '#9b59b6',
                       summonInterval: 5.0 }
        },
        maxEnemies: 500,
        spawnInterval: 0.4,
        eliteChance: 0.02,
        eliteChestChance: 0.4,
        eliteMultiplier: 5,
        blueCrystalsDrop: 1,
        enemyScaling: {
            hpPerWave: 0.5,
            damagePerWave: 0.4,
            speedPerWave: 0.04
        }
    },
    boss: { hp: 1000, speed: 35, damage: 8, exp: 30, radius: 22, blueCrystalsGiven: 5 },
    timer: { roundDuration: 900 },
    xp: { baseXpToLevel: 12, xpIncreasePerLevel: 8, orbRadius: 4 },
    chest: {
        optionsCount: 3,
        maxWeapons: 3,
        maxItems: 3
    },
    upgrades: {
        maxPerItem: 10,
        rarities: {
            common: { chance: 0.70, multiplier: 1.12 },
            uncommon:  { chance: 0.20, multiplier: 1.25 },
            epic:      { chance: 0.08, multiplier: 1.5 },
            legendary: { chance: 0.02, multiplier: 2 }
        }
    },
    locations: {
        sharedObjectTiles: {
            tree_single_1: 13, tree_single_2: 14, tree_single_3: 15, tree_pine: 16, tree_double: 30, cactus: 32,
            house_small: 47, house_big: 48,
            cave: 49, pyramid: 50, fence_h: 63, gravestone_1: 64, gravestone_2: 65, grave: 66,
            sign: 67, stairs_down: 83, lever_left: 101, lever_right: 84, log: 118, pot: 135, chest: 134,
            heart_empty: 127, heart_half: 128, heart_full: 129,
            house_big_wall_left: 92, house_big_wall_mid: 93, house_big_wall_right: 94,
            house_big_mid_left: 130, house_big_mid_mid: 131, house_big_mid_right: 132,
            house_big_roof_left: 113, house_big_roof_mid: 114, house_big_roof_right: 115,
            house_big_top_left: 96, house_big_top_mid: 97, house_big_top_right: 98,
            wall_small: 116, wall_small_alt: 79, roof_small: 78, roof_top: 80,
            door_closed: 117, window_shutters: 111, window_open: 112
        },
        sharedPathTiles: [85, 86, 102, 103, 87, 88, 89, 90, 91, 104, 105, 106],
        themes: [
            { id: 'bw', name: 'Чёрно-белый', grassTiles: [0, 17, 34, 51, 68] },
            { id: 'pink', name: 'Розовый сад', grassTiles: [0, 17, 34, 51, 68] },
            { id: 'green', name: 'Зелёный лес', grassTiles: [0, 17, 34, 51, 68] }
        ]
    }
};

export const LOCALE = {
    weapons: {
        Sword: { name_ru: 'Меч', name_en: 'Sword', desc_ru: 'Ближний бой. Рубит всех врагов вокруг.', desc_en: 'Melee. Slashes all enemies around.' },
        Staff: { name_ru: 'Посох', name_en: 'Staff', desc_ru: 'Стреляет магическим снарядом в ближайшего врага.', desc_en: 'Fires a magic projectile at the nearest enemy.' },
        Aura: { name_ru: 'Аура', name_en: 'Aura', desc_ru: 'Наносит урон всем врагам рядом с вами.', desc_en: 'Damages all enemies near you.' },
        Bone: { name_ru: 'Кость', name_en: 'Bone', desc_ru: 'Пронзает врагов, пробивая их насквозь.', desc_en: 'Pierces through enemies.' },
        Daggers: { name_ru: 'Кинжалы', name_en: 'Daggers', desc_ru: 'Быстрые клинки, бьют дважды.', desc_en: 'Fast blades, strike twice.' },
        Lightning: { name_ru: 'Молния', name_en: 'Lightning', desc_ru: 'Цепная молния между врагами.', desc_en: 'Chain lightning between enemies.' },
        Bow: { name_ru: 'Лук', name_en: 'Bow', desc_ru: 'Стреляет в случайном направлении.', desc_en: 'Shoots in a random direction.' },
        Skulls: { name_ru: 'Черепа', name_en: 'Skulls', desc_ru: 'Орбитальные черепа, жадно пожирающие врагов.', desc_en: 'Orbiting skulls that devour enemies.' }
    },
    items: {
        heart: { name_ru: 'Яблоко', name_en: 'Apple', desc_ru: 'Увеличивает максимальное здоровье.', desc_en: 'Increases max health.' },
        shield: { name_ru: 'Щит', name_en: 'Shield', desc_ru: 'Уменьшает получаемый урон.', desc_en: 'Reduces damage taken.' },
        boots: { name_ru: 'Ботинки', name_en: 'Boots', desc_ru: 'Увеличивает скорость передвижения.', desc_en: 'Increases movement speed.' },
        magnet: { name_ru: 'Магнитный кристалл', name_en: 'Magnet Crystal', desc_ru: 'Увеличивает радиус подбора опыта.', desc_en: 'Increases XP pickup radius.' },
        coin: { name_ru: 'Монета', name_en: 'Coin', desc_ru: 'Увеличивает получаемый опыт.', desc_en: 'Increases experience gain.' },
        amplifier: { name_ru: 'Перчатка силы', name_en: 'Power Glove', desc_ru: 'Увеличивает наносимый урон.', desc_en: 'Increases damage dealt.' },
        bandage: { name_ru: 'Целебное зелье', name_en: 'Healing Potion', desc_ru: 'Даёт регенерацию здоровья.', desc_en: 'Grants health regeneration.' },
        clover: { name_ru: 'Цветок удачи', name_en: 'Clover', desc_ru: 'Повышает шанс редких улучшений.', desc_en: 'Increases chance of rare upgrades.' },
        hourglass: { name_ru: 'Свеча концентрации', name_en: 'Candle of Focus', desc_ru: 'Уменьшает перезарядку оружия.', desc_en: 'Reduces weapon cooldown.' },
        tome: { name_ru: 'Древняя книга', name_en: 'Ancient Tome', desc_ru: 'Умножает получаемый опыт.', desc_en: 'Multiplies experience gained.' },
        crystalRing: { name_ru: 'Кольцо кристалла', name_en: 'Crystal Ring', desc_ru: 'За каждые 20 убийств даёт 1 синий кристалл.', desc_en: 'Grants 1 blue crystal per 20 kills.' },
        elixir: { name_ru: 'Эликсир', name_en: 'Elixir', desc_ru: 'Периодически восстанавливает здоровье.', desc_en: 'Periodically restores health.' },
        claw: { name_ru: 'Коготь', name_en: 'Claw', desc_ru: 'Увеличивает шанс критического удара.', desc_en: 'Increases critical hit chance.' },
        mirror: { name_ru: 'Зеркало', name_en: 'Mirror', desc_ru: 'Шанс отразить вражеский снаряд.', desc_en: 'Chance to reflect enemy projectiles.' },
        thornNecklace: { name_ru: 'Ожерелье шипов', name_en: 'Thorn Necklace', desc_ru: 'Возвращает часть урона атакующим врагам.', desc_en: 'Returns a portion of damage to attackers.' }
    },
    rarities: {
        common: 'Обычное',
        uncommon: 'Необычное',
        epic: 'Эпическое',
        legendary: 'Легендарное'
    }
};

export const LOCALE_STRINGS = {
    ru: {
        // Главное меню
        menuTitle: 'PIXEL SURVIVORS',
        start: '▶ Старт',
        upgrade: '📈 ПРОКАЧКА',
        settings: '⚙️ НАСТРОЙКИ',
        crystals: '💎 Синих кристаллов',

        // Выбор режима
        modeSelectTitle: 'ВЫБЕРИ РЕЖИМ',
        modeNormal: '🎮 Обычный',
        modeNormalDesc: 'Классика. Выбери сложность: от лёгкой прогулки до режима БОГ.',
        modeDaily: '📅 Ежедневный',
        modeDailyDesc: '⚡ Фиксированный лут, случайная сложность. Награда: 60 💎',
        modeDailyCompleted: '✅ Забег пройден. Возвращайся завтра за новыми испытаниями!',
        modeEndless: '♾️ Бесконечный',
        modeEndlessDesc: 'Сложность растёт каждые 2 минуты. Выживай как можно дольше!',
        backToMenu: '◀ НАЗАД В МЕНЮ',
        confirmResetPrompt: 'Вы действительно хотите сбросить ВЕСЬ прогресс? Это действие необратимо!',

        // Выбор сложности
        diffSelectTitle: 'ВЫБЕРИ СЛОЖНОСТЬ',
        diffHint: '(🎮 Обычный режим)',
        diffEasy: '🍼 Лёгкая прогулка',
        diffEasyDesc: 'Враги почти не кусаются. Идеально для кофе с печенькой ☕',
        diffNormal: '⚔️ Нормальный замес',
        diffNormalDesc: 'Как в детстве: страшно, но весело. Баланс для всех.',
        diffHard: '🔥 Адская кухня',
        diffHardDesc: 'Враги злые, ты злишься. Идеальный баланс боли и удовольствия.',
        diffInsane: '💀 Мазохист-ран',
        diffInsaneDesc: 'Если после этого ты ещё улыбаешься — мы гордимся. Или вызовем врача.',
        diffApocalypse: '🌋 Режим: БОГ',
        diffApocalypseDesc: 'Только для тех, кто прошёл всё остальное и хочет плакать. Награда: +50% кристаллов.',
        diffUnlocked: '✅ Доступно',
        diffLocked: '🔒 Требуется победа',
        diffWins: 'побед: ',

        // Выбор персонажа
        charSelectTitle: 'ВЫБЕРИ ГЕРОЯ',
        charUnlocked: '✅ Доступен',
        charLocked: '💎 ',
        charBonusDaily: '🎁 Бонус режима!',
        charCost: '💎 ',

        // Ежедневный забег
        dailyTitle: '📅 ЕЖЕДНЕВНЫЙ ЗАБЕГ',
        dailyDate: '🗓 Дата: ',
        dailyWeapon: '⚔️ Стартовое оружие:',
        dailyItems: '🛡 Стартовые предметы:',
        dailyReward: '🎁 Награда за победу: 60 💎',
        dailyChestsDisabled: 'Сундуки отключены. Удачи!',
        dailyStart: '▶ НАЧАТЬ ЗАБЕГ',
        dailyBack: '◀ К РЕЖИМАМ',

        // Игровой интерфейс
        pause: '⏸ ПАУЗА',
        resume: '▶ ПРОДОЛЖИТЬ',
        mainMenu: '🏠 ГЛАВНОЕ МЕНЮ',
        confirmTitle: 'ВЫ УВЕРЕНЫ?',
        confirmText: 'Прогресс не сохранится!',
        confirmYes: 'ДА',
        confirmNo: 'НЕТ',
        level: 'Ур.',

        // Окна победы/смерти
        victoryTitle: 'ПОБЕДА!',
        gameOverTitle: 'ТЫ ПОГИБ',
        results: 'Результаты забега:',
        resultsDamage: '⚔️ Общий урон: ',
        resultsKills: '💀 Убито врагов: ',
        resultsCrystals: '💎 Кристаллов за забег: ',
        resultsDamageTaken: '❤️‍🔥 Получено урона: ',
        resultsHealing: '💚 Исцелено: ',
        revive: '💎 ВОЗРОДИТЬСЯ (📺)',
        restart: '⚔️ ЗАНОВО',
        menu: '🏠 МЕНЮ',

        // Улучшения и сундуки
        levelUpTitle: 'ВЫБЕРИ УЛУЧШЕНИЕ',
        chestTitle: 'СУНДУК',
        chestSelect: 'Выбери награду',
        reroll: '🔄 РЕРОЛЛ',
        evolution: 'ЭВОЛЮЦИЯ',
        heal: '❤️ Лечение',
        xp: '⭐ Опыт',
        legendaryUpgrade: 'Легендарное улучшение',

        // Статистика в паузе
        statsHeader: 'ХАРАКТЕРИСТИКИ',
        statHP: '❤️ Здоровье: ',
        statDamage: '⚔️ Урон: +',
        statArmor: '🛡 Броня: ',
        statSpeed: '💨 Скорость: ',
        statMagnet: '🧲 Магнит: ',
        statLuck: '🍀 Удача: ',
        statCooldown: '🕒 Кулдаун: -',
        statExpMult: '📖 Множитель опыта: ',
        statRegen: '💚 Лечение: ',
        statCrystals: '💎 Кристаллы за забег: ',
        statWave: 'Уровень волны: ',

        // Дерево навыков
        skillTree: '🌟 ДРЕВО НАВЫКОВ',
        resetTree: '🔄 СБРОС',
        treeBack: '◀ НАЗАД',
        treeHelp: '🖱️ Колёсико – зум | Зажать и двигать – панорама',
        buy: 'КУПИТЬ',
        price: 'Цена: ',

        // Кнопки скорости
        speed1x: '1x',
        speed2x: '2x',
        speed3x: '3x',
        speed5x: '5x',

        // Дополнительные
        notEnoughCrystals: 'Недостаточно кристаллов!',
        adsOnlyYandex: 'Реклама доступна только в Yandex Games',
        back: 'НАЗАД',
        language: 'Язык',
        musicVolume: 'Громкость музыки',
        sfxVolume: 'Громкость звуков',
        particles: 'Частицы',
        graphics: 'Графика',
        low: 'Низкое',
        medium: 'Среднее',
        high: 'Высокое',
        infoEndless: '⚠️ Сложность растёт каждые 2 мин',
        infoDifficulty: '⚔️ Сложность: {diff}',
        dailyBonusInfo: '🎁 Бонус режима!',
        confirmReset: 'Вы уверены? Все навыки будут сброшены, кристаллы возвращены!',
        bossWarning: 'БОСС!',
        loading: 'Загрузка...',
        mapError: 'Ошибка загрузки карты',
        healDesc: 'Полное восстановление здоровья',
        xpDesc: '+5 опыта',
        crystalsDesc: '+3 кристалла',
        crystalsShort: 'Кристаллы',
        legendaryUpgradeDesc: 'Легендарное улучшение случайного предмета/оружия',
        resetProgress: 'СБРОС ПРОГРЕССА',
        tutorialTitle: 'ОБУЧЕНИЕ',
        tutorialSlide1: 'Используй WASD или джойстик для движения.',
        tutorialSlide2: 'Убивай врагов, собирай опыт и усиления.',
        tutorialSlide3: 'Каждый левел-ап даёт выбор улучшения оружия или предмета.',
        tutorialSlide4: 'Выживи 15 минут, чтобы сразиться с боссом!',
        achievementNew: '🏆 ДОСТИЖЕНИЕ!',
        weaponSelectTitle: 'ВЫБОР ОРУЖИЯ',
        upgradeDamage: 'урона',
        upgradeCooldown: 'перезарядка',
        upgradeRange: 'дальности',
        achievementsTitle: '🏆 ДОСТИЖЕНИЯ',
        leaderboardTitle: '🏆 Рекорды',
changeNameBtn: '✏️ Имя',         // кнопка смены имени
enterNamePrompt: 'Введите имя:',
leaderboardUnavailable: 'Таблица лидеров доступна только в Яндекс Играх',
        // Недостающие ключи
        achievementsBtn: '🏆 ДОСТИЖЕНИЯ',
        newItem: '🆕 Новое!',
tutorial_1: 'Управляй героем с помощью WASD или джойстика.',
tutorial_2: 'Убивай врагов и собирай опыт. Расти в уровнях.',
tutorial_3: 'Усиливай оружие и предметы… или ищи скрытые пути.',
tutorial_4: 'Выживай 15 минут, чтобы встретить босса.',
tutorial_start: '▶ В БОЙ',
    },
    en: {
        // Main menu
        menuTitle: 'PIXEL SURVIVORS',
        start: '▶ Start',
        upgrade: '📈 UPGRADE',
        settings: '⚙️ SETTINGS',
        crystals: '💎 Blue Crystals',

        // Mode selection
        modeSelectTitle: 'CHOOSE MODE',
        modeNormal: '🎮 Normal',
        modeNormalDesc: 'Classic. Choose difficulty: from easy walk to GOD mode.',
        modeDaily: '📅 Daily',
        modeDailyDesc: '⚡ Fixed loadout, random difficulty. Reward: 60 💎',
        modeDailyCompleted: '✅ Completed. Come back tomorrow for new challenges!',
        modeEndless: '♾️ Endless',
        modeEndlessDesc: 'Difficulty increases every 2 minutes. Survive as long as possible!',
        backToMenu: '◀ BACK TO MENU',

        // Difficulty selection
        diffSelectTitle: 'CHOOSE DIFFICULTY',
        diffHint: '(🎮 Normal Mode)',
        diffEasy: '🍼 Easy Walk',
        diffEasyDesc: 'Enemies barely bite. Perfect with cookies ☕',
        diffNormal: '⚔️ Normal Mess',
        diffNormalDesc: 'Like childhood: scary but fun. Balanced for all.',
        diffHard: '🔥 Hell Kitchen',
        diffHardDesc: 'Enemies are angry, you are angry. Perfect balance of pain and pleasure.',
        diffInsane: '💀 Masochist Run',
        diffInsaneDesc: 'If you smile after this – we are proud. Or we call a doctor.',
        diffApocalypse: '🌋 GOD Mode',
        diffApocalypseDesc: 'Only for those who finished everything else and want to cry. Reward: +50% crystals.',
        diffUnlocked: '✅ Available',
        diffLocked: '🔒 Win required',
        diffWins: 'wins: ',

        // Character selection
        charSelectTitle: 'CHOOSE HERO',
        charUnlocked: '✅ Available',
        charLocked: '💎 ',
        charBonusDaily: '🎁 Daily bonus!',
        charCost: '💎 ',

        // Daily challenge
        dailyTitle: '📅 DAILY CHALLENGE',
        dailyDate: '🗓 Date: ',
        dailyWeapon: '⚔️ Starting weapon:',
        dailyItems: '🛡 Starting items:',
        dailyReward: '🎁 Victory reward: 60 💎',
        dailyChestsDisabled: 'Chests disabled. Good luck!',
        dailyStart: '▶ START CHALLENGE',
        dailyBack: '◀ BACK TO MODES',

        // In-game UI
        pause: '⏸ PAUSE',
        resume: '▶ RESUME',
        mainMenu: '🏠 MAIN MENU',
        confirmTitle: 'ARE YOU SURE?',
        confirmText: 'Progress will be lost!',
        confirmYes: 'YES',
        confirmNo: 'NO',
        level: 'Lv.',

        // Victory/Game Over screens
        victoryTitle: 'VICTORY!',
        gameOverTitle: 'YOU DIED',
        results: 'Session results:',
        resultsDamage: '⚔️ Total damage: ',
        resultsKills: '💀 Enemies killed: ',
        resultsCrystals: '💎 Session crystals: ',
        resultsDamageTaken: '❤️‍🔥 Damage taken: ',
        resultsHealing: '💚 Healing received: ',
        revive: '💎 REVIVE (📺)',
        restart: '⚔️ RESTART',
        menu: '🏠 MENU',

        // Upgrades and chests
        levelUpTitle: 'CHOOSE UPGRADE',
        chestTitle: 'CHEST',
        chestSelect: 'Choose reward',
        reroll: '🔄 REROLL',
        evolution: 'EVOLUTION',
        heal: '❤️ Heal',
        xp: '⭐ XP',
        legendaryUpgrade: 'Legendary Upgrade',

        // Stats in pause
        statsHeader: 'STATS',
        statHP: '❤️ Health: ',
        statDamage: '⚔️ Damage: +',
        statArmor: '🛡 Armor: ',
        statSpeed: '💨 Speed: ',
        statMagnet: '🧲 Magnet: ',
        statLuck: '🍀 Luck: ',
        statCooldown: '🕒 Cooldown: -',
        statExpMult: '📖 XP Multiplier: ',
        statRegen: '💚 Regen: ',
        statCrystals: '💎 Session crystals: ',
        statWave: 'Wave level: ',

        // Skill tree
        skillTree: '🌟 SKILL TREE',
        resetTree: '🔄 RESET',
        treeBack: '◀ BACK',
        treeHelp: '🖱️ Scroll – zoom | Drag – pan',
        buy: 'BUY',
        price: 'Price: ',

        // Speed buttons
        speed1x: '1x',
        speed2x: '2x',
        speed3x: '3x',
        speed5x: '5x',

        // Additional
        notEnoughCrystals: 'Not enough crystals!',
        adsOnlyYandex: 'Ads only available in Yandex Games',
        back: 'BACK',
        language: 'Language',
        musicVolume: 'Music Volume',
        sfxVolume: 'SFX Volume',
        particles: 'Particles',
        graphics: 'Graphics',
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        infoEndless: '⚠️ Difficulty increases every 2 min',
        infoDifficulty: '⚔️ Difficulty: {diff}',
        dailyBonusInfo: '🎁 Daily bonus!',
        confirmReset: 'Are you sure? All skills will be reset, crystals refunded!',
        bossWarning: 'BOSS!',
        loading: 'Loading...',
        mapError: 'Map loading error',
        healDesc: 'Full heal',
        xpDesc: '+5 XP',
        crystalsDesc: '+3 crystals',
        crystalsShort: 'Crystals',
        legendaryUpgradeDesc: 'Legendary upgrade for a random item/weapon',
        resetProgress: 'RESET PROGRESS',
        tutorialTitle: 'TUTORIAL',
        tutorialSlide1: 'Use WASD or joystick to move.',
        tutorialSlide2: 'Kill enemies, collect XP and power-ups.',
        tutorialSlide3: 'Each level-up offers a choice to upgrade a weapon or item.',
        tutorialSlide4: 'Survive 15 minutes to face the boss!',
        achievementNew: '🏆 ACHIEVEMENT!',
        confirmResetPrompt: 'Are you sure you want to reset ALL progress? This cannot be undone!',
        weaponSelectTitle: 'WEAPON SELECT',
        upgradeDamage: 'damage',
        upgradeCooldown: 'cooldown',
        upgradeRange: 'range',
        achievementsTitle: '🏆 ACHIEVEMENTS',
        leaderboardTitle: '🏆 Leaderboard',
changeNameBtn: '✏️ Name',
enterNamePrompt: 'Enter name:',
leaderboardUnavailable: 'Leaderboard available only in Yandex Games',
        achievementsBtn: '🏆 ACHIEVEMENTS',
        newItem: '🆕 New!',
tutorial_1: 'Move with WASD or joystick.',
tutorial_2: 'Kill enemies, collect XP. Level up.',
tutorial_3: 'Upgrade weapons and items… or seek hidden paths.',
tutorial_4: 'Survive 15 minutes to face the boss.',
tutorial_start: '▶ FIGHT',
    }
};