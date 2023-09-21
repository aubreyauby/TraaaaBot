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

        const noStrikes = new EmbedBuilder()
            .setTitle(`${target.tag}'s Strike Logs`)
            .setColor(0x00FF00)
            .setTimestamp()
            .setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setDescription(`✅ <@${target.id}> has no strikes!\n\nThank you for following the rules.`)
            
        const viewYourOwn = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`❌ You do not have permission to view the strike logs of other members.`)

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
            .setDescription(`❗ <@${target.id}> has **${data.strikeCount}** ${data.strikeCount === 1 ? 'strike' : 'strikes'} in **${interaction.guild.name}**.\n${data.content.map(
                (w, i) => 
                `
                **Strike**: ${i + 1}
                **Moderator**: <@${w.ExecutorID}>
                **Reason**: ${w.Reason || "No reason provided"}
                `
            ).join('')}`);
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
    description: "Checks the strikes of a member.",
    options : [
        {
            name: "member",
            description: "The member to view the strikes of.",
            type: ApplicationCommandOptionType.Mentionable,
            required: false
        }
    ]
}