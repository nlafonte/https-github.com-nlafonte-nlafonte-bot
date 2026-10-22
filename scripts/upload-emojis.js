// Script ponctuel : upload en masse d'un dossier d'emojis vers le serveur via l'API Discord (bot token).
// Usage : node scripts/upload-emojis.js "<dossier contenant les .png>"
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.error('❌ DISCORD_TOKEN / GUILD_ID manquants dans .env');
  process.exit(1);
}

const folder = process.argv[2];
if (!folder || !fs.existsSync(folder)) {
  console.error('❌ Fournis un dossier valide en argument.');
  process.exit(1);
}

const API = 'https://discord.com/api/v10';

function sanitizeName(filename) {
  let name = path.basename(filename, path.extname(filename));
  // retire un préfixe numérique type "001_"
  name = name.replace(/^\d+_/, '');
  name = name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (name.length < 2) name = name.padEnd(2, '_');
  if (name.length > 32) name = name.slice(0, 32);
  return name;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const guildRes = await fetch(`${API}/guilds/${GUILD_ID}`, {
    headers: { Authorization: `Bot ${TOKEN}` },
  });
  const guild = await guildRes.json();
  if (!guildRes.ok) {
    console.error('❌ Impossible de lire le serveur :', guild);
    process.exit(1);
  }

  const tierLimits = { 0: 50, 1: 100, 2: 150, 3: 250 };
  const limit = tierLimits[guild.premium_tier] ?? 50;

  const emojisRes = await fetch(`${API}/guilds/${GUILD_ID}/emojis`, {
    headers: { Authorization: `Bot ${TOKEN}` },
  });
  const existing = await emojisRes.json();
  const staticCount = existing.filter((e) => !e.animated).length;
  const remaining = limit - staticCount;

  console.log(`ℹ️  Niveau de boost : ${guild.premium_tier} — limite statique : ${limit}`);
  console.log(`ℹ️  Emojis statiques déjà présents : ${staticCount}`);
  console.log(`ℹ️  Emplacements restants : ${remaining}`);

  const files = fs
    .readdirSync(folder)
    .filter((f) => /\.(png|jpe?g|gif)$/i.test(f))
    .sort();

  if (remaining <= 0) {
    console.error('❌ Aucun emplacement disponible.');
    process.exit(1);
  }

  const toUpload = files.slice(0, remaining);
  console.log(`🚀 Upload de ${toUpload.length} / ${files.length} emojis...`);

  const existingNames = new Set(existing.map((e) => e.name));
  let success = 0;
  let failed = [];

  for (const file of toUpload) {
    let name = sanitizeName(file);
    let suffix = 1;
    let finalName = name;
    while (existingNames.has(finalName)) {
      finalName = `${name}_${suffix++}`;
    }

    const filePath = path.join(folder, file);
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase() === '.jpg' || path.extname(file).toLowerCase() === '.jpeg' ? 'jpeg' : path.extname(file).slice(1).toLowerCase();
    const dataUri = `data:image/${ext};base64,${buffer.toString('base64')}`;

    try {
      const res = await fetch(`${API}/guilds/${GUILD_ID}/emojis`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: finalName, image: dataUri }),
      });

      if (res.ok) {
        existingNames.add(finalName);
        success++;
        console.log(`✅ ${finalName}`);
      } else {
        const err = await res.json().catch(() => ({}));
        failed.push({ file, error: err });
        console.log(`❌ ${finalName} — ${JSON.stringify(err)}`);
        if (res.status === 429) {
          const retryAfter = (err.retry_after || 5) * 1000;
          console.log(`⏳ Rate limit, pause ${retryAfter}ms...`);
          await sleep(retryAfter);
        }
      }
    } catch (e) {
      failed.push({ file, error: e.message });
      console.log(`❌ ${finalName} — ${e.message}`);
    }

    await sleep(1200); // marge anti rate-limit
  }

  console.log(`\n🎉 Terminé : ${success} ajoutés, ${failed.length} échoués.`);
  if (failed.length) {
    console.log('Échecs :', failed.map((f) => f.file).join(', '));
  }
}

main();
