require('dotenv').config();

// copied from the discord.js guide

const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { CLIENT_ID, GUILD_ID, TOKEN } = process.env;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(TOKEN);


(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		if (process.argv[2] === 'all') {
			console.log('Refreshing commands for all guilds - may take up to an hour to take effect.');
			await rest.put(
				Routes.applicationCommands(CLIENT_ID),
				{ body: commands, token: TOKEN },
			);
		} else {
			await rest.put(
				Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
				{ body: commands, token: TOKEN },
				);
		}

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();