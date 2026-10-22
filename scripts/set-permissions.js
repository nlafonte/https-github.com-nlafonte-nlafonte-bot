require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const headers = {
  Authorization: `Bot ${TOKEN}`,
  'Content-Type': 'application/json',
};

const SEND_MESSAGES = '2048';
const MODERATEUR_ROLE_ID = '1562905978058309694';

// Salons "lecture seule" : seuls Admin/Modérateur (et le bot) peuvent écrire.
const readOnlyChannels = {
  règlement: '1562896090108395592',
  bienvenue: '1562896259243708426',
  rôles: '1562896316277719070',
  annonces: '1562896365095489546',
  feed: '1562896429708742726',
  notifs: '1562896455377625199',
  support: '1562896586105692221',
};

async function setOverwrite(channelId, id, type, allow, deny) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/permissions/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ allow, deny, type }),
  });
  return res.ok;
}

async function main() {
  for (const [name, channelId] of Object.entries(readOnlyChannels)) {
    // @everyone : refuse l'envoi de messages
    const ok1 = await setOverwrite(channelId, GUILD_ID, 0, '0', SEND_MESSAGES);
    // Modérateur : autorise explicitement (Admin passe par le bypass Administrateur)
    const ok2 = await setOverwrite(channelId, MODERATEUR_ROLE_ID, 0, SEND_MESSAGES, '0');
    console.log(`${ok1 && ok2 ? '✅' : '❌'} #${name}`);
    await new Promise((r) => setTimeout(r, 400));
  }
}

main();
