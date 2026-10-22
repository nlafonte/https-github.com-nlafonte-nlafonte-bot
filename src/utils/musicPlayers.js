const sessions = new Map();

function setSession(guildId, entry) {
  sessions.set(guildId, entry);
}

function getSession(guildId) {
  return sessions.get(guildId);
}

function clearSession(guildId) {
  sessions.delete(guildId);
}

module.exports = { setSession, getSession, clearSession };
