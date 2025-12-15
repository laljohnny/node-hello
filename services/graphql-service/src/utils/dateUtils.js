const moment = require('moment-timezone');

/**
 * Calculate the next due date based on frequency and frequency value
 * @param {Date|string} currentDate - The current due date
 * @param {string} frequency - Frequency type (Daily, Weekly, Monthly, etc.)
 * @param {number} frequencyValue - Multiplier for frequency
 * @param {string} timezone - Timezone for calculation
 * @returns {Date} Next due date
 */
function calculateNextDueDate(currentDate, frequency, frequencyValue = 1, timezone = 'UTC') {
    const date = moment.tz(currentDate, timezone);

    switch (frequency) {
        case 'Daily':
            return date.add(frequencyValue, 'days').toDate();
        case 'Weekly':
            return date.add(frequencyValue, 'weeks').toDate();
        case 'Monthly':
            return date.add(frequencyValue, 'months').toDate();
        case 'Quarterly':
            return date.add(frequencyValue * 3, 'months').toDate();
        case 'Semi-Annually':
            return date.add(frequencyValue * 6, 'months').toDate();
        case 'Yearly':
            return date.add(frequencyValue, 'years').toDate();
        case 'One-Time':
            return null; // One-time schedules don't repeat
        default:
            throw new Error(`Invalid frequency: ${frequency}`);
    }
}

/**
 * Calculate reminder date (X days before scheduled date)
 * @param {Date|string} scheduledDate - The scheduled maintenance date
 * @param {number} daysBefore - Number of days before to send reminder
 * @param {string} timezone - Timezone for calculation
 * @returns {Date} Reminder date
 */
function calculateReminderDate(scheduledDate, daysBefore = 3, timezone = 'UTC') {
    const date = moment.tz(scheduledDate, timezone);
    return date.subtract(daysBefore, 'days').toDate();
}

/**
 * Add frequency intervals to a date
 * @param {Date|string} date - Starting date
 * @param {string} frequency - Frequency type
 * @param {number} value - Frequency multiplier
 * @param {string} timezone - Timezone for calculation
 * @returns {Date} New date
 */
function addFrequencyToDate(date, frequency, value = 1, timezone = 'UTC') {
    return calculateNextDueDate(date, frequency, value, timezone);
}

/**
 * Check if a date is in the past
 * @param {Date|string} date - Date to check
 * @param {string} timezone - Timezone for comparison
 * @returns {boolean} True if date is in the past
 */
function isDateInPast(date, timezone = 'UTC') {
    const checkDate = moment.tz(date, timezone);
    const now = moment.tz(timezone);
    return checkDate.isBefore(now, 'day');
}

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @param {string} timezone - Timezone for comparison
 * @returns {boolean} True if date is today
 */
function isDateToday(date, timezone = 'UTC') {
    const checkDate = moment.tz(date, timezone);
    const now = moment.tz(timezone);
    return checkDate.isSame(now, 'day');
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} timezone - Timezone for formatting
 * @param {string} format - Format string (default: 'YYYY-MM-DD')
 * @returns {string} Formatted date
 */
function formatDate(date, timezone = 'UTC', format = 'YYYY-MM-DD') {
    return moment.tz(date, timezone).format(format);
}

module.exports = {
    calculateNextDueDate,
    calculateReminderDate,
    addFrequencyToDate,
    isDateInPast,
    isDateToday,
    formatDate
};
