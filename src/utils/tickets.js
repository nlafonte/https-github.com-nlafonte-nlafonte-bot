const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const config = require('../config');

function buildPanel() {
  const embed = new EmbedBuilder()
    .setTitle('🎫 Support')
    .setDescription("Besoin d'aide ? Clique sur le bouton ci-dessous pour ouvrir un ticket privé avec l'équipe.")
    .setColor(0x5865f2);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_open')
      .setLabel('Ouvrir un ticket')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary),
  );

  return { embeds: [embed], components: [row] };
}

async function openTicket(interaction) {
  const guild = interaction.guild;
  const existing = guild.channels.cache.find(
    (c) => c.name === `ticket-${interaction.user.username.toLowerCase()}` && c.parentId === config.ticketCategoryId,
  );
  if (existing) {
    await interaction.reply({ content: `Tu as déjà un ticket ouvert : ${existing}`, ephemeral: true });
    return;
  }

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
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId || undefined,
    permissionOverwrites: overwrites,
  });

  const embed = new EmbedBuilder()
    .setTitle('🎫 Nouveau ticket')
    .setDescription(`Bienvenue ${interaction.user}, explique ta demande ici. Un membre du staff va te répondre.`)
    .setColor(0x5865f2);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Fermer le ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger),
  );

  await channel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: `Ticket créé : ${channel}`, ephemeral: true });
}

async function closeTicket(interaction) {
  await interaction.reply('🔒 Ce ticket va être fermé dans 5 secondes...');
  setTimeout(() => {
    interaction.channel.delete().catch(() => {});
  }, 5000);
}

module.exports = { buildPanel, openTicket, closeTicket };
