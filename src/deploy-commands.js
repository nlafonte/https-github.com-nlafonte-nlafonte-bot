const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const config = require('./config');

if (!config.token || !config.clientId) {
  console.error('❌ DISCORD_TOKEN et CLIENT_ID sont requis dans .env pour déployer les commandes.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const folderPath = path.join(commandsPath, folder);
  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const command = require(path.join(folderPath, file));
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(`🔄 Déploiement de ${commands.length} commande(s)...`);

    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    const data = await rest.put(route, { body: commands });

    console.log(`✅ ${data.length} commande(s) déployée(s)${config.guildId ? ' sur le serveur (instantané)' : ' globalement (jusqu\'à 1h de délai)'}.`);
  } catch (error) {
    console.error(error);
  }
})();
