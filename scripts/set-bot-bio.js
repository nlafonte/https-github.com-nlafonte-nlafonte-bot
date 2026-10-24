// Met à jour la description ("About Me") de l'application bot, visible sur son profil.
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const API = 'https://discord.com/api/v10';

const description =
  '🤖 Bot officiel du serveur **nlafonte** — modération, tickets, musique, notifications et bien plus.\n\n' +
  '🔴 Suis mes lives : https://twitch.tv/nlafonte';

(async () => {
  const res = await fetch(`${API}/applications/@me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });

  if (res.ok) {
    console.log('✅ Bio du bot mise à jour.');
  } else {
    console.error(`❌ ${res.status} : ${await res.text()}`);
  }
})();
