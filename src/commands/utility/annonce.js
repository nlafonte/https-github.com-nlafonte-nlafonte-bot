const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getOrCreateWebhook } = require('../../utils/liveWebhook');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('annonce')
    .setDescription('Publie une annonce dans #annonces')
    .addStringOption((opt) => opt.setName('titre').setDescription("Titre de l'annonce").setRequired(true))
    .addStringOption((opt) => opt.setName('message').setDescription("Contenu de l'annonce").setRequired(true))
    .addStringOption((opt) => opt.setName('lien').setDescription('Lien à associer (optionnel)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const titre = interaction.options.getString('titre');
    const message = interaction.options.getString('message');
    const lien = interaction.options.getString('lien');

    const channelId = config.announceChannelId;
    const channel = channelId ? interaction.guild.channels.cache.get(channelId) : null;
    if (!channel) {
      return interaction.reply({ content: "❌ Salon d'annonce introuvable (ANNOUNCE_CHANNEL_ID non configuré).", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const webhook = await getOrCreateWebhook(channel);

      const embed = new EmbedBuilder()
        .setTitle(`📢 ${titre}`)
        .setDescription(message)
        .setColor(0xe67e22)
        .setTimestamp();
      if (lien) {
        embed.setURL(lien);
        embed.addFields({ name: 'Lien', value: `[Clique ici](${lien})` });
      }

      await webhook.send({
        username: `${interaction.user.username} annonce`,
        avatarURL: interaction.user.displayAvatarURL(),
        content: '@everyone',
        embeds: [embed],
        allowedMentions: { parse: ['everyone'] },
      });

      await interaction.editReply(`✅ Annonce envoyée dans ${channel}.`);
    } catch (err) {
      console.error('Erreur /annonce :', err);
      await interaction.editReply("❌ Impossible d'envoyer l'annonce (permissions webhook manquantes ?).");
    }
  },
};
