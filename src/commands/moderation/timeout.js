const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const DURATIONS = {
  '60s': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1j': 24 * 60 * 60 * 1000,
  '1sem': 7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Réduit un membre au silence temporairement (timeout)')
    .addUserOption((opt) => opt.setName('membre').setDescription('Le membre à mute').setRequired(true))
    .addStringOption((opt) =>
      opt
        .setName('duree')
        .setDescription('Durée du mute')
        .setRequired(true)
        .addChoices(...Object.keys(DURATIONS).map((d) => ({ name: d, value: d }))),
    )
    .addStringOption((opt) => opt.setName('raison').setDescription('Raison du mute'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const durationKey = interaction.options.getString('duree');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    if (!target) {
      return interaction.reply({ content: "Ce membre n'est pas sur le serveur.", ephemeral: true });
    }
    if (!target.moderatable) {
      return interaction.reply({ content: "Je ne peux pas mute ce membre (rôle trop élevé).", ephemeral: true });
    }

    await target.timeout(DURATIONS[durationKey], reason);

    const embed = new EmbedBuilder()
      .setTitle('🔇 Membre mute')
      .setColor(0xfaa61a)
      .addFields(
        { name: 'Membre', value: `${target.user.tag}`, inline: true },
        { name: 'Durée', value: durationKey, inline: true },
        { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
        { name: 'Raison', value: reason },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
