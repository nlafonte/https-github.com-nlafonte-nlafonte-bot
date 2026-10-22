const { Events } = require('discord.js');
const tickets = require('../utils/tickets');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Erreur dans la commande ${interaction.commandName} :`, error);
        const payload = { content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      try {
        if (interaction.customId === 'ticket_open') {
          await tickets.openTicket(interaction);
        } else if (interaction.customId === 'ticket_close') {
          await tickets.closeTicket(interaction);
        }
      } catch (error) {
        console.error('Erreur bouton ticket :', error);
      }
    }
  },
};
