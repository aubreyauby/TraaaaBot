const { EmbedBuilder, ApplicationCommandOptionType, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const Configure = require('../../models/configure');
const configSessions = new Map();

module.exports = {
    callback: async (client, interaction) => {
        const commandName = interaction.commandName;

        if (commandName === 'config') {
            const modlogsOption = interaction.options.get('modlogs');
            const lookoutOption = interaction.options.get('lookout');
            const banOption = interaction.options.get('ban');
            const kickOption  = interaction.options.get('kick');
            const starboardOption = interaction.options.get('starboard');

            if (!modlogsOption && !lookoutOption && !banOption && !kickOption && !starboardOption) {
                const guild = interaction.guild;
                const guildIconURL = guild.iconURL();

                const helpEmbed = new EmbedBuilder()
                    .setColor('#FF69B4')
                    .setAuthor('TraaaaBot Settings', client.user.displayAvatarURL())
                    .setTitle('Configure Settings for TraaaaBot')
                    .setDescription(`Configure the behavior and features of TraaaaBot in your server to make the bot function based on your needs and preferences. ` 
                        + `You can also change the settings easily without the need to run many commands by [using the dashboard](https://www.google.com).\n\n`
                        + `**Usage:** \`/config [category: choice]\`\n`
                        + `**Example:** \`/config modlogs: Enable\` (this will enable moderation logs for the server)`)
                    .setThumbnail(guildIconURL);

                return await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
            }

            const modlogsValue = modlogsOption ? modlogsOption.value : null;
            const lookoutValue = lookoutOption ? lookoutOption.value : null;
            const banValue = banOption ? banOption.value : null;
            const kickValue = kickOption ? kickOption.value : null;
            const starboardValue = starboardOption ? starboardOption.value : null;

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            let configureDoc = await Configure.findOne({ guildId });

            if (!configureDoc) {
                configureDoc = new Configure({
                    guildId,
                    // moderation logs
                    modlogIsEnabled: false,
                    modlogChannel: '',
                    pingRoles: '',
                    // lookout
                    lookoutLogChannel: '',
                    // starboard
                    starboardIsEnabled: false,
                    starboardChannel: '',
                    starboardThreshold: '',
                    starboardDeleteUnderThreshold: false,
                    starboardSpoilerMark: false,
                    starboardEmojiID: '',
                    starboardEmojiReaction: '',
                    starboardLeaderboards: false,
                    starboardDetectWords: '',
                    starboardDetectMedia: '',
                    starboardAgeLimit: '',
                });
                try {
                    await configureDoc.save();
                } catch (error) {
                    console.error("Error while saving new configuration:", error);
                }
            }

            const updatedConfigureDoc = await Configure.findOne({ guildId });
            
            if (modlogsValue === 1) {
                // Enable logging and add audit log access information
                const modlogEnableEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('Success')
                    .setDescription(':white_check_mark: Moderation logs have been **enabled** for this server.')

                updatedConfigureDoc.modlogIsEnabled = true;
                await updatedConfigureDoc.save();

                if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
                    modlogEnableEmbed.addFields({name: 'Missing Permission', value: `:warning: TraaaaBot lacks the **View Audit Log** permission. Server icon changes will not be logged until this permission is granted.`})
                }

                await interaction.reply({ embeds: [modlogEnableEmbed], ephemeral: true });
            } else if (modlogsValue === 2) {
                const modlogDisableEmbed = new EmbedBuilder().setColor('#00FF00').setTitle('Success')
                    .setDescription(':white_check_mark: Moderation logs have been **disabled** for this server.');

                await Configure.findOneAndDelete({ guildId: interaction.guild.id });

                await interaction.reply({ embeds: [modlogDisableEmbed], ephemeral: true });
            } else if (modlogsValue === 3) {
                const modlogSetChannelEmbed = new EmbedBuilder().setColor('#CF9FFF').setTitle('Input Needed')
                    .setDescription(':question: Please specify the text channel that you want to use for logging in the next message.');

                configSessions.set(`${userId}-${guildId}`, true);
                const initialMessage = await interaction.reply({ embeds: [modlogSetChannelEmbed], ephemeral: true });
                const filter = (response) => {
                    return response.channel.id === interaction.channelId && response.author.id === interaction.user.id;
                };

                const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

                collector.on('collect', async (response) => {
                    const mentionedChannel = response.mentions.channels.first();

                    if (mentionedChannel) {
                        const successEmbed = new EmbedBuilder().setColor('#00FF00').setTitle('Success')
                            .setDescription(`:white_check_mark: Moderation logs will now be sent to ${mentionedChannel.toString()}.`);

                        if (!updatedConfigureDoc.modlogIsEnabled) {
                            successEmbed.addFields({ name: 'Warning', value: ':warning: Moderation logs are currently **disabled**. Enable it with `/config modlogs: Enable` to start logging to the channel.' });
                        }

                        configureDoc.modlogChannel = mentionedChannel.id;
                        await configureDoc.save();

                        await interaction.editReply({ embeds: [successEmbed] });
                        configSessions.delete(`${userId}-${guildId}`);
                        await response.delete();
                        collector.stop();
                    } else {
                        const invalidChannelEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('Error')
                            .setDescription(':x: Please mention a valid text channel to set as the logging channel.');
                        await interaction.editReply({ embeds: [invalidChannelEmbed], ephemeral: true });
                        await response.delete();
                    }
                });

                collector.on('end', async (reason) => {
                    if (reason === 'time') {
                        const timeoutEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('Error')
                            .setDescription(':x: Configuration session timed out.');
                        configSessions.delete(`${userId}-${guildId}`);
                        await interaction.editReply({ embeds: [timeoutEmbed], ephemeral: true });
                    }
                });
            } else if (modlogsValue === 4) {
                // Ask the user to ping or mention the roles
                const pingRolesPromptEmbed = new EmbedBuilder()
                    .setColor('#CF9FFF')
                    .setTitle('Input Needed')
                    .setDescription(':question: Please mention or type the names of the roles that should be pinged for new members whose accounts are less than 14 days old in the next message.\n\nIf you are specifying multiple roles, you must use commas. e.g. `role 1, role 2`\n\n'
                        + 'You can also type `clear` to clear the roles that are being used right now for pinging.'
                        + '\n\nIf you no longer wish to do this, type `cancel`.');

                const initialMessage = await interaction.reply({ embeds: [pingRolesPromptEmbed], ephemeral: true });
                configSessions.set(`${userId}-${guildId}`, true);

                // Create a filter function to check for valid role mentions and role names
                const roleMentionFilter = (response) => {
                    const content = response.content.toLowerCase();

                    if (content === 'cancel') {
                        // User wants to cancel the configuration
                        const cancelEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('Cancelled')
                            .setDescription(':x: Configuration cancelled. No roles were added.');

                        interaction.editReply({ embeds: [cancelEmbed], ephemeral: true }).then(() => {
                            if (!response.deleted) {
                                response.delete();
                            }
                            configSessions.delete(`${userId}-${guildId}`);
                        }).catch(error => {
                            console.error("Error while deleting messages:", error);
                            configSessions.delete(`${userId}-${guildId}`);
                        });

                        collector.stop();
                        return;
                    }

                    if (content === 'clear') {
                        // User wants to clear the specified roles
                        const clearedRoles = configureDoc.pingRoles.map(roleId => {
                            const role = interaction.guild.roles.cache.get(roleId);
                            return role ? `<@&${role.id}>` : null;
                        }).filter(Boolean);

                        if (clearedRoles.length === 0) {
                            // No roles to clear
                            const noRolesToClearEmbed = new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('Error')
                                .setDescription(':x: There are no roles to clear. The configuration window has closed.');

                            interaction.editReply({ embeds: [noRolesToClearEmbed], ephemeral: true }).then(() => {
                                if (!response.deleted) {
                                    response.delete();
                                }
                                configSessions.delete(`${userId}-${guildId}`);
                            }).catch(error => {
                                console.error("Error while deleting messages:", error);
                                configSessions.delete(`${userId}-${guildId}`);
                            });
                        } else {
                            configureDoc.pingRoles = [];
                            configureDoc.save().then(() => {
                                const successEmbed = new EmbedBuilder()
                                    .setColor('#00FF00')
                                    .setTitle('Success')
                                    .setDescription(`:white_check_mark: Successfully removed ${clearedRoles.join(', ')} from being pinged about new members who join with accounts less than 14 days old.`);

                                interaction.editReply({ embeds: [successEmbed], ephemeral: true }).then(() => {
                                    if (!response.deleted) {
                                        response.delete();
                                    }
                                    configSessions.delete(`${userId}-${guildId}`);
                                }).catch(error => {
                                    console.error("Error while deleting messages:", error);
                                    configSessions.delete(`${userId}-${guildId}`);
                                });
                            }).catch(error => {
                                console.error("Error while saving configuration:", error);
                                configSessions.delete(`${userId}-${guildId}`);
                            });
                        }
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
                                .setColor('#00FF00')
                                .setTitle('Success')
                                .setDescription(`:white_check_mark: Successfully added the roles that will be pinged if a member joins with an account that is younger than 14 days old.`
                                    + `\n\nRoles Added: ${mentionedRoleNames}`
                                    + `\n\nIn order to get a ping by the role, you need to make sure that the role has "Allow anyone to @mention this role" enabled. Please enable it if you haven't already for members with the role to get pinged.`);

                            if (invalidRoles.length > 0) {
                                successEmbed.addFields({
                                    name: 'Invalid Roles',
                                    value: `:x: The following roles were not added because they do not exist: \`${invalidRoles.join(', ')}\``
                                });
                            }

                            configSessions.delete(`${userId}-${guildId}`);

                            interaction.editReply({ embeds: [successEmbed], ephemeral: true }).then(() => {
                                if (!response.deleted) {
                                    response.delete();
                                }
                            }).catch(error => {
                                console.error("Error while deleting messages:", error);
                                configSessions.delete(`${userId}-${guildId}`);
                            });
                        }).catch(error => {
                            console.error("Error while saving configuration:", error);
                            configSessions.delete(`${userId}-${guildId}`);
                        });

                        collector.stop();
                    } else {
                        // Invalid roles mentioned or role names
                        const invalidRolesList = invalidRoles.join(', ');
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('Error')
                            .setDescription(`:x: The following roles are invalid or do not exist: \`${invalidRolesList}\`\n\nTry again.`);

                        interaction.editReply({ embeds: [errorEmbed], ephemeral: true }).then(() => {
                            if (!response.deleted) {
                                response.delete();
                            }
                        }).catch(error => {
                            console.error("Error while deleting messages:", error);
                            configSessions.delete(`${userId}-${guildId}`);
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
                            .setColor('#FF0000')
                            .setTitle('Error')
                            .setDescription(':x: Configuration session timed out.');
                        configSessions.delete(`${userId}-${guildId}`);

                        interaction.editReply({ embeds: [timeoutEmbed], ephemeral: true }).then(() => {
                            // Delete the initial message on timeout
                            if (!initialMessage.deleted) {
                                initialMessage.delete();
                            }
                        }).catch(error => {
                            console.error("Error while deleting messages:", error);
                            configSessions.delete(`${userId}-${guildId}`);
                        });
                    }
                });
            } else if (lookoutValue === 1) {
                const lookoutSetChannelEmbed = new EmbedBuilder().setColor('#CF9FFF').setTitle('Input Needed')
                    .setDescription(':question: Please specify the text channel where you want to post lookout logs in the next message.');

                configSessions.set(`${userId}-${guildId}`, true);
                const initialMessage = await interaction.reply({ embeds: [lookoutSetChannelEmbed], ephemeral: true });
                const filter = (response) => {
                    return response.channel.id === interaction.channelId && response.author.id === interaction.user.id;
                };

                const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

                collector.on('collect', async (response) => {
                    const mentionedChannel = response.mentions.channels.first();

                    if (mentionedChannel) {
                        const successEmbed = new EmbedBuilder().setColor('#00FF00').setTitle('Success')
                            .setDescription(`:white_check_mark: Lookout logs will now be sent to ${mentionedChannel.toString()}.`);

                        try {
                            const configureDoc = await Configure.findOneAndUpdate(
                                { guildId },
                                { lookoutLogChannel: mentionedChannel.id },
                                { new: true }
                            );

                            await configureDoc.save();
                        } catch (error) {
                            console.error(`Error updating lookoutLogChannel: ${error}`);
                        }

                        await interaction.editReply({ embeds: [successEmbed] });
                        configSessions.delete(`${userId}-${guildId}`);
                        await response.delete();
                        collector.stop();
                    } else {
                        const invalidChannelEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('Error')
                            .setDescription(':x: Please mention a valid text channel to set as the lookout logs channel.');
                        await interaction.editReply({ embeds: [invalidChannelEmbed], ephemeral: true });
                        await response.delete();
                    }
                });

                collector.on('end', async (reason) => {
                    if (reason === 'time') {
                        const timeoutEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('Error')
                            .setDescription(':x: Configuration session timed out.');
                        configSessions.delete(`${userId}-${guildId}`);
                        await interaction.editReply({ embeds: [timeoutEmbed], ephemeral: true });
                    }
                });
            } else if (starboardValue === 1) {
                
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
                { name: "Enable moderation logs for this server", value: 1 },
                { name: "Disable moderation logs for this server", value: 2 },
                { name: "Set a channel to post moderation logs", value: 3 },
                { name: "Ping roles if a member joins with an account less than 14 days old", value: 4 },
            ],
        },
        {
            name: "lookout",
            description: "Log more activities about a specified member in the server.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: [
                { name: "Set a channel to post lookout logs", value: 1 },
                { name: "Warn members in DMs that they've been placed on lookout (default: OFF)", value: 2 },
            ]
        },
        {
            name: "starboard",
            description: "Starboard is a great way to promote the best content of the server, showcasing it in a channel.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: [
                { name: "Start configuration wizard for Starboard", value: 1 },
                { name: "Toggle starboard for this server", value: 2 },
                { name: "Set a channel to post starboards", value: 3 },
                { name: "Set threshold needed to starboard", value: 4 },
                { name: "Delete starboard if number of starboard emojis fall below threshold", value: 5 },
                { name: "Spoiler mark starboard posts if the original content is spoiler marked", value: 6 },
                { name: "Override default emoji (⭐) with a custom emoji", value: 7 },
                { name: "Append emoji reaction for members to add stars via the assigned channel", value: 8 },
                { name: "Leaderboards for most starboard posts by member", value: 9 },
                { name: "[filter] Detect words or phrases that should not be posted in starboard", value: 10 },
                { name: "[filter] Detect types of media that should not be posted in starboard", value: 11 },
                { name: "[filter] Set an age limit for posts that can be posted in starboard", value: 12 },
            ]
        },
        {
            name: "ban",
            description: "Advanced banning feature for servers powered by TraaaaBot.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: [
                { name: "Warn members in DMs that they've been banned from the server (default: OFF)", value: 1, }
            ]
        },
        {
            name: "kick",
            description: "Advanced kicking feature for servers powered by TraaaaBot.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: [
                { name: "Warn members in DMs that they've been kicked from the server (default: OFF)", value: 1, }
            ]
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageGuild],
    botPermissions: [PermissionFlagsBits.ManageGuild],
};
