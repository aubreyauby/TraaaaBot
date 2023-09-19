require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const configJSON = require('../config.json');
const Ban = require('./models/ban');
const clear = require('clear-console');

// Clear anything that was displayed on the console before.
clear();

// Switch this between true and false if the host machine is connected to a network that is blacklisted
// by MongoDB. This is to ensure that the bot runs as fast as possible without it being left hanging
// because the bot is trying to connect to the database.
let shouldCheckDatabase = true;

// For when the stop button on TraaaaBot Console is clicked.
process.on('SIGTERM', () => { console.log(`\x1b[1;33mWARNING\x1b[0m Received SIGTERM signal. Gracefully shutting down...\x1b[0m`);
  process.exit(0);
});

// Define the intervals at which to check for expired bans (in milliseconds).
const checkInterval = 1000;

// Define the intents that the bot will utilize when it is active. This is now a new thing that we must follow.
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
  ],
});

// This is responsible for TraaaaBot Music.
client.queue = new Map();

// Define the colors of the trans flag (blue, pink, and white)
const transFlagColors = [
  '\x1b[38;2;91;172;247m',
  '\x1b[38;2;242;100;157m',
  '\x1b[38;2;255;255;255m',
];

// Create the ASCII art that says "TRAAAABOT" and color it in the defined flag colors.
const transFlagArt = [
  `${transFlagColors[0]}████████ ██████   █████   █████   █████   █████   █████   ██████  ████████ \x1b[0m`,
  `${transFlagColors[1]}   ██    ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██    ██    ██    \x1b[0m`,
  `${transFlagColors[2]}   ██    ██████  ███████ ███████ ███████ ███████ ██████  ██    ██    ██    \x1b[0m`,
  `${transFlagColors[1]}   ██    ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██    ██    ██    \x1b[0m`,
  `${transFlagColors[0]}   ██    ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██████   ██████     ██    \x1b[0m`,
];

// Now print them in the console, and add an additional line welcoming the user to TraaaaBot and the purpose of the bot.
console.log(transFlagArt.join('\n'));
console.log(`\n${transFlagColors[0]}\x1b[1mWelcome to TraaaaBot! A multi-purpose Discord bot written by electrasys in JavaScript.\n`);

// Display where the development workspace is located. In this case, it will show the ID of the test server,
// user ID of the bot, and the guild ID of the test server.
const testServerID = configJSON.testServer; console.log(`\x1b[1;32mSUCCESS \x1b[0mTesting guild ID set to: ${testServerID}.`);
const testClientID = configJSON.clientId; console.log(`\x1b[1;32mSUCCESS \x1b[0mClient ID set to: ${testClientID}.`);
const testDevID = configJSON.devs; console.log(`\x1b[1;32mSUCCESS \x1b[0mWhitelisted developers ID set to: ${testDevID}.`);

(async () => {
  try {
    if (shouldCheckDatabase) {
      mongoose.set('strictQuery', false);
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`\x1b[1;32mSUCCESS \x1b[0mSuccessfully connected to the MongoDB database.`);

      // This service enables a functionality for temporary bans to be lifted by the bot itself when the banned user's
      // ban is due for removal. The interval is defined in line 23 as 1000 milliseconds, which is 1 second. Every second,
      // the bot will check for temporary bans due to be removed. It will also delete the database entry for the temporary
      // ban details to conserve memory.
      setInterval(async () => {
        try {
          const currentTimestamp = Date.now();
          const expiredBans = await Ban.find({ banExpiration: { $lte: currentTimestamp } });
          
          for (const ban of expiredBans) {
            const guild = client.guilds.cache.get(ban.guildId);

            if (guild) {
              // Attempt to unban the user
              await guild.members.unban(ban.userId);
              console.log(`\x1b[1;32mSUCCESS \x1b[0mUnbanned user with ID ${ban.userId}`);

              // Remove the ban record from the database
              await Ban.deleteOne({ _id: ban._id });
            }
          }
        } catch (error) {
          console.error('Error checking for expired bans:', error);
        }
      }, checkInterval);
    } else {
      console.log(`\x1b[1;31mERROR \x1b[0mAttempts to connect to the MongoDB database have been disabled.`);
    }

    eventHandler(client);

    client.login(process.env.TOKEN);
  } catch (error) {
    console.error('Error:', error);
  }
})();