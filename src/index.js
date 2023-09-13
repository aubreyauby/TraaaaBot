require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const configJSON = require('../config.json');
const clear = require('clear-console');

clear();

let shouldCheckDatabase = true;

process.on('SIGTERM', () => {
  console.log(`\x1b[1;33mWARNING\x1b[0m Received SIGTERM signal. Gracefully shutting down...\x1b[0m`);
  process.exit(0);
});

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const transFlagColors = [
  '\x1b[38;2;91;172;247m',  // Blue
  '\x1b[38;2;242;100;157m', // Pink
  '\x1b[38;2;255;255;255m', // White
];

// Create the trans flag ASCII art with color-coded rows
const transFlagArt = [
  `${transFlagColors[0]}████████ ██████   █████   █████   █████   █████   █████   ██████  ████████ \x1b[0m`,
  `${transFlagColors[1]}   ██    ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██    ██    ██    \x1b[0m`,
  `${transFlagColors[2]}   ██    ██████  ███████ ███████ ███████ ███████ ██████  ██    ██    ██    \x1b[0m`,
  `${transFlagColors[1]}   ██    ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██    ██    ██    \x1b[0m`,
  `${transFlagColors[0]}   ██    ██   ██ ██   ██ ██   ██ ██   ██ ██   ██ ██████   ██████     ██    \x1b[0m`,
];

console.log(transFlagArt.join('\n'));

// Display the version number and the name of the bot.
const transFlagBlue = '\x1b[38;2;91;172;247m';
console.log(`\n${transFlagBlue}\x1b[1mWelcome to TraaaaBot! Version: ${process.env.VERSION}\x1b[0m\n`);

// Display where the development workspace is located. In this case, it will show the ID of the test server,
// user ID of the bot, and the guild ID of the test server.
const testServerID = configJSON.testServer;
const testClientID = configJSON.clientId;
const testDevID = configJSON.devs;
console.log(`\x1b[1;32mSUCCESS \x1b[0mTesting guild ID set to: ${testServerID}.`);
console.log(`\x1b[1;32mSUCCESS \x1b[0mClient ID set to: ${testClientID}.`);
console.log(`\x1b[1;32mSUCCESS \x1b[0mWhitelisted developers ID set to: ${testDevID}.`);

(async () => {
  try {
    // Database connection logic
    if (shouldCheckDatabase) {
      // Perform database checks or operations
      mongoose.set('strictQuery', false);
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`\x1b[1;32mSUCCESS \x1b[0mSuccessfully connected to the MongoDB database.`);
    } else {
      console.log(`Attempts to connect to the MongoDB database have been disabled.`);
    }

    // Set up event handling
    eventHandler(client);

    // Log in the bot
    client.login(process.env.TOKEN);
  } catch (error) {
    console.error('Error:', error);
  }
})();