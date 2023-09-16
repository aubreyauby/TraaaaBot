const {
  Client,
  Interaction,
  EmbedBuilder,
  ApplicationCommandOptionType,
  PermissionsBitField,
} = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const ytdl = require("discord-ytdl-core");
const youtubeScraper = require("yt-search");
const yt = require("ytdl-core");
const forHumans = require("../../utils/forhumans.js");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const error = (err) => interaction.channel.send(err);
    const send = (content) => interaction.channel.send(content);
    const setqueue = (id, obj) => client.queue.set(id, obj);
    const deletequeue = (id) => client.queue.delete(id);
    var song;

    const channel = interaction.member.voice.channel;

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    const notinVC = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`Error`)
      .setDescription(`Please join a voice channel to use this command.`);
    if (!channel) return await interaction.reply({ embeds: [notinVC] });

    const noConnectPerm = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`Error`)
      .setDescription(
        `TraaaaBot does not have the \`CONNECT\` permission in this guild. Please allow an administrator modify the permissions and try again later.`
      );
    if (
      !channel
        .permissionsFor(client.user)
        .has(PermissionsBitField.Flags.Connect)
    )
      return await interaction.reply({ embeds: [noConnectPerm] });

    const noSpeakPerm = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`Error`)
      .setDescription(
        `TraaaaBot does not have the \`SPEAK\` permission in this guild. Please allow an administrator modify the permissions and try again later.`
      );
    if (
      !channel.permissionsFor(client.user).has(PermissionsBitField.Flags.Speak)
    )
      return await interaction.reply({ embeds: [noSpeakPerm] });

    const content = interaction.options.getString("content");

    if (!content) return error("You didn't provide a song name to play!");

    if (content.includes("www.youtube.com")) {
      try {
        const ytdata = await yt.getBasicInfo(content);
        if (!ytdata || !ytdata.videoDetails) {
          return error("No song found for the URL provided");
        }
        song = {
          name: ytdata.videoDetails.title || "Unknown Title",
          thumbnail:
            ytdata.player_response.videoDetails.thumbnail.thumbnails[0]?.url ||
            "https://example.com/default-thumbnail.jpg",
          requested: interaction.user.id, // Use user ID instead of tag
          videoId: ytdata.videoDetails.videoId || "N/A",
          duration: forHumans(ytdata.videoDetails.lengthSeconds),
          url: ytdata.videoDetails.video_url || "N/A",
          views: ytdata.videoDetails.viewCount || "N/A",
        };
      } catch (e) {
        console.log(e);
        return error("An error occurred, please check the console");
      }
    } else {
      try {
        const fetched = await (await youtubeScraper(content)).videos;
        if (fetched.length === 0 || !fetched)
          return error("I couldn't find the song you requested!");
        const data = fetched[0];
        song = {
          name: data.title || "Unknown Title",
          thumbnail: data.image || "https://example.com/default-thumbnail.jpg",
          requested: interaction.user.id, // Use user ID instead of tag
          videoId: data.videoId || "N/A",
          duration: data.duration?.toString() || "N/A",
          url: data.url || "N/A",
          views: data.views || "N/A",
        };
      } catch (err) {
        console.log(err);
        return error("An error occurred, please check the console");
      }
    }

    console.log("Guild ID:", interaction.guild.id);
    var list = interaction.client.queue.get(interaction.guild.id);

    if (list) {
      list.queue.push(song);
      return send(
        new EmbedBuilder()
          .setAuthor(
            "The song has been added to the queue",
            "https://img.icons8.com/color/2x/cd--v3.gif"
          )
          .setColor("F93CCA")
          .setThumbnail(song.thumbnail)
          .addField("Song Name", song.name, false)
          .addField("Views", song.views, false)
          .addField("Duration", song.duration, false)
          .addField("Requested By", `<@${song.requested}>`, false) // Format as <@userID>
          .setFooter("Positioned " + list.queue.length + " In the queue")
      );
    }

    const structure = {
      channel: interaction.channel,
      vc: channel,
      volume: 85,
      playing: true,
      queue: [],
      connection: null,
    };

    setqueue(interaction.guild.id, structure);

    try {
      // Create an audio player and audio resource
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });

      // Subscribe the player to the connection
      connection.subscribe(player);

      structure.connection = connection;
      structure.queue.push(song);
      play(structure.queue[0], player);
    } catch (e) {
      console.log(e);
      deletequeue(interaction.guild.id);
      return error(
        "I couldn't join the voice channel, please check the console"
      );
    }

    async function play(track, player) {
      try {
        const data = client.queue.get(interaction.guild.id);
        if (!track) {
          data.channel.send("Queue is empty, leaving voice channel");
          player.stop();
          connection.destroy();
          return deletequeue(interaction.guild.id);
        }

        const source = ytdl(track.url, {
          filter: "audioonly",
          quality: "highestaudio",
          highWaterMark: 1 << 25,
          opusEncoded: true,
        });

        // Create an audio resource with volume control
        const resource = createAudioResource(source, {
          inlineVolume: true,
        });

        // Set the volume (0.5 represents 50% volume)
        resource.volume.setVolume(data.volume / 200);

        // Play the audio resource
        player.play(resource);

        player.on("stateChange", (oldState, newState) => {
          if (newState.status === "idle") {
            var removed = data.queue.shift();
            if (data.loop == true) {
              data.queue.push(removed);
            }
            play(data.queue[0], player);
          }
        });

        const durationText = track.duration ? track.duration : "Live Stream";

        const nowPlayingEmbed = new EmbedBuilder()
          .setAuthor({
            name: "TraaaaBot Music",
            iconURL: client.user.displayAvatarURL(),
          })
          .setImage(track.thumbnail)
          .setTitle(`🎵 Now Playing in ${channel.name}`)
          .setColor(0x9d5cff)
          .addFields(
            { name: "Name", value: track.name, inline: false },
            { name: "Duration", value: durationText, inline: false },
            {
              name: "Requested By",
              value: `<@${track.requested}>`,
              inline: false,
            }
          );

        data.channel.send({ embeds: [nowPlayingEmbed] });
      } catch (e) {
        console.error(e);
      }
    }
  },

  name: "play",
  description: "Plays something in a voice channel.",
  options: [
    {
      name: "content",
      description: "Search for something by URL or name (YouTube search).",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};
