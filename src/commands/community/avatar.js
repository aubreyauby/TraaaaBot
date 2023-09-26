const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            const memberArg = interaction.options.get('member');

            if (memberArg !== null && typeof memberArg === 'object' && memberArg.user) {
                const user = memberArg.user;

                const avatarEmbed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle(`${user.tag}'s Avatar`)
                    .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setDescription(`[Open in browser](${user.displayAvatarURL({ dynamic: true, size: 1024 })})`)
                    .setTimestamp()
                    .setFooter({ text: `User ID: ${user.id}` });

                await interaction.reply({ embeds: [avatarEmbed] });
            } else if (memberArg === null) {
                const user = interaction.user;

                const avatarEmbed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle(`${user.tag}'s Avatar`)
                    .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setDescription(`[Open in browser](${user.displayAvatarURL({ dynamic: true, size: 1024 })})`)
                    .setTimestamp()
                    .setFooter({ text: `User ID: ${user.id}` });

                await interaction.reply({ embeds: [avatarEmbed] });
            }
        } catch (error) {
            const errorEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('Error')
                .setDescription(
                    `:x: An error occurred while trying to run this command:\n\`\`\`${error.message}\`\`\`\nThis is an internal error. Please contact the developers of TraaaaBot and report this issue. You are also able to continue using this command if the command could not run due to a typo, or any invalid arguments that were given.`
                );

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            console.log(error);
        }
    },
    name: 'avatar',
    description: "Gets a full-sized avatar of a member.",
    options: [
        {
            name: "member",
            description: "The member to view the avatar of.",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ]
};
