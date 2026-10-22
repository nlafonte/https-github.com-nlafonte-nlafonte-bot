const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un membre du serveur')
    .addUserOption((opt) => opt.setName('membre').setDescription('Le membre à bannir').setRequired(true))
    .addStringOption((opt) => opt.setName('raison').setDescription('Raison du bannissement'))
    .addIntegerOption((opt) =>
      opt.setName('jours_messages').setDescription('Supprimer les messages des N derniers jours (0-7)').setMinValue(0).setMaxValue(7),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
    const days = interaction.options.getInteger('jours_messages') || 0;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) {
      return interaction.reply({ content: "Je ne peux pas bannir ce membre (rôle trop élevé).", ephemeral: true });
    }

    await interaction.guild.members.ban(target.id, { reason, deleteMessageSeconds: days * 86400 });

    const embed = new EmbedBuilder()
      .setTitle('🔨 Membre banni')
      .setColor(0xed4245)
      .addFields(
        { name: 'Membre', value: `${target.tag}`, inline: true },
        { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
        { name: 'Raison', value: reason },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
