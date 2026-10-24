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

// Discord ne permet ni sélecteur d'emoji ni upload de fichier dans un formulaire (modal) :
// seuls des champs texte y sont autorisés. On demande donc le nom de l'emoji (ex: "flamme")
// et un lien d'image en texte, directement dans le formulaire.
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
  if (!name) return null;
  const clean = name.trim().toLowerCase().replace(/:/g, '');
  return EMOJIS.find((e) => e.name === clean) || null;
}

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

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

    const emojiInput = new TextInputBuilder()
      .setCustomId('emoji')
      .setLabel('Emoji (optionnel)')
      .setPlaceholder('flamme, annonces, etoile, cadeau, video...')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(30);

    const lienInput = new TextInputBuilder()
      .setCustomId('lien')
      .setLabel('Lien (optionnel)')
      .setPlaceholder('https://...')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const imageInput = new TextInputBuilder()
      .setCustomId('image')
      .setLabel("Image - lien URL (optionnel)")
      .setPlaceholder('https://... (termine par .png, .jpg, .gif...)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titreInput),
      new ActionRowBuilder().addComponents(messageInput),
      new ActionRowBuilder().addComponents(emojiInput),
      new ActionRowBuilder().addComponents(lienInput),
      new ActionRowBuilder().addComponents(imageInput),
    );

    await interaction.showModal(modal);
  },

  async handleModalSubmit(interaction) {
    const titre = interaction.fields.getTextInputValue('titre');
    const message = interaction.fields.getTextInputValue('message');
    const emojiName = interaction.fields.getTextInputValue('emoji');
    const lien = interaction.fields.getTextInputValue('lien');
    const image = interaction.fields.getTextInputValue('image');

    if (lien && !isValidUrl(lien)) {
      return interaction.reply({ content: `❌ Le lien "${lien}" n'est pas une URL valide (doit commencer par https://).`, ephemeral: true });
    }
    if (image && !isValidUrl(image)) {
      return interaction.reply({ content: `❌ Le lien d'image "${image}" n'est pas une URL valide (doit commencer par https://).`, ephemeral: true });
    }

    const channelId = config.announceChannelId;
    const channel = channelId ? interaction.guild.channels.cache.get(channelId) : null;
    if (!channel) {
      return interaction.reply({ content: "❌ Salon d'annonce introuvable (ANNOUNCE_CHANNEL_ID non configuré).", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const emoji = findEmoji(emojiName);
    const titlePrefix = emoji ? `<:${emoji.name}:${emoji.id}>` : '📢';

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
      if (image) {
        embed.setImage(image);
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
      await interaction.editReply("❌ Impossible d'envoyer l'annonce (webhook/permissions).");
    }
  },
};
