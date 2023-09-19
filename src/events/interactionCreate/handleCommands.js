const { devs, testServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');
const { EmbedBuilder } = require('discord.js');
const path = require('path');

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const localCommands = getLocalCommands();

  try {
    const commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    );

    if (!commandObject) return;

    if (commandObject.devOnly) {
      if (!devs.includes(interaction.member.id)) {
        const noPermission = new EmbedBuilder().setColor(0xFF0000)
        .setTitle(`Error`)
        .setDescription(`:x: This command is only available for selected members.`)
        return await interaction.reply({ embeds: [noPermission], ephemeral: true });
      }
    }

    if (commandObject.testOnly) {
      if (!(interaction.guild.id === testServer)) {
        const noPermission = new EmbedBuilder().setColor(0xFF0000)
        .setTitle(`Error`)
        .setDescription(`:x: This command is only available in selected guilds.`)
        return await interaction.reply({ embeds: [noPermission], ephemeral: true });
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          const noPermission = new EmbedBuilder().setColor(0xFF0000)
          .setTitle(`Error`)
          .setDescription(`:x: You do not have permission to use this command.`)
          return await interaction.reply({ embeds: [noPermission], ephemeral: true });
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me;

        if (!bot.permissions.has(permission)) {
          const noPermission = new EmbedBuilder().setColor(0xFF0000)
          .setTitle(`Error`)
          .setDescription(`TraaaaBot cannot use this command because it lacks a permission to do so. Try modifying the permissions for the bot and try again later.`)
          return await interaction.reply({ embeds: [noPermission], ephemeral: true });
        }
      }
    }

    await commandObject.callback(client, interaction);
  } catch (error) {
    const stackLines = error.stack.split('\n');
    const lineInfo = stackLines[1].match(/:(\d+):\d+/);
    const lineNumber = lineInfo ? lineInfo[1] : "N/A";
    const fileName = path.basename(__filename);
    const relativeDir = path.relative(process.cwd(), __dirname);
    const errorMessage = `\x1b[1;31mERROR \x1b[0mAn error was thrown from \x1b[1m${fileName}\x1b[0m in directory \x1b[1m${relativeDir}\x1b[0m in line ${lineNumber}:\n${error.stack}`;
    console.log(errorMessage);
  }
};