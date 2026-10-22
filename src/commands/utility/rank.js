const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levels = require('../../utils/levels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Affiche ton niveau et ton XP')
    .addUserOption((opt) => opt.setName('membre').setDescription('Voir le rang d\'un autre membre')),

  async execute(interaction) {
    const target = interaction.options.getUser('membre') || interaction.user;
    const stats = levels.getRank(target.id);
    const needed = levels.xpForLevel(stats.level);

    const embed = new EmbedBuilder()
      .setTitle(`📊 Rang de ${target.username}`)
      .setColor(0x5865f2)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Niveau', value: `${stats.level}`, inline: true },
        { name: 'XP', value: `${stats.xp} / ${needed}`, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
