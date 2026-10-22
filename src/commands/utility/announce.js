const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Envoie une annonce dans un salon')
    .addChannelOption((opt) =>
      opt.setName('salon').setDescription('Le salon cible').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true),
    )
    .addStringOption((opt) => opt.setName('titre').setDescription('Titre de l\'annonce').setRequired(true))
    .addStringOption((opt) => opt.setName('message').setDescription('Contenu de l\'annonce').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('salon');
    const title = interaction.options.getString('titre');
    const message = interaction.options.getString('message');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(0x5865f2)
      .setFooter({ text: `Annoncé par ${interaction.user.tag}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Annonce envoyée dans ${channel}.`, ephemeral: true });
  },
};
