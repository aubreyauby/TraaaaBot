const { Client, Interaction, PermissionsBitField, EmbedBuilder } = require("discord.js");
const { getVoiceConnection, VoiceConnectionStatus } = require("@discordjs/voice");

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
        .setDescription(`:x: Please join a voice channel to use this command.`);

      return interaction.reply({ embeds: [notInVCEmbed] });
    }

    const botVoiceConnection = getVoiceConnection(channel.guild.id);

    if (!botVoiceConnection || botVoiceConnection.state.status === VoiceConnectionStatus.Destroyed) {
      // Bot is not in a voice channel in this guild
      const notInVoiceEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription(`:x: I am not in a voice channel.`);

      return interaction.reply({ embeds: [notInVoiceEmbed] });
    }

    botVoiceConnection.destroy();

    const successEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Success")
      .setDescription(`:white_check_mark: Left voice channel: **${channel.name}**`);

    return interaction.reply({ embeds: [successEmbed] });
  },

  name: "leave",
  description: "Have TraaaaBot leave the current voice channel you're in.",
};
