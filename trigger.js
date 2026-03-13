const { Client, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
const config = require("./config.js");

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

/**
 * This script is for manually forcing a run of both Daily and Weekly reports
 * to their respective Discord channels immediately.
 */

async function forceDispatch() {
    // We import from index.js to reuse logical generators
    // Need to handle the fact that index.js might try to login automatically
    // But since we are requiring it, we can just use its exported methods.
    const { getDailyReport, getWeeklySummary } = require("./index.js");

    const workspaceId = process.env.CLOCKIFY_WORKSPACE_ID;
    const headers = {
        "X-Api-Key": process.env.CLOCKIFY_API_KEY,
        "Content-Type": "application/json"
    };

    const now = new Date();

    console.log("🚀 Forcing manual report dispatch...");

    client.once("ready", async () => {
        console.log(`✅ Logged in as ${client.user.tag}`);
        
        try {
            // 1. Generate Daily
            console.log("Generating Daily Report...");
            const daily = await getDailyReport(workspaceId, headers, now);
            if (daily) {
                const dailyChannel = await client.channels.fetch(process.env.PROJECT_MANAGEMENT_CHANNEL_ID);
                await dailyChannel.send({ content: daily, allowedMentions: { parse: ['users'] } });
                console.log("✅ Daily report sent.");
            }

            // 2. Generate Weekly (forced)
            console.log("Generating Weekly Summary...");
            const weekly = await getWeeklySummary(workspaceId, headers, now);
            if (weekly) {
                const weeklyChannel = await client.channels.fetch(process.env.FULL_TIME_ANNOUNCEMENTS_CHANNEL_ID);
                await weeklyChannel.send({ content: weekly, allowedMentions: { parse: ['users'] } });
                console.log("✅ Weekly summary sent.");
            }

            console.log("🎉 Manual trigger complete. Exiting...");
            process.exit(0);
        } catch (err) {
            console.error("❌ Error during manual dispatch:", err);
            process.exit(1);
        }
    });

    client.login(process.env.DISCORD_TOKEN);
}

forceDispatch();
