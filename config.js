// config.js

// Sri Lankan Public Holidays for 2026, 2027, 2028
// Format: YYYY-MM-DD
const HOLIDAYS_2026 = {
    "2026-01-03": "Duruthu Full Moon Poya Day",
    "2026-01-15": "Tamil Thai Pongal Day",
    "2026-02-01": "Navam Full Moon Poya Day",
    "2026-02-04": "Independence Day",
    "2026-03-02": "Madin Full Moon Poya Day",
    "2026-04-01": "Bak Full Moon Poya Day",
    "2026-04-13": "Day prior to Sinhala and Tamil New Year Day",
    "2026-04-14": "Sinhala and Tamil New Year Day",
    "2026-05-01": "May Day & Vesak Full Moon Poya Day",
    "2026-05-02": "Day following Vesak Full Moon Poya Day",
    "2026-05-30": "Adhi Poson Full Moon Poya Day",
    "2026-06-29": "Poson Full Moon Poya Day",
    "2026-07-29": "Esala Full Moon Poya Day",
    "2026-08-26": "Milad un-Nabi (Prophet's Birthday)",
    "2026-08-27": "Nikini Full Moon Poya Day",
    "2026-09-24": "Binara Full Moon Poya Day",
    "2026-10-24": "Vap Full Moon Poya Day",
    "2026-11-23": "Il Full Moon Poya Day",
    "2026-12-23": "Unduvap Full Moon Poya Day",
    "2026-12-25": "Christmas Day"
};

const HOLIDAYS_2027 = {
    "2027-01-15": "Tamil Thai Pongal Day",
    "2027-01-22": "Duruthu Full Moon Poya Day",
    "2027-02-04": "Independence Day",
    "2027-02-20": "Navam Full Moon Poya Day",
    "2027-03-22": "Madin Full Moon Poya Day",
    "2027-04-13": "Day prior to Sinhala and Tamil New Year Day",
    "2027-04-14": "Sinhala and Tamil New Year Day",
    "2027-04-20": "Bak Full Moon Poya Day",
    "2027-05-01": "May Day",
    "2027-05-20": "Vesak Full Moon Poya Day",
    "2027-05-21": "Day following Vesak Full Moon Poya Day",
    "2027-06-18": "Poson Full Moon Poya Day",
    "2027-07-18": "Esala Full Moon Poya Day",
    "2027-08-15": "Milad un-Nabi (Prophet's Birthday)",
    "2027-08-17": "Nikini Full Moon Poya Day",
    "2027-09-16": "Binara Full Moon Poya Day",
    "2027-10-15": "Vap Full Moon Poya Day",
    "2027-11-14": "Ill Full Moon Poya Day",
    "2027-12-13": "Unduvap Full Moon Poya Day",
    "2027-12-25": "Christmas Day"
};

const HOLIDAYS_2028 = {
    "2028-01-12": "Duruthu Full Moon Poya Day",
    "2028-01-14": "Tamil Thai Pongal Day",
    "2028-02-04": "Independence Day",
    "2028-02-10": "Navam Full Moon Poya Day",
    "2028-03-11": "Madin Full Moon Poya Day",
    "2028-04-09": "Bak Full Moon Poya Day",
    "2028-04-13": "Day prior to Sinhala and Tamil New Year Day",
    "2028-04-14": "Sinhala and Tamil New Year Day AND Good Friday",
    "2028-05-01": "May Day",
    "2028-05-08": "Vesak Full Moon Poya Day",
    "2028-05-09": "Day following Vesak Full Moon Poya Day",
    "2028-06-07": "Poson Full Moon Poya Day",
    "2028-07-06": "Esala Full Moon Poya Day",
    "2028-08-03": "Milad un-Nabi (Prophet's Birthday)",
    "2028-08-05": "Nikini Full Moon Poya Day",
    "2028-09-04": "Binara Full Moon Poya Day",
    "2028-10-03": "Vap Full Moon Poya Day",
    "2028-11-02": "Ill Full Moon Poya Day",
    "2028-12-02": "Unduvap Full Moon Poya Day",
    "2028-12-25": "Christmas Day",
    "2028-12-31": "Adhi Unduvap Full Moon Poya Day"
};

const ALL_HOLIDAYS = {
    ...HOLIDAYS_2026,
    ...HOLIDAYS_2027,
    ...HOLIDAYS_2028
};

/**
 * Checks if a given date string is a public holiday in Sri Lanka.
 * @param {string} dateStr - Date string in YYYY-MM-DD format (e.g., "2026-01-14")
 * @returns {boolean} - True if the date is a public holiday, false otherwise.
 */
function isPublicHoliday(dateStr) {
    return dateStr in ALL_HOLIDAYS;
}

/**
 * Gets the name of the public holiday for a given date.
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string|undefined} - Name of the public holiday, or undefined if not a holiday.
 */
function getPublicHolidayName(dateStr) {
    return ALL_HOLIDAYS[dateStr];
}

const config = {
    // Clockify user IDs mapped to Discord usernames or tags
    // clockify_id: { discordId, name }
    users: {
        "ADMIN_DULAJ": { discordId: "927228118341652540", name: "Dulaj", birthday: "20-04", role: "admin" },
        "ADMIN_ISURU": { discordId: "883292926417989632", name: "Isuru", birthday: "13-05", role: "admin" },
        "ADMIN_SUDARAKA": { discordId: "834681879894425620", name: "Sudaraka", birthday: "29-08", role: "admin" },
        "ADMIN_MALAKA": { discordId: "563605515138236436", name: "Malaka", birthday: "25-09", role: "admin" },
        "672874f70069dd2e09a53498": { discordId: "1302874198812655687", name: "Chamika", birthday: "03-08", role: "employee" },
        "6777d1891c567d719f83c4c1": { discordId: "1323952767953408032", name: "Charith", birthday: "19-06", role: "employee" },
        "65ba46ea34b49b480cab146d": { discordId: "1185813501894201386", name: "Dilan", birthday: "03-05", role: "employee" },
        "65218021e5c62943e1ba89aa": { discordId: "890601217691090954", name: "Shakthi", birthday: "09-03", role: "employee" },
        "652182e8e5c62943e1ba9a96": { discordId: "1000320547957248040", name: "Sheron", birthday: "06-08", role: "employee" },
        "684182980300f917a0fbc273": { discordId: "1369530176198676550", name: "Vishal", birthday: "14-07", role: "employee" },
        "64af043d5a1474600d24ede6": { discordId: "889764524473860116", name: "Megha", birthday: "21-04", role: "employee" },
        "68ff1ff0da72376ea5d5850b": { discordId: "1431195342912622697", name: "Nimsara", birthday: "", role: "employee" },
        "697703496790704cd5eb356a": { discordId: "1217796032377913385", name: "Chanu", birthday: "21-02", role: "employee" }
    },

    thresholds: {
        dailyMinHours: 7,         // flag if below this per day
        dailyPraiseHours: 7.5,    // praise if above this per day
        weeklyMinHoursPerDay: 7,  // multiplied by working days
        weeklyPraiseHoursPerDay: 7.5 // multiplied by working days
    },

    timezone: 'Asia/Colombo',
    zotizensApiUrl: 'https://zotizens.zotech.xyz',

    isPublicHoliday,
    getPublicHolidayName
};

module.exports = config;
