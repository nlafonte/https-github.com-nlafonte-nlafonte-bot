const sessions = new Map();

function setSession(guildId, entry) {
  sessions.set(guildId, entry);
}
function getSession(guildId) {
  return sessions.get(guildId);
}
function clearSession(guildId, expectedSession) {
  if (expectedSession && sessions.get(guildId) !== expectedSession) return false;
  return sessions.delete(guildId);
}
function stopSession(guildId, expectedSession) {
  const session = sessions.get(guildId);
  if (!session || (expectedSession && session !== expectedSession)) return false;
  sessions.delete(guildId);
  try { session.player?.stop(true); } catch (err) { console.warn('[song] stop:', err.message); }
  try { if (session.ffmpegProcess && !session.ffmpegProcess.killed) session.ffmpegProcess.kill('SIGKILL'); } catch (err) { console.warn('[song] ffmpeg:', err.message); }
  try { if (session.connection?.state?.status !== 'destroyed') session.connection?.destroy(); } catch (err) { console.warn('[song] voice:', err.message); }
  return true;
}
module.exports = { setSession, getSession, clearSession, stopSession };
