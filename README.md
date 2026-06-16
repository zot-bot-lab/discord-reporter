# Discord Reporter Bot

A fully automated Node.js bot that queries the Solidtime API for time entries and publishes reports to Discord.

## 🚀 Key Features

- **Daily Reports**: Automatically sent to the Project Management channel every weekday at 11:00 AM Colombo time.
- **Weekly Summaries**: Solidtime logs automatically sent to the Full-Time Announcements channel on the first working day of each week.
- **Weekly Highlights**: Upcoming birthdays and public holidays sent to the General channel every Sunday (mentions @everyone).
- **Role-Based Filtering**: Distinguishes between `admin` (birthdays only) and `employee` (birthdays + Solidtime logs) to reduce noise.
- **Dynamic Thresholds**: Calculates weekly targets based on actual working days (excluding holidays and weekends).
- **Holiday Aware**: Skips reporting on Sri Lankan public holidays and adapts weekly triggers accordingly.
- **Leaves Integration**: Automatically fetches approved leaves from the Zotizens API.
- **Smart Filtering**: Excludes users on full-day leave from "Attention Needed" and halves the log threshold for half-day leave users.
- **Absence Visibility**: Shows "On Leave Today" (informational) and "On Leave Yesterday" (functional) sections in the daily report.
- **Missing Logs Detection**: Flags users with missing time entries or empty descriptions.
- **Top Performers Recognition**: Highlights "Most hours logged" for users exceeding performance targets.

## 📂 Project Structure

- `index.js`: The core bot logic, scheduling, and report generators.
- `leaves.js`: Module for fetching and processing leave data from the Zotizens Public API.
- `config.js`: Centralized configuration for users, holiday dates, and threshold settings.
- `trigger.js`: A utility script to forcefully trigger both reports immediately.
- `.env`: Secret credentials and channel-specific IDs.

## ⚙️ Configuration (`config.js`)

The `config.js` file contains:
- **Users**: Mappings of user configuration (where the keys represent their legacy leaves IDs returned by the Zotizens Leaves API) to Discord properties, display names, birthdays (`DD-MM`), roles (`admin` or `employee`), and their corresponding `solidTimeId` (used to query the Solidtime API).
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
SOLIDTIME_API_TOKEN=your_api_token
SOLIDTIME_ORGANIZATION_ID=your_organization_id
SOLIDTIME_API_URL=https://app.solidtime.io/api

PROJECT_MANAGEMENT_CHANNEL_ID=1082295824043737180
FULL_TIME_ANNOUNCEMENTS_CHANNEL_ID=your_announcements_channel_id
GENERAL_CHANNEL_ID=your_general_channel_id
```

## 🛠️ Triggers

### Automated
The bot uses `node-cron` to run every Monday–Friday at 11:00 AM Colombo time.

### Manual
If you need to send reports right now, run:
```bash
node trigger.js
```

## 🤖 GitHub Actions
The bot is configured to run automatically via GitHub Actions. Ensure the following secrets are set in your repository:
- `DISCORD_TOKEN`
- `SOLIDTIME_API_TOKEN`
- `SOLIDTIME_ORGANIZATION_ID`
- `SOLIDTIME_API_URL`
- `PROJECT_MANAGEMENT_CHANNEL_ID`
- `FULL_TIME_ANNOUNCEMENTS_CHANNEL_ID`
- `GENERAL_CHANNEL_ID`

---
*Built for ZOT Bot Lab*
