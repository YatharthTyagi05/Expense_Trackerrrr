require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Simple user session ----------
function getOrCreateUser(req, res, next) {
  let userId = req.headers['x-user-id'] || req.body.userId;

  if (!userId) {
    userId = uuidv4();
    res.set('X-User-ID', userId);
  }

  db.getOrCreateUser(userId);
  req.userId = userId;
  next();
}

app.use(getOrCreateUser);

// ---------- Entries (expenses/income/savings) ----------
app.post('/api/entries', (req, res) => {
  const { type, amount, category, goalId, date, note } = req.body;
  const id = uuidv4();

  const entry = {
    id,
    user_id: req.userId,
    type,
    amount,
    category: category || null,
    goal_id: goalId || null,
    date,
    note: note || '',
    created_at: new Date().toISOString(),
  };

  try {
    db.insertEntry(entry);
    res.json({ id, type, amount, category, goalId, date, note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/entries', (req, res) => {
  try {
    res.json(db.listEntries(req.userId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/:id', (req, res) => {
  try {
    db.deleteEntry(req.params.id, req.userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Goals ----------
app.post('/api/goals', (req, res) => {
  const { name, target } = req.body;
  const id = uuidv4();
  const goal = { id, user_id: req.userId, name, target, created_at: new Date().toISOString() };

  try {
    db.insertGoal(goal);
    res.json({ id, name, target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/goals', (req, res) => {
  try {
    res.json(db.listGoals(req.userId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/goals/:id', (req, res) => {
  try {
    db.deleteGoal(req.params.id, req.userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Budgets ----------
app.post('/api/budgets/:category', (req, res) => {
  const { amount } = req.body;
  const { category } = req.params;

  try {
    db.setBudget(req.userId, category, amount);
    res.json({ category, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/budgets', (req, res) => {
  try {
    const obj = {};
    db.listBudgets(req.userId).forEach(row => obj[row.category] = row.amount);
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/budgets/:category', (req, res) => {
  try {
    db.deleteBudget(req.userId, req.params.category);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Export ----------
app.get('/api/export', (req, res) => {
  try {
    const entries = db.listEntries(req.userId);
    const goals = db.listGoals(req.userId);
    const budgets = {};
    db.listBudgets(req.userId).forEach(row => budgets[row.category] = row.amount);
    res.json({ entries, goals, budgets, exportedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
