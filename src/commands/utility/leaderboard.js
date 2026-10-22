const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levels = require('../../utils/levels');

module.exports = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Classement des membres les plus actifs'),

  async execute(interaction) {
    const top = levels.getLeaderboard(10);

    if (top.length === 0) {
      return interaction.reply('Personne n\'a encore gagné d\'XP.');
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = top.map((entry, i) => `${medals[i] || `**${i + 1}.**`} <@${entry.userId}> — niveau ${entry.level} (${entry.xp} XP)`);

    const embed = new EmbedBuilder().setTitle('🏆 Classement').setColor(0xf1c40f).setDescription(lines.join('\n'));

    await interaction.reply({ embeds: [embed] });
  },
};
