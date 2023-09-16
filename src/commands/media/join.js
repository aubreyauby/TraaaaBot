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
      const notInVCEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription(`Please join a voice channel to use this command.`);

      return interaction.reply({ embeds: [notInVCEmbed] });
    }

    const botVoiceConnection = getVoiceConnection(channel.guild.id);

    if (botVoiceConnection && botVoiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
      // Bot is already in a voice channel in this guild
      const botChannelName = botVoiceConnection.joinConfig.channel ? botVoiceConnection.joinConfig.channel.name : "unknown";
      const alreadyInVoiceEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription(`I'm already in a voice channel: **${botChannelName}**`);

      return interaction.reply({ embeds: [alreadyInVoiceEmbed] });
    }

    const noConnectPerm = new PermissionsBitField(channel.permissionsFor(client.user).bitfield).missing(PermissionsBitField.Flags.Connect);
    if (noConnectPerm.any) {
      const missingPermissionsEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription(`I don't have the necessary permissions to join this voice channel. Missing permissions: \`${noConnectPerm.toArray().join(", ")}\``);

      return interaction.reply({ embeds: [missingPermissionsEmbed] });
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    const successEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Success")
      .setDescription(`Joined voice channel: **${channel.name !== null ? channel.name : "unknown"}**`);

    return interaction.reply({ embeds: [successEmbed] });
  },

  name: "join",
  description: "Have TraaaaBot join the current voice channel you're in.",
};
