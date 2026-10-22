require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
  headers: { Authorization: `Bot ${TOKEN}` },
})
  .then((r) => r.json())
  .then((data) => data.forEach((c) => console.log(`${c.id} | type ${c.type} | "${c.name}"`)));
