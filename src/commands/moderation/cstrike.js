const { Client, 
    Interaction, 
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
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

        if (target.bot) {
            const botStrikeEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
                .setDescription(`:x: <@${target.id}> is a bot.`)
                .setAuthor({ name: target.tag, iconURL: target.avatarURL()});
            return await interaction.reply({ embeds: [botStrikeEmbed], ephemeral: true });
        }


        if (!userStrikes) {
            const noStrikesEmbed = {
                color: 0xFF0000,
                title: `Error`,
                description: `❌ <@${target.id}> does not have any strikes.`,
                author: {
                    name: target.tag, 
                    iconURL: target.avatarURL()
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
            description: `:warning: Are you sure you want to clear <@${target.id}>'s strikes? They will not be notified that their strikes were cleared from the server.\n\n<@${target.id}> currently has ${userStrikes.strikeCount === 1 ? '**1** strike' : `**${userStrikes.strikeCount}** strikes`}.`,
            footer: {text: 'Are you looking to remove a specific strike? The command is /rstrike.'},
            author: {
                name: target.tag, 
                iconURL: target.avatarURL()
            }
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
                    description: `:white_check_mark: <@${target.id}>'s strikes have been cleared from ${interaction.guild.name}.`,
                    author: {
                        name: target.tag, 
                        iconURL: target.avatarURL()
                    }
                };


                interaction.editReply({ embeds: [resultEmbed], components: [] });
                collector.stop();
                buttonResponseProvided = true;
            } else if (i.customId === 'cstrcancel') {
                const cancelEmbed = {
                    color: 0x00ff00,
                    title: `Success`,
                    description: `:white_check_mark: Clear strike operation for <@${target.id}> was cancelled.`,
                    author: {
                        name: target.tag, 
                        iconURL: target.avatarURL()
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
                    description: `:x: Strike clear confirmation timed out. <@${target.id}> will not have their strikes cleared from this server.`,
                    author: {
                        name: target.tag, 
                        iconURL: target.avatarURL()
                    }
                };

                interaction.editReply({ embeds: [timeoutEmbed], components: [] });
            }
        });
    },

    name: 'cstrike',
    description: "Clears the strikes of a member.",
    options : [
        {
            name: "user",
            description: "The member you want to clear the strikes of.",
            type: ApplicationCommandOptionType.Mentionable,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages]
}