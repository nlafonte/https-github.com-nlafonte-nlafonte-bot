const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getOrCreateWebhook } = require('../../utils/liveWebhook');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('live')
    .setDescription('Annonce que tu es en direct dans #twitch')
    .addStringOption((opt) => opt.setName('titre').setDescription('Titre du stream').setRequired(true))
    .addStringOption((opt) => opt.setName('lien').setDescription('Lien de la chaîne (Twitch, YouTube...)').setRequired(true))
    .addStringOption((opt) => opt.setName('jeu').setDescription('Jeu ou catégorie du stream'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const titre = interaction.options.getString('titre');
    const lien = interaction.options.getString('lien');
    const jeu = interaction.options.getString('jeu');

    const channelId = config.liveChannelId || config.announceChannelId;
    const channel = channelId ? interaction.guild.channels.cache.get(channelId) : null;
    if (!channel) {
      return interaction.reply({ content: "❌ Salon d'annonce introuvable (LIVE_CHANNEL_ID non configuré).", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const webhook = await getOrCreateWebhook(channel);

      const embed = new EmbedBuilder()
        .setTitle(`🔴 ${titre}`)
        .setURL(lien)
        .setColor(0x9146ff)
        .setTimestamp();
      if (jeu) embed.addFields({ name: 'Catégorie', value: jeu, inline: true });
      embed.addFields({ name: 'Regarder', value: `[Clique ici pour rejoindre](${lien})` });

      await webhook.send({
        username: `${interaction.user.username} est en live !`,
        avatarURL: interaction.user.displayAvatarURL(),
        content: '@everyone',
        embeds: [embed],
        allowedMentions: { parse: ['everyone'] },
      });

      await interaction.editReply(`✅ Annonce envoyée dans ${channel}.`);
    } catch (err) {
      console.error('Erreur /live :', err);
      await interaction.editReply("❌ Impossible d'envoyer l'annonce (permissions webhook manquantes ?).");
    }
  },
};
