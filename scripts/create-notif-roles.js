require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const ROLES = [
  { name: '🟣 Notif Twitch', color: 0x9146ff },
  { name: '▶️ Notif YouTube', color: 0xff0000 },
  { name: '📢 Notif Annonce', color: 0xe67e22 },
];

(async () => {
  for (const role of ROLES) {
    const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: role.name,
        color: role.color,
        hoist: false,
        mentionable: true,
        permissions: '0',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`❌ Échec création "${role.name}" :`, data);
      continue;
    }
    console.log(`✅ ${role.name} -> ${data.id}`);
  }
})();
