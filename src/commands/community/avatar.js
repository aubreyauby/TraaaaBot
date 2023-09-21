const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            // Get the member argument (mentionable user) from the interaction
            const memberArg = interaction.options.get('member');

            // Check if memberArg is not null and is an object with a valid user property (indicating a user mention)
            if (memberArg !== null && typeof memberArg === 'object' && memberArg.user) {
                // Retrieve the mentioned user
                const user = memberArg.user;

                // Build an embed with the user's avatar
                const avatarEmbed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle(`${user.tag}'s Avatar`)
                    .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setFooter({ text: `User ID: ${user.id}` });

                // Send the embed as a response
                await interaction.reply({ embeds: [avatarEmbed] });
            } else if (memberArg === null) {
                // Handle the case where no member argument was provided (defaults to user's avatar)
                const user = interaction.user;

                // Build an embed with the user's avatar
                const avatarEmbed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle(`${user.tag}'s Avatar`)
                    .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setFooter({ text: `User ID: ${user.id}` });

                // Send the embed as a response
                await interaction.reply({ embeds: [avatarEmbed] });
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Error')
                    .setDescription(':x: You specified a role. Please specify a valid user to view their avatar.');

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        } catch (error) {
            // Handle other errors by sending an error embed
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription(':x: An error occurred. Please check the command usage and try again later.');

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
    name: 'avatar',
    description: "Gets a full-sized avatar of a member.",
    options: [
        {
            name: "member",
            description: "The member to view the avatar of.",
            type: ApplicationCommandOptionType.Mentionable,
            required: false
        }
    ]
};
