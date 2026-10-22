const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
  StreamType,
} = require('@discordjs/voice');
const { Ytdl, parseVideoId } = require('@distube/ytdl-core');
const { setSession, getSession, clearSession } = require('../../utils/musicPlayers');

const ytdl = new Ytdl();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('song')
    .setDescription('Joue une musique depuis un lien YouTube')
    .addStringOption((opt) => opt.setName('lien').setDescription('Lien YouTube de la musique').setRequired(true)),

  async execute(interaction) {
    const url = interaction.options.getString('lien');
    const voiceChannel = interaction.member.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '🔇 Rejoins un salon vocal avant d\'utiliser cette commande.', ephemeral: true });
    }

    if (!parseVideoId(url)) {
      return interaction.reply({ content: '❌ Lien invalide. Donne un lien YouTube valide.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;

      let connection = getSession(interaction.guild.id)?.connection;
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
      }

      const stream = ytdl.download(url, { filter: (f) => f.hasAudio && !f.hasVideo, quality: 'highestaudio' });
      const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });

      const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
      player.play(resource);
      connection.subscribe(player);

      setSession(interaction.guild.id, { connection, player });

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
