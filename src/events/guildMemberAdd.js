const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('node:path');
const config = require('../config');

const BANNER_PATH = path.join(__dirname, '..', '..', 'assets', 'bienvenue.png');
const EMOJI_BIENVENUE = '<:bienvenue:1562920145561587726>';
const EMOJI_COEUR = '<:coeur:1562920220086108260>';

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

    const attachment = new AttachmentBuilder(BANNER_PATH, { name: 'bienvenue.png' });

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJI_BIENVENUE}  Bienvenue ${member.user.username} !`)
      .setDescription(
        `${member} vient de rejoindre **${member.guild.name}** ${EMOJI_COEUR}\n` +
          (config.rulesChannelId ? `N'oublie pas de lire <#${config.rulesChannelId}>.` : ''),
      )
      .setColor(0xe67e22)
      .setImage('attachment://bienvenue.png')
      .setFooter({ text: `⭐ Membre n°${member.guild.memberCount}` })
      .setTimestamp();

    channel
      .send({ embeds: [embed], files: [attachment] })
      .catch((err) => console.error('Impossible d\'envoyer le message de bienvenue :', err));
  },
};
