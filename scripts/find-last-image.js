require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;
const headers = { Authorization: `Bot ${TOKEN}` };

const channels = [
  ['support', '1562896586105692221'],
  ['règlement', '1562896090108395592'],
  ['discussion', '1562896654384766976'],
  ['bienvenue', '1562896259243708426'],
  ['annonces', '1562896365095489546'],
  ['rôles', '1562896316277719070'],
  ['notifs', '1562896455377625199'],
  ['recrutements', '1562896505277255700'],
  ['boosters', '1562896548533108786'],
  ['médias', '1562896692511113386'],
  ['bots', '1562896792712908830'],
  ['mon-studio', '1562897018492555374'],
];

async function main() {
  for (const [name, id] of channels) {
    const res = await fetch(`https://discord.com/api/v10/channels/${id}/messages?limit=10`, { headers });
    const msgs = await res.json();
    if (!Array.isArray(msgs)) continue;
    for (const m of msgs) {
      if (m.attachments && m.attachments.length) {
        m.attachments.forEach((a) => console.log(`#${name} | ${m.author.username} | ${a.url}`));
      }
    }
  }
}
main();
