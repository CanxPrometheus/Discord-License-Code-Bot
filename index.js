const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const axios = require("axios");


const webhookUrl = ""
const token = "";
const clientId = "";
const guildId = "";
const allowedChannelId = '';
const allowedRoleId = '';


const commands = [
    new SlashCommandBuilder()
        .setName('spoofer')
        .setDescription('Select a time period')
        .addStringOption(option => 
            option.setName('period')
                .setDescription('Choose a time period')
                .setRequired(true)
                .addChoices(
                    { name: '1d', value: '1d' },
                    { name: '3d', value: '3d' },
                    { name: '7d', value: '7d' },
                    { name: '30d', value: '30d' },
                    { name: 'lifetime', value: 'lifetime' }
                )
        ),
];

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, channelId, member } = interaction;


    if (commandName === 'spoofer') {

        if (channelId !== allowedChannelId) {
            await interaction.reply({
                content: 'You can only use this command in the specified channel.',
                ephemeral: true
            });
            return;
        }

        if (!member.roles.cache.has(allowedRoleId)) {
            await interaction.reply({
                content: 'You do not have the required role to use this command.',
                ephemeral: true
            });
            return;
        }

        const period = interaction.options.getString('period');
        const fileName = `${period}.txt`;

        fs.readFile(fileName, 'utf8', async (err, data) => {
            if (err) {
                console.error(err);
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Error')
                            .setDescription('An error occurred while reading the file.')
                            .setColor('#FF0000') 
                    ],
                    ephemeral: true
                });
                return;
            }
            let lines = data.trim().split('\n').filter(line => line.length > 0);

            if (lines.length === 0) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('No Codes Left')
                            .setDescription('No codes are available in the file.')
                            .setColor('#FFFF00')  
                    ],
                    ephemeral: true

                });
                return;
            }

            let code = lines.shift();
            fs.writeFile(fileName, lines.join('\n'), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error(writeErr);
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Error')
                                .setDescription('An error occurred while updating the file.')
                                .setColor('#FF0000') 
                        ],
                        ephemeral: true

                    });
                    return;
                }
                axios.post(webhookUrl, {
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Code Usage')
                            .setDescription(`**User:** ${interaction.user.tag}\n**Code:** \`${code}\`\n**Period:** ${period}`)
                            .setColor('#0000FF')  
                    ]
                }).catch(logErr => console.error('Error sending webhook:', logErr));


                 interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Code Sent')
                            .setDescription(`Here is your code: \`${code}\``)
                            .setColor('#00FF00')  
                    ],
                    ephemeral: true

                });
            });
        });
    }
});


client.login(token);