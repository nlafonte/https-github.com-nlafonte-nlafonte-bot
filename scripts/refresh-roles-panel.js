// Nettoie les anciens messages du bot dans #rôles et poste le panneau de notification.
require('dotenv').config();
const { buildPanel } = require('../src/utils/notifRoles');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CHANNEL_ID = process.env.ROLES_CHANNEL_ID;
const API = 'https://discord.com/api/v10';
const headers = { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' };

async function main() {
  const msgsRes = await fetch(`${API}/channels/${CHANNEL_ID}/messages?limit=50`, { headers });
  const msgs = await msgsRes.json();
  if (Array.isArray(msgs)) {
    const botMsgs = msgs.filter((m) => m.author?.id === CLIENT_ID);
    for (const msg of botMsgs) {
      await fetch(`${API}/channels/${CHANNEL_ID}/messages/${msg.id}`, { method: 'DELETE', headers });
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log(`🧹 ${botMsgs.length} ancien(s) message(s) du bot supprimé(s).`);
  }

  const panel = buildPanel();
  const body = {
    embeds: panel.embeds.map((e) => e.toJSON()),
    components: panel.components.map((c) => c.toJSON()),
  };

  const res = await fetch(`${API}/channels/${CHANNEL_ID}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  console.log(res.ok ? '✅ Nouveau panneau de rôles posté.' : `❌ ${await res.text()}`);
}

main();
