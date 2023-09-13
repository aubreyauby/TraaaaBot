const {
    EmbedBuilder,
    ApplicationCommandOptionType 
} = require('discord.js');

module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        const icon = user.displayAvatarURL({ dynamic: true, size: 4096 });
        const tag = user.tag;

        const embed = new EmbedBuilder()
        .setColor("Blue")
        .setAuthor({name: tag, iconURL: icon})
        .setThumbnail(icon)
        .addFields({name: "Member", value: `${user}`, inline: false})
        .addFields({name: "Roles", value: `${member.roles.cache.map(r => r).join(' ')}`, inline: false})
        .addFields({name: "Joined Server", value: `<t:${parseInt(member.joinedAt / 1000)}:R>`, inline: true})
        .addFields({name: "Account Created", value: `<t:${parseInt(user.createdAt / 1000)}:R>`, inline: true})
        .setFooter({text: `User ID: ${user.id}`})
        .setTimestamp()

        await interaction.reply({embeds: [embed]});
    },
    name: 'uinfo',
    description: "Gets information about a user.",
    options : [
        {
            name: "user",
            description: "The user to view information of.",
            type: ApplicationCommandOptionType.Mentionable,
            required: false
        }
    ]
}