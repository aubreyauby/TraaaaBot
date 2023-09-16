const { ActivityType } = require('discord.js');

module.exports = (client) => {
    console.log(`\x1b[1;32mSUCCESS \x1b[0m${client.user.tag} is online.`);
    console.log(`\x1b[1;34mINFO \x1b[0mTraaaaBot is in ${client.guilds.cache.size} server(s).\x1b[0m`);
};