const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const warnings = require('../../utils/warnings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Donne un avertissement à un membre')
    .addUserOption((opt) => opt.setName('membre').setDescription('Le membre à avertir').setRequired(true))
    .addStringOption((opt) => opt.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison');

    const total = warnings.add(target.id, interaction.user.id, reason);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Avertissement')
      .setColor(0xfaa61a)
      .addFields(
        { name: 'Membre', value: `${target.tag}`, inline: true },
        { name: 'Total avertissements', value: `${total}`, inline: true },
        { name: 'Raison', value: reason },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
