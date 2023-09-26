const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
      const { options, guild } = interaction;
      const target = options.getUser("member");

      // Check if the target user is in the guild.
      if (!interaction.guild.members.cache.has(target.id)) {
        const memberNotFoundErrorEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
            .setDescription(`:x: <@${target.id}> is not in this server.`)
            .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
        return interaction.reply({ embeds: [memberNotFoundErrorEmbed], ephemeral: true });
    }

      // Check if the target user is the bot itself.
      if (target.id === client.user.id) {
          const botKickErrorEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
              .setDescription(":x: You cannot kick the bot itself.")
              .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
          return interaction.reply({ embeds: [botKickErrorEmbed], ephemeral: true });
      }

      // Check if the target user is the owner of the server.
      if (target.id === guild.ownerId) {
          const ownerKickErrorEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
              .setDescription(":x: You cannot kick the owner of this server.")
              .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
          return interaction.reply({ embeds: [ownerKickErrorEmbed], ephemeral: true });
      }

      // Check if TraaaaBot has permission to kick members in the guild.
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
          const botNoPermissionEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
              .setDescription(":x: TraaaaBot does not have the Kick Members permission in this server. Please check the permissions and try again later.")
              .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
          return interaction.reply({ embeds: [botNoPermissionEmbed], ephemeral: true });
      }

      const reason = interaction.options.getString("reason") || "No reason provided";
      const deleteTimeframeChoice = options.getInteger("delete", 0);
      const deleteTimeframeChoices = {
          3600: "Past Hour",
          21600: "Past 6 Hours",
          43200: "Past 12 Hours",
          86400: "Past 24 Hours",
          259200: "Past 3 Days",
          604800: "Past 7 Days",
      };

      const deleteTimeframe = deleteTimeframeChoices[deleteTimeframeChoice];

      try {
        const userKickedEmbed = new EmbedBuilder()
          .setTitle("User Kicked")
          .setColor(0x00ff00)
          .setDescription(`:white_check_mark: <@${target.id}> has been kicked.`)
          .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
          .addFields(
            { name: "Reason", value: reason, inline: true },
            {
              name: "Moderator",
              value: `<@${interaction.user.id}>`,
              inline: true,
            }
          );

        if (deleteTimeframeChoice) {
          try {
            const messages = await interaction.channel.messages.fetch({
              limit: 100,
            });
            const timestampCutoff = Date.now() - deleteTimeframeChoice * 1000;
            const messagesToDelete = messages.filter((msg) => {
              return (
                msg.author.id === target.id &&
                msg.createdTimestamp >= timestampCutoff
              );
            });
            let delMsgValue = `:white_check_mark: **${
              messagesToDelete.size
            }** message${
              messagesToDelete.size === 1 ? "" : "s"
            } from the **${deleteTimeframe.toLowerCase()}** have been deleted.`;
            if (messagesToDelete.size === 0) {
              delMsgValue = `:x: No messages from the **${deleteTimeframe.toLowerCase()}** have been deleted because there was none to delete.`;
            }
            userKickedEmbed.addFields({
              name: "Deleted Messages",
              value: delMsgValue,
              inline: false,
            });

            if (messagesToDelete.size > 0) {
              const messageIdsToDelete = messagesToDelete.map((msg) => msg.id);
              while (messageIdsToDelete.length > 0) {
                const batch = messageIdsToDelete.splice(0, 100);
                await interaction.channel.bulkDelete(batch);
              }
            }
          } catch (error) {
            console.error("Error deleting messages:", error);
          }
        }

        await guild.members.kick(target);

        return interaction.reply({ embeds: [userKickedEmbed] });
      } catch (error) {
        if (error.code === 50013) {
          const missingPermError = new EmbedBuilder()
            .setTitle("Error")
            .setColor(0xff0000)
            .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
            .setDescription(
              `:x: **${target.tag}** (<@${target.id}>) is positioned above TraaaaBot in the roles hierarchy. To kick this member using TraaaaBot, you need to move TraaaaBot's role on top of every role that will be kickable by this command.`
            );

          return interaction.reply({
            embeds: [missingPermError],
            ephemeral: true,
          });
        }
        const errorEmbed = new EmbedBuilder()
          .setTitle("Error")
          .setColor(0xff0000)
          .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
          .setDescription(
            `:x: An error occurred while trying to run this command:\n\`\`\`${error.message}\`\`\`\nThis is an internal error. Please contact the developers of TraaaaBot and report this issue. You are also able to continue using this command if the command could not run due to a typo, or any invalid arguments that were given.`
          );
        console.log(error);
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
  },

  name: "kick",
  description: "Kick a member from the server.",
  options: [
      {
          name: "member",
          description: "Specify the member you want to kick from the server.",
          type: ApplicationCommandOptionType.User,
          required: true,
      },
      {
          name: "reason",
          description: "Specify a reason for why the member is being kicked.",
          type: ApplicationCommandOptionType.String,
          required: false,
      },
      {
          name: "delete",
          description: "Delete messages posted in the past hour or days.",
          type: ApplicationCommandOptionType.Integer,
          required: false,
          choices: [
              { name: "Past Hour", value: 3600 },
              { name: "Past 6 Hours", value: 21600 },
              { name: "Past 12 Hours", value: 43200 },
              { name: "Past 24 Hours", value: 86400 },
              { name: "Past 3 Days", value: 259200 },
              { name: "Past 7 Days", value: 604800 },
          ],
      },
  ],
  permissionsRequired: [PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
};
