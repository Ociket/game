// js/utils/UpgradeText.js

/**
 * Возвращает строку описания улучшения для оружия в зависимости от языка.
 * @param {string} stat - код улучшения ('damage', 'cooldown', 'range', 'projectiles' и т.д.)
 * @param {number|string} value - значение улучшения
 * @param {string} lang - язык ('ru' или 'en')
 * @returns {string} форматированная строка, например "+2 урона" или "+2 damage"
 */
export function formatUpgrade(stat, value, lang = 'ru') {
    // Приводим к числу, если передана строка
    const num = typeof value === 'number' ? value : parseFloat(value);

    // Локализованные строки для каждого типа улучшения
    const ru = {
        damage: v => `+${formatNumber(v)} урона`,
        cooldown: v => `${formatNumber(v)} сек перезарядки`, // v может быть отрицательным
        range: v => `+${formatNumber(v)} дальности`,
        projectiles: v => `+${formatNumber(v)} снарядов`,
        auraRadius: v => `+${formatNumber(v)} радиус ауры`,
        swingRadius: v => `+${formatNumber(v)} радиус взмаха`,
        swingDuration: v => `+${formatNumber(v)} длит. взмаха`,
        boneCount: v => `+${formatNumber(v)} костей`,
        critChance: v => `+${(v * 100).toFixed(0)}% крит`,
        boneRange: v => `+${formatNumber(v)} дальность`,
        arrowCount: v => `+${formatNumber(v)} стрел`,
        pierce: v => `+${formatNumber(v)} пробитие`,
        dotTicks: v => `+${formatNumber(v)} тиков яда`,
        dotDamage: v => `+${formatNumber(v)} урон яда`,
        daggerCount: v => `+${formatNumber(v)} кинжалов`,
        staffRange: v => `+${formatNumber(v)} дальность`,
        explosionRadius: v => `+${formatNumber(v)} радиус взрыва`,
        chainCount: v => `+${formatNumber(v)} цепей`,
        chainRange: v => `+${formatNumber(v)} радиус цепи`,
        skullCount: v => `+${formatNumber(v)} черепов`,
        orbitRadius: v => `+${formatNumber(v)} радиус орбиты`,
        orbitSpeed: v => `+${formatNumber(v)} скор. орбиты`,
        skullDuration: v => `+${formatNumber(v)} сек длительности`,
    };

    const en = {
        damage: v => `+${formatNumber(v)} damage`,
        cooldown: v => `${formatNumber(v)} sec cooldown`,
        range: v => `+${formatNumber(v)} range`,
        projectiles: v => `+${formatNumber(v)} projectiles`,
        auraRadius: v => `+${formatNumber(v)} aura radius`,
        swingRadius: v => `+${formatNumber(v)} swing radius`,
        swingDuration: v => `+${formatNumber(v)} swing duration`,
        boneCount: v => `+${formatNumber(v)} bones`,
        critChance: v => `+${(v * 100).toFixed(0)}% crit`,
        boneRange: v => `+${formatNumber(v)} range`,
        arrowCount: v => `+${formatNumber(v)} arrows`,
        pierce: v => `+${formatNumber(v)} pierce`,
        dotTicks: v => `+${formatNumber(v)} poison ticks`,
        dotDamage: v => `+${formatNumber(v)} poison damage`,
        daggerCount: v => `+${formatNumber(v)} daggers`,
        staffRange: v => `+${formatNumber(v)} range`,
        explosionRadius: v => `+${formatNumber(v)} explosion radius`,
        chainCount: v => `+${formatNumber(v)} chains`,
        chainRange: v => `+${formatNumber(v)} chain range`,
        skullCount: v => `+${formatNumber(v)} skulls`,
        orbitRadius: v => `+${formatNumber(v)} orbit radius`,
        orbitSpeed: v => `+${formatNumber(v)} orbit speed`,
        skullDuration: v => `+${formatNumber(v)} duration`,
    };

    const dict = lang === 'en' ? en : ru;
    const formatter = dict[stat];
    return formatter ? formatter(num) : `${stat}: ${num}`;
}

// Вспомогательная функция: округляет дробные числа до одного знака, целые оставляет без изменений
function formatNumber(value) {
    if (typeof value !== 'number') return String(value);
    // Целые числа оставляем как есть (без ".00")
    if (Number.isInteger(value)) return value.toString();
    // Округляем до одного знака после запятой
    return value.toFixed(1);
}