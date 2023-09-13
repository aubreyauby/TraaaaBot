const { Client, 
    Interaction, 
    EmbedBuilder,
    PermissionsBitField,
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
        const invoker = member.user;
        let data = await strikeSchema.findOne({
            guildID: guildId,
            userID: target.id,
            userTag: target.tag,
        });

        // Build the embed that tells the member that they do not have any strikes in the server.
        const noStrikes = new EmbedBuilder()
            .setTitle(`${target.tag}'s Strike Logs`)
            .setColor(0x00FF00)
            .setTimestamp()
            .setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setDescription(`✅ **${target.tag}** (<@${target.id}>) has no strikes!\n\nThank you for following the rules.`)

        // Build the embed that tells the member to check their DMs for either their own or other members' strike logs.
        const sentConfirmation = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`✅ Check your DMs for ${target.id === invoker.id ? 'your' : `<@${target.id}>'s`} strike logs.`)
            
        // Build the embed that tells the member that they do not have permission to view the strike logs of other members.
        const viewYourOwn = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`❌ You do not have permission to view the strike logs of other members.`)

        // If the target is not the same as the invoking user and they don't have "Manage Messages" permission, prohibit viewing other members' strike logs
        if (target.id !== invoker.id && !member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            interaction.reply({ embeds: [viewYourOwn] })
            return;
        }

        if (data) {
            const embed = new EmbedBuilder()
            .setTitle(`${target.tag}'s Strike Logs`)
            .setColor(0xFF0000)
            .setTimestamp()
            .setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setDescription(`❗ **${target.tag}** (<@${target.id}>) has **${data.strikeCount}** ${data.strikeCount === 1 ? 'strike' : 'strikes'}.\n${data.content.map(
                (w, i) => 
                  `
                    **Strike**: ${i + 1}
                    **Moderator**: <@${w.ExecutorID}>
                    **Rule violated**: ${w.RuleBroken}
                    **Explanation**: ${w.StrikeDetails}
                  `
                ).join(`\n`)}`);
            try {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (err) {
                const errorEmbed = new EmbedBuilder()
                .setDescription(`❌ This command threw an error. Please report this error to the developers.\n\`\`\`${err}\`\`\``)
                interaction.reply({ embeds: [errorEmbed], ephemeral: true })
            }
        } else {
            try {
                await interaction.reply({ embeds: [noStrikes], ephemeral: true });
            } catch (err) {
                const errorEmbed = new EmbedBuilder()
                .setDescription(`❌ This command threw an error. Please report this error to the developers.\n\`\`\`${err}\`\`\``)
                interaction.reply({ embeds: [errorEmbed], ephemeral: true })
            }
        }
    },

    name: 'strikes',
    description: "Checks the strikes of a user.",
    options : [
        {
            name: "user",
            description: "The user to view the strikes of.",
            type: ApplicationCommandOptionType.Mentionable,
            required: false
        }
    ]
}