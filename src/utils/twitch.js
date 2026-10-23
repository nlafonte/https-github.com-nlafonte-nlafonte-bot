const config = require('../config');

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAppToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.twitch.clientId,
      client_secret: config.twitch.clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twitch auth (${res.status}) : ${JSON.stringify(data)}`);

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

// Retourne les infos du stream si le login est actuellement en direct, sinon null.
async function getLiveStream(login) {
  const token = await getAppToken();
  const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`, {
    headers: {
      'Client-Id': config.twitch.clientId,
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twitch streams (${res.status}) : ${JSON.stringify(data)}`);
  return data.data?.[0] || null;
}

module.exports = { getLiveStream };
