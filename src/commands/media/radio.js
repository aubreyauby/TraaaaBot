const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
} = require("@discordjs/voice");
const stationData = require('../../utils/stationData');

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const channel = interaction.member.voice.channel;

    const notinVC = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`Error`)
      .setDescription(`Please join a voice channel to use this command.`);
    if (!channel) return await interaction.reply({ embeds: [notinVC] });

    const noConnectPerm = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`Error`)
      .setDescription(`TraaaaBot does not have the \`CONNECT\` permission in this guild. Please allow an administrator to modify the permissions and try again later.`);
    if (!channel.permissionsFor(client.user).has(PermissionsBitField.Flags.Connect)) return await interaction.reply({ embeds: [noConnectPerm] });

    const noSpeakPerm = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`Error`)
      .setDescription(`TraaaaBot does not have the \`SPEAK\` permission in this guild. Please allow an administrator to modify the permissions and try again later.`);
    if (!channel.permissionsFor(client.user).has(PermissionsBitField.Flags.Speak)) return await interaction.reply({ embeds: [noSpeakPerm] });

    const stationArgument = interaction.options.getString("station").toLowerCase(); // Convert to lowercase for consistency

    if (stationArgument in stationData) {
      const { streamUrl, stationIconUrl } = stationData[stationArgument];
      
      // Code to join the voice channel, create and play audio, and send embeds goes here
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();

      const resource = createAudioResource(streamUrl, {
        inputType: 2, // Stream type
      });

      player.play(resource);

      connection.subscribe(player);

      const nowPlayingEmbed = new EmbedBuilder()
        .setColor(0x9d5cff)
        .setAuthor({
          name: "TraaaaBot Music",
          iconURL: client.user.displayAvatarURL(),
        })
        .setThumbnail(stationIconUrl)
        .setTitle(`🎵 Now Playing in ${channel.name}`)
        .setDescription(`Now listening to **${stationArgument.toUpperCase()}**.`);

      interaction.reply({ embeds: [nowPlayingEmbed] });

      player.on("error", (error) => {
        console.error("Error playing audio:", error);
        connection.destroy();
      });

      player.on("stateChange", (oldState, newState) => {
        if (newState.status === "idle") {
          connection.destroy();
        }
      });
    } else {
      const notAvailable = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`Error`)
      .setDescription(`**${stationArgument.toUpperCase()}** either does not exist or is not available on TraaaaBot yet.`);
      return interaction.reply({ embeds: [notAvailable] });
    }
  },

  name: "radio",
  description: "Play a real-world radio station by searching with the callsign.",
  options: [
    {
      name: "station",
      description: "The callsign of the station to listen to.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};
