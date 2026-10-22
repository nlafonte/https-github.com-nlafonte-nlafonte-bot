const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
} = require('@discordjs/voice');
const play = require('play-dl');
const { setSession, getSession, clearSession } = require('../../utils/musicPlayers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('song')
    .setDescription('Joue une musique depuis un lien (YouTube, SoundCloud, lien audio direct)')
    .addStringOption((opt) => opt.setName('lien').setDescription('Lien de la musique').setRequired(true)),

  async execute(interaction) {
    const url = interaction.options.getString('lien');
    const voiceChannel = interaction.member.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '🔇 Rejoins un salon vocal avant d\'utiliser cette commande.', ephemeral: true });
    }

    const type = await play.validate(url).catch(() => false);
    if (!type || type === 'search') {
      return interaction.reply({ content: '❌ Lien invalide. Donne un lien YouTube, SoundCloud ou un lien audio direct.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      let connection = getSession(interaction.guild.id)?.connection;
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
      }

      const streamInfo = await play.stream(url);
      const resource = createAudioResource(streamInfo.stream, { inputType: streamInfo.type });

      const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
      player.play(resource);
      connection.subscribe(player);

      setSession(interaction.guild.id, { connection, player });

      let title = url;
      if (type === 'yt_video') {
        const info = await play.video_info(url).catch(() => null);
        if (info?.video_details?.title) title = info.video_details.title;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎵 Lecture en cours')
        .setDescription(`**${title}**\nDans ${voiceChannel}`)
        .setColor(0x1db954);

      await interaction.editReply({ embeds: [embed] });

      player.removeAllListeners(AudioPlayerStatus.Idle);
      player.once(AudioPlayerStatus.Idle, () => {
        connection.destroy();
        clearSession(interaction.guild.id);
      });

      player.removeAllListeners('error');
      player.once('error', (err) => {
        console.error('Erreur lecteur audio :', err);
        connection.destroy();
        clearSession(interaction.guild.id);
      });
    } catch (err) {
      console.error('Erreur /song :', err);
      await interaction.editReply('❌ Impossible de lire ce lien (il est peut-être privé, région-bloqué ou invalide).');
    }
  },
};
