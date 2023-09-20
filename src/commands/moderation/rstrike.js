const { Client, 
    Interaction,
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
        const { options, member, guildId } = interaction;
        const target = options.getUser('user') || member.user;

        const userStrikes = await strikeSchema.findOne({
            guildID: guildId,
            userID: target.id,
            userTag: target.tag
        });

        // Retrieve the strikeNumber from the interaction options
        const strikeNumber = options.getInteger('strike');

        // Check if userStrikes is defined and has the 'content' property
        if (!userStrikes || !userStrikes.content || isNaN(strikeNumber) || strikeNumber <= 0 || strikeNumber > userStrikes.content.length) {
            const errorEmbed = {
                color: 0xFF0000,
                title: `Error`,
                description: `❌ There was an issue removing the strike for <@${target.id}>. Please provide a valid strike number and try again later.`,
                thumbnail: {
                    url: target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })
                }
            };
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Remove the specific strike from the user's strikes array
        userStrikes.content.splice(strikeNumber - 1, 1);

        // Update the strikeCount based on the modified content array
        userStrikes.strikeCount = userStrikes.content.length;

        // Save the updated userStrikes document back to the database
        await userStrikes.save();

        // Create a success embed
        const successEmbed = {
            color: 0x5cb85c,
            title: `Success`,
            description: `✅ Removed strike **${strikeNumber}** for <@${target.id}>.\n\n:warning: If you removed the strike from the member during their timeout period, the timeout was not lifted. You would have to manually remove it from the member. `,
            thumbnail: {
                url: target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })
            }
        };

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },

    name: 'rstrike',
    description: "Removes a specific strike from a member.",
    options: [
        {
            name: "user",
            description: "The member you want to clear the strikes of.",
            type: ApplicationCommandOptionType.Mentionable,
            required: true
        },
        {
            name: "strike",
            description: "The strike number you want to remove from the member.",
            type: ApplicationCommandOptionType.Integer,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages]
}