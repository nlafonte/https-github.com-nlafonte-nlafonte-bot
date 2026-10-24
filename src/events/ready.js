const { ActivityType, Events } = require('discord.js');
const { startTwitchWatcher } = require('../services/twitchWatcher');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    // Type "Streaming" (et uniquement celui-ci) permet d'afficher un lien cliquable,
    // mais Discord n'accepte que twitch.tv ou youtube.com comme url.
    client.user.setActivity('Follow nlafonte sur Twitch', { type: ActivityType.Streaming, url: 'https://twitch.tv/nlafonte' });
    startTwitchWatcher(client);
  },
};
