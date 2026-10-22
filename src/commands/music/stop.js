const { SlashCommandBuilder } = require('discord.js');
const { getSession, clearSession } = require('../../utils/musicPlayers');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Arrête la musique et quitte le salon vocal'),

  async execute(interaction) {
    const session = getSession(interaction.guild.id);
    if (!session) {
      return interaction.reply({ content: 'Aucune musique en cours de lecture.', ephemeral: true });
    }

    session.player.stop();
    session.ffmpegProcess?.kill('SIGKILL');
    session.connection.destroy();
    clearSession(interaction.guild.id);

    await interaction.reply('⏹️ Musique arrêtée, je quitte le vocal.');
  },
};
