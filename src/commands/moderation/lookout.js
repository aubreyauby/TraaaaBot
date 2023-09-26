const { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder, Constants } = require('discord.js');
const Configure = require('../../models/configure');
const Lookout = require('../../models/lookout');

module.exports = {
    callback: async (client, interaction) => {
        const { options, guildId, user } = interaction;
        const target = options.getUser('member');

        if (target.bot) {
            const botStrikeEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
                .setDescription(`:x: <@${target.id}> is a bot.`)
                .setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 }));
            return await interaction.reply({ embeds: [botStrikeEmbed], ephemeral: true });
        }

        try {
            // Check if the target user is already on the lookout list for this guild
            const lookoutEntry = await Lookout.findOne({ guildID: guildId, userID: target.id });

            if (lookoutEntry) {
                // Toggle lookout status
                lookoutEntry.lookOutEnabled = !lookoutEntry.lookOutEnabled;
                await lookoutEntry.save();

                const action = lookoutEntry.lookOutEnabled ? 'added to' : 'removed from';

                // Send a confirmation message
                const successEmbed = new EmbedBuilder().setColor(0x00FF00).setTitle('Success')
                    .setDescription(`:white_check_mark: <@${target.id}> has been ${action} the lookout list.`)
                    .setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 }));

                return await interaction.reply({ embeds: [successEmbed] });
            }

            // Get the guild's configuration
            const configureDoc = await Configure.findOne({ guildId });

            if (!configureDoc || !configureDoc.lookoutLogChannel) {
                const configMissingEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
                    .setDescription(`:x: Lookout configuration is missing or incomplete for this guild.`);

                return await interaction.reply({ embeds: [configMissingEmbed], ephemeral: true });
            }

            // Create a new entry in the lookout database
            const newLookoutEntry = new Lookout({
                guildID: guildId,
                userID: target.id,
                userTag: target.tag,
                lookOutEnabled: true,
            });

            await newLookoutEntry.save();

            // Send a confirmation message
            const successEmbed = new EmbedBuilder().setColor(0x00FF00).setTitle('Success')
                .setDescription(`:white_check_mark: <@${target.id}> has been added to the lookout list.`)
                .setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 }));

            await interaction.reply({ embeds: [successEmbed] });
        } catch (error) {
            console.error(`Error toggling user lookout status: ${error}`);
            const errorEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
                .setDescription(`An error occurred while toggling <@${target.id}>'s lookout status.`);

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    name: 'lookout',
    description: "Sends out advisories to a specified text channel about a member's activity.",
    options: [
        {
            name: "member",
            description: "The member to place on or lift lookout from.",
            type: ApplicationCommandOptionType.User,
            required: true,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages],
};
