const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const config = require('../../config');
const { getOrCreateWebhook } = require('../../utils/liveWebhook');

const MODAL_ID = 'annonce_modal';
const EMOJI_SELECT_ID = 'annonce_emoji_select';

// Discord ne permet pas de choisir un emoji directement dans un formulaire (modal) :
// seuls des champs texte y sont autorisés. On fait donc le choix de l'emoji juste avant,
// via un menu déroulant, puis on l'intègre au titre de l'annonce.
const EMOJIS = [
  { name: 'annonces', id: '1562920124795846792' },
  { name: 'actualites', id: '1562933822369173595' },
  { name: 'evenement', id: '1562933842644304012' },
  { name: 'flamme', id: '1562920340986798160' },
  { name: 'etoile', id: '1562920354052182077' },
  { name: 'cadeau', id: '1562920206320406588' },
  { name: 'trophee', id: '1562920213140340957' },
  { name: 'validation', id: '1562920152218214542' },
  { name: 'avertissement', id: '1562920166478717010' },
  { name: 'coeur', id: '1562920220086108260' },
  { name: 'musique', id: '1562920366299418675' },
  { name: 'video', id: '1562920373232869486' },
  { name: 'gaming', id: '1562920226369179648' },
  { name: 'calendrier', id: '1562920246061305856' },
  { name: 'horloge', id: '1562920252604678164' },
  { name: 'notification', id: '1562920258862588034' },
  { name: 'epingle', id: '1562920266173128825' },
  { name: 'drapeau', id: '1562933982277013611' },
  { name: 'favori', id: '1562933996378132500' },
  { name: 'croissance', id: '1562934043153014816' },
  { name: 'recompense', id: '1562933913498812486' },
  { name: 'certification', id: '1562933861522997268' },
  { name: 'protection', id: '1562933900857188412' },
  { name: 'createur', id: '1562933907178135714' },
];

function findEmoji(name) {
  return EMOJIS.find((e) => e.name === name);
}

module.exports = {
  MODAL_ID,
  EMOJI_SELECT_ID,
  data: new SlashCommandBuilder()
    .setName('annonce')
    .setDescription('Ouvre un formulaire pour publier une annonce dans #annonces')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(EMOJI_SELECT_ID)
      .setPlaceholder("Choisis un emoji pour l'annonce...")
      .addOptions([
        { label: 'Sans emoji', value: 'none', emoji: '🚫' },
        ...EMOJIS.map((e) => ({ label: e.name, value: e.name, emoji: { id: e.id, name: e.name } })),
      ]);

    await interaction.reply({
      content: "Choisis l'emoji qui précédera le titre de ton annonce :",
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true,
    });
  },

  async handleEmojiSelect(interaction) {
    const choice = interaction.values[0];

    const modal = new ModalBuilder().setCustomId(`${MODAL_ID}:${choice}`).setTitle('Nouvelle annonce');

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
    await interaction.deleteReply().catch(() => {});
  },

  async handleModalSubmit(interaction) {
    const [, emojiChoice] = interaction.customId.split(':');
    const emoji = emojiChoice && emojiChoice !== 'none' ? findEmoji(emojiChoice) : null;
    const titlePrefix = emoji ? `<:${emoji.name}:${emoji.id}>` : '📢';

    const titre = interaction.fields.getTextInputValue('titre');
    const message = interaction.fields.getTextInputValue('message');
    const lien = interaction.fields.getTextInputValue('lien');

    const channelId = config.announceChannelId;
    const channel = channelId ? interaction.guild.channels.cache.get(channelId) : null;
    if (!channel) {
      return interaction.reply({ content: "❌ Salon d'annonce introuvable (ANNOUNCE_CHANNEL_ID non configuré).", ephemeral: true });
    }

    // Discord ne permet pas non plus de joindre un fichier dans un formulaire.
    // On demande donc à l'utilisateur d'envoyer une image juste après, ici même,
    // et on la récupère automatiquement avant de publier l'annonce.
    await interaction.reply({
      content: "📎 Envoie une image **dans ce salon** dans les 60 secondes pour l'ajouter à l'annonce (ou ignore pour publier sans image)...",
      ephemeral: true,
    });

    let imageUrl = null;
    try {
      const collected = await interaction.channel.awaitMessages({
        filter: (m) => m.author.id === interaction.user.id && m.attachments.size > 0,
        max: 1,
        time: 60_000,
        errors: ['time'],
      });
      const msg = collected.first();
      imageUrl = msg.attachments.first().url;
      await msg.delete().catch(() => {});
    } catch {
      // Personne n'a envoyé d'image dans le délai : on continue sans.
    }

    try {
      const webhook = await getOrCreateWebhook(channel);

      const embed = new EmbedBuilder()
        .setTitle(`${titlePrefix} ${titre}`)
        .setDescription(message)
        .setColor(0xe67e22)
        .setTimestamp();
      if (lien) {
        embed.setURL(lien);
        embed.addFields({ name: '<:lien:1562933815700226159> Lien', value: `[Clique ici](${lien})` });
      }
      if (imageUrl) {
        embed.setImage(imageUrl);
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

      await interaction.editReply(`✅ Annonce envoyée dans ${channel}${imageUrl ? ' (avec image)' : ''}.`);
    } catch (err) {
      console.error('Erreur /annonce :', err);
      await interaction.editReply("❌ Impossible d'envoyer l'annonce (permissions webhook manquantes ?).");
    }
  },
};
