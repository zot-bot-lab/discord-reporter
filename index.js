const { Client, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
const cron = require("node-cron");
const { USERS } = require("./users.js");
const { isPublicHoliday } = require("./holidays.js");

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

    if (wd === 'Sat' || wd === 'Sun' || isPublicHoliday(dateStr)) {
      candidate = new Date(candidate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      return { targetDate: candidate, targetDateStr: dateStr, displayDate: displayStr };
    }
  }
}

/**
 * Fetch and process a single user's Clockify logs for the target date.
 * @returns {{ type: 'issue'|'praise'|'ok', message?: string }}
 */
async function processUser(userId, discordTag, workspaceId, headers, startUTC, endUTC, targetDateStr) {
  try {
    const url = `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries?start=${startUTC}&end=${endUTC}`;
    console.log(`Fetching logs for <@${discordTag}>...`);

    const reportRes = await fetch(url, { method: "GET", headers });

    if (!reportRes.ok) {
      const errorText = await reportRes.text();
      console.error(`Clockify API error for <@${discordTag}>: ${reportRes.status}`);
      console.error(`Response: ${errorText}`);
      return { type: 'issue', message: `⚠️ <@${discordTag}>\n- Error fetching logs` };
    }

    const logs = await reportRes.json();
    console.log(`\n--- <@${discordTag}> ---`);
    console.log(`Total logs returned: ${logs.length}`);

    if (!logs || !logs.length) {
      return { type: 'issue', message: `❌ <@${discordTag}>\n- No logs` };
    }

    // Filter logs – include only entries that started on the target date
    const targetDateLogs = logs.filter(log => {
      if (!log.timeInterval?.start || !log.timeInterval?.end) return false;

      const logStart = new Date(log.timeInterval.start);
      const logEnd = new Date(log.timeInterval.end);

      const startDateStr = dateFormatter.format(logStart);
      const isIncluded = startDateStr === targetDateStr;

      const startTime = timeFormatter.format(logStart);
      const endTime = timeFormatter.format(logEnd);
      const endDateStr = dateFormatter.format(logEnd);

      console.log(
        `  ${isIncluded ? '✓' : '✗'} [${startDateStr} ${startTime}] to [${endDateStr} ${endTime}] - ${log.timeInterval.duration} - "${log.description?.substring(0, 40) || '(empty)'}"`
      );

      return isIncluded;
    });

    console.log(`Filtered logs (included): ${targetDateLogs.length}`);

    if (!targetDateLogs.length) {
      return { type: 'issue', message: `❌ <@${discordTag}>\n- No logs` };
    }

    let totalSeconds = 0;
    let hasEmptyDescription = false;

    for (const log of targetDateLogs) {
      if (!log.description || log.description.trim() === "") {
        hasEmptyDescription = true;
      }
      if (log.timeInterval?.duration) {
        totalSeconds += parseISODuration(log.timeInterval.duration);
      }
    }

    const totalHours = totalSeconds / 3600;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    const timeLogged = `${hours}h ${minutes}m`;

    const issues = [];
    if (hasEmptyDescription) issues.push("Descriptions missing");
    if (totalHours < 6) issues.push("Logs missing");

    if (issues.length > 0) {
      return { type: 'issue', message: `⚠️ <@${discordTag}> (${timeLogged})\n- ${issues.join("\n- ")}` };
    } else if (totalHours > 6.5) {
      return { type: 'praise', message: `🌟 <@${discordTag}> (${timeLogged})` };
    }

    return { type: 'ok' };

  } catch (error) {
    console.error(`Error processing logs for <@${discordTag}>:`, error);
    return { type: 'issue', message: `⚠️ <@${discordTag}>\n- Error fetching logs` };
  }
}

// ── Main Report Function ─────────────────────────────────────────────

async function getClockifyLogs() {
  const workspaceId = process.env.CLOCKIFY_WORKSPACE_ID;
  const headers = {
    "X-Api-Key": process.env.CLOCKIFY_API_KEY,
    "Content-Type": "application/json"
  };

  const now = new Date();

  // Check if TODAY is a holiday or weekend – no need to run at all
  const todayParts = dateWithWeekdayFormatter.formatToParts(now);
  const dayOfWeek = todayParts.find(p => p.type === 'weekday').value;
  const todayDateStr = dateFormatter.format(now);

  if (isPublicHoliday(todayDateStr)) {
    console.log(`\n========================================`);
    console.log(`Skipping bot run: Today (${todayDateStr}) is a public/mercantile holiday in Sri Lanka.`);
    console.log(`========================================\n`);
    return null;
  }

  // Find the last working day (skips weekends + holidays automatically)
  const { targetDate, targetDateStr, displayDate } = getLastWorkingDay(now);

  // Query a wider range to cover timezone overlaps and weekends
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const startUTC = fiveDaysAgo.toISOString();
  const endUTC = tomorrow.toISOString();

  const actualDaysGoneBack = Math.round((now.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1000));

  console.log(`\n========================================`);
  console.log(`Today: ${dayOfWeek} - Going back ${actualDaysGoneBack} day(s)`);
  console.log(`TARGET DATE: ${displayDate} (${targetDateStr}) Sri Lankan Time`);
  console.log(`Query range (wide): ${startUTC} to ${endUTC}`);
  console.log(`========================================\n`);

  // ── Fetch all users in parallel ──────────────────────────────────
  const userEntries = Object.entries(USERS);
  const results = await Promise.all(
    userEntries.map(([userId, discordTag]) =>
      processUser(userId, discordTag, workspaceId, headers, startUTC, endUTC, targetDateStr)
    )
  );

  // Collate results
  const issuesList = results.filter(r => r.type === 'issue').map(r => r.message);
  const praiseList = results.filter(r => r.type === 'praise').map(r => r.message);

  // Build final report
  let finalReport = [`📝 **Daily Time Log Report** - ${displayDate}`];

  if (issuesList.length > 0) {
    finalReport.push(`\n👇 **Attention Needed**`);
    finalReport.push(...issuesList);
  }

  if (praiseList.length > 0) {
    finalReport.push(`\n🏆 **Top Performers ( > 6.5h )**`);
    finalReport.push(...praiseList);
  }

  if (issuesList.length === 0 && praiseList.length === 0) {
    finalReport.push(`\n✅ All good! Everyone met the targets.`);
  }

  return finalReport.join("\n");
}

// ── Scheduling & Startup ─────────────────────────────────────────────

// Run every weekday (Mon–Fri) at 4:00 PM Colombo time
cron.schedule(
  "0 16 * * 1-5",  // 4:00 PM = 16:00
  async () => {
    try {
      const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
      const report = await getClockifyLogs();
      if (report) {
        await channel.send({
          content: report,
          allowedMentions: { parse: ['users'] }
        });
        console.log("✅ Report sent successfully");
      } else {
        console.log("ℹ️ No report to send (Holiday or empty).");
      }
    } catch (err) {
      console.error("Error sending report:", err);
    }
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
      const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
      const report = await getClockifyLogs();
      if (report) {
        await channel.send({
          content: report,
          allowedMentions: { parse: ['users'] }
        });
        console.log("✅ Report sent successfully");
      } else {
        console.log("ℹ️ No report to send (Holiday or empty).");
      }
      process.exit(0);
    } catch (err) {
      console.error("Error sending report:", err);
      process.exit(1);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

// Test call - remove in production or keep for local testing
getClockifyLogs().then(console.log);