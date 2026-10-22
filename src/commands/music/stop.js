const { SlashCommandBuilder } = require('discord.js');
const { stopSession } = require('../../utils/musicPlayers');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Arrête la musique et quitte le salon vocal'),

  async execute(interaction) {
    if (!stopSession(interaction.guild.id)) {
      return interaction.reply({ content: 'Aucune musique en cours de lecture.', ephemeral: true });
    }

    await interaction.reply('⏹️ Musique arrêtée, je quitte le vocal.');
  },
};
