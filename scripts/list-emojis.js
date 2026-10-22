require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/emojis`, {
  headers: { Authorization: `Bot ${TOKEN}` },
})
  .then((r) => r.json())
  .then((data) => {
    data.forEach((e) => console.log(`${e.name} -> <:${e.name}:${e.id}>`));
    console.log(`Total: ${data.length}`);
  });
