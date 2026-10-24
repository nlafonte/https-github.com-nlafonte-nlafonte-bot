const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../config');

const NOTIFS = {
  notif_twitch: {
    label: 'Notif Twitch',
    emoji: { id: '1562920340986798160', name: 'flamme' },
    description: 'Alerte quand nlafonte passe en live sur Twitch',
    get roleId() {
      return config.notifRoles.twitchRoleId;
    },
  },
  notif_youtube: {
    label: 'Notif YouTube',
    emoji: { id: '1562920373232869486', name: 'video' },
    description: 'Alerte à chaque nouvelle vidéo YouTube',
    get roleId() {
      return config.notifRoles.youtubeRoleId;
    },
  },
  notif_annonce: {
    label: 'Notif Annonce',
    emoji: { id: '1562920124795846792', name: 'annonces' },
    description: 'Alerte à chaque annonce du serveur',
    get roleId() {
      return config.notifRoles.annonceRoleId;
    },
  },
};

function buildPanel() {
  const bellEmoji = { id: '1562920258862588034', name: 'notification' };

  const embed = new EmbedBuilder()
    .setTitle('🔔 Rôles de notification')
    .setThumbnail(`https://cdn.discordapp.com/emojis/${bellEmoji.id}.png?size=128`)
    .setDescription(
      `<:${bellEmoji.name}:${bellEmoji.id}> Choisis les notifications que tu veux recevoir en cliquant sur les boutons ci-dessous :\n\n` +
        Object.values(NOTIFS)
          .map((n) => `<:${n.emoji.name}:${n.emoji.id}> **${n.label}** — ${n.description}`)
          .join('\n') +
        `\n\nClique à nouveau sur un bouton pour retirer la notification.`,
    )
    .setColor(0xe67e22);

  const row = new ActionRowBuilder().addComponents(
    Object.entries(NOTIFS).map(([customId, n]) =>
      new ButtonBuilder().setCustomId(customId).setLabel(n.label).setEmoji(n.emoji).setStyle(ButtonStyle.Secondary),
    ),
  );

  return { embeds: [embed], components: [row] };
}

async function toggleRole(interaction) {
  const notif = NOTIFS[interaction.customId];
  if (!notif) return;

  const roleId = notif.roleId;
  if (!roleId) {
    return interaction.reply({ content: `❌ Rôle "${notif.label}" non configuré.`, ephemeral: true });
  }

  const member = interaction.member;
  const has = member.roles.cache.has(roleId);

  if (has) {
    await member.roles.remove(roleId);
    await interaction.reply({ content: `🔕 Notification **${notif.label}** retirée.`, ephemeral: true });
  } else {
    await member.roles.add(roleId);
    await interaction.reply({ content: `🔔 Notification **${notif.label}** activée.`, ephemeral: true });
  }
}

module.exports = { NOTIFS, buildPanel, toggleRole };
