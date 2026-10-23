// Nettoie les anciens messages du salon support et poste le nouveau panneau de ticket.
require('dotenv').config();
const { buildPanel } = require('../src/utils/tickets');

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.SUPPORT_CHANNEL_ID;
const API = 'https://discord.com/api/v10';
const headers = { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' };

async function main() {
  const msgsRes = await fetch(`${API}/channels/${CHANNEL_ID}/messages?limit=50`, { headers });
  const msgs = await msgsRes.json();
  if (Array.isArray(msgs)) {
    for (const msg of msgs) {
      await fetch(`${API}/channels/${CHANNEL_ID}/messages/${msg.id}`, { method: 'DELETE', headers });
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log(`🧹 ${msgs.length} ancien(s) message(s) supprimé(s).`);
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

  console.log(res.ok ? '✅ Nouveau panneau de ticket posté.' : `❌ ${await res.text()}`);
}

main();
