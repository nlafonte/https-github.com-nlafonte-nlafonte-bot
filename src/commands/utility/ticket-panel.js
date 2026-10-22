const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const tickets = require('../../utils/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Poste le panneau pour ouvrir un ticket dans ce salon')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.channel.send(tickets.buildPanel());
    await interaction.reply({ content: '✅ Panneau de ticket envoyé.', ephemeral: true });
  },
};
