// Script ponctuel : nettoie #règlement et poste le règlement sous forme d'embed propre.
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const RULES_CHANNEL_ID = process.env.RULES_CHANNEL_ID;
const API = 'https://discord.com/api/v10';

const headers = {
  Authorization: `Bot ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function main() {
  // 1. Récupère et supprime les anciens messages du salon
  const msgsRes = await fetch(`${API}/channels/${RULES_CHANNEL_ID}/messages?limit=100`, { headers });
  const msgs = await msgsRes.json();

  if (Array.isArray(msgs)) {
    for (const msg of msgs) {
      await fetch(`${API}/channels/${RULES_CHANNEL_ID}/messages/${msg.id}`, {
        method: 'DELETE',
        headers,
      });
      await new Promise((r) => setTimeout(r, 400));
    }
    console.log(`🧹 ${msgs.length} ancien(s) message(s) supprimé(s).`);
  }

  // 2. Récupère les emojis du serveur pour les intégrer au message
  const emojisRes = await fetch(`${API}/guilds/${process.env.GUILD_ID}/emojis`, { headers });
  const emojis = await emojisRes.json();
  const e = (name) => {
    const found = emojis.find((em) => em.name === name);
    return found ? `<:${found.name}:${found.id}>` : '•';
  };

  const refus = e('refus');
  const reglement = e('reglement');
  const avertissement = e('avertissement');
  const divider = '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯';

  // 3. Poste le nouvel embed
  const embed = {
    title: `${reglement}  Règlement`,
    description:
      "┃ En rejoignant le serveur **nlafonte**, vous acceptez le règlement ci-dessous afin de garder une ambiance **agréable** et **respectueuse**.\n\n" +
      `${divider}\n\n` +
      `${refus} Pas d'utilisation d'une langue autre que le **français** ;\n` +
      `${refus} Pas de **hors-sujet** dans les salons concernés ;\n` +
      `${refus} Pas de **publicité** ;\n` +
      `${refus} Pas de **double compte** ;\n` +
      `${refus} Pas de **spam** ;\n` +
      `${refus} Pas d'**abus de @mentions** ;\n` +
      `${refus} Pas de contenu **NSFW** ;\n` +
      `${refus} Pas de discussions **politiques** ou **religieuses** ;\n` +
      `${refus} Pas de débats concernant le **genre** ou l'**orientation sexuelle** ;\n` +
      `${refus} Pas de remarque **raciste, misogyne ou homophobe** ;\n` +
      `${refus} Pas d'utilisation abusive des **majuscules**.\n\n` +
      `${divider}\n\n` +
      `${avertissement} Toute **violation** de ce règlement résultera d'une **sanction** de la part de l'équipe de modération.`,
    color: 0x5865f2,
  };

  const postRes = await fetch(`${API}/channels/${RULES_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (postRes.ok) {
    console.log('✅ Règlement posté avec succès.');
  } else {
    console.error('❌ Échec :', await postRes.text());
  }
}

main();
