const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits,
  } = require("discord.js");
  const Ban = require("../../models/ban");
  
  module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
      const { options, guild, user, member } = interaction;
      const targetUser = options.getUser("user");
  
      // Check if the target user is the bot itself.
      if (targetUser.id === client.user.id) {
        const botUnbanErrorEmbed = new EmbedBuilder()
          .setTitle("Error")
          .setColor(0xff0000)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
          .setDescription(":x: If I was banned, you technically wouldn't even be able to run this command with TraaaaBot.");
        return interaction.reply({
          embeds: [botUnbanErrorEmbed],
          ephemeral: true,
        });
      }
  
      // Check if TraaaaBot has permission to unban members in the guild.
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        const botNoPermissionEmbed = new EmbedBuilder()
          .setTitle("Error")
          .setColor(0xff0000)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
          .setDescription(
            ":x: TraaaaBot does not have the Ban Members permission in this server. Please check the permissions and try again later."
          );
        return interaction.reply({
          embeds: [botNoPermissionEmbed],
          ephemeral: true,
        });
      }
  
      try {
        // Check if the user is banned
        const banData = await Ban.findOne({ userId: targetUser.id, guildId: guild.id });
  
        if (!banData) {
          const notBannedEmbed = new EmbedBuilder()
            .setTitle("Error")
            .setColor(0xff0000)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
            .setDescription(`:x: <@${targetUser.id}> is not banned in this server.`);
          return interaction.reply({
            embeds: [notBannedEmbed],
            ephemeral: true,
          });
        }
  
        // Remove the ban for the user
        await guild.members.unban(targetUser.id);
  
        // Delete the ban record from the database (if any)
        await Ban.deleteOne({ userId: targetUser.id, guildId: guild.id });
  
        const userUnbannedEmbed = new EmbedBuilder()
          .setTitle("User Unbanned")
          .setColor(0x00ff00)
          .setDescription(`:white_check_mark: <@${targetUser.id}> has been unbanned.`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
          .addFields(
            { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true }
          );
  
        return interaction.reply({ embeds: [userUnbannedEmbed] });
      } catch (error) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("Error")
          .setColor(0xff0000)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
          .setDescription(`:x: An error occurred while trying to unban the user:\n\`\`\`${error.message}\`\`\``);
        console.log(error);
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    },
  
    name: "unban",
    description: "Unban a member from the server.",
    options: [
      {
        name: "user",
        description: "Specify the user you want to unban from the server.",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
    permissionsRequired: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
  };
  