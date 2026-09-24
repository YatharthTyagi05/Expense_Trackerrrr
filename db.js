// Plain-JSON file "database". No native modules, no compilation step —
// this avoids the sqlite3 node-gyp/prebuild problems entirely.
// Same shape of data as the old SQLite tables, just persisted as JSON.

const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'tracker-data.json');

function emptyState() {
  return { users: {}, entries: [], goals: [], budgets: [] };
}

function load() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Object.assign(emptyState(), parsed);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Could not read ${DATA_PATH}, starting fresh:`, err.message);
    }
    return emptyState();
  }
}

let state = load();

function save() {
  // Write to a temp file then rename, so a crash mid-write can't corrupt the data file.
  const tmpPath = DATA_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
  fs.renameSync(tmpPath, DATA_PATH);
}

console.log(`Using JSON data file at ${DATA_PATH}`);

module.exports = {
  // ---------- Users ----------
  getOrCreateUser(id) {
    if (!state.users[id]) {
      state.users[id] = { id, created_at: new Date().toISOString() };
      save();
    }
    return state.users[id];
  },

  // ---------- Entries ----------
  insertEntry(entry) {
    state.entries.push(entry);
    save();
    return entry;
  },
  listEntries(userId) {
    return state.entries
      .filter(e => e.user_id === userId)
      .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : (b.id > a.id ? 1 : -1)));
  },
  deleteEntry(id, userId) {
    const before = state.entries.length;
    state.entries = state.entries.filter(e => !(e.id === id && e.user_id === userId));
    if (state.entries.length !== before) save();
  },

  // ---------- Goals ----------
  insertGoal(goal) {
    state.goals.push(goal);
    save();
    return goal;
  },
  listGoals(userId) {
    return state.goals.filter(g => g.user_id === userId);
  },
  deleteGoal(id, userId) {
    const before = state.goals.length;
    state.goals = state.goals.filter(g => !(g.id === id && g.user_id === userId));
    if (state.goals.length !== before) save();
  },

  // ---------- Budgets ----------
  setBudget(userId, category, amount) {
    state.budgets = state.budgets.filter(b => !(b.user_id === userId && b.category === category));
    state.budgets.push({ user_id: userId, category, amount });
    save();
  },
  listBudgets(userId) {
    return state.budgets.filter(b => b.user_id === userId);
  },
  deleteBudget(userId, category) {
    const before = state.budgets.length;
    state.budgets = state.budgets.filter(b => !(b.user_id === userId && b.category === category));
    if (state.budgets.length !== before) save();
  },
};
