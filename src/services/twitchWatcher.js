const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getLiveStream } = require('../utils/twitch');
const { getOrCreateWebhook } = require('../utils/liveWebhook');
const { load, save } = require('../utils/store');

const CHECK_INTERVAL_MS = 90_000;

function startTwitchWatcher(client) {
  const { clientId, clientSecret, login } = config.twitch;
  if (!clientId || !clientSecret || !login) {
    console.log('ℹ️ Surveillance Twitch désactivée (TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET / TWITCH_LOGIN manquants).');
    return;
  }
  if (!config.liveChannelId) {
    console.log('ℹ️ Surveillance Twitch désactivée (LIVE_CHANNEL_ID manquant).');
    return;
  }

  console.log(`📡 Surveillance Twitch activée pour "${login}" (vérification toutes les ${CHECK_INTERVAL_MS / 1000}s).`);
  const tick = () => checkOnce(client).catch((err) => console.error('Erreur surveillance Twitch :', err));
  tick();
  setInterval(tick, CHECK_INTERVAL_MS);
}

async function checkOnce(client) {
  const state = load('twitch-status', { wasLive: false, lastStreamId: null });
  const stream = await getLiveStream(config.twitch.login);
  const isLive = Boolean(stream);

  if (isLive && (!state.wasLive || state.lastStreamId !== stream.id)) {
    await announce(client, stream);
    save('twitch-status', { wasLive: true, lastStreamId: stream.id });
  } else if (!isLive && state.wasLive) {
    save('twitch-status', { wasLive: false, lastStreamId: null });
  }
}

async function announce(client, stream) {
  const guild = client.guilds.cache.get(config.guildId);
  const channel = guild?.channels.cache.get(config.liveChannelId);
  if (!channel) return;

  const thumbnail = stream.thumbnail_url.replace('{width}', '640').replace('{height}', '360') + `?t=${Date.now()}`;

  const embed = new EmbedBuilder()
    .setTitle(`🔴 ${stream.title || 'En direct sur Twitch !'}`)
    .setURL(`https://twitch.tv/${config.twitch.login}`)
    .setColor(0x9146ff)
    .setImage(thumbnail)
    .addFields({ name: 'Catégorie', value: stream.game_name || 'Non précisée', inline: true })
    .setTimestamp();

  try {
    const webhook = await getOrCreateWebhook(channel);
    await webhook.send({
      username: `${stream.user_name} est en live sur Twitch !`,
      avatarURL: client.user.displayAvatarURL(),
      content: '@everyone',
      embeds: [embed],
      allowedMentions: { parse: ['everyone'] },
    });
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'annonce Twitch :", err);
  }
}

module.exports = { startTwitchWatcher };
