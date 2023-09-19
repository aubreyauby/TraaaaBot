const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const electrasys = "817818570431004752";
    if (interaction.user.id === electrasys) {
      const serverName = interaction.options.getString("arg");
      const errors = [];

      if (serverName) {
        // Find the guild by name
        const guild = client.guilds.cache.find(
          (guild) => guild.name === serverName
        );

        if (guild) {
          try {
            const commands = await guild.commands.fetch();

            commands.forEach(async (command) => {
              await command.delete();
            });

            console.log(`Deleted commands in guild ${guild.name}`);
          } catch (error) {
            errors.push(
              `Error deleting commands in guild ${guild.name}: ${error}`
            );
          }
        } else {
          errors.push(`Guild with name "${serverName}" not found.`);
        }
      } else {
        errors.push(`Server name argument is missing.`);
      }

      if (errors.length === 0) {
        const done = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle(`Success`)
          .setDescription(
            `:white_check_mark: All registered commands were successfully deleted from **${serverName}**.\n\nWould you like to restart the bot to apply changes?\n\n:warning: The bot would need to be restarted for **${serverName}** to gain access to slash commands again.`
          );

        const restart_yes = new ButtonBuilder()
          .setCustomId("restart-yes")
          .setLabel("Yes")
          .setStyle(ButtonStyle.Danger);

        const restart_no = new ButtonBuilder()
          .setCustomId("restart-no")
          .setLabel("No")
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(
          restart_yes,
          restart_no
        );

        await interaction.reply({
          embeds: [done],
          ephemeral: true,
          components: [row],
        });

        let buttonResponseProvided = false;
        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
          filter,
          time: 40000,
        });

        collector.on("collect", async (i) => {
          if (i.customId === "restart-yes") {
            const resultEmbed = {
              color: 0x00ff00,
              title: `Success`,
              description: `Bot restart now in progress.`,
            };

            interaction.editReply({ embeds: [resultEmbed], components: [], ephemeral: true });
            buttonResponseProvided = true;
          } else if (i.customId === "restart-no") {
            const resultEmbed = {
              color: 0x00ff00,
              title: `Success`,
              description: `:white_check_mark: The bot will not be restarted. **${serverName}** cannot access TraaaaBot through slash commands until the bot is restarted to register them.`,
            };

            interaction.editReply({ embeds: [resultEmbed], components: [], ephemeral: true });
            buttonResponseProvided = true;
          }
        });

        collector.on("end", (_, reason) => {
          if (reason === "time" && !buttonResponseProvided) {
            const timeoutEmbed = {
              color: 0xff0000,
              title: `Error`,
              description: `:x: Registered command deletion process for **${serverName}** timed out.`,
            };

            interaction.editReply({ embeds: [timeoutEmbed], components: [], ephemeral: true });
          }
        });
      } else {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle(`Error`)
          .setDescription(
            `:x: Unable to fulfill this request. Errors:\n\`\`\`${errors.join(
              "\n"
            )}\`\`\``
          );

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } else {
      const notinVC = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(`Error`)
        .setDescription(
          `You do not have permission to use this command. \n\n**NOTE:** This permission comes internally from TraaaaBot and not based on your guild's permission settings.`
        );

      await interaction.reply({ embeds: [notinVC], ephemeral: true });
    }
  },
  name: "dac",
  description:
    "Developer-only command. Documentation is not available for this command.",
  options: [
    {
      name: "arg",
      description: "Developer-only command. Documentation is not available for this command.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};
