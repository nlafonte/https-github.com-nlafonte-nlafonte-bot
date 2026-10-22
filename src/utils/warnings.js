const { load, save } = require('./store');

function getAll(userId) {
  const data = load('warnings', { users: {} });
  return data.users[userId] || [];
}

function add(userId, moderatorId, reason) {
  const data = load('warnings', { users: {} });
  if (!data.users[userId]) data.users[userId] = [];
  const entry = { moderatorId, reason, date: new Date().toISOString() };
  data.users[userId].push(entry);
  save('warnings', data);
  return data.users[userId].length;
}

module.exports = { getAll, add };
