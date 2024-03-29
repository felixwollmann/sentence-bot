const { SlashCommandBuilder, SlashCommandBooleanOption, SlashCommandStringOption } = require('@discordjs/builders');
const { CommandInteraction, InteractionCollector } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('Ends a sentence')
        .addBooleanOption(
            new SlashCommandBooleanOption()
                .setName('ephemeral')
                .setRequired(false)
                .setDescription('The message will only be visible to the you')
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setRequired(false)
                .setName('option')
                .setAutocomplete(false)
                .setDescription('Add options here') // intentionally vague as this is supposed to be an april fools joke
        )
        ,
    // Explanation: The april fools joke
    // The idea here is the following: A person, who knows this insight, can manipulate the output of the bot to hopefully make it more fun.
    // It is hidden behind the nondescript option "option". When it is set, it just completely skips any processing of messages and echoes the parameter.
    // With the ephemeral-option, one could copy that message, (slightly) adjust it and then let the bot echo it.

    /**
     * 
     * @param { CommandInteraction } interaction 
     */
    async execute(interaction) {
        const { channel, client } = interaction;

        if (!interaction.inGuild()) {
            return interaction.reply('Dieser Command kann nicht in DMs verwendet werden ☹');
        }

        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const secretOption = interaction.options.getString('option') || false; // april fools addition
        if (secretOption) {
            interaction.reply({
                ephemeral,
                content: secretOption,
            });
            console.log(`SECRET APRIL FOOLS OPTION: echoed the following "${secretOption} (${ephemeral ? `ephemeral, by ` : ''}${interaction.user.username})`);
            return;
        }
        await interaction.deferReply({ ephemeral, });

        // fetch the mesages in the current channel
        const messages = await channel.messages.fetch({
            limit: 100, // Amount of messages to be fetched in the channel
        });

        /** Set of all members, who contributed something */
        const members = new Set();

        /** Array of contributions to the sentence */
        let sentence = [];

        for (const [snowflake, message] of messages) {
            let { content, author, member } = message;
            if (author.id == client.user.id && sentence.length > 0) break;
            if (author.bot) continue;
            if (content.trim() === '---') break;

            content = content.replace(/ \/\/.+$/, '');

            if (/^,? *[\p{L}\d'"<>+^°|\.,$€@#*-]+ *,?$/iu.test(content) && content[content.length - 1] != '.') {
                // test if the message is a valid contribution
                sentence.unshift(content.split(/ +/).join(' ').trim());

            } else if (/^,? *[\p{L}\d'"<>+^°|\.,$€@#*-]+\.$/iu.test(content) && sentence.length == 0) {
                sentence.unshift(content.replace('.', '').split(/ +/).join(' ').trim());

            } else if (content.trim().endsWith('.') && sentence.length > 0) {
                // test if the message concludes a sentence (".", but not as the last message)
                break;

            } else if (content.trim() == '.' && sentence.length <= 0) {
                // still add the member to members if they ended the sentence

            } else {
                // continue with the loop, if none of the above conditions are met
                continue;
            }
            // add the user to members
            members.add(member ?? await message.guild.members.fetch(author.id).catch(() => console.error(`Could not fetch member ${author.id}, in Channel ${message.channel.id}`)));

        }


        // add a space between each word, except for if the next one starts with a ', ', to avoid things like "foo , bar"
        sentence = sentence.map((val, index, array) => (array[index + 1]?.startsWith(', ') ? val.trim() : val.trim() + ' '));

        if (sentence.length == 0) {
            return interaction.editReply({ content: 'Kein Satz gefunden ☹', ephemeral: true });
        }

        // construct the sentence
        // [the sentence]. -[contributing users]
        const output = `${sentence.join('').trim()}. –${[...members].filter((val) => !!val).map(m => m.nickname || m.user.username).join(', ')}`;

        interaction.editReply(
            {
                ephemeral,
                content: output,
            }
        );

        // I didn't want to add a database so I'm just printing the output to the console
        console.log(output + (ephemeral ? ` (ephemeral, by ${interaction.user.username})` : ''));
    },
};