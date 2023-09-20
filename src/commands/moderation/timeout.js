const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits,
  } = require("discord.js");
  const ms = require('ms');
  
  module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const { default: prettyMs } = await import('pretty-ms');
        const mentionable = interaction.options.get('user').value;
        const duration = interaction.options.get('duration').value;
        const reason = interaction.options.get('reason')?.value || "No reason provided";

        function formatDurationWithoutDecimal(duration) {
          const parts = prettyMs(duration, { verbose: true, secondsDecimalDigits: 0 }).split(' ');
          return parts.join(' ');
        }

        const targetUser = await interaction.guild.members.fetch(mentionable);
        if (!targetUser) {
          const notInServerEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
          .setDescription(`:x: <@${targetUser.id}> is not in this server.`);
          return await interaction.reply({embeds: [notInServerEmbed], ephemeral: true});
        }

        const msDuration = ms(duration);
        if (isNaN(msDuration)) {
          const invalidFormatEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
          .setDescription(`:x: \`${duration}\` is an invalid time format. Accepted format examples: \`30m\`, \`1h\`, or \`1 day\``);
          return await interaction.reply({embeds: [invalidFormatEmbed], ephemeral: true});
        }

        if (msDuration < 5000 || msDuration > 2.592e9) {
          const invalidFormatEmbed = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
            .setDescription(`:x: \`${duration}\` falls outside the time limit accepted. Please specify a timeout timeframe between **5 seconds** and **30 days**.`);
          return await interaction.reply({ embeds: [invalidFormatEmbed], ephemeral: true }); 
        }

        const targetUserRolePosition = targetUser.roles.highest.position;
        const requestUserRolePosition = interaction.member.roles.highest.position;
        const botRolePosition = interaction.guild.members.me.roles.highest.position;

        try {
          const expirationTime = Date.now() + msDuration;

          const userTimedoutEmbed = new EmbedBuilder().setTitle("User Timed Out").setColor(0x00ff00)
          .setDescription(`:white_check_mark: <@${targetUser.id}> was timed out for **${prettyMs(msDuration, { verbose: true })}**.`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
          .addFields(
            { name: 'Reason', value: reason, inline: true },
            { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Expires', value: `<t:${Math.floor(expirationTime / 1000)}:R>`, inline: false }
          )

            if (targetUser.isCommunicationDisabled()) {
                const oldTimeoutExpiration = targetUser.communicationDisabledUntilTimestamp;
                const oldTimeoutDuration = oldTimeoutExpiration - Date.now();
                const oldTimeoutPrettyDuration = formatDurationWithoutDecimal(oldTimeoutDuration);

                targetUser.timeout(msDuration, reason);
                userTimedoutEmbed.addFields({
                    name: 'Timeout Override',
                    value: `:warning: This member was previously timed out for **${oldTimeoutPrettyDuration}** and was overwritten with a new duration of **${prettyMs(msDuration, { verbose: true })}**.`
                });
            }

          await targetUser.timeout(msDuration, reason);
          await interaction.reply({embeds: [userTimedoutEmbed], ephemeral: true});
        } catch (error) {
          console.log(`There was an error when timing out: ${error.stack}`);
          if (error.code === 50013) {
            // 50013 occurs when the bot cannot timeout the user because of the guild's role hierarchy.
            // So we let the user know that and to move the roles to see if they can timeout the user now.
            const missingPermError = new EmbedBuilder().setTitle("Error").setColor(0xff0000)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                .setDescription(`:x: **${targetUser.user.tag}** (<@${targetUser.id}>) is positioned above TraaaaBot in the roles hierarchy. To timeout this member using TraaaaBot, you need to move TraaaaBot's role on top of every role that will be timed out by this command.`);

            return interaction.reply({ embeds: [missingPermError], ephemeral: true });
        }
        }
    },
  
    name: "timeout",
    description: "Timeout a member in the server.",
    options: [
        {
            name: "user",
            description: "Specify the user you want to timeout.",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'duration',
            description: 'Specify for how long the timeout will be (e.g. 30m, 1h, 1 day).',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "reason",
            description: "Specify for what reason the member would be timed out for.",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages],
  };
  