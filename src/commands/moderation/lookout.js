const {
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');
const LookoutUser = require ('../../models/lookout')

// Maintain a Set to keep track of users on the lookout list
const lookoutUsers = new Set();

module.exports = {
  /**
   * 
   * @param {Client} client 
   * @param {Interaction} interaction
   */
    callback: async (client, interaction) => {
        const noPermission = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`❌ You do not have permission to use this command.`);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return await interaction.reply({ embeds: [noPermission], ephemeral: true });
        }

        const { options } = interaction;
        const type = interaction.options.getString("type");
        const target = options.getUser('user');

        if (type === 'add') {
            const existingUser = await LookoutUser.findOne({ userID: target.id });

            await LookoutUser.create({
                guildID: interaction.guild.id,
                userID: target.id,
                userTag: target.tag,
                lookOutEnabled: true
            });

            if (existingUser) {
                return await interaction.reply({
                    embeds: [new EmbedBuilder().setColor(0xFF0000).setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                    .setTitle("Error").setDescription(`❌ **${target.username}** (<@${target.id}>) is already on the lookout list.`)],
                    ephemeral: true
                });
            }

            await interaction.reply({
                embeds: [new EmbedBuilder().setColor(0x5cb85c).setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
               .setTitle("Success").setDescription(`✅ **${target.tag}** (<@${target.id}>) has been added to the lookout list.`)],
               ephemeral: true
            });
        } else if (type === 'remove') {
            const existingUser = await LookoutUser.findOneAndDelete({ userID: target.id });

            if (existingUser === null) {
                return await interaction.reply({
                    embeds: [new EmbedBuilder().setColor(0xFF0000).setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                    .setTitle("Error").setDescription(`❌ **${target.username}** (<@${target.id}>) is not on the lookout list.`)],
                    ephemeral: true
                });
            } else {
                return await interaction.reply({
                    embeds: [new EmbedBuilder().setColor(0x5cb85c).setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                    .setTitle("Success").setDescription(`✅ **${target.tag}** (<@${target.id}>) has been removed from the lookout list.`)],
                    ephemeral: true
                });
            }
        }
    },

    name: 'lookout',
    description: "Sends out advisories to a specified text channel about a user's activity.",
    options: [
        {
            name: "type",
            description: "Choose whether to add or remove a user from lookout.",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: "add",
                    value: "add"
                },
                {
                    name: "remove",
                    value: "remove"
                }
            ]
        },
        {
            name: "user",
            description: "The user to place on lookout.",
            type: ApplicationCommandOptionType.Mentionable,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages]
}