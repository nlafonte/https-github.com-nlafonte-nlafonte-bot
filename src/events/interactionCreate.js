const { Events } = require('discord.js');
const tickets = require('../utils/tickets');
const annonce = require('../commands/utility/annonce');
const notifRoles = require('../utils/notifRoles');

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
        if (interaction.customId === 'ticket_claim') {
          await tickets.claimTicket(interaction);
        } else if (interaction.customId === 'ticket_close') {
          await tickets.requestClose(interaction);
        } else if (interaction.customId === 'ticket_close_confirm') {
          await tickets.confirmClose(interaction);
        } else if (interaction.customId === 'ticket_close_cancel') {
          await tickets.cancelClose(interaction);
        } else if (interaction.customId in notifRoles.NOTIFS) {
          await notifRoles.toggleRole(interaction);
        }
      } catch (error) {
        console.error('Erreur bouton :', error);
      }
      return;
    }

    if (interaction.isStringSelectMenu()) {
      try {
        if (interaction.customId === 'ticket_category_select') {
          await tickets.openTicket(interaction);
        }
      } catch (error) {
        console.error('Erreur menu déroulant :', error);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      try {
        if (interaction.customId === annonce.MODAL_ID) {
          await annonce.handleModalSubmit(interaction);
        }
      } catch (error) {
        console.error('Erreur formulaire annonce :', error);
      }
    }
  },
};
