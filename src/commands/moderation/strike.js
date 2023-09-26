const { Client, 
  Interaction, 
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType 
} = require('discord.js');
const strikeSchema = require('../../models/strike');
const Configure = require('../../models/configure')
const fs = require('fs');
const ongoingStrikeProcesses = new Map();

module.exports = {
  /**
   * 
   * @param {Client} client 
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
      const { options, guildId, user } = interaction;
      const reason = interaction.options.getString('reason') || "No reason provided";
      const target = options.getUser('member');
      const strikeContent = {ExecutorID: user.id, ExecutorTag: user.tag, Reason: reason || "No reason provided"};
      let sentDMConfirmation = "";
      const userTag = `${target.username}`;
      const userId = interaction.user.id;

      if (target.bot) {
        const botStrikeEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
            .setDescription(`:x: <@${target.id}> is a bot.`)
            .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
        return await interaction.reply({ embeds: [botStrikeEmbed], ephemeral: true });
      }

      if (!interaction.guild.members.cache.has(target.id)) {
        const notInServerEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
          .setDescription(`:x: <@${target.id}> is not on this server and cannot be given a strike.`)
          .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
        return await interaction.reply({ embeds: [notInServerEmbed], ephemeral: true });
      }

      if (ongoingStrikeProcesses.has(userId)) {
        const ongoingStrikeEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
          .setDescription(`:x: You already have an ongoing strike process. Please complete it before starting a new one.`)
          .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
        return await interaction.reply({ embeds: [ongoingStrikeEmbed], ephemeral: true });
      }

      ongoingStrikeProcesses.set(userId, interaction);
      if (!interaction.isChatInputCommand()) return;

      try {
        const confirmButton = new ButtonBuilder().setCustomId('confirm').setLabel('Yes').setStyle(ButtonStyle.Primary);
        const cancelButton = new ButtonBuilder().setCustomId('cancel').setLabel('No').setStyle(ButtonStyle.Secondary);
        const forgetAboutIt = new ButtonBuilder().setCustomId('forgetAboutIt').setLabel('Cancel').setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton, forgetAboutIt);

        const attachmentEmbed = {
            color: 0x3498db,
            title: `Add Attachments`,
            description: `:question: Would you like to add attachments for <@${target.id}>'s strike? This would allow them and server moderators to see detailed evidence of why a strike was given.\n\n:warning: If you submit attachments by a Discord link, they will be accessible until they are deleted. You cannot modify attachments after the strike was given.`,
            author: {
              name: target.tag, 
              iconURL: target.avatarURL()
            }
        };

        await interaction.reply({ embeds: [attachmentEmbed], components: [row], ephemeral: true });
        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 999999999 });

        collector.on('collect', async (i) => {
          if (i.customId === 'confirm') {
            const attachmentSendEmbed = {
              color: 0x00FF00,
              title: `Awaiting Submissions`,
              description: `🕗 To submit attachments, send them in the next message and TraaaaBot will process them. Your message containing the attachments will be instantly deleted, so you do not have to worry about doing it yourself.\n\nThe following attachment types are accepted: \`.png\`, \`.jpg\`, \`.jpeg\`, \`.gif\`\n\nThis request will expire after two minutes of no activity. It will expire <t:${Math.floor((Date.now() + 2 * 60 * 1000) / 1000)}:R>.`,
              author: {
                name: target.tag, 
                iconURL: target.avatarURL()
              }
            };

            interaction.editReply({embeds: [attachmentSendEmbed], components: []});
        
            const attachmentFilter = (msg) => msg.author.id === interaction.user.id && msg.attachments.size > 0;
        
            const attachmentCollector = interaction.channel.createMessageCollector({filter: attachmentFilter, time: 120000});
        
            attachmentCollector.on('collect', async (msg) => {
              const attachment = msg.attachments.first();

              const submissionConfirmationEmbed = new EmbedBuilder().setColor(0xA3A3A3).setTitle(`Submission Received`)
                .setDescription(`We have received your submission(s) for <@${target.id}>'s strike. \n\nPlease wait while we process them and prepare the strike confirmation for you...`)
                .setAuthor({ name: target.tag, iconURL: target.avatarURL() });

              await interaction.editReply({ embeds: [submissionConfirmationEmbed], components: [] });

              const attachmentBuffer = await fetch(attachment.url).then((response) => response.arrayBuffer());

              const attachmentPath = '../../strikersc/';
              const fileName = `${attachmentPath}${attachment.name}`;
              
              if (!fs.existsSync(attachmentPath)) { fs.mkdirSync(attachmentPath, { recursive: true }); }
              
              fs.writeFileSync(fileName, Buffer.from(attachmentBuffer));
              
              const acceptedExtensions = ['png', 'jpeg', 'jpg', 'gif'];
              const fileExtension = attachment.name.split('.').pop().toLowerCase();
              if (acceptedExtensions.includes(fileExtension)) {
                  try {
                    const { guildId } = interaction;

                    try {
                      data = await strikeSchema.findOne({ guildID: guildId, userID: target.id, userTag: target.tag }).lean();

                      let strikeCount = 1;
                      if (data && data.strikeCount !== undefined) { strikeCount = data.strikeCount + 1; }
                    
                      const submitStrike = new ButtonBuilder().setCustomId('submitStrike').setLabel('Submit').setStyle(ButtonStyle.Primary);
                      const cancelStrike = new ButtonBuilder().setCustomId('cancelStrike').setLabel('Cancel').setStyle(ButtonStyle.Danger);
                      const row = new ActionRowBuilder().addComponents(submitStrike, cancelStrike);

                      const imageEmbed = new EmbedBuilder().setColor(0x00FF00)
                      .setTitle(`Verify Strike`)
                      .setDescription(`Your attachment has been successfully uploaded for <@${target.id}>'s strike. Please review the following and confirm whether all the strike details are correct.`)
                      .setImage(`attachment://${attachment.name}`)
                      .setAuthor({ name: target.username, iconURL: target.avatarURL() })
                      .addFields(
                        { name: 'Strike', value: `**${strikeCount}**`, inline: true },
                        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                      ); 

                      interaction.editReply({embeds: [imageEmbed], files: [fileName], components: [row]}); 
                      const submitCollector = interaction.channel.createMessageComponentCollector({ filter, time: 999999999 });

                      submitCollector.on('collect', async (dbi) => {
                          if (dbi.customId === 'submitStrike') {
                            let data = await strikeSchema.findOne({ guildID: guildId, userID: target.id, userTag: target.tag });

                            if (!data) {
                              data = new strikeSchema({
                                guildID: guildId,
                                userID: target.id,
                                userTag: userTag,
                                strikeCount: 1,
                                content: [strikeContent],
                              });
                            } else {
                              data.content.push(strikeContent);
                              data.strikeCount += 1;
                            }
                            
                            await data.save();
              
                            const dmEmbed = new EmbedBuilder()
                            .setTitle(`Strike Notice`)
                            .setDescription(`❗ You have received a strike in **${interaction.guild.name}**. For more information on this strike, please contact the staff members of the server.`)
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true, format: 'png', size: 4096 }) })
                            .setImage(`attachment://${attachment.name}`)
                            .setColor(0xFF0000)
                            .setTimestamp()
                            .addFields(
                                { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                                { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Reason', value: reason, inline: false }
                            )
                  
                            try {await target.send({ embeds: [dmEmbed], components: [], files: [fileName] });
                                sentDMConfirmation = "✅ Delivered";
                            } catch (dmError) { if (dmError.code === 50007) return sentDMConfirmation = "❌ DMs Disabled"; }
                  
                            const interactionEmbed = new EmbedBuilder()
                              .setTitle(`Strike Successful`)
                              .setDescription(`✅ <@${target.id}> has been striked.`)
                              .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
                              .setImage(`attachment://${attachment.name}`)
                              .setColor(0x00FF00)
                              .addFields(
                                  { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                                  { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                  { name: 'Reason', value: reason, inline: false },
                                  { name: 'Delivered to DM?', value: sentDMConfirmation, inline: false },
                              );

                              interaction.editReply({ embeds: [interactionEmbed], ephemeral: true, components: [] });

                              if (config && config.modlogChannel && config.modlogIsEnabled) {
                                const logEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Member Striked`)
                                    .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
                            
                                let descriptionText = `:scales: <@${user.id}> has issued a strike to <@${target.id}>`;
                            
                                if (user.id === target.id) {
                                    descriptionText = `:scales: <@${user.id}> has self-struck themselves! Talk about taking accountability for their own actions!`;
                                }
                            
                                logEmbed.setDescription(descriptionText)
                                    .setTimestamp()
                                    .addFields(
                                        { name: 'Strike Count', value: `**${data.strikeCount}**`, inline: true },
                                        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                        { name: 'Reason', value: reason, inline: false }
                                    );
                            
                                const modlogChannel = interaction.guild.channels.cache.get(config.modlogChannel);
                                if (modlogChannel) { modlogChannel.send({ embeds: [logEmbed] }); }
                            }

                            ongoingStrikeProcesses.delete(userId, interaction);
                            submitCollector.stop(); attachmentCollector.stop(); collector.stop();

                            try { fs.unlinkSync(fileName);
                            } catch (err) { console.error(`Error deleting ${fileName}: ${err.message}`); }

                            return;
                          } else if (dbi.customId === 'cancelStrike') {
                              const cancelEmbed = new EmbedBuilder()
                                  .setColor(0x00FF00)
                                  .setTitle(`Success`)
                                  .setDescription(`:white_check_mark: The strike operation has been cancelled and <@${target.id}> will not receive a strike.`)
                                  .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
                              
                              interaction.editReply({ embeds: [cancelEmbed], files: [], components: [] });

                              ongoingStrikeProcesses.delete(userId, interaction);
                              submitCollector.stop(); attachmentCollector.stop(); collector.stop();

                              try {
                                fs.unlinkSync(fileName);
                              } catch (err) { console.error(`Error deleting ${fileName}: ${err.message}`); }

                              return;
                          }
                      });
                    } catch (error) {
                        console.log(`\x1b[1;31mERROR\x1b[0m (\x1b[1m${interaction.guild.name}\x1b[0m) An error occurred, but a strike can still be given: ${error.stack}`);

                        const dbsubmitStrike = new ButtonBuilder().setCustomId('dbsubmitStrike').setLabel('Submit').setStyle(ButtonStyle.Primary);
                        const dbcancelStrike = new ButtonBuilder().setCustomId('dbcancelStrike').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
                        const dbrow = new ActionRowBuilder().addComponents(dbsubmitStrike, dbcancelStrike);
                        
                        const dbimageEmbed = new EmbedBuilder().setColor(0x00FF00)
                        .setTitle(`Verify Strike`)
                        .setDescription(`Your attachment has been successfully uploaded. Please review the following and confirm whether all the strike details are correct.\n\n:warning: Submitting a strike with an internal error: \`\`\`${error.message}\`\`\``)
                        .setImage(`attachment://${attachment.name}`)
                        .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
                        .addFields(
                          { name: 'Strike', value: `\`${error.message}\``, inline: false },
                          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                          { name: 'Reason', value: reason, inline: false }
                        );
                        
                        interaction.editReply({embeds: [dbimageEmbed], files: [fileName], components: [dbrow]});

                        const dbsubmitCollector = interaction.channel.createMessageComponentCollector({ filter, time: 999999999 });
                        dbsubmitCollector.on('collect', async (dbi) => {
                          if (dbi.customId === 'dbsubmitStrike') {
                            let data = await strikeSchema.findOne({guildID: guildId, userID: target.id, userTag: target.tag});

                            if (!data) {
                              data = new strikeSchema({
                                  guildID: guildId,
                                  userID: target.id,
                                  userTag: userTag,
                                  strikeCount: 1,
                                  content: [strikeContent],
                              });
                            } else {
                                data.content.push(strikeContent);
                                data.strikeCount += 1;
                            }

                            await data.save();
              
                            const dmEmbed = new EmbedBuilder()
                            .setTitle(`Strike Notice`)
                            .setDescription(`❗ You have received a strike in **${interaction.guild.name}**. For more information on this strike, please contact the staff members of the server.`)
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true, format: 'png', size: 4096 }) })
                            .setImage(`attachment://${attachment.name}`)
                            .setColor(0xFF0000)
                            .setTimestamp()
                            .addFields(
                                { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                                { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Reason', value: reason, inline: false }
                            )
                  
                            try {
                                await target.send({ embeds: [dmEmbed], components: [], files: [fileName] });
                                sentDMConfirmation = "✅ Delivered";
                            } catch (dmError) {
                                if (dmError.code === 50007) return sentDMConfirmation = "❌ DMs Disabled";
                            }
                  
                            const interactionEmbed = new EmbedBuilder()
                              .setTitle(`Strike Confirmation`)
                              .setDescription(`✅ <@${target.id}> has been striked.`)
                              .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
                              .setImage(`attachment://${attachment.name}`)
                              .setColor(0x00FF00)
                              .addFields(
                                  { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                                  { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                  { name: 'Reason', value: reason, inline: false },
                                  { name: 'Delivered to DM?', value: sentDMConfirmation, inline: false },
                              );

                              interaction.editReply({ embeds: [interactionEmbed], ephemeral: true, components: [] });
                              
                              const config = await Configure.findOne({ guildId: interaction.guild.id });
                              if (config && config.logChannel && config.logIsEnabled) {
                        
                              if (config && config.modlogChannel && config.modlogIsEnabled) {
                                  const logEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Member Striked`)
                                      .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
                              
                                  let descriptionText = `:scales: <@${user.id}> has issued a strike to <@${target.id}>`;
                              
                                  if (user.id === target.id) {
                                      descriptionText = `:scales: <@${user.id}> has self-struck themselves! Talk about taking accountability for their own actions!`;
                                  }
                              
                                  logEmbed.setDescription(descriptionText)
                                      .setTimestamp()
                                      .addFields(
                                          { name: 'Strike Count', value: `**${data.strikeCount}**`, inline: true },
                                          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                          { name: 'Reason', value: reason, inline: false }
                                      );
                              
                                  const modlogChannel = interaction.guild.channels.cache.get(config.modlogChannel);
                                  if (modlogChannel) { modlogChannel.send({ embeds: [logEmbed] }); }
                              }

                              ongoingStrikeProcesses.delete(userId, interaction);
                              submitCollector.stop(); attachmentCollector.stop(); collector.stop();
                              return;
                          } else if (dbi.customId === 'dbcancelStrike') {
                            const cancelEmbed = new EmbedBuilder().setColor(0x00FF00).setTitle(`Success`)
                              .setDescription(`:white_check_mark: The strike operation has been cancelled and <@${target.id}> will not receive a strike.`)
                              .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
                            
                              interaction.editReply({ embeds: [cancelEmbed], files: [], components: [] });

                            ongoingStrikeProcesses.delete(userId, interaction);
                            dbsubmitCollector.stop(); attachmentCollector.stop(); collector.stop();
                            return;
                          }
                        }});
                    }
                  } catch (error) { console.log(error.stack);}
              } else {
                const invalidAttachmentEmbed = new EmbedBuilder().setColor(0xFF0000)
                  .setTitle(`Invalid Attachment`)
                  .setDescription(`The attachment you provided (\`${attachment.name}\`) is not a valid attachment. Please submit images or GIFs and try again.\n\nAccepted formats:\n\`.png\`, \`.jpg\`, \`.jpeg\`, \`.gif\``)
                  .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
        
                const invalidAttachmentRow = new ActionRowBuilder().addComponents(forgetAboutIt);
        
                interaction.editReply({ embeds: [invalidAttachmentEmbed], components: [invalidAttachmentRow] });
              }   
              msg.delete().catch(console.error);
            });
        
            attachmentCollector.on('end', (collected, reason) => {
              if (reason === 'time') {
                const timeoutEmbed = new EmbedBuilder().setColor(0xFF0000)
                  .setTitle(`Error`)
                  .setDescription(`:x: You did not submit any attachments within the time limit. The strike request has timed out.`)
                  .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
                
                interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                
                ongoingStrikeProcesses.delete(userId, interaction);
                attachmentCollector.stop();
                collector.stop();
                return;
              }
            });
            
          } else if (i.customId === 'cancel') {
            let data = await strikeSchema.findOne({guildID: guildId, userID: target.id, userTag: target.tag});
            const serverId = interaction.guild.id;
            const config = await Configure.findOne({ guildId: serverId });

            if (!data) {
              data = new strikeSchema({
                  guildID: guildId,
                  userID: target.id,
                  userTag: userTag,
                  strikeCount: 1,
                  content: [strikeContent],
              });
            } else {
                data.content.push(strikeContent);
                data.strikeCount += 1;
            }

            await data.save();

            const dmEmbed = new EmbedBuilder()
            .setTitle(`Strike Notice`)
            .setDescription(`❗ You have received a strike in **${interaction.guild.name}**. For more information on this strike, please contact the staff members of the server.`)
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true, format: 'png', size: 4096 }) })
            .setColor(0xFF0000)
            .setTimestamp()
            .addFields(
                { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
  
            try {
                await target.send({ embeds: [dmEmbed], components: [] });
                sentDMConfirmation = "✅ Delivered";
            } catch (dmError) {
                if (dmError.code === 50007) return sentDMConfirmation = "❌ DMs Disabled";
            }
  
            const interactionEmbed = new EmbedBuilder()
              .setTitle(`Strike Confirmation`)
              .setDescription(`✅ <@${target.id}> has been striked.`)
              .setAuthor({ name: target.tag, iconURL: target.avatarURL() })
              .setColor(0x00FF00)
              .addFields(
                  { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                  { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                  { name: 'Reason', value: reason, inline: false },
                  { name: 'Delivered to DM?', value: sentDMConfirmation, inline: false },
              );

              if (config && config.modlogChannel && config.modlogIsEnabled) {
                const logEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Member Striked`)
                    .setAuthor({ name: target.tag, iconURL: target.avatarURL() });
            
                let descriptionText = `:scales: <@${user.id}> has issued a strike to <@${target.id}>`;
            
                if (user.id === target.id) {
                    descriptionText = `:scales: <@${user.id}> has self-struck themselves! Talk about taking accountability for their own actions!`;
                }
            
                logEmbed.setDescription(descriptionText)
                    .setTimestamp()
                    .addFields(
                        { name: 'Strike Count', value: `**${data.strikeCount}**`, inline: true },
                        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    );
            
                const modlogChannel = interaction.guild.channels.cache.get(config.modlogChannel);
                if (modlogChannel) { modlogChannel.send({ embeds: [logEmbed] }); }
            }

            interaction.editReply({ embeds: [interactionEmbed], ephemeral: true, components: [] });

            ongoingStrikeProcesses.delete(userId, interaction);
            collector.stop();
            return;            
          } else if (i.customId === 'forgetAboutIt') {
              const cancelEmbed = {
                  color: 0x00FF00,
                  title: `Success`,
                  description: `:white_check_mark: The strike operation has been cancelled and <@${target.id}> will not receive a strike.`,
                  author: {
                    name: target.tag, 
                    iconURL: target.avatarURL()
                  }
              };
              interaction.editReply({ embeds: [cancelEmbed], components: [] });
              ongoingStrikeProcesses.delete(userId, interaction);
              collector.stop();
              return;
          }
        });

      } catch (err) { console.log(`\x1b[1;31mERROR\x1b[0m (\x1b[1m${interaction.guild.name}\x1b[0m) Strike error: ${err}`); }
  },

  name: 'strike',
  description: "Issue a strike to a member.",
  options: [
      {
          name: "member",
          description: "The member to strike.",
          type: ApplicationCommandOptionType.User,
          required: true
      },
      {
          name: "reason",
          description: "The reason for striking the member.",
          type: ApplicationCommandOptionType.String,
          required: false
      }
  ],
  permissionsRequired: [PermissionFlagsBits.ManageMessages],
  botPermissions: [PermissionFlagsBits.ManageMessages]
}