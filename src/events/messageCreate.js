const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config');
const levels = require('../utils/levels');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const amount = Math.floor(Math.random() * (config.xp.maxPerMessage - config.xp.minPerMessage + 1)) + config.xp.minPerMessage;
    const result = levels.addXp(message.author.id, amount, config.xp.cooldownMs);

    if (result && result.leveledUp) {
      const targetChannelId = config.levelUpChannelId || message.channel.id;
      const channel = message.guild.channels.cache.get(targetChannelId) || message.channel;

      const embed = new EmbedBuilder()
        .setDescription(`🎉 ${message.author} passe **niveau ${result.level}** !`)
        .setColor(0xf1c40f);

      channel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
