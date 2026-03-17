# Discord Reporter Bot

A fully automated Node.js bot that queries the Clockify API for time entries and publishes reports to Discord.

## 🚀 Key Features

- **Daily Reports**: Automatically sent to the Project Management channel every weekday at 4:00 PM Colombo time.
- **Weekly Summaries**: Clockify logs automatically sent to the Full-Time Announcements channel on the first working day of each week.
- **Weekly Highlights**: Upcoming birthdays and public holidays sent to the General channel every Monday (mentions @everyone).
- **Role-Based Filtering**: Distinguishes between `admin` (birthdays only) and `employee` (birthdays + Clockify logs) to reduce noise.
- **Dynamic Thresholds**: Calculates weekly targets based on actual working days (excluding holidays and weekends).
- **Holiday Aware**: Skips reporting on Sri Lankan public holidays and adapts weekly triggers accordingly.
- **Missing Logs Detection**: Flags users with missing time entries or empty descriptions.
- **Top Performers Recognition**: Highlights "Most hours logged" for users exceeding performance targets.

## 📂 Project Structure

- `index.js`: The core bot logic, scheduling, and report generators.
- `config.js`: Centralized configuration for users, holiday dates, and threshold settings.
- `trigger.js`: A utility script to forcefully trigger both reports immediately.
- `.env`: Secret credentials and channel-specific IDs.

## ⚙️ Configuration (`config.js`)

The `config.js` file contains:
- **Users**: Mappings of Clockify IDs to Discord IDs, display names, birthdays (`DD-MM`), and roles (`admin` or `employee`).
- **Thresholds**: 
  - Daily Min: 7h
  - Daily Praise: 7.5h
  - Weekly Min: `workingDays * 7h`
  - Weekly Praise: `workingDays * 7.5h`
- **Holidays**: A pre-configured list of Sri Lankan public holidays for 2026–2028.

## 🔐 Environment Variables (`.env`)

Create a `.env` file in the root directory:

```env
DISCORD_TOKEN=your_bot_token
CLOCKIFY_API_KEY=your_api_key
CLOCKIFY_WORKSPACE_ID=your_workspace_id

PROJECT_MANAGEMENT_CHANNEL_ID=1082295824043737180
FULL_TIME_ANNOUNCEMENTS_CHANNEL_ID=your_announcements_channel_id
GENERAL_CHANNEL_ID=your_general_channel_id
```

## 🛠️ Triggers

### Automated
The bot uses `node-cron` to run every Monday–Friday at 16:00 Colombo time.

### Manual
If you need to send reports right now, run:
```bash
node trigger.js
```

## 🤖 GitHub Actions
The bot is configured to run automatically via GitHub Actions. Ensure the following secrets are set in your repository:
- `DISCORD_TOKEN`
- `CLOCKIFY_API_KEY`
- `CLOCKIFY_WORKSPACE_ID`
- `PROJECT_MANAGEMENT_CHANNEL_ID`
- `FULL_TIME_ANNOUNCEMENTS_CHANNEL_ID`
- `GENERAL_CHANNEL_ID`

---
*Built for ZOT Bot Lab*
