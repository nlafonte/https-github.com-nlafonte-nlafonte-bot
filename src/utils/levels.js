const { load, save } = require('./store');

const COOLDOWNS = new Map();

function xpForLevel(level) {
  return 5 * level ** 2 + 50 * level + 100;
}

function getData() {
  return load('levels', { users: {} });
}

function getUser(data, userId) {
  if (!data.users[userId]) {
    data.users[userId] = { xp: 0, level: 0 };
  }
  return data.users[userId];
}

function addXp(userId, amount, cooldownMs) {
  const now = Date.now();
  const last = COOLDOWNS.get(userId) || 0;
  if (now - last < cooldownMs) return null;
  COOLDOWNS.set(userId, now);

  const data = getData();
  const user = getUser(data, userId);
  user.xp += amount;

  let leveledUp = false;
  while (user.xp >= xpForLevel(user.level)) {
    user.xp -= xpForLevel(user.level);
    user.level += 1;
    leveledUp = true;
  }

  save('levels', data);
  return { leveledUp, level: user.level, xp: user.xp };
}

function getRank(userId) {
  const data = getData();
  const user = getUser(data, userId);
  save('levels', data);
  return user;
}

function getLeaderboard(limit = 10) {
  const data = getData();
  return Object.entries(data.users)
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => b.level - a.level || b.xp - a.xp)
    .slice(0, limit);
}

module.exports = { addXp, getRank, getLeaderboard, xpForLevel };
