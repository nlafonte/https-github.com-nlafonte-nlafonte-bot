const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const config = require('../../config');
const { getOrCreateWebhook } = require('../../utils/liveWebhook');

const MODAL_ID = 'annonce_modal';

module.exports = {
  MODAL_ID,
  data: new SlashCommandBuilder()
    .setName('annonce')
    .setDescription('Ouvre un formulaire pour publier une annonce dans #annonces')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const modal = new ModalBuilder().setCustomId(MODAL_ID).setTitle('Nouvelle annonce');

    const titreInput = new TextInputBuilder()
      .setCustomId('titre')
      .setLabel('Titre')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const messageInput = new TextInputBuilder()
      .setCustomId('message')
      .setLabel('Message')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(2000);

    const lienInput = new TextInputBuilder()
      .setCustomId('lien')
      .setLabel('Lien (optionnel)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titreInput),
      new ActionRowBuilder().addComponents(messageInput),
      new ActionRowBuilder().addComponents(lienInput),
    );

    await interaction.showModal(modal);
  },

  async handleModalSubmit(interaction) {
    const titre = interaction.fields.getTextInputValue('titre');
    const message = interaction.fields.getTextInputValue('message');
    const lien = interaction.fields.getTextInputValue('lien');

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
        embed.addFields({ name: '<:lien:1562933815700226159> Lien', value: `[Clique ici](${lien})` });
      }

      const annonceRoleId = config.notifRoles.annonceRoleId;
      const ping = annonceRoleId ? `<@&${annonceRoleId}>` : '@everyone';

      await webhook.send({
        username: `${interaction.user.username} annonce`,
        avatarURL: interaction.user.displayAvatarURL(),
        content: `<:annonces:1562920124795846792> ${ping}`,
        embeds: [embed],
        allowedMentions: annonceRoleId ? { roles: [annonceRoleId] } : { parse: ['everyone'] },
      });

      await interaction.editReply(`✅ Annonce envoyée dans ${channel}.`);
    } catch (err) {
      console.error('Erreur /annonce :', err);
      await interaction.editReply("❌ Impossible d'envoyer l'annonce (permissions webhook manquantes ?).");
    }
  },
};
