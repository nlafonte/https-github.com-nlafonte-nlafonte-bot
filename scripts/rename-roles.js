require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const headers = {
  Authorization: `Bot ${TOKEN}`,
  'Content-Type': 'application/json',
};

const updates = [
  { id: '1562905661770174577', name: '⚡ Admin' },
  { id: '1562905978058309694', name: '🛡️ Modérateur' },
  { id: '1562906339221577798', name: '👤 Membre' },
];

async function main() {
  for (const u of updates) {
    const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles/${u.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: u.name }),
    });
    if (res.ok) {
      console.log(`✅ ${u.name}`);
    } else {
      console.log(`❌ ${u.name} — ${await res.text()}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

main();
