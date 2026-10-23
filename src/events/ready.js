const { ActivityType, Events } = require('discord.js');
const { startTwitchWatcher } = require('../services/twitchWatcher');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    client.user.setActivity('nlafonte', { type: ActivityType.Watching });
    startTwitchWatcher(client);
  },
};
