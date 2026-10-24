// Copie l'avatar actuel du bot (user) vers l'icône de l'application
// (affichée sur la fiche d'installation / App Directory), qui est un réglage séparé.
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const API = 'https://discord.com/api/v10';
const headers = { Authorization: `Bot ${TOKEN}` };

(async () => {
  const userRes = await fetch(`${API}/users/@me`, { headers });
  const user = await userRes.json();
  if (!userRes.ok) {
    console.error('❌ Impossible de récupérer le bot :', user);
    return;
  }
  if (!user.avatar) {
    console.error("❌ Le bot n'a pas d'avatar actuellement.");
    return;
  }

  const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
  const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=512`;

  const imgRes = await fetch(avatarUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const mime = ext === 'gif' ? 'image/gif' : 'image/png';
  const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;

  const patchRes = await fetch(`${API}/applications/@me`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ icon: dataUri }),
  });

  if (patchRes.ok) {
    console.log("✅ Icône de l'application synchronisée avec l'avatar du bot.");
  } else {
    console.error(`❌ ${patchRes.status} : ${await patchRes.text()}`);
  }
})();
