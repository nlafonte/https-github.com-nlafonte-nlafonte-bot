const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (config.autoroleId) {
      const role = member.guild.roles.cache.get(config.autoroleId);
      if (role) {
        await member.roles.add(role).catch((err) => console.error('Impossible d\'attribuer le rôle auto :', err));
      }
    }

    if (!config.welcomeChannelId) return;
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`👋 Bienvenue ${member.user.username} !`)
      .setDescription(
        `${member} vient de rejoindre **${member.guild.name}** !\n` +
          (config.rulesChannelId ? `N'oublie pas de lire <#${config.rulesChannelId}>.` : ''),
      )
      .setColor(0x57f287)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `Membre n°${member.guild.memberCount}` })
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch((err) => console.error('Impossible d\'envoyer le message de bienvenue :', err));
  },
};
