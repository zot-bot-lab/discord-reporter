const { Client, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
const cron = require("node-cron");
const config = require("./config.js");

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// ── Shared Formatters (created once, reused everywhere) ──────────────
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Colombo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const dateWithWeekdayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Colombo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short'
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Colombo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

// ── Helpers ──────────────────────────────────────────────────────────

/** Convert ISO 8601 duration (PT5H30M) to seconds */
function parseISODuration(duration) {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(duration);
  if (!match) return 0;
  const [, h, m, s] = match.map(x => parseInt(x || "0"));
  return h * 3600 + m * 60 + s;
}

/**
 * Walks backward from yesterday to find the most recent working day
 * (skipping weekends and public/mercantile holidays).
 * @param {Date} now - The current date/time
 * @returns {{ targetDate: Date, targetDateStr: string, displayDate: string }}
 */
function getLastWorkingDay(now) {
  let candidate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  while (true) {
    const parts = dateWithWeekdayFormatter.formatToParts(candidate);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    const wd = parts.find(p => p.type === 'weekday').value;

    const dateStr = `${y}-${m}-${d}`;
    const displayStr = `${d}/${m}/${y}`;

    if (wd === 'Sat' || wd === 'Sun' || config.isPublicHoliday(dateStr)) {
      candidate = new Date(candidate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      return { targetDate: candidate, targetDateStr: dateStr, displayDate: displayStr };
    }
  }
}

/**
 * Checks if the given date is the first working day of its week (Mon-Sun).
 * e.g. If Mon is a holiday, Tue is the first working day.
 */
function isFirstWorkingDayOfWeek(now) {
  // Go backwards from 'now' to find all previous working days in the SAME week
  // If we find any, 'now' is NOT the first working day.
  const currentDayOfWeek = now.getDay(); // 0(Sun) - 6(Sat)
  // Convert to 1(Mon) - 7(Sun)
  const currentIsoWeekday = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
  
  // If it's a weekend, it's never the first working day
  if (currentIsoWeekday > 5) return false;
  
  const todayDateStr = dateFormatter.format(now);
  if (config.isPublicHoliday(todayDateStr)) return false;

  // Let's check days before today, up to Monday (day 1)
  let candidate = new Date(now);
  for (let d = currentIsoWeekday - 1; d >= 1; d--) {
    candidate.setDate(candidate.getDate() - 1);
    const dateStr = dateFormatter.format(candidate);
    if (!config.isPublicHoliday(dateStr)) {
      // Found a working day earlier in this week!
      return false;
    }
  }
  return true; // No working days found earlier this week
}

/**
 * Get previous week's Monday and Sunday dates (00:00:00 Colombo time).
 */
function getPreviousWeekRange(now) {
  // now is Colombo time. We need last week's Monday and Sunday.
  const currentDayOfWeek = now.getDay();
  const currentIsoWeekday = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
  
  const lastSunday = new Date(now);
  lastSunday.setDate(lastSunday.getDate() - currentIsoWeekday);
  
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastMonday.getDate() - 6);

  // Set times to boundary
  lastMonday.setHours(0, 0, 0, 0);
  lastSunday.setHours(23, 59, 59, 999);

  return { lastMonday, lastSunday };
}

/**
 * Counts non-weekend, non-holiday days between start and end (inclusive)
 */
function getWorkingDays(startDate, endDate) {
  let count = 0;
  let current = new Date(startDate);
  current.setHours(0,0,0,0);
  
  const end = new Date(endDate);
  end.setHours(0,0,0,0);

  while (current <= end) {
    const wd = current.getDay();
    if (wd !== 0 && wd !== 6) { // Not Sunday or Saturday
      const dateStr = dateFormatter.format(current);
      if (!config.isPublicHoliday(dateStr)) {
        count++;
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Fetch and process a single user's Clockify logs for a daily report.
 * @returns {{ type: 'issue'|'praise'|'ok', message?: string }}
 */
async function processUserDaily(userId, userObj, workspaceId, headers, startUTC, endUTC, targetDateStr) {
  try {
    const url = `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries?start=${startUTC}&end=${endUTC}`;
    const reportRes = await fetch(url, { method: "GET", headers });

    if (!reportRes.ok) {
      return { type: 'issue', message: `<@${userObj.discordId}>\n- Error fetching logs` };
    }

    const logs = await reportRes.json();
    if (!logs || !logs.length) {
      return { type: 'issue', message: `<@${userObj.discordId}>\n- No logs` };
    }

    const targetDateLogs = logs.filter(log => {
      if (!log.timeInterval?.start || !log.timeInterval?.end) return false;
      const logStart = new Date(log.timeInterval.start);
      return dateFormatter.format(logStart) === targetDateStr;
    });

    if (!targetDateLogs.length) {
      return { type: 'issue', message: `**${userObj.name}**\n- No logs` };
    }

    let totalSeconds = 0;
    let hasEmptyDescription = false;
    for (const log of targetDateLogs) {
      if (!log.description || log.description.trim() === "") hasEmptyDescription = true;
      if (log.timeInterval?.duration) {
        totalSeconds += parseISODuration(log.timeInterval.duration);
      }
    }

    const totalHours = totalSeconds / 3600;
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const timeLogged = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;

    const issues = [];
    if (hasEmptyDescription) issues.push("Descriptions missing");
    if (totalHours < config.thresholds.dailyMinHours) issues.push("Logs missing");

    if (issues.length > 0) {
      return { type: 'issue', message: `**${userObj.name}** (${timeLogged})\n- ${issues.join("\n- ")}` };
    } else if (totalHours > config.thresholds.dailyPraiseHours) {
      return { type: 'praise', message: `**${userObj.name}** (${timeLogged})` };
    }
    return { type: 'ok' };
  } catch (error) {
    return { type: 'issue', message: `**${userObj.name}**\n- Error fetching logs` };
  }
}

/**
 * Fetch and process a single user's Clockify logs for the entire weekly summary.
 */
async function processUserWeekly(userId, userObj, workspaceId, headers, startUTC, endUTC, lastMonday, lastSunday, workingDays) {
  try {
    const minHours = workingDays * config.thresholds.weeklyMinHoursPerDay;
    const praiseHours = workingDays * config.thresholds.weeklyPraiseHoursPerDay;

    const url = `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries?start=${startUTC}&end=${endUTC}`;
    const reportRes = await fetch(url, { method: "GET", headers });

    if (!reportRes.ok) {
      return { type: 'issue', message: `<@${userObj.discordId}>\n- Error fetching logs`, totalHours: 0 };
    }

    const logs = await reportRes.json();
    
    // Group logs by Date string "YYYY-MM-DD"
    const logsByDate = {};
    
    // Initialize working days in logsByDate with empty arrays
    let current = new Date(lastMonday);
    while (current <= lastSunday) {
      const wd = current.getDay();
      if (wd !== 0 && wd !== 6) { // Not Sat/Sun
        const dateStr = dateFormatter.format(current);
        if (!config.isPublicHoliday(dateStr)) {
          logsByDate[dateStr] = { durationSecs: 0, hasEmptyDesc: false };
        }
      }
      current.setDate(current.getDate() + 1);
    }

    let totalSecondsList = 0;
    
    if (logs && logs.length > 0) {
      for (const log of logs) {
        if (!log.timeInterval?.start || !log.timeInterval?.end) continue;
        const logStart = new Date(log.timeInterval.start);
        const dateStr = dateFormatter.format(logStart);
        
        let secs = 0;
        if (log.timeInterval?.duration) {
          secs = parseISODuration(log.timeInterval.duration);
          
          // Only add to weekly total if the log falls strictly between lastMonday and lastSunday boundaries
          if (logStart >= lastMonday && logStart <= lastSunday) {
            totalSecondsList += secs;
          }
        }

        // Only care about tracking missing descriptions for expected working days
        if (logsByDate[dateStr] !== undefined) {
          if (!log.description || log.description.trim() === "") {
            logsByDate[dateStr].hasEmptyDesc = true;
          }
          logsByDate[dateStr].durationSecs += secs;
        }
      }
    }

    const totalHours = totalSecondsList / 3600;
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalSecondsList % 3600) / 60);
    const timeLogged = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;

    const missingLogDays = [];
    const missingDescDays = [];

    // Check each expected working day
    for (const [dateStr, dayData] of Object.entries(logsByDate)) {
      if (dayData.durationSecs < config.thresholds.dailyMinHours * 3600) {
        missingLogDays.push(dateStr);
      }
      if (dayData.hasEmptyDesc) {
        missingDescDays.push(dateStr);
      }
    }

    if (totalHours < minHours) {
      let msg = `<@${userObj.discordId}> (${timeLogged})`;
      if (missingLogDays.length > 0) msg += `\n- Missing logs on: ${missingLogDays.join(", ")}`;
      if (missingDescDays.length > 0) msg += `\n- Descriptions missing on: ${missingDescDays.join(", ")}`;
      return { type: 'issue', message: msg, totalHours };
    } else if (totalHours > praiseHours) {
      return { type: 'praise', message: `<@${userObj.discordId}> (${timeLogged})`, totalHours };
    }
    
    // Normal case (between min and praise)
    return { type: 'normal', message: `<@${userObj.discordId}> (${timeLogged})`, totalHours };
  } catch (error) {
    return { type: 'issue', message: `<@${userObj.discordId}>\n- Error fetching logs`, totalHours: 0 };
  }
}

// ── Main Report Function ─────────────────────────────────────────────

async function getDailyReport(workspaceId, headers, now) {
  const { targetDate, targetDateStr, displayDate } = getLastWorkingDay(now);

  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const startUTC = fiveDaysAgo.toISOString();
  const endUTC = tomorrow.toISOString();

  console.log(`[Daily] TARGET DATE: ${displayDate} (${targetDateStr})`);

  const userEntries = Object.entries(config.users);
  const results = await Promise.all(
    userEntries.map(([userId, userObj]) =>
      processUserDaily(userId, userObj, workspaceId, headers, startUTC, endUTC, targetDateStr)
    )
  );

  const issuesList = results.filter(r => r.type === 'issue').map(r => r.message);
  const praiseList = results.filter(r => r.type === 'praise').map(r => r.message);

  let finalReport = [`<@889764524473860116> **Daily Time Log Report** - ${displayDate}`];

  if (issuesList.length > 0) {
    finalReport.push(`\n**Attention Needed**`);
    finalReport.push(...issuesList);
  }

  if (praiseList.length > 0) {
    finalReport.push(`\n**Most hours logged ( > ${config.thresholds.dailyPraiseHours}h )**`);
    finalReport.push(...praiseList);
  }

  if (issuesList.length === 0 && praiseList.length === 0) {
    finalReport.push(`\nAll good! Everyone met the targets.`);
  }

  return finalReport.join("\n");
}

async function getWeeklySummary(workspaceId, headers, now) {
  const { lastMonday, lastSunday } = getPreviousWeekRange(now);
  const workingDays = getWorkingDays(lastMonday, lastSunday);
  
  if (workingDays === 0) {
    console.log("[Weekly] No working days in the previous week! Skipping.");
    return null;
  }

  // Widen UTC window just in case
  const startQuery = new Date(lastMonday.getTime() - 2 * 24 * 60 * 60 * 1000);
  const endQuery = new Date(lastSunday.getTime() + 2 * 24 * 60 * 60 * 1000);
  
  const startUTC = startQuery.toISOString();
  const endUTC = endQuery.toISOString();
  
  console.log(`[Weekly] Summarizing ${dateFormatter.format(lastMonday)} to ${dateFormatter.format(lastSunday)}`);
  console.log(`[Weekly] Working Days: ${workingDays}`);

  const userEntries = Object.entries(config.users);
  const results = await Promise.all(
    userEntries.map(([userId, userObj]) =>
      processUserWeekly(userId, userObj, workspaceId, headers, startUTC, endUTC, lastMonday, lastSunday, workingDays)
    )
  );

  const minHrs = workingDays * config.thresholds.weeklyMinHoursPerDay;
  const praiseHrs = workingDays * config.thresholds.weeklyPraiseHoursPerDay;

  const issuesList = results.filter(r => r.type === 'issue').map(r => r.message);
  const praiseList = results.filter(r => r.type === 'praise').map(r => r.message);
  const normalList = results.filter(r => r.type === 'normal').map(r => r.message);

  let finalReport = [`📊 **Weekly Time Log Summary** (${dateFormatter.format(lastMonday)} to ${dateFormatter.format(lastSunday)})`];

  if (issuesList.length > 0) {
    finalReport.push(`\n⚠️ **Attention Needed ( < ${minHrs}h )**`);
    finalReport.push(...issuesList);
  }

  if (normalList.length > 0) {
    finalReport.push(`\n✅ **Met Target Hours**`);
    finalReport.push(...normalList);
  }

  if (praiseList.length > 0) {
    finalReport.push(`\n🏆 **Most hours logged ( > ${praiseHrs}h )**`);
    finalReport.push(...praiseList);
  }

  return finalReport.join("\n");
}

async function runGenerators() {
  const workspaceId = process.env.CLOCKIFY_WORKSPACE_ID;
  const headers = {
    "X-Api-Key": process.env.CLOCKIFY_API_KEY,
    "Content-Type": "application/json"
  };

  const now = new Date();
  const todayDateStr = dateFormatter.format(now);

  if (config.isPublicHoliday(todayDateStr)) {
    console.log(`Skipping bot run: Today (${todayDateStr}) is a public/mercantile holiday in Sri Lanka.`);
    return { daily: null, weekly: null };
  }

  const dailyReport = await getDailyReport(workspaceId, headers, now);
  
  let weeklyReport = null;
  if (isFirstWorkingDayOfWeek(now)) {
    console.log("[Trigger] First working day of the week detected -> generating Weekly report.");
    weeklyReport = await getWeeklySummary(workspaceId, headers, now);
  }

  return { daily: dailyReport, weekly: weeklyReport };
}

// ── Scheduling & Startup ─────────────────────────────────────────────

// ── Scheduling & Startup ─────────────────────────────────────────────

async function sendReports() {
  try {
    const { daily, weekly } = await runGenerators();

    if (daily) {
      const dailyChannel = await client.channels.fetch(process.env.PROJECT_MANAGEMENT_CHANNEL_ID);
      await dailyChannel.send({
        content: daily,
        allowedMentions: { parse: ['users'] }
      });
      console.log("✅ Daily report sent successfully.");
    } else {
      console.log("ℹ️ No daily report sent.");
    }

    if (weekly) {
      const weeklyChannel = await client.channels.fetch(process.env.FULL_TIME_ANNOUNCEMENTS_CHANNEL_ID);
      await weeklyChannel.send({
        content: weekly,
        allowedMentions: { parse: ['users'] }
      });
      console.log("✅ Weekly report sent successfully.");
    } else {
      console.log("ℹ️ No weekly report sent today.");
    }

  } catch (err) {
    console.error("Error sending reports:", err);
    throw err; // For Github Actions process exit
  }
}

// Run every weekday (Mon–Fri) at 4:00 PM Colombo time
cron.schedule(
  "0 16 * * 1-5",  // 4:00 PM = 16:00
  async () => {
    await sendReports();
  },
  {
    timezone: "Asia/Colombo"
  }
);

client.once("clientReady", async () => {
  console.log(`✅ Bot is running as ${client.user.tag}`);

  // If running in GitHub Actions, send report immediately and exit
  if (process.env.GITHUB_ACTIONS) {
    console.log('Running in GitHub Actions mode - sending report now...');
    try {
      await sendReports();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  }
});

if (require.main === module) {
  client.login(process.env.DISCORD_TOKEN);

  // Test call for local dev testing
  // To test daily vs weekly, uncomment getDailyReport or getWeeklySummary inside runGenerators
  if (!process.env.GITHUB_ACTIONS) {
    runGenerators().then(({ daily, weekly }) => {
      if (daily) console.log("\n--- DAILY REPORT ---\n" + daily);
      if (weekly) console.log("\n--- WEEKLY SUMMARY ---\n" + weekly);
    }).catch(console.error);
  }
}

module.exports = {
  getDailyReport,
  getWeeklySummary,
  isFirstWorkingDayOfWeek,
  getPreviousWeekRange,
  getWorkingDays
};