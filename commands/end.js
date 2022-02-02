const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('Ends a sentence'),
    /**
     * 
     * @param { CommandInteraction } interaction 
     */
    async execute(interaction) {
        const { channel } = interaction;


        // fetch the mesages in the current channel
        const messages = await channel.messages.fetch({
            limit: 100, // Amount of messages to be fetched in the channel
        });

        /** Set of all users, who contributed something */
        const users = new Set();

        /** Array of contributions to the sentence */
        let sentence = [];

        for (const [snowflake, message] of messages) {
            const { content, author } = message;
            if (author.bot) continue;
            if (content.includes('---')) break;
            if (author.id == process.env.CLIENT_ID) break;

            // test if the message is a valid contribution
            if (/^,? *[\p{L}\d]+ *,?$/iu.test(content)) {
                sentence.unshift(message.content.split(/ +/).join(' ').trim());
            // test if the message concludes a sentence (".", but not as the last message)
            } else if (content.includes('.') && sentence.length > 0) {
                break;
            } else {
                // continue with the loop, if none of the above conditions are met
                continue;
            }
            // add the user to users
            users.add(author);

        }


        // add a space between each word, except for if the next one starts with a ', ', to avoid things like "foo , bar"
        sentence = sentence.map((val, index, array) => (array[index + 1]?.startsWith(', ') ? val.trim() : val.trim() + ' '));

        // construct the sentence
        // [the sentence]. -[contributing users]
        const output = `${sentence.join('').trim()}. -${[...users].map(u => u.username).join(', ')}`;

        interaction.reply(output);

        // I didn't want to add a database so I'm just printing the output to the console
        console.log(output);
    },
};