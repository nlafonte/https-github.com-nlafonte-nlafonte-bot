require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const headers = { Authorization: `Bot ${TOKEN}` };

async function main() {
  const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/threads/active`, { headers });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2).slice(0, 3000));

  if (data.threads) {
    for (const t of data.threads) {
      const msgsRes = await fetch(`https://discord.com/api/v10/channels/${t.id}/messages?limit=10`, { headers });
      const msgs = await msgsRes.json();
      if (Array.isArray(msgs)) {
        msgs.forEach((m) => {
          if (m.attachments && m.attachments.length) {
            m.attachments.forEach((a) => console.log(`THREAD ${t.name} | ${m.author.username} | ${a.url}`));
          }
        });
      }
    }
  }
}
main();
