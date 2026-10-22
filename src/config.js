require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  welcomeChannelId: process.env.WELCOME_CHANNEL_ID,
  rulesChannelId: process.env.RULES_CHANNEL_ID,
  supportChannelId: process.env.SUPPORT_CHANNEL_ID,
  announceChannelId: process.env.ANNOUNCE_CHANNEL_ID,
  levelUpChannelId: process.env.LEVEL_UP_CHANNEL_ID,
  ticketCategoryId: process.env.TICKET_CATEGORY_ID,

  autoroleId: process.env.AUTOROLE_ID,
  staffRoleId: process.env.STAFF_ROLE_ID,

  xp: {
    minPerMessage: 15,
    maxPerMessage: 25,
    cooldownMs: 60_000,
  },
};
