require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder, ChannelType, AuditLogEvent, PermissionsBitField } = require('discord.js');
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
    IntentsBitField.Flags.GuildInvites,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildMessageReactions
  ],
});

// This is responsible for TraaaaBot Music.
client.queue = new Map();
const configSessions = new Map();

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
      try {
        if (deletedMessage.author.id === client.user.id) return;
    
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
    
          if (deletedMessage.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            try {
              const auditLogs = await deletedMessage.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete });
              const auditLogEntry = auditLogs.entries.first();
              messageDeleteEmbed.addFields({ name: 'Deleted By', value: `<@${auditLogEntry.executor.id}>` });
            } catch (error) {
              if (error.message.includes("Cannot read properties of undefined (reading 'fetchAuditLogs')")) {
                return;
              }
            }
          }
    
          const modlogChannel = deletedMessage.guild.channels.cache.get(config.modlogChannel);
          if (modlogChannel) {
            modlogChannel.send({ embeds: [messageDeleteEmbed] });
          }
        }
      } catch (error) {
        console.error('Error in messageDelete event:', error);
      }
    });      

    // Logging: Nickname changes
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
      try {
        const serverId = newMember.guild.id;
        const config = await Configure.findOne({ guildId: serverId });

        if (config && config.modlogChannel && config.modlogIsEnabled) {
          if (oldMember.displayName !== newMember.displayName) {
            // Nickname change
            const nicknameChangeEmbed = new EmbedBuilder()
              .setColor(0xFF69B4)
              .setTitle('Nickname changed')
              .setDescription(`**Before:** ${oldMember.displayName}\n**After:** ${newMember.displayName}`)
              .setTimestamp()
              .setFooter({ text: `User ID: ${newMember.id}` });

            if (newMember.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
              try {
                const auditLogs = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate });
                const auditLogEntry = auditLogs.entries.first();
                nicknameChangeEmbed.addFields({ name: 'Updated By', value: `<@${auditLogEntry.executor.id}>` });
              } catch (error) {
                console.error(error);
                if (error.message.includes("Cannot read properties of undefined (reading 'fetchAuditLogs')")) {
                  return;
                }
              }
            }

            const modlogChannel = newMember.guild.channels.cache.get(config.modlogChannel);
            if (modlogChannel) {
              modlogChannel.send({ embeds: [nicknameChangeEmbed] });
            }
          }
        }
      } catch (error) {
        console.error('Error in guildMemberUpdate event:', error);
      }
    });

    // Logging: Role changes (added and removed)
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
      try {
        const serverId = newMember.guild.id;
        const config = await Configure.findOne({ guildId: serverId });

        if (config && config.modlogChannel && config.modlogIsEnabled) {
          const addedRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));
          const removedRoles = oldMember.roles.cache.filter((role) => !newMember.roles.cache.has(role.id));

          // Check for roles that were added but are not present in the GuildMember's roles collection
          if (addedRoles.size > 0) {
            addedRoles.forEach(async (role) => {
              const rolesAddedEmbed = new EmbedBuilder()
                .setColor(0x3498db)
                .setTitle('Role Added')
                .setDescription(`Role added to <@${newMember.id}>: ${role.toString()}`)
                .setTimestamp()
                .setFooter({ text: `User ID: ${newMember.id}` })
                .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.avatarURL() });

              if (newMember.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
                try {
                  const auditLogs = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate });
                  const auditLogEntry = auditLogs.entries.first();
                  rolesAddedEmbed.addFields({ name: 'Updated By', value: `<@${auditLogEntry.executor.id}>` });
                } catch (error) {
                  console.error(error);
                  if (error.message.includes("Cannot read properties of undefined (reading 'fetchAuditLogs')")) {
                    return;
                  }
                }
              }

              const modlogChannel = newMember.guild.channels.cache.get(config.modlogChannel);
              if (modlogChannel) {
                modlogChannel.send({ embeds: [rolesAddedEmbed] });
              }
            });
          }

          if (removedRoles.size > 0) {
            const removedRolesNames = removedRoles.map((role) => role.toString()).join(', ');
            const rolesRemovedEmbed = new EmbedBuilder()
              .setColor(0xEE4B2B)
              .setTitle('Roles Removed')
              .setDescription(`Roles removed from <@${newMember.id}>: ${removedRolesNames}`)
              .setTimestamp()
              .setFooter({ text: `User ID: ${newMember.id}` })
              .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.avatarURL() });

            if (newMember.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
              try {
                const auditLogs = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate });
                const auditLogEntry = auditLogs.entries.first();
                rolesRemovedEmbed.addFields({ name: 'Updated By', value: `<@${auditLogEntry.executor.id}>` });
              } catch (error) {
                console.error(error);
                if (error.message.includes("Cannot read properties of undefined (reading 'fetchAuditLogs')")) {
                  return;
                }
              }
            }

            const modlogChannel = newMember.guild.channels.cache.get(config.modlogChannel);
            if (modlogChannel) {
              modlogChannel.send({ embeds: [rolesRemovedEmbed] });
            }
          }
        }
      } catch (error) {
        console.error('Error in guildMemberUpdate event:', error);
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
          .setDescription(`Account Created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>, which was <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n\n<@${member.user.id}> is the **${ordinalSuffix(memberCount)}** member to join.`)

        const daysSinceCreation = Math.floor((currentDate - accountCreationDate) / (1000 * 60 * 60 * 24));
        if (daysSinceCreation < 14) {
          joinEmbed.addFields({ name: 'New Account', value: ':warning: This member created their Discord account **less than two weeks ago.**' });

          if (config.pingRoles && config.pingRoles.length > 0) {
            const modlogChannel = member.guild.channels.cache.get(config.modlogChannel);

            const pingedRoles = config.pingRoles.map((roleId) => {
              const role = member.guild.roles.cache.get(roleId);
              return role ? `<@&${role.id}>` : null;
            }).filter(Boolean);

            if (pingedRoles.length > 0 && modlogChannel) {
              const rolesMessage = pingedRoles.join(' '); // Join roles into a single string
              modlogChannel.send(`:warning: Hey ${rolesMessage}, watch out! **${member.user.tag}** (<@${member.user.id}>) joined with an account less than two weeks old!`);
            }
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

    // Logging: Members who created a channel
    client.on('channelCreate', async (channel) => {
      try {
        if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildCategory) {
          const serverId = channel.guild.id;
          const config = await Configure.findOne({ guildId: serverId });
    
          if (config && config.modlogChannel && config.modlogIsEnabled) {
            let channelType = '';
            let title = '';
    
            if (channel.type === ChannelType.GuildText) {
              channelType = 'Text Channel';
              title = `Text Channel Created: <#${channel.id}>`;
            } else if (channel.type === ChannelType.GuildVoice) {
              channelType = 'Voice Channel';
              title = `Voice Channel Created: <#${channel.id}>`;
            } else if (channel.type === ChannelType.GuildCategory) {
              channelType = 'Category';
              title = `Category Created: ${channel.name}`;
            }
    
            const channelCreateEmbed = new EmbedBuilder()
              .setColor(0x3498db)
              .setTitle(title)
              .setDescription(`**Type:** ${channelType}\n**ID:** ${channel.id}`)
              .setAuthor({ name: channel.guild.name, iconURL: channel.guild.iconURL() })
              .setTimestamp();
    
            if (channel.type !== ChannelType.GuildCategory && channel.parent) {
              channelCreateEmbed.addFields({ name: 'Parent Category', value: channel.parent.name });
            }
            channelCreateEmbed.addFields({ name: 'Timestamp', value: `<t:${Math.floor(channel.createdAt / 1000)}:F>` });
    
            if (channel.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
              try {
                const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate });
                const auditLogEntry = auditLogs.entries.first();
                channelCreateEmbed.addFields({ name: 'Created By', value: `<@${auditLogEntry.executor.id}>` });
              } catch (error) {
                if (error.message.includes("Cannot read properties of undefined (reading 'fetchAuditLogs')")) {
                  return;
                }
              }
            }
    
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
    

    client.on('channelDelete', async (channel) => {
      try {
        if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildCategory) {
          const serverId = channel.guild.id;
          const config = await Configure.findOne({ guildId: serverId });
    
          if (config && config.modlogChannel && config.modlogIsEnabled) {
            let channelType = '';
            let title = '';
    
            if (channel.type === ChannelType.GuildText) {
              channelType = 'Text Channel';
              title = `Text Channel Deleted: ${channel.name}`;
            } else if (channel.type === ChannelType.GuildVoice) {
              channelType = 'Voice Channel';
              title = `Voice Channel Deleted: ${channel.name}`;
            } else if (channel.type === ChannelType.GuildCategory) {
              channelType = 'Category';
              title = `Category Deleted: ${channel.name}`;
            }
    
            const channelDeleteEmbed = new EmbedBuilder()
              .setColor(0xEE4B2B)
              .setTitle(title)
              .setDescription(`**Type:** ${channelType}\n**ID:** ${channel.id}`)
              .setAuthor({ name: channel.guild.name, iconURL: channel.guild.iconURL() })
              .setTimestamp();
    
            if (channel.type !== ChannelType.GuildCategory && channel.parent) {
              channelDeleteEmbed.addFields({ name: 'Parent Category', value: channel.parent.name });
            }
            channelDeleteEmbed.addFields({ name: 'Timestamp', value: `<t:${Math.floor(channel.createdAt / 1000)}:F>` });
    
            if (channel.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
              try {
                const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete });
                const auditLogEntry = auditLogs.entries.first();
                channelDeleteEmbed.addFields({ name: 'Deleted By', value: `<@${auditLogEntry.executor.id}>` });
              } catch (error) {
                if (error.message.includes("Cannot read properties of undefined (reading 'fetchAuditLogs')")) {
                  return;
                }
              }
            }
    
            const modlogChannel = channel.guild.channels.cache.get(config.modlogChannel);
            if (modlogChannel) {
              modlogChannel.send({ embeds: [channelDeleteEmbed] });
            }
          }
        }
      } catch (error) {
        console.error('Error in channelDelete event:', error);
      }
    });    

    // Logging: Profile picture changes
    client.on('userUpdate', async (oldUser, newUser) => {
      if (oldUser.avatar !== newUser.avatar) {
        const serverIds = client.guilds.cache.map(guild => guild.id); // Use client.guilds.cache
        const configPromises = serverIds.map(guildId => Configure.findOne({ guildId }));
    
        const configArray = await Promise.all(configPromises);
    
        for (let i = 0; i < serverIds.length; i++) {
          const serverId = serverIds[i];
          const config = configArray[i];
    
          if (config && config.modlogChannel && config.modlogIsEnabled) {
            const profilePictureChangeEmbed = new EmbedBuilder()
              .setColor(0xFF69B4)
              .setTitle(`Account Avatar Changed`)
              .setAuthor({ name: newUser.tag, iconURL: newUser.avatarURL() })
              .setThumbnail(newUser.displayAvatarURL())
              .setDescription(`<@${newUser.id}> changed their Discord account avatar.`)
              .setTimestamp()
              .setFooter({ text: `User ID: ${newUser.id}` });
    
            const modlogChannel = client.guilds.cache.get(serverId)?.channels.cache.get(config.modlogChannel);
            if (modlogChannel) {
              modlogChannel.send({ embeds: [profilePictureChangeEmbed] });
            }
          }
        }
      }
    });

    // Logging: Guild icon changes
    client.on('guildUpdate', async (oldGuild, newGuild) => {
      try {
        if (oldGuild.icon !== newGuild.icon) {
          const config = await Configure.findOne({ guildId: newGuild.id });
  
          if (config && config.modlogChannel && config.modlogIsEnabled) {
              // Find the audit logs for the guild
              const auditLogs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate });
              const auditLogEntry = auditLogs.entries.first();
  
              if (auditLogEntry) {
                  const profilePictureChangeEmbed = new EmbedBuilder()
                      .setColor(0xFF69B4)
                      .setTitle(`Server Icon Update`)
                      .setAuthor({ name: newGuild.name, iconURL: newGuild.iconURL() })
                      .setThumbnail(newGuild.iconURL())
                      .setTimestamp()
                      .setFooter({ text: `Server ID: ${newGuild.id}` })
                      .addFields({ name: 'Updated By', value: `<@${auditLogEntry.executor.id}>` });
  
                  const modlogChannel = newGuild.channels.cache.get(config.modlogChannel);
                  if (modlogChannel) {
                      modlogChannel.send({ embeds: [profilePictureChangeEmbed] });
                  }
              }
          }
      }
      } catch (error) { if (error.code === 50013) { return; } }
    });

    // Logging: Invites created
    client.on('inviteCreate', async (invite) => {
      try {
        const serverId = invite.guild.id;
        const config = await Configure.findOne({ guildId: serverId });
    
        if (config && config.modlogChannel && config.modlogIsEnabled) {
          const inviteCreateEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Invite Created')
            .setAuthor({
              name: invite.inviter ? invite.inviter.tag : 'Unknown',
              iconURL: invite.inviter ? invite.inviter.displayAvatarURL() : ''
            })
            .setDescription(`**Channel:** <#${invite.channel.id}>\n**Invite Code:** ${invite.code}`)
            .addFields({ name: 'Created by', value: `<@${invite.inviter.id}>` })
            .setTimestamp();
    
          const modlogChannel = invite.guild.channels.cache.get(config.modlogChannel);
          if (modlogChannel) {
            modlogChannel.send({ embeds: [inviteCreateEmbed] });
          }
        }
      } catch (error) {
        console.error('Error in inviteCreate event:', error);
      }
    });

    // Logging: Invites deleted
    client.on('inviteDelete', async (invite) => {
      try {
        const serverId = invite.guild.id;
        const config = await Configure.findOne({ guildId: serverId });
    
        if (config && config.modlogChannel && config.modlogIsEnabled) {
          const inviteDeleteEmbed = new EmbedBuilder()
            .setColor(0xFF0000) // Red color for invite revocation
            .setTitle('Invite Deleted')
            .setAuthor({
              name: invite.inviter ? invite.inviter.tag : 'Unknown',
              iconURL: invite.inviter && invite.inviter.displayAvatarURL() ? invite.inviter.displayAvatarURL() : null
            })
            .setDescription(`**Channel:** <#${invite.channel.id}>\n**Invite Code:** ${invite.code}`)
    
          const botMember = invite.guild.members.cache.get(client.user.id);
          if (botMember && botMember.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            try {
              const auditLogs = await invite.guild.fetchAuditLogs({ type: AuditLogEvent.InviteDelete });
              const auditLogEntry = auditLogs.entries.first();
              if (auditLogEntry) {
                inviteDeleteEmbed.addFields({ name: 'Deleted by', value: `<@${auditLogEntry.executor.id}>` });
                inviteDeleteEmbed.setAuthor({ name: auditLogEntry.executor.tag, iconURL: auditLogEntry.executor.avatarURL() })
              }
            } catch (error) {
              if (error.message.includes("Cannot read properties of undefined (reading 'fetchAuditLogs')")) {
                return;
              }
            }
          }
    
          // Set the timestamp and send the embed to the modlog channel
          inviteDeleteEmbed.setTimestamp();
          const modlogChannel = invite.guild.channels.cache.get(config.modlogChannel);
          if (modlogChannel) {
            modlogChannel.send({ embeds: [inviteDeleteEmbed] });
          }
        }
      } catch (error) {
        console.error('Error in inviteDelete event:', error);
      }
    });
       
    
    } else { console.log(`\x1b[1;31mERROR \x1b[0mAttempts to connect to the MongoDB database have been disabled.`); }

    eventHandler(client);
    client.login(process.env.TOKEN);

  } catch (error) { console.error('Error:', error); }
})();

function ordinalSuffix(number) {
  if (number % 100 >= 11 && number % 100 <= 13) { return number + 'th'; }
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