require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const headers = {
  Authorization: `Bot ${TOKEN}`,
  'Content-Type': 'application/json',
};

const roleIds = [
  '1562905661770174577', // Admin
  '1562905978058309694', // Modérateur
  '1562906339221577798', // Membre
];

async function main() {
  for (const id of roleIds) {
    const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ hoist: true }),
    });
    const data = await res.json();
    console.log(res.ok ? `✅ ${data.name}` : `❌ ${id} — ${JSON.stringify(data)}`);
    await new Promise((r) => setTimeout(r, 400));
  }
}

main();
