const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retire le timeout d\'un membre')
    .addUserOption((opt) => opt.setName('membre').setDescription('Le membre à démute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    if (!target) {
      return interaction.reply({ content: "Ce membre n'est pas sur le serveur.", ephemeral: true });
    }
    await target.timeout(null);
    await interaction.reply(`🔊 ${target.user.tag} peut de nouveau parler.`);
  },
};
