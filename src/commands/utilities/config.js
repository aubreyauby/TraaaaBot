const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const Configure = require('../../models/configure');

module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const commandName = interaction.commandName;

        if (commandName === 'configure') {
            const modlogsOption = interaction.options.get('modlogs');

            if (!modlogsOption) {
                // Handle the case where no arguments are provided (showing help)
                const guild = interaction.guild;
                const guildIconURL = guild.iconURL();

                const helpEmbed = new EmbedBuilder()
                    .setColor(0xFF69B4)
                    .setTitle('Configure Settings for TraaaaBot')
                    .setDescription(`Configure the behavior and features of TraaaaBot in your server to make the bot function based on your needs and preferences. ` 
                        + `You can also change the settings easily without the need to run many commands by [using the dashboard](https://www.google.com).\n\n`
                        + `**Usage:** \`/configure [category: choice]\`\n`
                        + `**Example:** \`/configure modlogs: Enable\` (this will enable moderation logs for the server)`)
                    .setThumbnail(guildIconURL);

                await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
                return;
            }

            const value = modlogsOption.value;

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            let configureDoc = await Configure.findOne({ userId, guildId });

            if (!configureDoc) {
                configureDoc = new Configure({
                    userId,
                    guildId,
                    modlogIsEnabled: false,
                    modlogChannel: '',
                });
                await configureDoc.save();
            }

            const updatedConfigureDoc = await Configure.findOne({ userId, guildId });
            
            if (value === 1) {
                const modlogEnableEmbed = new EmbedBuilder().setColor(0x00FF00).setTitle('Success')
                .setDescription(':white_check_mark: Moderation logs have been **enabled** for this server.');
            
                updatedConfigureDoc.modlogIsEnabled = true;
                await updatedConfigureDoc.save();
            
                await interaction.reply({ embeds: [modlogEnableEmbed], ephemeral: true });
            } else if (value === 2) {
                const modlogDisableEmbed = new EmbedBuilder().setColor(0x00FF00).setTitle('Success')
                .setDescription(':white_check_mark: Moderation logs have been **disabled** for this server.');
            
                // Delete the server's data from the database
                await Configure.findOneAndDelete({ userId: interaction.user.id, guildId: interaction.guild.id });
            
                await interaction.reply({ embeds: [modlogDisableEmbed], ephemeral: true });
            } else if (value === 3) {
                const modlogSetChannelEmbed = new EmbedBuilder().setColor(0xCF9FFF).setTitle('Input Needed')
                    .setDescription(':question: Please specify the text channel that you want to use for logging in the next message.');
            
                const initialMessage = await interaction.reply({ embeds: [modlogSetChannelEmbed], ephemeral: true });
                const filter = (response) => {
                    return response.channel.id === interaction.channelId && response.author.id === interaction.user.id;
                };
            
                const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });
            
                collector.on('collect', async (response) => {
                    const mentionedChannel = response.mentions.channels.first();
            
                    if (mentionedChannel) {
                        const successEmbed = new EmbedBuilder().setColor(0x00FF00).setTitle('Success')
                        .setDescription(`:white_check_mark: Moderation logs will now be sent to ${mentionedChannel.toString()}.`);
                        
                        if (!updatedConfigureDoc.modlogIsEnabled) {
                            successEmbed.addFields({name: 'Warning', value: ':warning: Moderation logs are currently **disabled**. Enable it with \`/configure modlogs: Enable\` to start logging to the channel.'})
                        }
                        
                        configureDoc.modlogChannel = mentionedChannel.id;
                        await configureDoc.save();

                        await interaction.editReply({ embeds: [successEmbed] });
                        await response.delete();
                        collector.stop();
                    } else {
                        const invalidChannelEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('Error')
                        .setDescription(':x: Please mention a valid text channel to set as the logging channel.');
                        await interaction.editReply({ embeds: [invalidChannelEmbed], ephemeral: true });
                        await response.delete();
                    }
                });
            
                collector.on('end', async (reason) => {
                    if (reason === 'time') {
                        const timeoutEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('Error')
                            .setDescription(':x: Configuration session timed out.');
                        await interaction.editReply({ embeds: [timeoutEmbed], ephemeral: true });
                    }
                });
            } else if (value === 4) {
                // Ask the user to ping or mention the roles
                const pingRolesPromptEmbed = new EmbedBuilder()
                    .setColor(0xCF9FFF)
                    .setTitle('Input Needed')
                    .setDescription(':question: Please mention or type the names of the roles that should be pinged for new members whose accounts are less than 14 days old in the next message.\n\nIf you are specifying multiple roles, you must use commas. e.g. `role 1, role 2`');
                
                const initialMessage = await interaction.reply({ embeds: [pingRolesPromptEmbed], ephemeral: true });
            
                // Create a filter function to check for valid role mentions and role names
                const roleMentionFilter = (response) => {
                    const content = response.content.toLowerCase(); // Convert to lowercase for case-insensitivity
                    if (content === 'disable') {
                        // User wants to disable the feature, so remove pingRoles entry from the database
                        configureDoc.pingRoles = [];
                        configureDoc.save().then(() => {
                            const successEmbed = new EmbedBuilder()
                                .setColor(0x00FF00)
                                .setTitle('Success')
                                .setDescription(':white_check_mark: The roles ping feature has been disabled.');
                            interaction.editReply({ embeds: [successEmbed], ephemeral: true }).then(() => {
                                if (!response.deleted) {
                                    response.delete();
                                }
                            }).catch(error => {
                                console.error("Error while deleting messages:", error);
                            });
                        }).catch(error => {
                            console.error("Error while saving configuration:", error);
                        });
                        collector.stop();
                        return;
                    }
                    
                    const roleMentionsAndNames = content.split(',').map(role => role.trim());
                    const validRoles = [];
                    const invalidRoles = [];
            
                    for (const roleMentionOrName of roleMentionsAndNames) {
                        if (roleMentionOrName.startsWith('<@&') && roleMentionOrName.endsWith('>')) {
                            // Check for role mentions
                            const roleId = roleMentionOrName.match(/(\d+)/);
                            if (roleId && interaction.guild.roles.cache.has(roleId[0])) {
                                validRoles.push(interaction.guild.roles.cache.get(roleId[0]));
                            } else {
                                invalidRoles.push(roleMentionOrName);
                            }
                        } else {
                            // Check for role names
                            const role = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === roleMentionOrName);
                            if (role) {
                                validRoles.push(role);
                            } else {
                                invalidRoles.push(roleMentionOrName);
                            }
                        }
                    }
            
                    if (validRoles.length > 0 && response.author.id === interaction.user.id) {
                        // Store the mentioned roles
                        const mentionedRoleNames = validRoles.map(role => `<@&${role.id}>`).join(', ');
                        configureDoc.pingRoles = validRoles.map(role => role.id);
                        configureDoc.save().then(() => {
                            const successEmbed = new EmbedBuilder()
                                .setColor(0x00FF00)
                                .setTitle('Success')
                                .setDescription(`:white_check_mark: Successfully added the roles that will be pinged if a member joins with an account that is younger than 14 days old.`
                                + `\n\nRoles Added: ${mentionedRoleNames}` 
                                + `\n\nIn order to get a ping by the role, you need to make sure that the role has "Allow anyone to @mention this role" enabled. Please enable it if you haven't already for members with the role to get pinged.`);
            
                            if (invalidRoles.length > 0) {
                                successEmbed.addFields({
                                    name: 'Invalid Roles',
                                    value: `The following roles were not added because they do not exist: \`${invalidRoles.join(', ')}\``
                                });
                            }
            
                            interaction.editReply({ embeds: [successEmbed], ephemeral: true }).then(() => {
                                if (!response.deleted) {
                                    response.delete();
                                }
                            }).catch(error => {
                                console.error("Error while deleting messages:", error);
                            });
                        }).catch(error => {
                            console.error("Error while saving configuration:", error);
                        });
            
                        collector.stop();
                    } else {
                        // Invalid roles mentioned or role names
                        const invalidRolesList = invalidRoles.join(', ');
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('Error')
                            .setDescription(`:x: The following roles are invalid or do not exist: \`${invalidRolesList}\``);
            
                        interaction.editReply({ embeds: [errorEmbed], ephemeral: true }).then(() => {
                            if (!response.deleted) {
                                response.delete();
                            }
                        }).catch(error => {
                            console.error("Error while deleting messages:", error);
                        });
                    }
                }
            
                const collector = interaction.channel.createMessageCollector({ time: 60000 });
            
                collector.on('collect', async (response) => {
                    // Call the roleMentionFilter function to handle role mentions and names
                    roleMentionFilter(response);
                });
            
                collector.on('end', async (reason) => {
                    if (reason === 'time') {
                        const timeoutEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('Error')
                            .setDescription(':x: Configuration session timed out.');
            
                        interaction.editReply({ embeds: [timeoutEmbed], ephemeral: true }).then(() => {
                            // Delete the initial message on timeout
                            if (!initialMessage.deleted) {
                                initialMessage.delete();
                            }
                        }).catch(error => {
                            console.error("Error while deleting messages:", error);
                        });
                    }
                });
            }                                                                                                                                                                                     
        }
    },
    name: "config",
    description: "Configure settings for TraaaaBot in the server.",
    options: [
        {
            name: "modlogs",
            description: "Log member, moderator, and server management events of the server.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: [
                { name: "Enable", value: 1 },
                { name: "Disable", value: 2 },
                { name: "Set channel", value: 3 },
                { name: "Ping roles if an account is less than 14 days old", value: 4 },
            ],
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ManageGuild],
    botPermissions: [PermissionFlagsBits.ManageGuild],
};
