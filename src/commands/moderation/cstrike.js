const { Client, 
    Interaction, 
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    PermissionFlagsBits,
    ApplicationCommandOptionType } = require('discord.js');
const strikeSchema = require('../../models/strike');
module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const { options, guildId } = interaction;
        const target = options.getUser('user');

        const userStrikes = await strikeSchema.findOne({
            guildID: guildId,
            userID: target.id,
            userTag: target.tag
        });

        if (!userStrikes) {
            const noStrikesEmbed = {
                color: 0xFF0000,
                title: `Error`,
                description: `❌ **${target.username}** (<@${target.id}>) does not have any strikes.`,
                thumbnail: {
                    url: target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })
                }
            };
            return await interaction.reply({ embeds: [noStrikesEmbed], ephemeral: true });
        }

        const confirmButton = new ButtonBuilder()
        .setCustomId('cstrconfirm')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
        .setCustomId('cstrcancel')
        .setLabel('No')
        .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
    
        const confirmEmbed = {
            color: 0xEED202,
            title: 'Warning',
            description: `Are you sure you want to **clear** <@${target.id}>'s strikes? They will not be notified that their strikes were cleared from the server.\n\n<@${target.id}> currently has ${userStrikes.strikeCount === 1 ? '**1** strike' : `**${userStrikes.strikeCount}** strikes`}.\n\n**WAIT!** Are you looking to remove a specific strike only? Do \`/rstrike (user) (strike number)\` instead.`,
            thumbnail: { url: target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }) }
        };

        await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
        let buttonResponseProvided = false;
        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 40000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'cstrconfirm') {
                await strikeSchema.findOneAndDelete({
                    guildID: guildId,
                    userID: target.id,
                    userTag: target.tag
                });

                const resultEmbed = {
                    color: 0x00ff00,
                    title: `Success`,
                    description: `<@${target.id}>'s strikes have been cleared from this server.`,
                    thumbnail: {
                        url: target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })
                    }
                };


                interaction.editReply({ embeds: [resultEmbed], components: [] });
                collector.stop();
                buttonResponseProvided = true;
            } else if (i.customId === 'cstrcancel') {
                const cancelEmbed = {
                    color: 0x00ff00,
                    title: `Success`,
                    description: `Clear strike operation for <@${target.id}> was cancelled.`,
                    thumbnail: {
                        url: target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })
                    }
                };
                interaction.editReply({ embeds: [cancelEmbed], components: [] });
                collector.stop();
                buttonResponseProvided = true;
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time' && !buttonResponseProvided) {
                const timeoutEmbed = {
                    color: 0xFF0000,
                    title: `Error`,
                    description: `Strike clear confirmation timed out. <@${target.id}> will not have their strikes cleared from this server.`,
                    thumbnail: {
                        url: target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })
                    }
                };

                interaction.editReply({ embeds: [timeoutEmbed], components: [] });
            }
        });
    },

    name: 'cstrike',
    description: "Clears the strikes of a user.",
    options : [
        {
            name: "user",
            description: "The user you want to clear the strikes of.",
            type: ApplicationCommandOptionType.Mentionable,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages]
}