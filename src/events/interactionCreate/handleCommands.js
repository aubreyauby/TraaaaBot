const { devs, testServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');
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
        interaction.reply({
          content: 'This command is only available to authorized developers.',
          ephemeral: true,
        });
        return;
      }
    }

    if (commandObject.testOnly) {
      if (!(interaction.guild.id === testServer)) {
        interaction.reply({
          content: 'This command is only available in the specified development server.',
          ephemeral: true,
        });
        return;
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          interaction.reply({
            content: 'You do not have the required permissions to run this command.',
            ephemeral: true,
          });
          return;
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me;

        if (!bot.permissions.has(permission)) {
          interaction.reply({
            content: "I do not have the required permissions to run this command. Please check my permissions and try again.",
            ephemeral: true,
          });
          return;
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