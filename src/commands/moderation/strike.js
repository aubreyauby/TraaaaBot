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
const fs = require('fs');
const ongoingStrikeProcesses = new Map();

module.exports = {
  /**
   * 
   * @param {Client} client 
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
      // Prohibit moderators from trying to strike the bot itself.
      const mentionedUser = interaction.options.getUser('user');
      if (mentionedUser.id === client.user.id) {
          const noBotStrike = new EmbedBuilder().setColor(0xFF0000)
          .setTitle(`Error`)  
          .setDescription(`You cannot strike the bot itself.`)
          return await interaction.reply({ embeds: [noBotStrike], ephemeral: true });
      }

      // Prohibit moderators from striking members that are not on the server.
      if (!interaction.guild.members.cache.has(mentionedUser.id)) {
        const notInServerEmbed = new EmbedBuilder().setColor(0xFF0000)
          .setTitle(`Error`)
          .setDescription(`**${mentionedUser.username}** (<@${mentionedUser.id}>) is not on this server and cannot be given a strike.`)
          .setThumbnail(mentionedUser.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 }));
        return await interaction.reply({ embeds: [notInServerEmbed], ephemeral: true });
      }

      // Check if the user has an ongoing strike process
      const userId = interaction.user.id;
      if (ongoingStrikeProcesses.has(userId)) {
        const ongoingStrikeEmbed = new EmbedBuilder().setColor(0xFF0000)
        .setTitle(`Error`)
        .setDescription(`You already have an ongoing strike process. Please complete it before starting a new one.`)
        return await interaction.reply({ embeds: [ongoingStrikeEmbed], ephemeral: true });
      }
      ongoingStrikeProcesses.set(userId, interaction);
      
      if (!interaction.isChatInputCommand()) return;

      try {
        const confirmButton = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Primary);

        const cancelButton = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('No, strike now')
        .setStyle(ButtonStyle.Secondary);

        const forgetAboutIt = new ButtonBuilder()
        .setCustomId('forgetAboutIt')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
          .addComponents(confirmButton, cancelButton, forgetAboutIt);

        const attachmentEmbed = {
            color: 0x3498db,
            title: `Add evidence for ${interaction.options.getUser('user').username}'s strike?`,
            description: `:question: Would you like to provide attachments for <@${interaction.options.getUser('user').id}>'s strike? This would allow <@${interaction.options.getUser('user').id}> and your moderators to see detailed evidence of why a strike was given.\n\n:warning:  If you submit attachments by a Discord link, they will be accessible until they are deleted. You cannot modify attachments after the strike was given.`,
            thumbnail: {
                url: interaction.options.getUser('user').displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })
            },
            author: {
              name: interaction.options.getUser('user').username, 
              iconURL: interaction.options.getUser('user').avatarURL()
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
              description: `To submit attachments, send them in this channel and I'll process them to add to the strike.\n\nYour message containing the attachments will be instantly deleted, so you do not have to worry about doing it yourself. \n\nThis request will expire after two minutes of no activity. It will expire <t:${Math.floor((Date.now() + 2 * 60 * 1000) / 1000)}:R>.`,
              thumbnail: {
                url: interaction.options.getUser('user').displayAvatarURL({
                  dynamic: true,
                  format: 'png',
                  size: 4096,
                }),
              },
            };
            interaction.editReply({
              embeds: [attachmentSendEmbed],
              components: [],
            });
        
            const attachmentFilter = (msg) =>
              msg.author.id === interaction.user.id && msg.attachments.size > 0;
        
            const attachmentCollector = interaction.channel.createMessageCollector({
              filter: attachmentFilter,
              time: 120000,
            });
        
            attachmentCollector.on('collect', async (msg) => {
              const attachment = msg.attachments.first();

              const submissionConfirmationEmbed = new EmbedBuilder().setColor(0xA3A3A3)
                .setTitle(`Submission Received`)
                .setDescription(`We have received your submission(s) for ${interaction.options.getUser('user').username}'s strike. \n\nPlease wait while we process your attachments and prepare a confirmation...`)
                .setThumbnail(interaction.options.getUser('user').displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }));

              await interaction.editReply({ embeds: [submissionConfirmationEmbed], components: [] });

              const attachmentBuffer = await fetch(attachment.url).then((response) => response.arrayBuffer() );
            
              const attachmentPath = '../../strikersc/';
              const fileName = `${attachmentPath}${attachment.name}`;
            
              if (!fs.existsSync(attachmentPath)) { fs.mkdirSync(attachmentPath, { recursive: true }); }
            
              fs.writeFileSync(fileName, Buffer.from(attachmentBuffer));

              const acceptedExtensions = ['png', 'jpeg', 'jpg', 'gif'];
              const fileExtension = attachment.name.split('.').pop().toLowerCase();
              if (acceptedExtensions.includes(fileExtension)) {
                  try {
                    const { options, guildId } = interaction;
                    const target = options.getUser('user');

                    const reason = interaction.options.getString('reason') || "No reason provided";

                    try {
                      data = await strikeSchema.findOne({
                        guildID: guildId,
                        userID: target.id,
                        userTag: target.tag,
                      }).lean();

                      let strikeCount = 1;
                      if (data && data.strikeCount !== undefined) {
                        // If the user already has strikes, increment the existing count
                        strikeCount = data.strikeCount + 1;
                      }
                    
                      const submitStrike = new ButtonBuilder().setCustomId('submitStrike').setLabel('Submit').setStyle(ButtonStyle.Primary);
                      const cancelStrike = new ButtonBuilder().setCustomId('cancelStrike').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
                      const row = new ActionRowBuilder().addComponents(submitStrike, cancelStrike);

                      const imageEmbed = new EmbedBuilder().setColor(0x00FF00)
                      .setTitle(`Verify Strike Information`)
                      .setDescription(`Your attachment has been successfully uploaded for <@${interaction.options.getUser('user').id}>'s strike. Please review the following and confirm whether all the strike details are correct.`)
                      .setImage(`attachment://${attachment.name}`)
                      .setThumbnail(interaction.options.getUser('user').displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                      .addFields(
                        { name: 'Strike', value: `**${strikeCount}**`, inline: true },
                        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                      ); 

                      interaction.editReply({embeds: [imageEmbed], files: [fileName], components: [row]}); 

                      const submitCollector = interaction.channel.createMessageComponentCollector({ filter, time: 999999999 });
                      submitCollector.on('collect', async (dbi) => {
                          if (dbi.customId === 'submitStrike') {
                            const { options, guildId, user } = interaction;
                            const target = options.getUser('user');
                            const userTag = `${target.username}`;
                            
                            const reason = interaction.options.getString('reason') || "No reason provided";
                      
                            const strikeContent = {
                              ExecutorID: user.id,
                              ExecutorTag: user.tag,
                              Reason: reason || "No reason provided",
                            };
                            
                            let data = await strikeSchema.findOne({
                              guildID: guildId,
                              userID: target.id,
                              userTag: target.tag
                            });
                      
                            // If the data was not found, create a new one.
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
                            console.log(`\x1b[1;34mINFO \x1b[0mStrike information has been written to the database:\nguildID: ${guildId}\nuserID:${target.id}\nuserTag: ${target.tag}\nstrikeCount: ${data.strikeCount}\ncontent:\n${data.content.join('\n')}`);
              
                            const dmEmbed = new EmbedBuilder()
                            .setTitle(`Strike Notification`)
                            .setAuthor({ name: 'TraaaaBot', iconURL: client.user.displayAvatarURL() })
                            .setDescription(`❗ You have received a strike in **${interaction.guild.name}**.`)
                            .setThumbnail(interaction.guild.iconURL({ dynamic: true, format: 'png', size: 4096 }))
                            .setImage(`attachment://${attachment.name}`)
                            .setColor(0xFF0000)
                            .setTimestamp()
                            .addFields(
                                { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                                { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Reason', value: reason, inline: false }
                            )
                  
                            let sentDMConfirmation = "";
                            try {
                                await target.send({ embeds: [dmEmbed], components: [], files: [fileName] });
                                sentDMConfirmation = "✅ Delivered";
                            } catch (dmError) {
                                if (dmError.code === 50007) return sentDMConfirmation = "❌ DMs Disabled";
                            }
                  
                            const interactionEmbed = new EmbedBuilder()
                              .setTitle(`Strike Confirmation`)
                              .setDescription(`✅ **${target.username}** (<@${target.id}>) has been striked.`)
                              .setThumbnail(target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                              .setImage(`attachment://${attachment.name}`)
                              .setColor(0x00FF00)
                              .addFields(
                                  { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                                  { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                  { name: 'Reason', value: reason, inline: false },
                                  { name: 'Delivered to DM?', value: sentDMConfirmation, inline: false },
                              );

                              interaction.editReply({ embeds: [interactionEmbed], ephemeral: true, components: [] });

                              // Terminate all processes
                              ongoingStrikeProcesses.delete(userId, interaction);
                              submitCollector.stop();  
                              attachmentCollector.stop();
                              collector.stop();
                              return;
                          } else if (dbi.customId === 'cancelStrike') {
                              const cancelEmbed = new EmbedBuilder()
                                  .setColor(0x00FF00)
                                  .setTitle(`Success`)
                                  .setDescription(`:white_check_mark: The strike operation has been cancelled and ${mentionedUser.username} will not receive a strike.`)
                                  .setThumbnail(mentionedUser.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }));
                              interaction.editReply({ embeds: [cancelEmbed], files: [], components: [] });

                              // Terminate all processes
                              ongoingStrikeProcesses.delete(userId, interaction);
                              submitCollector.stop();
                              attachmentCollector.stop();
                              collector.stop();
                              return;
                          }
                      });
                    } catch (error) {
                        console.log(`\x1b[1;31mERROR\x1b[0m (\x1b[1m${interaction.guild.name}\x1b[0m) An error occurred, but a strike can still be given: ${error.stack}`);

                        const dbsubmitStrike = new ButtonBuilder().setCustomId('dbsubmitStrike').setLabel('Submit').setStyle(ButtonStyle.Primary);
                        const dbcancelStrike = new ButtonBuilder().setCustomId('dbcancelStrike').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
                        const dbrow = new ActionRowBuilder().addComponents(dbsubmitStrike, dbcancelStrike);
                        
                        const dbimageEmbed = new EmbedBuilder().setColor(0x00FF00)
                        .setTitle(`Verify Strike Information`)
                        .setDescription(`Your attachment has been successfully uploaded. Please review the following and confirm whether all the strike details are correct.\n\n:warning: Submitting a strike with an internal error: \`\`\`${error.message}\`\`\``)
                        .setImage(`attachment://${attachment.name}`)
                        .setThumbnail(interaction.options.getUser('user').displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                        .addFields(
                          { name: 'Strike', value: `\`${error.message}\``, inline: false },
                          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                          { name: 'Reason', value: reason, inline: false }
                        );
                        
                        interaction.editReply({embeds: [dbimageEmbed], files: [fileName], components: [dbrow]});

                        const dbsubmitCollector = interaction.channel.createMessageComponentCollector({ filter, time: 999999999 });
                        dbsubmitCollector.on('collect', async (dbi) => {
                          if (dbi.customId === 'dbsubmitStrike') {
                            const { options, guildId, user } = interaction;
                            const target = options.getUser('user');
                            const userTag = `${target.username}`;
                      
                            const strikeContent = {
                              ExecutorID: user.id,
                              ExecutorTag: user.tag,
                              Reason: reason || "No reason provided",
                            };
                            
                            let data = await strikeSchema.findOne({
                              guildID: guildId,
                              userID: target.id,
                              userTag: target.tag
                            });
                      
                            // If the data was not found, create a new one.
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
                            console.log(`\x1b[1;34mINFO \x1b[0mStrike information has been written to the database:\nguildID: ${guildId}\nuserID:${target.id}\nuserTag: ${target.tag}\nstrikeCount: ${data.strikeCount}\ncontent:\n${data.content.join('\n')}`);
              
                            const dmEmbed = new EmbedBuilder()
                            .setTitle(`Strike Notification`)
                            .setAuthor({ name: 'TraaaaBot', iconURL: client.user.displayAvatarURL() })
                            .setDescription(`❗ You have received a strike in **${interaction.guild.name}**.`)
                            .setThumbnail(interaction.guild.iconURL({ dynamic: true, format: 'png', size: 4096 }))
                            .setImage(`attachment://${attachment.name}`)
                            .setColor(0xFF0000)
                            .setTimestamp()
                            .addFields(
                                { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                                { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Rule violated', value: whatRuleWasViolatedValue || 'No rule mentioned', inline: false },
                                { name: 'Explanation', value: strikeDetailsValue, inline: false }
                            )
                  
                            let sentDMConfirmation = "";
                            try {
                                await target.send({ embeds: [dmEmbed], components: [], files: [fileName] });
                                sentDMConfirmation = "✅ Delivered";
                            } catch (dmError) {
                                if (dmError.code === 50007) return sentDMConfirmation = "❌ DMs Disabled";
                            }
                  
                            const interactionEmbed = new EmbedBuilder()
                              .setTitle(`Strike Confirmation`)
                              .setDescription(`✅ **${target.username}** (<@${target.id}>) has been striked.`)
                              .setThumbnail(target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
                              .setImage(`attachment://${attachment.name}`)
                              .setColor(0x00FF00)
                              .addFields(
                                  { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                                  { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                                  { name: 'Rule violated', value: whatRuleWasViolatedValue || 'No rule mentioned', inline: false },
                                  { name: 'Explanation', value: strikeDetailsValue, inline: false },
                                  { name: 'Delivered to DM?', value: sentDMConfirmation, inline: false },
                              );

                              interaction.editReply({ embeds: [interactionEmbed], ephemeral: true, components: [] });

                              // Terminate all processes
                              ongoingStrikeProcesses.delete(userId, interaction);
                              submitCollector.stop();  
                              attachmentCollector.stop();
                              collector.stop();
                              return;
                          } else if (dbi.customId === 'dbcancelStrike') {
                            const cancelEmbed = new EmbedBuilder()
                              .setColor(0x00FF00)
                              .setTitle(`Success`)
                              .setDescription(`:white_check_mark: The strike operation has been cancelled and ${interaction.options.getUser('user').username} will not receive a strike.`)
                              .setThumbnail(interaction.options.getUser('user').displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }));
                            interaction.editReply({ embeds: [cancelEmbed], files: [], components: [] });

                            // Terminate all processes
                            ongoingStrikeProcesses.delete(userId, interaction);
                            dbsubmitCollector.stop();
                            attachmentCollector.stop();
                            collector.stop();
                            return;
                          }
                        });
                    }
                  } catch (error) {
                    
                  }
              } else {
                const invalidAttachmentEmbed = new EmbedBuilder().setColor(0xFF0000)
                  .setTitle(`Invalid Attachment`)
                  .setDescription(`The attachment you provided (\`${attachment.name}\`) is not a valid attachment. Please submit images or GIFs and try again.\n\nAccepted formats:\n\`.png\`, \`.jpg\`, \`.jpeg\`, \`.gif\``)
                  .setThumbnail(interaction.options.getUser('user').displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }));
        
                const invalidAttachmentRow = new ActionRowBuilder().addComponents(forgetAboutIt);
        
                interaction.editReply({ embeds: [invalidAttachmentEmbed], components: [invalidAttachmentRow] });
              }
              // Delete the attachments from the message that was sent.      
              msg.delete().catch(console.error);
            });
        
            attachmentCollector.on('end', async (collected) => {
              if (collected.size === 0) {
                // Handle the case when no attachments are submitted within the specified time...
              }
            });
            
          } else if (i.customId === 'cancel') {
            const { options, guildId, user } = interaction;
            const target = options.getUser('user');
            const userTag = `${target.username}`;
            const reason = interaction.options.getString('reason') || "No reason provided";

            const strikeContent = {
              ExecutorID: user.id,
              ExecutorTag: user.tag,
              Reason: reason || "No reason provided",
            };
            
            let data = await strikeSchema.findOne({
              guildID: guildId,
              userID: target.id,
              userTag: target.tag
            });
      
            // If the data was not found, create a new one.
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
            console.log(`\x1b[1;34mINFO \x1b[0mStrike information has been written to the database:\nguildID: ${guildId}\nuserID:${target.id}\nuserTag: ${target.tag}\nstrikeCount: ${data.strikeCount}\ncontent:\n${data.content.join('\n')}`);

            const dmEmbed = new EmbedBuilder()
            .setTitle(`Strike Notification`)
            .setAuthor({ name: 'TraaaaBot', iconURL: client.user.displayAvatarURL() })
            .setDescription(`❗ You have received a strike in **${interaction.guild.name}**.`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, format: 'png', size: 4096 }))
            .setColor(0xFF0000)
            .setTimestamp()
            .addFields(
                { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
  
            let sentDMConfirmation = "";
            try {
                await target.send({ embeds: [dmEmbed], components: [] });
                sentDMConfirmation = "✅ Delivered";
            } catch (dmError) {
                if (dmError.code === 50007) return sentDMConfirmation = "❌ DMs Disabled";
            }
  
            const interactionEmbed = new EmbedBuilder()
              .setTitle(`Strike Confirmation`)
              .setDescription(`✅ **${target.username}** (<@${target.id}>) has been striked.`)
              .setThumbnail(target.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 }))
              .setColor(0x00FF00)
              .addFields(
                  { name: 'Strike', value: `**${data.strikeCount}**`, inline: true },
                  { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                  { name: 'Reason', value: reason || "No reason provided", inline: false },
                  { name: 'Delivered to DM?', value: sentDMConfirmation, inline: false },
              );

              interaction.editReply({ embeds: [interactionEmbed], ephemeral: true, components: [] });

              // Terminate all processes
              ongoingStrikeProcesses.delete(userId, interaction);
              collector.stop();
              return;            
          } else if (i.customId === 'forgetAboutIt') {
              const cancelEmbed = {
                  color: 0x00FF00,
                  title: `Success`,
                  description: `:white_check_mark: The strike operation has been cancelled and ${interaction.options.getUser('user').username} will not receive a strike.`,
                  thumbnail: {
                      url: interaction.options.getUser('user').displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })
                  }
              };
              interaction.editReply({ embeds: [cancelEmbed], components: [] });
              ongoingStrikeProcesses.delete(userId, interaction);
              collector.stop();
              return;
          }
        });

      } catch (err) {
        console.log(`\x1b[1;31mERROR\x1b[0m (\x1b[1m${interaction.guild.name}\x1b[0m) Strike error: ${err}`);
      }
  },

  name: 'strike',
  description: "Issue a moderation strike to a member.",
  options: [
      {
          name: "user",
          description: "The user to strike.",
          type: ApplicationCommandOptionType.Mentionable,
          required: true
      },
      {
          name: "reason",
          description: "The reason for striking the user.",
          type: ApplicationCommandOptionType.String,
          required: false
      }
  ],
  permissionsRequired: [PermissionFlagsBits.ManageMessages],
  botPermissions: [PermissionFlagsBits.ManageMessages]
}