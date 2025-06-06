const { devs, testServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');
const { EmbedBuilder } = require('discord.js');
const path = require('path');

const commandUsageCounts = new Map();
const MAX_COMMANDS_PER_MINUTE = 3;
const WINDOW_DURATION = 60000;

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const localCommands = getLocalCommands();

  try {
    const { user } = interaction;
    const commandName = interaction.commandName;
    const usageKey = `${user.id}-${commandName}`;
    const isExemptUser = user.id === '817818570431004752';

    if (!isExemptUser && commandUsageCounts.has(usageKey)) {
      const { timestamp, count } = commandUsageCounts.get(usageKey);

      if (Date.now() - timestamp > WINDOW_DURATION) {
        commandUsageCounts.set(usageKey, { timestamp: Date.now(), count: 1 });
      } else {
        if (count >= MAX_COMMANDS_PER_MINUTE) {
          const cooldownEmbed = new EmbedBuilder().setColor(0xFF0000)
            .setTitle(`Error`)
            .setDescription(`:x: You have exceeded the command limit (${MAX_COMMANDS_PER_MINUTE} commands per minute for this command). Please wait before you can run it again.`);
          return await interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
        } else { commandUsageCounts.set(usageKey, { timestamp, count: count + 1 }); }
      }
    } else {
      commandUsageCounts.set(usageKey, { timestamp: Date.now(), count: 1 });
    }

    const commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    );

    if (!commandObject) return;

    if (commandObject.devOnly) {
      if (!devs.includes(interaction.member.id)) {
        const noPermission = new EmbedBuilder().setColor(0xFF0000)
          .setTitle(`Error`)
          .setDescription(`:x: This command is only available for selected members.`);
        return await interaction.reply({ embeds: [noPermission], ephemeral: true });
      }
    }

    if (commandObject.testOnly) {
      if (!(interaction.guild.id === testServer)) {
        const noPermission = new EmbedBuilder().setColor(0xFF0000)
          .setTitle(`Error`)
          .setDescription(`:x: This command is only available in selected guilds.`);
        return await interaction.reply({ embeds: [noPermission], ephemeral: true });
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          const noPermission = new EmbedBuilder().setColor(0xFF0000)
            .setTitle(`Error`)
            .setDescription(`:x: You do not have permission to use this command.`);
          return await interaction.reply({ embeds: [noPermission], ephemeral: true });
        }
      }
    }

    await commandObject.callback(client, interaction);
  } catch (error) {
    const stackLines = error.stack.split('\n');
    const lineInfo = stackLines[1].match(/:(\d+):\d+/);
    const lineNumber = lineInfo ? lineInfo[1] : "N/A";
    const errorMessage = `\x1b[1;91mERROR \x1b[0;91mAn error was thrown in line ${lineNumber}:\n${error.stack}`;
    console.log(errorMessage);
  }
};
