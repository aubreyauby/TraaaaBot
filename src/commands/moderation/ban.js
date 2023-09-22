const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const Configure = require('../../models/configure');
const Ban = require('../../models/ban');

module.exports = {
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const { options, guild, user, member } = interaction;
        const targetUser = options.getUser("user");

        // Check if the target user is the bot itself.
        if (targetUser.id === client.user.id) {
            const botBanErrorEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000).setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                .setDescription(":x: You cannot ban the bot itself.");
            return interaction.reply({ embeds: [botBanErrorEmbed], ephemeral: true });
        }

        // Check if the target user is the owner of the server.
        if (targetUser.id === guild.ownerId) {
            const ownerBanErrorEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000).setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                .setDescription(":x: You cannot ban the owner of this server.");
            return interaction.reply({ embeds: [ownerBanErrorEmbed], ephemeral: true });
        }

        // Check if TraaaaBot has permission to ban members in the guild.
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            const botNoPermissionEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000).setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                .setDescription(":x: TraaaaBot does not have the Ban Members permission in this server. Please check the permissions and try again later.");
            return interaction.reply({ embeds: [botNoPermissionEmbed], ephemeral: true });
        }

        const reason = interaction.options.getString("reason") || "No reason provided";
        const deleteTimeframeChoice = options.getInteger("delete", 0);
        const deleteTimeframeChoices = {
            3600: "Past Hour",
            21600: "Past 6 Hours",
            43200: "Past 12 Hours",
            86400: "Past 24 Hours",
            259200: "Past 3 Days",
            604800: "Past 7 Days",
        };

        const durationChoices = {
            10: "10 Seconds",
            86400: "1 Day",
            259200: "3 Days",
            604800: "1 Week (7 Days)",
            1209600: "2 Weeks (14 Days)",
            2592000: "1 Month",
        };

        const deleteTimeframe = deleteTimeframeChoices[deleteTimeframeChoice];

        const duration = options.getInteger("duration");

        try {
            let banExpiration = null;
            let previousBanExpiration = null; // To store the previous ban expiration
            const userBannedEmbed = new EmbedBuilder().setTitle("User Banned").setColor(0x00ff00)
            .setDescription(`:white_check_mark: <@${targetUser.id}> has been banned.`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
            .addFields(
                { name: "Reason", value: reason, inline: true },
                { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true }
            );

            if (duration) {
                // Calculate the ban expiration date based on the duration
                banExpiration = new Date(Date.now() + duration * 1000);
        
                // Find the existing ban for the same user and guild
                const existingBan = await Ban.findOne({ userId: targetUser.id, guildId: guild.id });
        
                if (existingBan) {
                    previousBanExpiration = existingBan.banExpiration;
                    
                    // Update the existing ban with the new ban expiration
                    await Ban.updateOne({ userId: targetUser.id, guildId: guild.id }, { $set: { banExpiration } });
                } else {
                    // Create a new Ban document and save it to the database
                    const newBan = new Ban({ userId: targetUser.id, guildId: guild.id, banExpiration });
                    await newBan.save();
                }

                if (previousBanExpiration) {
                    userBannedEmbed.addFields({
                        name: "Ban Duration",
                        value: `:warning: The previous ban expiration of **<t:${Math.floor(previousBanExpiration / 1000)}:f>** was overwritten with a new ban expiration of **<t:${Math.floor(banExpiration / 1000)}:f>**.`,
                        inline: false,
                    });
                } else {
                    userBannedEmbed.addFields({
                        name: "Ban Duration",
                        value: `This ban will last until **<t:${Math.floor(banExpiration / 1000)}:f>**.`,
                        inline: false,
                    });
                }
            }
        
            // Ban the user
            await guild.members.ban(targetUser, { reason: reason });
            

            if (deleteTimeframeChoice) {
                try {
                    // Fetch messages from the channel
                    const messages = await interaction.channel.messages.fetch({ limit: 100 });
                
                    // Calculate the timestamp cutoff
                    const timestampCutoff = Date.now() - deleteTimeframeChoice * 1000;
                
                    // Filter and delete messages older than the timestamp cutoff
                    const messagesToDelete = messages.filter((msg) => {
                        return msg.author.id === targetUser.id && msg.createdTimestamp >= timestampCutoff;
                    });
                
                    // Notify that messages were deleted
                    let delMsgValue = `:white_check_mark: **${messagesToDelete.size}** message${messagesToDelete.size === 1 ? '' : 's'} from the **${deleteTimeframe.toLowerCase()}** have been deleted.`;
            
                    if (messagesToDelete.size === 0) {
                        delMsgValue = `:x: No messages from the **${deleteTimeframe.toLowerCase()}** have been deleted.`;
                    }
            
                    // Set the deletedMessagesField based on whether messages were deleted or not
                    deletedMessagesField = `:boom: ${delMsgValue}\n`;
                
                    userBannedEmbed.addFields({
                        name: "Deleted Messages",
                        value: delMsgValue,
                        inline: false,
                    });
                
                    if (messagesToDelete.size > 0) {
                        const messageIdsToDelete = messagesToDelete.map((msg) => msg.id);
                        await interaction.channel.bulkDelete(messageIdsToDelete);
                    }
                } catch (error) {
                    console.error("Error deleting messages:", error);
                }
            }

            // Log the ban to a modlog channel if logging is enabled
            const serverId = guild.id;
            const config = await Configure.findOne({ guildId: serverId });

            if (config && config.modlogChannel && config.modlogIsEnabled) {
                const modlogChannel = guild.channels.cache.get(config.modlogChannel);
                if (modlogChannel) {
                    let delMsgValue = ""; // Initialize the variable
                    const expirationDate = duration ? new Date(Date.now() + duration * 1000) : null;
                    const expirationString = expirationDate ? `until <t:${Math.floor(expirationDate / 1000)}:f>` : "Permanent";
                    if (deleteTimeframeChoice) {
                        try {
                            // Fetch messages from the channel
                            const messages = await interaction.channel.messages.fetch({ limit: 100 });
                    
                            // Calculate the timestamp cutoff
                            const timestampCutoff = Date.now() - deleteTimeframeChoice * 1000;
                    
                            // Filter and delete messages older than the timestamp cutoff
                            const messagesToDelete = messages.filter((msg) => {
                                return msg.author.id === targetUser.id && msg.createdTimestamp >= timestampCutoff;
                            });
                    
                            // Notify that messages were deleted
                            if (messagesToDelete.size > 0) {
                                delMsgValue = `:white_check_mark: **${messagesToDelete.size}** message${messagesToDelete.size === 1 ? '' : 's'} from the **${deleteTimeframe.toLowerCase()}** have been deleted.`;
                            }
                        } catch (error) {
                            console.error("Error deleting messages:", error);
                        }
                    }
            
                    // Create the ban log embed
                    const banLogEmbed = new EmbedBuilder()
                    .setColor(0xEE4B2B)
                    .setTitle(`Member Banned`)
                    .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }) })
                    .setDescription(
                        `**Member:** <@${targetUser.id}>\n` +
                        `**Moderator:** <@${interaction.user.id}>\n` +
                        `**Reason:** ${reason}\n` +
                        `**Duration:** ${duration ? `${durationChoices[duration]} (${expirationString})` : "Permanent"}\n` + 
                        delMsgValue // Include the delMsgValue variable in the description
                    )
                    .setTimestamp()
                    .setFooter(({text: `Member ID: ${targetUser.id}`}));
                
            
                    modlogChannel.send({ embeds: [banLogEmbed] });
                }
            }            

            return interaction.reply({ embeds: [userBannedEmbed] });
        } catch (error) {
            if (error.code === 50013) {
                // 50013 occurs when the bot cannot ban the user because of the guild's role hierarchy.
                // So we let the user know that and to move the roles to see if they can ban the user now.
                const missingPermError = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                    .setDescription(`:x: **${targetUser.tag}** (<@${targetUser.id}>) is positioned above TraaaaBot in the roles hierarchy. To ban this member using TraaaaBot, you need to move TraaaaBot's role on top of every role that will be bannable by this command.`);

                return interaction.reply({ embeds: [missingPermError], ephemeral: true });
            }
            const errorEmbed = new EmbedBuilder()
                .setTitle("Error")
                .setColor(0xff0000)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                .setDescription(`:x: An error occurred while trying to ban the user:\n\`\`\`${error.message}\`\`\``);
            console.log(error);
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    name: "ban",
    description: "Ban a member from the server.",
    options: [
        {
            name: "member",
            description: "Specify the member you want to ban from the server.",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "reason",
            description: "Specify a reason for why the member is being banned.",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: "delete",
            description: "Delete messages posted in the past hour or days.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: [
                { name: "Past Hour", value: 3600 },
                { name: "Past 6 Hours", value: 21600 },
                { name: "Past 12 Hours", value: 43200 },
                { name: "Past 24 Hours", value: 86400 },
                { name: "Past 3 Days", value: 259200 },
                { name: "Past 7 Days", value: 604800 },
            ],
        },
        {
            name: "duration",
            description: "Specify for how long this ban will last if it'll be temporary.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: [
                { name: "10 Seconds", value: 10 },
                { name: "1 Day", value: 86400 },
                { name: "3 Days", value: 259200 },
                { name: "1 Week (7 Days)", value: 604800 },
                { name: "2 Weeks (14 Days)", value: 1209600 },
                { name: "1 Month", value: 2592000 },
            ],
        },
    ],
    permissionsRequired: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
};
