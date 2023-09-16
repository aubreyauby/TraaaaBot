const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const amountToDelete = interaction.options.getInteger('amount');

        if (amountToDelete <= 0 || amountToDelete > 100) {
            const errorEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('Error')
            .setDescription('You can only delete between 1 and 100 messages at a time.');

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            // Fetch the last 'amountToDelete' messages in the channel
            const messages = await interaction.channel.messages.fetch({ limit: amountToDelete + 1 });
            
            // Delete the fetched messages
            await interaction.channel.bulkDelete(messages, true);

            const successEmbed = new EmbedBuilder().setColor('#00FF00').setTitle('Success')
            .setDescription(`Successfully deleted ${amountToDelete} messages.`);

            interaction.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (error) {
            console.error(error);

            const errorEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('Error')
            .setDescription('An error occurred while trying to delete messages.');

            interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    name: 'purge',
    description: "Bulk delete a specified amount of messages in a channel.",
    options: [
        {
            name: "amount",
            description: "The number of messages you want to delete.",
            type: ApplicationCommandOptionType.Integer,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages]
  }
