const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { load, save } = require('../utils/store');

function getTempChannels() {
  return load('temp-voice', { channelIds: [] });
}

function saveTempChannels(state) {
  save('temp-voice', state);
}

async function deleteIfEmpty(channel) {
  if (!channel || channel.members.size > 0) return false;
  await channel.delete().catch(() => {});
  return true;
}

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    if (!config.studioHubChannelId) return;

    // Un membre rejoint le salon "Créer mon studio" : on lui crée son propre vocal.
    if (newState.channelId === config.studioHubChannelId && oldState.channelId !== config.studioHubChannelId) {
      const hub = newState.channel;
      const guild = newState.guild;
      const member = newState.member;

      const studio = await guild.channels.create({
        name: `🎙️ Studio de ${member.displayName}`,
        type: ChannelType.GuildVoice,
        parent: hub.parentId,
        userLimit: hub.userLimit || 0,
        permissionOverwrites: [
          ...hub.permissionOverwrites.cache.map((o) => ({ id: o.id, allow: o.allow, deny: o.deny, type: o.type })),
          {
            id: member.id,
            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers],
          },
        ],
      });

      const state = getTempChannels();
      state.channelIds.push(studio.id);
      saveTempChannels(state);

      await member.voice.setChannel(studio).catch(async () => {
        await studio.delete().catch(() => {});
        state.channelIds = state.channelIds.filter((id) => id !== studio.id);
        saveTempChannels(state);
      });
    }

    // Un membre quitte un salon temporaire : on le supprime s'il est vide.
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const state = getTempChannels();
      if (state.channelIds.includes(oldState.channelId)) {
        const deleted = await deleteIfEmpty(oldState.channel);
        if (deleted) {
          state.channelIds = state.channelIds.filter((id) => id !== oldState.channelId);
          saveTempChannels(state);
        }
      }
    }
  },
};
