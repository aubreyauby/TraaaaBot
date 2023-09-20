const { Client, Interaction, PermissionsBitField, EmbedBuilder } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } = require("@discordjs/voice");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const channel = interaction.member.voice.channel;

    if (!channel) {
      const notInVCEmbed = new EmbedBuilder().setColor(0xff0000).setTitle("Error")
        .setDescription(`:x: Please join a voice channel to use this command.`);

      return interaction.reply({ embeds: [notInVCEmbed], ephemeral: true});
    }

    const botVoiceConnection = getVoiceConnection(channel.guild.id);

    if (botVoiceConnection && botVoiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
      // Bot is already in a voice channel in this guild
      const botChannelID = botVoiceConnection.joinConfig.channelId;

      if (botChannelID === channel.id) {
        const alreadyInVoiceEmbed = new EmbedBuilder().setColor(0xff0000).setTitle("Error")
        .setDescription(`:x: The bot is already in the voice channel you specified.`);

        return interaction.reply({ embeds: [alreadyInVoiceEmbed], ephemeral: true });
      } else {
        const alreadyInVoiceEmbed = new EmbedBuilder().setColor(0xff0000).setTitle("Error")
        .setDescription(`:x: The bot is being used in a different voice channel right now: <#${botChannelID}>`);

        return interaction.reply({ embeds: [alreadyInVoiceEmbed], ephemeral: true });
      }
    }
    
    const noConnectPerm = new PermissionsBitField(channel.permissionsFor(client.user).bitfield).missing(PermissionsBitField.Flags.Connect);

    if (noConnectPerm.any) {
      const missingPermissionsEmbed = new EmbedBuilder().setColor(0xff0000).setTitle("Error")
      .setDescription(`:x: I don't have the necessary permissions to join this voice channel. Missing permissions: \`${noConnectPerm.toArray().join(", ")}\``);

      return interaction.reply({ embeds: [missingPermissionsEmbed], ephemeral: true });
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      joinConfig: {
        channelId: channel.id,
      },
    });

    const successEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Success")
      .setDescription(`:white_check_mark: Joined voice channel: <#${channel.id}>`);

    return interaction.reply({ embeds: [successEmbed] });
  },

  name: "join",
  description: "Have TraaaaBot join the current voice channel you're in.",
};
