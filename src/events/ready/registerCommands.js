const { ActivityType } = require('discord.js');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');
const fs = require('fs');
const path = require('path');

const areCommandsDifferent = require('../../utils/areCommandsDifferent');

const registerCommandsForGuild = async (client, guild) => {
    try {
        const localCommands = getLocalCommands();
        const applicationCommands = await getApplicationCommands(client, guild.id);

        for (const localCommand of localCommands) {
            const { name, description, options } = localCommand;
            const existingCommand = await applicationCommands.cache.find((cmd) => cmd.name === name);

            if (existingCommand) {
                if (localCommand.deleted) {
                    await applicationCommands.delete(existingCommand.id);
                    console.log(`\x1b[1;32mSUCCESS \x1b[0m Deleted ${name} from guild: ${guild.name}.`);
                    continue;
                }

                if (areCommandsDifferent(existingCommand, localCommand)) {
                    await applicationCommands.edit(existingCommand.id, {description, options});
                    console.log(`\x1b[1;32mSUCCESS \x1b[0mEdited ${name} in guild: ${guild.name}.`);
                }
            } else {
                if (localCommand.deleted) {
                    console.log(
                        `\x1b[1;32mSUCCESS \x1b[0m Command registration for "${name}" was skipped for guild: ${guild.name} as it's set to be deleted.`
                    );
                    continue;
                }

                await applicationCommands.create({name, description, options});

                console.log(`\x1b[1;32mSUCCESS \x1b[0m Registered command "${name}" for guild: ${guild.name}.`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        console.log(`\x1b[1;31mERROR \x1b[0m${error.stack}`);
    }
};

const registerAllCommands = async (client) => {
    client.user.setPresence({ activities: [{ name: `commands load. Be back soon!`, type: ActivityType.Watching }], status: 'dnd' });

    const commandsFolder = fs.readdirSync(path.join(__dirname, '../../commands'));

    for (const folder of commandsFolder) {
        if (folder === '.DS_Store') { continue; }

        const folderPath = path.join(__dirname, `../../commands/${folder}`);
        console.log("\x1b[1;34mLOADING \x1b[0mReading commands from directory:", folderPath);

        const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));

        for (const file of commandFiles) {
            const commandFilePath = path.join(folderPath, file);
            const fileName = path.basename(file, '.js');
            console.log("\x1b[1;32mSUCCESS \x1b[0mCommand load successful:", fileName);

            // Require the command file directly
            const commandFile = require(commandFilePath);

            // Register the command for all guilds
            const guilds = client.guilds.cache;

            for (const guild of guilds.values()) {
                await registerCommandsForGuild(client, guild, commandFile);
            }
        }
    }
};

module.exports = async (client) => {
    await registerAllCommands(client);

    try {
        client.on('newCommandDetected', async (newCommand) => {
            console.log(`\x1b[1;33mSUCCESS \x1b[0mA new command has been detected: ${newCommand.name}`);
            const guilds = client.guilds.cache.array();
            for (const guild of guilds) { await registerCommandsForGuild(client, guild, newCommand); }
        });
    } catch (error) { console.log(`\x1b[1;31mERROR \x1b[0m${error.stack}`); }

    try {
        client.on('guildCreate', async (guild) => {
            console.log(`\x1b[1;33mNEW GUILD \x1b[0m Bot has been added to guild: (\x1b[1m${guild.name}\x1b[0m). Self-registering commands for the new guild...`);
            await registerCommandsForGuild(client, guild);
        });
    } catch (error) {
        console.log(`\x1b[1;31mERROR \x1b[0m${error.stack}`);
    }

    setInterval(() => {
        client.user.setPresence({ activities: [{ name: `in ${client.guilds.cache.size} servers | Do /help`, type: ActivityType.Playing }], status: 'online' });
    }, 3000);
    console.log("\x1b[1;32mSUCCESS \x1b[0mAll slash command tasks have been completed and are ready for use.");
};
