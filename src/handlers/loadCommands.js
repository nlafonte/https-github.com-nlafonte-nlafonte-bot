const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');

function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);
    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      const command = require(path.join(folderPath, file));
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`[WARN] La commande ${file} n'a pas de propriété "data" ou "execute".`);
      }
    }
  }
}

module.exports = { loadCommands };
