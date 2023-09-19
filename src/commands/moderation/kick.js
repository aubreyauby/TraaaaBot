const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
  
  module.exports = {
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
      const { options, guild, user, member } = interaction;
      const targetUser = options.getUser("user");

      if (targetUser.id === client.user.id) {
        const botKickErrorEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000).setDescription(":x: You cannot kick the bot itself.");
        return interaction.reply({ embeds: [botKickErrorEmbed], ephemeral: true });
      }
      
      const reason = interaction.options.getString("reason") || "No reason provided";
      const deleteMessagesCount = options.getInteger("delete", 0);
  
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
        const botNoPermissionEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
          .setDescription(":x: TraaaaBot does not have the permissions in this server to kick members. Please review the bot's permissions and try again later.");
  
        return interaction.reply({embeds: [botNoPermissionEmbed], ephemeral: true });
      }
  
      try {
        await guild.members.kick(targetUser, reason);
  
        if (deleteMessagesCount > 0) {
          const messages = await interaction.channel.messages.fetch({limit: deleteMessagesCount});
          const userMessages = messages.filter((msg) => msg.author.id === targetUser.id);
          await Promise.all(userMessages.map((msg) => msg.delete()));
        }
  
        const userKickedEmbed = new EmbedBuilder()
          .setTitle("User Kicked")
          .setDescription(`:white_check_mark: <@${targetUser.id}> has been kicked.`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
          .setColor(0x00ff00)
          .addFields(
            { name: "Reason", value: reason, inline: false },
            { name: "Moderator", value: `<@${interaction.user.id}>`, inline: false }
          );
  
        if (deleteMessagesCount > 0) {
            userKickedEmbed.addFields({ name: "Deleted Messages", value: `The last **${deleteMessagesCount}** messages by <@${targetUser.id}> have been deleted.`, inline: false });
        }
  
        return interaction.reply({embeds: [userKickedEmbed]});
      } catch (error) {
        console.error(error);
        const errorEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
          .setDescription("An error occurred while trying to kick the user.");
  
        return interaction.reply({embeds: [errorEmbed], ephemeral: true});
      }
    },
  
    name: "kick",
    description: "Kick a member from the server.",
    options: [
      {
        name: "user",
        description: "The user you want to kick.",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "The reason for why this user will be kicked.",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "delete",
        description: "Delete 1-100 messages sent by the user being kicked.",
        type: ApplicationCommandOptionType.Integer,
        required: false,
      }
    ],
    permissionsRequired: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],
  };
  