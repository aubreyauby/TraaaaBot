const areCommandsDifferent = require('../../utils/areCommandsDifferent');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');
const fs = require('fs');
const path = require('path');

const registerCommandsForGuild = async (client, guild) => {
  try {
      const localCommands = getLocalCommands();
      const applicationCommands = await getApplicationCommands(
          client,
          guild.id
      );

      for (const localCommand of localCommands) {
          const { name, description, options } = localCommand;

          const existingCommand = await applicationCommands.cache.find(
              (cmd) => cmd.name === name
          );

          if (existingCommand) {
              if (localCommand.deleted) {
                  await applicationCommands.delete(existingCommand.id);
                  console.log(`\x1b[1;32mSUCCESS \x1b[0m Deleted command "${name}".`);
                  continue;
              }

              if (areCommandsDifferent(existingCommand, localCommand)) {
                  await applicationCommands.edit(existingCommand.id, {
                      description,
                      options,
                  });

                  console.log(`\x1b[1;32mSUCCESS \x1b[0m Edited command "${name}".`);
              }
          } else {
              if (localCommand.deleted) {
                  console.log(
                      `\x1b[1;32mSUCCESS \x1b[0m Command registration for "${name}" was skipped as it's set to be deleted.`
                  );
                  continue;
              }

              await applicationCommands.create({
                  name,
                  description,
                  options,
              });

              console.log(`\x1b[1;32mSUCCESS \x1b[0mRegistered command "${name}."`);
          }
      }

  } catch (error) {
      console.log(`\x1b[1;31mERROR \x1b[0m${error.stack}`);
  }
};

module.exports = async (client) => {
    const commandsFolder = fs.readdirSync(path.join(__dirname, "../../commands"));
    for (const folder of commandsFolder) {
        if (folder === '.DS_Store') {
            continue;
        }

        const folderPath = path.join(__dirname, `../../commands/${folder}`);
        console.log("\x1b[1;34mLOADING \x1b[0mReading commands from directory:", folderPath);

        const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));

        for (const file of commandFiles) {
            const commandFilePath = path.join(folderPath, file);
            console.log("\x1b[1;32mSUCCESS \x1b[0mCommand load successful:", commandFilePath);

            const commandFile = require(commandFilePath);
            const properties = { folder, ...commandFile };
        }
    }

    try {
        client.on('guildCreate', async (guild) => {
          console.log(`\x1b[1;33mNEW GUILD \x1b[0mBot has been added to guild: (\x1b[1m${guild.name}\x1b[0m). Self-registering commands for the new guild...`);
            await registerCommandsForGuild(client, guild);
        });
    } catch (error) {
        console.log(`\x1b[1;31mERROR \x1b[0m${error.stack}`);
    }
};