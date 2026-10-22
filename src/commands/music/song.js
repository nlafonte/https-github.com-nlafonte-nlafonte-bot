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
const { setSession, stopSession } = require('../../utils/musicPlayers');

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
    '-loglevel', 'warning',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1',
  ]);
  ffmpeg.stdin.on('error', () => {});
  ffmpeg.stdout.on('error', () => {});

  let stderr = '';
  ffmpeg.stderr.on('data', (d) => {
    stderr += d.toString();
  });
  ffmpeg.on('close', (code, signal) => {
    console.log(`[song] ffmpeg fermé : code=${code} signal=${signal}`);
    if (stderr.trim()) {
      console.log(`[song] stderr ffmpeg :\n${stderr.slice(-1500)}`);
    }
  });
  ffmpeg.on('error', (err) => {
    console.error('[song] ffmpeg n\'a pas pu démarrer :', err);
  });

  let bytesReceived = 0;
  ffmpeg.stdout.on('data', (chunk) => {
    bytesReceived += chunk.length;
  });
  setTimeout(() => {
    console.log(`[song] ${bytesReceived} octets PCM reçus de ffmpeg après 5s`);
  }, 5000);

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

      stopSession(interaction.guild.id);
      let connection;
      let ffmpegProcess;
      try {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
      } catch (error) {
        if (connection?.state.status !== VoiceConnectionStatus.Destroyed) connection?.destroy();
        throw error;
      }

      const { stream, process } = createFfmpegResource(streamSource);
      ffmpegProcess = process;
      const resource = createAudioResource(stream, { inputType: StreamType.Raw });

      const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
      player.on('stateChange', (oldState, newState) => {
        console.log(`[song] player: ${oldState.status} -> ${newState.status}`);
      });
      player.play(resource);
      const subscription = connection.subscribe(player);
      console.log('[song] subscription réussie :', Boolean(subscription));
      console.log('[song] connection state :', connection.state.status);

      const session = { connection, player, ffmpegProcess };
      setSession(interaction.guild.id, session);

      const embed = new EmbedBuilder()
        .setTitle('🎵 Lecture en cours')
        .setDescription(`**${title}**\nDans ${voiceChannel}`)
        .setColor(0x1db954);

      await interaction.editReply({ embeds: [embed] });

      const cleanup = () => stopSession(interaction.guild.id, session);

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
