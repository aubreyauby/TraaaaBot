const { EmbedBuilder } = require("discord.js");

module.exports = {
  /**
   *
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

    // Check if the queue exists for this guild
    const queue = client.queue.get(interaction.guild.id);
    var status;
    var np;
    var count = 0;
    if (!queue) status = "Nothing is playing right now. Use \`/play (name or YouTube URL)\` to play something in the current voice channel.";
    else
      status = queue.queue
        .map((x) => {
          count += 1;
          const requestedBy = x.requested ? `<@${x.requested.id}>` : "Unknown User";
          return (
            "**" +
            count +
            "." +
            "** " +
            x.name +
            " - Requested by " +
            requestedBy
          );
        })
        .join("\n");
    if (!queue) np = status;
    else np = queue.queue[0] ? queue.queue[0].name : "No song playing";
    if (queue) thumbnail = queue.queue[0] ? queue.queue[0].thumbnail : interaction.guild.iconURL();
    else thumbnail = interaction.guild.iconURL();

    const embed = new EmbedBuilder()
    .setAuthor({ name: 'TraaaaBot Music', iconURL: client.user.displayAvatarURL() })
    .setThumbnail(thumbnail)
    .setColor(0x32CD32)
    .addFields({ name: 'Now Playing', value: np, inline: true })
    .setDescription(status)
    interaction.channel.send({ embeds: [embed] });
  },

  name: "queue",
  description: "Displays the music queue in a voice channel.",
};
