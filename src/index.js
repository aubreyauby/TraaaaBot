require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder, ChannelType } = require('discord.js');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const configJSON = require('../config.json');
const Ban = require('./models/ban');
const clear = require('clear-console');
const Configure = require('./models/configure');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

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
    IntentsBitField.Flags.GuildMessageReactions
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

const serverConfigs = {};

(async () => {
  try {
    if (shouldCheckDatabase) {
      mongoose.set('strictQuery', false);
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`\x1b[1;32mSUCCESS \x1b[0mSuccessfully connected to the MongoDB database.`);

      // Load all guilds configuration settings that are written to the database.
      const allServerConfigs = await Configure.find({});
      allServerConfigs.forEach((config) => {
        serverConfigs[config.guildId] = config;
      });

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
              await guild.members.unban(ban.userId);
              console.log(`\x1b[1;32mSUCCESS \x1b[0mUnbanned user with ID ${ban.userId}`);

              await Ban.deleteOne({ _id: ban._id });
            }
          }
        } catch (error) {
          console.error('Error checking for expired bans:', error);
        }
      }, checkInterval);

      client.on('voiceStateUpdate', (oldState, newState) => {
        if (!newState.channel) {
          const voiceChannelMembers = oldState.channel ? oldState.channel.members.size : 0;
      
          if (voiceChannelMembers === 1) {
      
            const connection = joinVoiceChannel({
              channelId: oldState.channelId,
              guildId: newState.guild.id,
              adapterCreator: newState.guild.voiceAdapterCreator,
            });
      
            setTimeout(() => {
              connection.destroy();
            }, 100);
          }
        }
      });

    // Logging: Edited Messages
    client.on('messageUpdate', async (oldMessage, newMessage) => {
      if (oldMessage.author.bot || oldMessage.content === newMessage.content) return;

      const serverId = newMessage.guild.id;
      const config = await Configure.findOne({ guildId: serverId });

      if (config && config.modlogChannel && config.modlogIsEnabled) {
        const messageEditedEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle(`Message edited in <#${newMessage.channel.id}>`)
          .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.avatarURL() })
          .setTimestamp()
          .setDescription(`**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}\n\n[Jump to Message](https://discord.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id})`)
          .setFooter({ text: `Message ID: ${newMessage.id} | Sender ID: ${newMessage.author.id}` });

        const modlogChannel = newMessage.guild.channels.cache.get(config.modlogChannel);
        if (modlogChannel) { modlogChannel.send({ embeds: [messageEditedEmbed] }); }
      }
    });

    // Logging: Deleted Messages
    client.on('messageDelete', async (deletedMessage) => {
      if (deletedMessage.author.bot) return;

      const serverId = deletedMessage.guild.id;
      const config = await Configure.findOne({ guildId: serverId });

      if (config && config.modlogChannel && config.modlogIsEnabled) {
        const messageDeleteEmbed = new EmbedBuilder()
          .setColor(0xEE4B2B)
          .setTitle(`Message deleted in <#${deletedMessage.channel.id}>`)
          .setAuthor({ name: deletedMessage.author.tag, iconURL: deletedMessage.author.avatarURL() })
          .setDescription(`**Content:** ${deletedMessage.content}\n\n`)
          .setTimestamp()
          .setFooter({ text: `Message ID: ${deletedMessage.id} | Sender ID: ${deletedMessage.author.id}` });

        const modlogChannel = deletedMessage.guild.channels.cache.get(config.modlogChannel);
        if (modlogChannel) { modlogChannel.send({ embeds: [messageDeleteEmbed] }); }
      }
    });

    // Logging: Nickname changes
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
      if (oldMember.displayName !== newMember.displayName) {
          const serverId = newMember.guild.id;
          const config = await Configure.findOne({ guildId: serverId });
  
          if (config && config.modlogChannel && config.modlogIsEnabled) {
              const nicknameChangeEmbed = new EmbedBuilder()
                  .setColor(0xFF69B4)
                  .setTitle(`Nickname changed`)
                  .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.avatarURL() })
                  .setDescription(`**Before:** ${oldMember.displayName}\n**After:** ${newMember.displayName}`)
                  .setTimestamp()
                  .setFooter({ text: `User ID: ${newMember.id}` });
  
              const modlogChannel = newMember.guild.channels.cache.get(config.modlogChannel);
              if (modlogChannel) { modlogChannel.send({ embeds: [nicknameChangeEmbed] }); }
          }
      }
    });

    // Logging: Members who joined
    client.on('guildMemberAdd', async (member) => {
      const serverId = member.guild.id;
      const config = await Configure.findOne({ guildId: serverId });
    
      if (config && config.modlogChannel && config.modlogIsEnabled) {
        const accountCreationDate = new Date(member.user.createdTimestamp);
        const currentDate = new Date();
    
        const memberCount = member.guild.memberCount;
    
        const joinEmbed = new EmbedBuilder()
          .setColor(0x90EE90)
          .setTitle(`Member Joined`)
          .setAuthor({ name: member.user.tag, iconURL: member.user.avatarURL() })
          .setTimestamp()
          .setDescription(`Account Created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>, which was <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n\nThis member is the **${ordinalSuffix(memberCount)}** member to join.`)
    
        const daysSinceCreation = Math.floor((currentDate - accountCreationDate) / (1000 * 60 * 60 * 24));
        if (daysSinceCreation < 14) {
          joinEmbed.addFields({ name: 'New Account', value: ':warning: This member created their Discord account **less than two weeks ago.**' });
    
          if (config.pingRoles && config.pingRoles.length > 0) {
            const modlogChannel = member.guild.channels.cache.get(config.modlogChannel);
    
            config.pingRoles.forEach(async (roleId) => {
              const role = member.guild.roles.cache.get(roleId);
              if (role && modlogChannel) {
                modlogChannel.send(`:warning: <@&${role.id}>, **${member.user.tag}** joined with an account less than two weeks old!`);
              }
            });
          }
        }
        joinEmbed.setFooter({ text: `User ID: ${member.id}` });
    
        const modlogChannel = member.guild.channels.cache.get(config.modlogChannel);
        if (modlogChannel) {
          modlogChannel.send({ embeds: [joinEmbed] });
        }
      }
    });
    
    
    // Logging: Members who left
    client.on('guildMemberRemove', async (member) => {
      const serverId = member.guild.id;
      const config = await Configure.findOne({ guildId: serverId });
    
      if (config && config.modlogChannel && config.modlogIsEnabled) {
        const leaveEmbed = new EmbedBuilder()
          .setColor(0xFF6B6B)
          .setTitle(`Member Left`)
          .setAuthor({ name: member.user.tag, iconURL: member.user.avatarURL() })
          .setDescription(`Account Created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>, which was <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
          .setTimestamp()
          .setFooter({ text: `User ID: ${member.id}` });
    
        const modlogChannel = member.guild.channels.cache.get(config.modlogChannel);
        if (modlogChannel) {
          modlogChannel.send({ embeds: [leaveEmbed] });
        }
      }
    });

    // Logging: Channels created
    client.on('channelCreate', async (channel) => {
      try {
        if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildCategory) {
          const serverId = channel.guild.id;
          const config = await Configure.findOne({ guildId: serverId });
    
          if (config && config.modlogChannel && config.modlogIsEnabled) {
            const channelType = channel.type === ChannelType.GuildText ? 'Text Channel' : (channel.type === ChannelType.GuildVoice ? 'Voice Channel' : 'Category');
            const channelCreateEmbed = new EmbedBuilder()
              .setColor(0x3498db)
              .setTitle(`Channel Created: <#${channel.id}>`)
              .setDescription(`**Type:** ${channelType}\n**ID:** ${channel.id}`)
              .setAuthor({name: channel.guild.name, iconURL: channel.guild.iconURL()})
              .setTimestamp();
    
            // Add more information to the embed message
            if (channel.parent) {
              channelCreateEmbed.addFields({ name: 'Parent Category', value: channel.parent.name });
            }
            channelCreateEmbed.addFields({ name: 'Timestamp', value: `<t:${Math.floor(channel.createdAt / 1000)}:F>` });
    
            const modlogChannel = channel.guild.channels.cache.get(config.modlogChannel);
            if (modlogChannel) {
              modlogChannel.send({ embeds: [channelCreateEmbed] });
            }
          }
        }
      } catch (error) {
        console.error('Error in channelCreate event:', error);
      }
    }); 
    
    } else {
      console.log(`\x1b[1;31mERROR \x1b[0mAttempts to connect to the MongoDB database have been disabled.`);
    }

    eventHandler(client);

    client.login(process.env.TOKEN);
  } catch (error) {
    console.error('Error:', error);
  }
})();

function ordinalSuffix(number) {
  if (number % 100 >= 11 && number % 100 <= 13) {
    return number + 'th';
  }
  switch (number % 10) {
    case 1:
      return number + 'st';
    case 2:
      return number + 'nd';
    case 3:
      return number + 'rd';
    default:
      return number + 'th';
  }
}