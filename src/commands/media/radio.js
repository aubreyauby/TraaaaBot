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
const stringSimilarity = require('string-similarity');

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const channel = interaction.member.voice.channel;
    const userId = interaction.user.id;
    const stationArgument = interaction.options.getString("station")?.toLowerCase();

    const notinVC = new EmbedBuilder().setColor(0xff0000).setTitle(`Error`)
      .setDescription(`:x: Please join a voice channel to use this command.`);
    if (!channel) return await interaction.reply({ embeds: [notinVC], ephemeral: true });

    const noConnectPerm = new EmbedBuilder().setColor(0xff0000).setTitle(`Error`)
      .setDescription(`:x: TraaaaBot does not have the \`CONNECT\` permission in this guild. Please allow an administrator to modify the permissions and try again later.`);
    if (!channel.permissionsFor(client.user).has(PermissionsBitField.Flags.Connect)) return await interaction.reply({ embeds: [noConnectPerm], ephemeral: true });

    const noSpeakPerm = new EmbedBuilder().setColor(0xff0000).setTitle(`Error`)
      .setDescription(`:x: TraaaaBot does not have the \`SPEAK\` permission in this guild. Please allow an administrator to modify the permissions and try again later.`);
    if (!channel.permissionsFor(client.user).has(PermissionsBitField.Flags.Speak)) return await interaction.reply({ embeds: [noSpeakPerm], ephemeral: true });

    const invalidStationLengthEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
      .setDescription(`:x: The station callsign must be 3-4 letters long.\n\n Examples: \`wcrb\` or \`wbz\``);
    if (stationArgument.length < 3 || stationArgument.length > 4) return await interaction.reply({ embeds: [invalidStationLengthEmbed], ephemeral: true });

    if (stationArgument === 'list') {
      const stationList = Object.keys(stationData)
        .sort()
        .map(stationName => `\`${stationName}\``);

      const stationListEmbed = new EmbedBuilder()
        .setColor(0x9d5cff)
        .setAuthor({ name: "TraaaaBot Music", iconURL: client.user.displayAvatarURL() })
        .setTitle("List of Radio Stations on TraaaaBot")
        .setDescription(`TraaaaBot has the following radio stations available:\n\n${stationList.join(', ')}`)

      return interaction.reply({ embeds: [stationListEmbed] });
    }

    if (stationArgument in stationData) {
      const stationName = stationArgument.toUpperCase();
      const { streamUrl, stationIconUrl, countryCode, ownerName } = stationData[stationArgument];
      
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
    
      const queue = client.queue.get(interaction.guild.id) || {
        queue: [],
        isRadio: false,
        radioStationName: "", 
        requested: userId,
      };
      
      queue.queue.push({ name: stationName, thumbnail: stationIconUrl });
      
      client.queue.set(interaction.guild.id, queue);
    
      const player = createAudioPlayer();
    
      const resource = createAudioResource(streamUrl, { inputType: 2 });
    
      player.play(resource);
    
      connection.subscribe(player);
    
      const nowPlayingEmbed = new EmbedBuilder()
        .setColor(0x9d5cff)
        .setAuthor({name: "TraaaaBot Music", iconURL: client.user.displayAvatarURL()})
        .setThumbnail(stationIconUrl)
        .setTitle(`Now playing in <#${channel.id}>: ${stationName}`)
        .addFields(
          { name: 'Requested By', value: `<@${interaction.user.id}>`, inline: false },
          { name: 'Station Owner', value: ownerName, inline: true }
        );
        
        if (countryCode === 'US') {nowPlayingEmbed.addFields({ name: 'Country', value: `🇺🇸 \`US\``, inline: true});} 
        else if (countryCode === 'CA') {nowPlayingEmbed.addFields({ name: 'Country', value: `🇨🇦 \`CA\``, inline: true});}
        interaction.reply({ embeds: [nowPlayingEmbed] });
    
      player.on("error", (error) => {
          const nowPlayingEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setAuthor({ name: "TraaaaBot Music", iconURL: client.user.displayAvatarURL() })
          .setDescription(`Now listening to **${stationName}**.\n\n:x: Could not connect to the stream. Try again later.`)
          .setThumbnail(stationIconUrl)
          .setTitle(`🎵 Now playing in ${channel.name}`)
          .addFields(
            { name: 'Requested By', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Station Owner', value: ownerName, inline: true }
          );

          if (countryCode === 'US') { nowPlayingEmbed.addFields({name: 'Country', value: `🇺🇸 \`US\``, inline: false});} 
          else if (countryCode === 'CA') {nowPlayingEmbed.addFields({name: 'Country', value: `🇨🇦 \`CA\``, inline: false});}
      
          interaction.editReply({embeds: [nowPlayingEmbed]});
          console.log(`Stream for ${stationName} dropped prematurely: ${error}`)

          connection.destroy();
      });
    
      player.on("stateChange", (oldState, newState) => {
        if (newState.status === "idle") {
          const nowPlayingEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setAuthor({ name: "TraaaaBot Music", iconURL: client.user.displayAvatarURL() })
          .setDescription(`Now listening to **${stationName}**.\n\n:x: Stream connection unsuccessful. Try again later.`)
          .setThumbnail(stationIconUrl)
          .setTitle(`🎵 Now playing in ${channel.name}`)
          .addFields(
            { name: 'Requested By', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Owner', value: ownerName, inline: true }
          );

          if (countryCode === 'US') { nowPlayingEmbed.addFields({name: 'Country', value: `🇺🇸 \`US\``, inline: true});} 
          else if (countryCode === 'CA') {nowPlayingEmbed.addFields({name: 'Country', value: `🇨🇦 \`CA\``, inline: true});}
      
          interaction.editReply({embeds: [nowPlayingEmbed]});

          connection.destroy();
        }
      });
    } else {
      function findNearMatchingStations(stationArgument, stationDataArray, thresholdScore) {
        const matches = [];
        for (const station of stationDataArray) {
          const score = stringSimilarity.compareTwoStrings(stationArgument.toLowerCase(), station.stationName.toLowerCase());
          if (score >= thresholdScore) {
            matches.push(station.stationName);
          }
        }
        return matches;
      }
      
      const stationDataArray = Object.keys(stationData).map(key => ({stationName: key, ...stationData[key] }));
      
      const thresholdScore = 0.6;
      
      const similarStations = findNearMatchingStations(stationArgument, stationDataArray, thresholdScore);
      
      const notAvailable = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(`Error`)
        .setDescription(`:x: **${stationArgument.toUpperCase()}** either does not exist or is not available on TraaaaBot yet.`);
      
      if (similarStations.length > 0) {
        const formattedMatches = similarStations.map(station => `\`${station}\``).join(', ');
        notAvailable.addFields({ name: 'Did you mean one of these?', value: formattedMatches });
      }
      
      return interaction.reply({ embeds: [notAvailable], ephemeral: true });
    }
  },

  name: "radio",
  description: "Play a real-world radio station by searching with the callsign.",
  options: [
    {
      name: "station",
      description: "The callsign of the station to listen to. Type list for the list of stations.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};
