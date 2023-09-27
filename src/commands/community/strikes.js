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
        const target = options.getUser('member') || member.user;
        const invoker = member.user;
        let data = await strikeSchema.findOne({
            guildID: guildId,
            userID: target.id,
            userTag: target.tag,
        });

        if (target.bot) {
            const botStrikeEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
                .setDescription(`:x: <@${target.id}> is a bot.`)
                .setAuthor({name: target.tag, iconURL: target.avatarURL()});
            return await interaction.reply({ embeds: [botStrikeEmbed], ephemeral: true });
        }

        const noStrikes = new EmbedBuilder()
            .setTitle(`Error`)
            .setColor(0xFF0000)
            .setTimestamp()
            .setAuthor({name: target.tag, iconURL: target.avatarURL()})
            .setDescription(`:x: <@${target.id}> has no strikes.`)
            .setFooter({text: `User ID: ${target.id}`})
            
        const viewYourOwn = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`:x: You do not have permission to view the strike logs of other members.`)

        if (target.id !== invoker.id && !member.permissions.has(PermissionsBitField.Flags.ManageMessages)) { return interaction.reply({ embeds: [viewYourOwn], ephemeral: true }); }

        if (data) {
            const embed = new EmbedBuilder()
            .setTitle(`${target.tag}'s Strike Logs`)
            .setColor(0xFF0000)
            .setTimestamp()
            .setAuthor({name: target.tag, iconURL: target.avatarURL()})
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
                const strikesCrashError = new EmbedBuilder()
                .setDescription(`❌ This command threw an error. Please report this error to the developers.\n\`\`\`${err}\`\`\``)
                interaction.reply({ embeds: [strikesCrashError], ephemeral: true })
            }
        }
    },

    name: 'strikes',
    description: "Checks the strikes of a member.",
    options : [
        {
            name: "member",
            description: "The member to view the strikes of.",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ]
}