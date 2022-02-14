const { CommandInteraction, InteractionCollector } = require('discord.js');


module.exports = {
    name: 'interactionCreate',

    /**
     * @param { CommandInteraction } interaction 
     */

    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const { client } = interaction;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            return interaction[interaction.deferred ? 'editReply' : 'reply']({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};