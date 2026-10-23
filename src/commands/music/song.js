const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { spawn } = require('node:child_process');
// Render inclut FFmpeg système ; le binaire ffmpeg-static plante (SIGSEGV) sur les flux HTTPS.
const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
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
  console.log(`[song] lancement FFmpeg système : ${ffmpegPath}`);
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
    exitInfo = { code, signal };
    console.log(`[song] ffmpeg fermé : code=${code} signal=${signal} bytes=${bytesReceived}`);
    if (stderr.trim()) {
      console.log(`[song] stderr ffmpeg :\n${stderr.slice(-1500)}`);
    }
  });
  ffmpeg.on('error', (err) => {
    console.error('[song] ffmpeg n\'a pas pu démarrer :', err);
  });

  let bytesReceived = 0;
  let exitInfo = null;
  ffmpeg.stdout.on('data', (chunk) => {
    bytesReceived += chunk.length;
  });
  setTimeout(() => {
    console.log(`[song] ${bytesReceived} octets PCM reçus de ffmpeg après 5s`);
  }, 5000);

  return { stream: ffmpeg.stdout, process: ffmpeg, getDiagnostics: () => ({ bytesReceived, exitInfo, stderr: stderr.slice(-1200) }) };
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
        // Un VoiceConnection sans listener "error" fait planter tout le process Node
        // dès qu'il émet une erreur (comportement par défaut d'EventEmitter).
        connection.on('error', (err) => {
          console.error('[song] Erreur de connexion vocale :', err);
        });
        await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
      } catch (error) {
        if (connection?.state.status !== VoiceConnectionStatus.Destroyed) connection?.destroy();
        throw error;
      }

      const { stream, process, getDiagnostics } = createFfmpegResource(streamSource);
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

      const cleanup = async () => {
        const details = getDiagnostics();
        console.log('[song] fin lecture :', JSON.stringify(details));
        if (!details.bytesReceived) {
          try {
            await interaction.followUp({
              content: '⚠️ Le flux audio s’est arrêté sans envoyer de son. Vérifie les logs Render (`[song] ffmpeg fermé` et `[song] stderr ffmpeg`) pour identifier la cause.',
              ephemeral: true,
            });
          } catch (err) { console.warn('[song] message erreur:', err.message); }
        }
        stopSession(interaction.guild.id, session);
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
      const detail = String(err?.message || err).slice(0, 300);
      await interaction.editReply(`❌ Impossible de lire ce lien.\n\`\`\`${detail}\`\`\``);
    }
  },
};
