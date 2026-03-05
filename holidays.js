// Sri Lankan Public Holidays for 2026
// Format: YYYY-MM-DD
const HOLIDAYS_2026 = [
    "2026-01-03", // Duruthu Full Moon Poya Day
    "2026-01-15", // Tamil Thai Pongal Day
    "2026-02-01", // Navam Full Moon Poya Day
    "2026-02-04", // Independence Day
    "2026-03-02", // Madin Full Moon Poya Day
    "2026-04-01", // Bak Full Moon Poya Day
    "2026-04-13", // Day prior to Sinhala and Tamil New Year Day
    "2026-04-14", // Sinhala and Tamil New Year Day
    "2026-05-01", // May Day AND Vesak Full Moon Poya Day
    "2026-05-02", // Day following Vesak Full Moon Poya Day
    "2026-05-30", // Adhi Poson Full Moon Poya Day
    "2026-06-29", // Poson Full Moon Poya Day
    "2026-07-29", // Esala Full Moon Poya Day
    "2026-08-26", // Milad un-Nabi (Prophet's Birthday)
    "2026-08-27", // Nikini Full Moon Poya Day
    "2026-09-24", // Binara Full Moon Poya Day
    "2026-10-24", // Vap Full Moon Poya Day
    "2026-11-23", // Il Full Moon Poya Day
    "2026-12-23", // Unduvap Full Moon Poya Day
    "2026-12-25"  // Christmas Day
];

// Estimated Public Holidays for 2027
const HOLIDAYS_2027 = [
    "2027-01-15", // Tamil Thai Pongal Day
    "2027-01-22", // Duruthu Full Moon Poya Day
    "2027-02-04", // Independence Day
    "2027-02-20", // Navam Full Moon Poya Day
    "2027-03-22", // Madin Full Moon Poya Day
    "2027-04-13", // Day prior to Sinhala and Tamil New Year Day
    "2027-04-14", // Sinhala and Tamil New Year Day
    "2027-04-20", // Bak Full Moon Poya Day
    "2027-05-01", // May Day
    "2027-05-20", // Vesak Full Moon Poya Day
    "2027-05-21", // Day following Vesak Full Moon Poya Day
    "2027-06-18", // Poson Full Moon Poya Day
    "2027-07-18", // Esala Full Moon Poya Day
    "2027-08-15", // Milad un-Nabi (Prophet's Birthday)
    "2027-08-17", // Nikini Full Moon Poya Day
    "2027-09-16", // Binara Full Moon Poya Day
    "2027-10-15", // Vap Full Moon Poya Day
    "2027-11-14", // Ill Full Moon Poya Day
    "2027-12-13", // Unduvap Full Moon Poya Day
    "2027-12-25"  // Christmas Day
];

// Estimated Public Holidays for 2028
const HOLIDAYS_2028 = [
    "2028-01-12", // Duruthu Full Moon Poya Day
    "2028-01-14", // Tamil Thai Pongal Day
    "2028-02-04", // Independence Day
    "2028-02-10", // Navam Full Moon Poya Day
    "2028-03-11", // Madin Full Moon Poya Day
    "2028-04-09", // Bak Full Moon Poya Day
    "2028-04-13", // Day prior to Sinhala and Tamil New Year Day
    "2028-04-14", // Sinhala and Tamil New Year Day AND Good Friday
    "2028-05-01", // May Day
    "2028-05-08", // Vesak Full Moon Poya Day
    "2028-05-09", // Day following Vesak Full Moon Poya Day
    "2028-06-07", // Poson Full Moon Poya Day
    "2028-07-06", // Esala Full Moon Poya Day
    "2028-08-03", // Milad un-Nabi (Prophet's Birthday) (Estimate)
    "2028-08-05", // Nikini Full Moon Poya Day
    "2028-09-04", // Binara Full Moon Poya Day
    "2028-10-03", // Vap Full Moon Poya Day
    "2028-11-02", // Ill Full Moon Poya Day
    "2028-12-02", // Unduvap Full Moon Poya Day
    "2028-12-25", // Christmas Day
    "2028-12-31"  // Adhi Unduvap Full Moon Poya Day
];

const ALL_HOLIDAYS = [
    ...HOLIDAYS_2026,
    ...HOLIDAYS_2027,
    ...HOLIDAYS_2028
];

/**
 * Checks if a given date string is a public holiday in Sri Lanka.
 * @param {string} dateStr - Date string in YYYY-MM-DD format (e.g., "2026-01-14")
 * @returns {boolean} - True if the date is a public holiday, false otherwise.
 */
function isPublicHoliday(dateStr) {
    return ALL_HOLIDAYS.includes(dateStr);
}

module.exports = { isPublicHoliday };
