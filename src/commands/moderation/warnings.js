const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const warnings = require('../../utils/warnings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Affiche les avertissements d\'un membre')
    .addUserOption((opt) => opt.setName('membre').setDescription('Le membre').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const list = warnings.getAll(target.id);

    if (list.length === 0) {
      return interaction.reply({ content: `${target.tag} n'a aucun avertissement.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Avertissements de ${target.tag}`)
      .setColor(0xfaa61a)
      .setDescription(
        list
          .map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderatorId}> (${new Date(w.date).toLocaleDateString('fr-FR')})`)
          .join('\n'),
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
