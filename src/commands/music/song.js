const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { spawn } = require('node:child_process');
const ffmpegPath = require('ffmpeg-static');
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
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { setSession, getSession, clearSession } = require('../../utils/musicPlayers');

const soundcloud = new SoundCloudPlugin();

// Lance ffmpeg pour transcoder n'importe quelle source lisible par ffmpeg
// (lien audio direct, flux HLS SoundCloud, ...) en PCM brut pour @discordjs/voice.
function createFfmpegResource(sourceUrl) {
  const ffmpeg = spawn(ffmpegPath, [
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', sourceUrl,
    '-analyzeduration', '0',
    '-loglevel', '0',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1',
  ]);
  ffmpeg.stdin.on('error', () => {});
  ffmpeg.stdout.on('error', () => {});
  return { stream: ffmpeg.stdout, process: ffmpeg };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('song')
    .setDescription('Joue une musique depuis un lien SoundCloud ou un lien audio direct (.mp3, .wav, ...)')
    .addStringOption((opt) => opt.setName('lien').setDescription('Lien SoundCloud ou lien audio direct').setRequired(true)),

  async execute(interaction) {
    const url = interaction.options.getString('lien');
    const voiceChannel = interaction.member.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: "🔇 Rejoins un salon vocal avant d'utiliser cette commande.", ephemeral: true });
    }

    const isSoundCloud = soundcloud.validate(url);
    const isHttp = /^https?:\/\//i.test(url);
    if (!isSoundCloud && !isHttp) {
      return interaction.reply({ content: '❌ Lien invalide. Donne un lien SoundCloud ou un lien audio direct (.mp3, .wav...).', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      let title = url;
      let streamSource = url;

      if (isSoundCloud) {
        const song = await soundcloud.resolve(url);
        if (!song) throw new Error('Piste SoundCloud introuvable');
        title = song.name || title;
        streamSource = await soundcloud.getStreamURL(song);
      } else {
        try {
          title = decodeURIComponent(new URL(url).pathname.split('/').pop()) || title;
        } catch {
          // garde l'URL brute comme titre si le parsing échoue
        }
      }

      let connection = getSession(interaction.guild.id)?.connection;
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
      }

      const { stream, process: ffmpegProcess } = createFfmpegResource(streamSource);
      const resource = createAudioResource(stream, { inputType: StreamType.Raw });

      const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
      player.play(resource);
      connection.subscribe(player);

      setSession(interaction.guild.id, { connection, player, ffmpegProcess });

      const embed = new EmbedBuilder()
        .setTitle('🎵 Lecture en cours')
        .setDescription(`**${title}**\nDans ${voiceChannel}`)
        .setColor(0x1db954);

      await interaction.editReply({ embeds: [embed] });

      const cleanup = () => {
        ffmpegProcess.kill('SIGKILL');
        connection.destroy();
        clearSession(interaction.guild.id);
      };

      player.removeAllListeners(AudioPlayerStatus.Idle);
      player.once(AudioPlayerStatus.Idle, cleanup);

      player.removeAllListeners('error');
      player.once('error', (err) => {
        console.error('Erreur lecteur audio :', err);
        cleanup();
      });
    } catch (err) {
      console.error('Erreur /song :', err);
      await interaction.editReply('❌ Impossible de lire ce lien (il est peut-être privé, invalide ou dans un format non supporté).');
    }
  },
};
