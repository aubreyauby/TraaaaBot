const { Client, 
    Interaction,
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
        const { options, member, guildId } = interaction;
        const target = options.getUser('member') || member.user;

        const userStrikes = await strikeSchema.findOne({
            guildID: guildId,
            userID: target.id,
            userTag: target.tag
        });

        if (target.bot) {
            const botStrikeEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
                .setDescription(`:x: <@${target.id}> is a bot.`)
                .setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 }));
            return await interaction.reply({ embeds: [botStrikeEmbed], ephemeral: true });
        }

        const strikeNumber = options.getInteger('strike');

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

        userStrikes.content.splice(strikeNumber - 1, 1);
        userStrikes.strikeCount = userStrikes.content.length;
        await userStrikes.save();

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
            name: "member",
            description: "The member you want to remove a strike from.",
            type: ApplicationCommandOptionType.Mentionable,
            required: true
        },
        {
            name: "strike",
            description: "The strike number you want to remove.",
            type: ApplicationCommandOptionType.Integer,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages]
}