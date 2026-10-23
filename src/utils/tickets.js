const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const config = require('../config');
const { load, save } = require('./store');

const CATEGORIES = {
  support: { label: 'Support général', emoji: { id: '1562920185743278174', name: 'support' }, description: "Besoin d'aide sur le serveur" },
  report: { label: 'Signaler un problème', emoji: { id: '1562920166478717010', name: 'avertissement' }, description: "Signaler un membre ou un souci" },
  partnership: { label: 'Partenariat / Candidature', emoji: { id: '1562920279515332731', name: 'partenariat' }, description: 'Proposer un partenariat ou postuler' },
  other: { label: 'Autre demande', emoji: { id: '1562920272535879786', name: 'aide' }, description: 'Toute autre question' },
};

function getState() {
  return load('tickets', { counter: 0, open: {} });
}

function saveState(state) {
  save('tickets', state);
}

function findOpenTicketByUser(state, userId) {
  return Object.entries(state.open).find(([, t]) => t.userId === userId);
}

function buildPanel() {
  const embed = new EmbedBuilder()
    .setTitle('🎫 Centre de support')
    .setDescription(
      "Besoin d'aide ? Choisis une catégorie ci-dessous pour ouvrir un ticket privé avec l'équipe.\n\n" +
        Object.values(CATEGORIES)
          .map((c) => `<:${c.emoji.name}:${c.emoji.id}> **${c.label}** — ${c.description}`)
          .join('\n'),
    )
    .setColor(0x5865f2)
    .setFooter({ text: 'Un seul ticket ouvert à la fois par membre.' });

  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_category_select')
    .setPlaceholder('Choisis une catégorie de ticket...')
    .addOptions(
      Object.entries(CATEGORIES).map(([value, c]) => ({
        label: c.label,
        description: c.description,
        value,
        emoji: c.emoji,
      })),
    );

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] };
}

async function openTicket(interaction) {
  const categoryKey = interaction.values[0];
  const category = CATEGORIES[categoryKey];
  const guild = interaction.guild;
  const state = getState();

  const existing = findOpenTicketByUser(state, interaction.user.id);
  if (existing) {
    const [channelId] = existing;
    const channel = guild.channels.cache.get(channelId);
    if (channel) {
      return interaction.reply({ content: `Tu as déjà un ticket ouvert : ${channel}`, ephemeral: true });
    }
    delete state.open[channelId];
  }

  await interaction.deferReply({ ephemeral: true });

  state.counter += 1;
  const number = String(state.counter).padStart(4, '0');

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    },
    {
      id: interaction.client.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
    },
  ];
  if (config.staffRoleId) {
    overwrites.push({
      id: config.staffRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${number}`,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId || undefined,
    topic: `Ticket #${number} • ${category.label} • Ouvert par ${interaction.user.tag} (${interaction.user.id})`,
    permissionOverwrites: overwrites,
  });

  state.open[channel.id] = {
    number,
    userId: interaction.user.id,
    category: category.label,
    claimedBy: null,
    openedAt: Date.now(),
  };
  saveState(state);

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket #${number}`)
    .setDescription(`Bienvenue ${interaction.user}, explique ta demande ici. Un membre du staff va te répondre.`)
    .addFields(
      { name: 'Catégorie', value: category.label, inline: true },
      { name: 'Ouvert par', value: `${interaction.user}`, inline: true },
      { name: 'Pris en charge', value: 'Personne pour le moment', inline: true },
    )
    .setColor(0x5865f2)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Prendre en charge').setEmoji('🙋').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer le ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  );

  const pingContent = config.staffRoleId ? `<@&${config.staffRoleId}>` : undefined;
  await channel.send({ content: pingContent, embeds: [embed], components: [row], allowedMentions: { roles: config.staffRoleId ? [config.staffRoleId] : [] } });
  await interaction.editReply({ content: `✅ Ticket créé : ${channel}` });
}

function isStaff(member) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (config.staffRoleId && member.roles.cache.has(config.staffRoleId)) return true;
  return false;
}

async function claimTicket(interaction) {
  const state = getState();
  const ticket = state.open[interaction.channel.id];
  if (!ticket) {
    return interaction.reply({ content: "Ce salon n'est pas reconnu comme ticket actif.", ephemeral: true });
  }
  if (!isStaff(interaction.member)) {
    return interaction.reply({ content: "Seul un membre du staff peut prendre en charge un ticket.", ephemeral: true });
  }
  if (ticket.claimedBy) {
    return interaction.reply({ content: `Ce ticket est déjà pris en charge par <@${ticket.claimedBy}>.`, ephemeral: true });
  }

  ticket.claimedBy = interaction.user.id;
  saveState(state);

  const message = interaction.message;
  const embed = EmbedBuilder.from(message.embeds[0]).spliceFields(2, 1, { name: 'Pris en charge', value: `${interaction.user}`, inline: true });

  const row = ActionRowBuilder.from(message.components[0]);
  row.components[0] = ButtonBuilder.from(message.components[0].components[0]).setDisabled(true).setLabel('Déjà pris en charge');

  await interaction.update({ embeds: [embed], components: [row] });
  await interaction.followUp({ content: `🙋 ${interaction.user} prend en charge ce ticket.` });
}

async function requestClose(interaction) {
  const state = getState();
  if (!state.open[interaction.channel.id]) {
    return interaction.reply({ content: "Ce salon n'est pas reconnu comme ticket actif.", ephemeral: true });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Confirmer la fermeture').setEmoji('✅').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_close_cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({ content: '⚠️ Confirmer la fermeture de ce ticket ?', components: [row], ephemeral: true });
}

async function cancelClose(interaction) {
  await interaction.update({ content: 'Fermeture annulée.', components: [] });
}

async function confirmClose(interaction) {
  const state = getState();
  const ticket = state.open[interaction.channel.id];

  await interaction.update({ content: '🔒 Fermeture du ticket...', components: [] });

  const ticketLabel = ticket ? `#${ticket.number}` : interaction.channel.name;

  if (config.supportChannelId) {
    const logChannel = interaction.guild.channels.cache.get(config.supportChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle(`🔒 Ticket ${ticketLabel} fermé`)
        .addFields(
          { name: 'Catégorie', value: ticket?.category || 'Inconnue', inline: true },
          { name: 'Ouvert par', value: ticket ? `<@${ticket.userId}>` : 'Inconnu', inline: true },
          { name: 'Fermé par', value: `${interaction.user}`, inline: true },
        )
        .setColor(0xed4245)
        .setTimestamp();
      await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }

  if (ticket) {
    delete state.open[interaction.channel.id];
    saveState(state);
  }

  setTimeout(() => {
    interaction.channel.delete().catch(() => {});
  }, 5000);
}

module.exports = { buildPanel, openTicket, claimTicket, requestClose, cancelClose, confirmClose };
