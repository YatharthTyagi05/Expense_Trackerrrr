# Where It Goes — Expense Tracker with Real Database

A reliable expense tracker that syncs all your data to a real database on the server. **No more lost data.**

## What's new in this version

- **Savings goals** — a new Goals tab. Create a goal with a name and target amount, then choose it whenever you log a saving. Each goal shows a progress bar and how much is left.
- **Monthly budgets** — a new Budgets tab that uses the budget API the backend already had but the old UI never exposed. Set a monthly cap per category and see a progress bar against the month you're viewing (turns red if you go over).
- **Category breakdown** — the Overview tab now shows a bar chart of where your money went this month, by category.
- **Refreshed UI** — refined spacing, subtle shadows, category icons, a gradient title accent, and animated progress bars.
- **Light/dark theme toggle** — tap the 🌙/☀️ button top-right; your choice is remembered.
- **History filters** — quickly filter the activity list to just expenses, income, or savings.
- **Export button** — one tap in Overview downloads all your data as JSON (this used the existing `/api/export` endpoint, previously only reachable by URL).

Your entries survive:
- Browser clears/crashes
- Device restarts
- Clearing cache
- Switching devices (if you run the same app on multiple phones)

## Architecture

```
Your Phone/Browser
        ↓
   (sends expense)
        ↓
  Backend Server (Node.js)
        ↓
   tracker-data.json (a plain JSON file on disk)
```

The backend safely stores everything. The app talks to your server, not directly to the file.

> **Why not SQLite?** An earlier version of this app used the `sqlite3` npm package,
> which needs a native binary compiled for your exact OS, CPU, and Node version. On newer
> Node/npm versions that compile step is often blocked or fails outright (you'd see an error
> like `Could not locate the bindings file`). Switching to a plain JSON file removes that
> failure mode entirely — nothing to compile, works the same on every machine.

## Local Setup (for development)

### Prerequisites
- Node.js 16+ (download from nodejs.org)
- npm (comes with Node.js)

### Steps

1. **Extract the files**
   ```bash
   cd expense-app-with-db
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` from the example**
   ```bash
   cp .env.example .env
   ```
   (You can leave `.env` as-is for local SQLite development)

4. **Start the server**
   ```bash
   npm start
   ```
   You should see: `Server running at http://localhost:3000`

5. **Open in your browser**
   Go to `http://localhost:3000` on the same computer or phone on the same WiFi.

## How it works

- **First time**: App generates a unique user ID and stores it in your browser's localStorage
- **Each entry**: Gets saved to the SQLite database on your computer
- **Offline**: If the server is down, entries are queued and synced when it's back
- **Multiple devices**: If you access from a different phone, you get a new user ID — to share data across devices, you'd need user accounts (not included in this starter)

## Deployment (so it's not just on your computer)

### Option 1: Render (easiest for beginners)

1. Create a free account at https://render.com
2. Connect your GitHub repo
3. Create a new "Web Service"
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variable in the Render dashboard:
   - Key: `DATABASE_URL`
   - Value: leave blank for SQLite on Render (data persists), or paste a PostgreSQL URL
5. Deploy — takes 2 minutes

**Important**: Render's free tier has limitations. For production, upgrade or use Railway.

### Option 2: Railway (also easy, slightly better free tier)

1. Sign up at https://railway.app
2. Connect your GitHub
3. Railway detects `package.json` and auto-runs it
4. Set `PORT=3000` in the Railway dashboard
5. Deploy

### Option 3: Your own VPS (full control)

Rent a small server from DigitalOcean ($5/month) or Linode, SSH in, clone the repo, run `npm start` inside `screen` or `tmux`, done.

## Upgrading to a real database (production-ready)

The JSON file in `db.js` is great for one person's data on a single server, but it isn't built
for many simultaneous users or multiple server instances. If you outgrow it, swap `db.js` for
a version backed by Postgres (Render and Railway both offer free Postgres) or another database —
the rest of `server.js` calls a small, well-defined set of functions (`insertEntry`, `listEntries`,
`insertGoal`, etc.), so only `db.js` needs to change.

## API Endpoints (for reference)

```
POST   /api/entries              Create an expense/income/saving
GET    /api/entries              Get all entries for this user
DELETE /api/entries/:id          Delete an entry

POST   /api/goals                Create a savings goal (name, target)
GET    /api/goals                Get all goals for this user
DELETE /api/goals/:id            Delete a goal

GET    /api/export               Export all data as JSON
GET    /api/budgets              Get budget limits
POST   /api/budgets/:category    Set budget for a category
DELETE /api/budgets/:category    Remove a category's budget

GET    /                         The web interface
```

All endpoints require the `X-User-ID` header (the app sets this automatically).

## Data backup

Even with a server, you can export your data:
- On the app, there's an export button (if you want to add it back)
- Or hit `/api/export` in your browser to download raw JSON

## Troubleshooting

**"Cannot connect to server"**
- Make sure the server is running (`npm start`)
- If on a phone, make sure both phone and computer are on the same WiFi
- Use the computer's IP address instead of `localhost`: find it with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

**"Could not locate the bindings file" / sqlite3 errors**
- You likely have an older copy of this project. This version doesn't use `sqlite3` at all —
  delete `node_modules` and `package-lock.json`, then run `npm install` again with these files.

**Data not appearing after an entry**
- Check the browser console (F12, Console tab) for errors
- Look at the server terminal for error messages
- Try a full page reload

## Next Steps

From here you could add:
- Real user accounts (sign up / login)
- Sharing expense splits with friends
- Mobile app (React Native)
- CSV import from your bank
- Budget alerts
- Investment tracking

All the groundwork is in place.

## Privacy

All data is stored on **your** server. Nobody has access except you. This is the opposite of SaaS — you own everything.

---

Happy tracking! Any issues, check the server logs.
