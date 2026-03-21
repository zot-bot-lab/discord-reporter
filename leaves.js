/**
 * leaves.js
 * Module to handle fetching approved leaves from the Zotizens public API.
 */

const config = require('./config');

/**
 * Fetches approved leaves from the Zotizens API.
 * @param {Object} params - Query parameters
 * @param {string} [params.date] - Filter by a specific date (YYYY-MM-DD)
 * @param {string} [params.startDate] - Filter starting from this date
 * @param {string} [params.endDate] - Filter ending on or before this date
 * @param {string} [params.status] - Filter by status (default: APPROVED)
 * @returns {Promise<Array>} - Array of leave records
 */
async function fetchLeaves({ date, startDate, endDate, status = 'APPROVED' }) {
    const baseUrl = config.zotizensApiUrl;
    const endpoint = '/api/public/leaves';
    
    let url = `${baseUrl}${endpoint}?status=${status}`;
    if (date) url += `&date=${date}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    try {
        console.log(`[Leaves API] Fetching: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`[Leaves API] HTTP error! status: ${response.status}`);
            return [];
        }
        
        const result = await response.json();
        if (result.success) {
            return result.data || [];
        } else {
            console.error('[Leaves API] API Error:', result.error);
            return [];
        }
    } catch (error) {
        console.error('[Leaves API] Failed to fetch leaves:', error);
        return [];
    }
}

/**
 * Builds a Map of leaves keyed by clockifyUserId for quick lookup.
 * If multiple leaves exist for the same user on the same date, the last one wins.
 * @param {Array} leavesArray 
 * @returns {Map<string, Object>}
 */
function buildLeaveMap(leavesArray) {
    const map = new Map();
    for (const leave of leavesArray) {
        if (leave.clockifyUserId) {
            map.set(leave.clockifyUserId, leave);
        }
    }
    return map;
}

module.exports = {
    fetchLeaves,
    buildLeaveMap
};
