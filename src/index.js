const http = require('node:http');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');
const { loadCommands } = require('./handlers/loadCommands');
const { loadEvents } = require('./handlers/loadEvents');

if (!config.token) {
  console.error('❌ DISCORD_TOKEN manquant. Copie .env.example en .env et renseigne tes identifiants.');
  process.exit(1);
}

// Serveur HTTP minimal : Render exige un port ouvert, et un ping externe
// (ex. cron-job.org) l'utilise pour empêcher le service gratuit de s'endormir.
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('nlafonte bot en ligne');
  })
  .listen(PORT, () => console.log(`🌐 Serveur HTTP de health-check sur le port ${PORT}`));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

loadCommands(client);
loadEvents(client);

client.login(config.token);
