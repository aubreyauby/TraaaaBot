const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Shows the bot\'s latency.',
  
    callback: (client, interaction) => {
        const embed = new EmbedBuilder()
        .setTitle('Latency Report')
        .setColor(0xFF69B4)
        .setDescription(`You can read a more detailed online status of TraaaaBot and other GXX: by electrasys services by clicking [here](https://status.electrasys.net).`)
        .addFields(
            { name: "Local Latency", value: `\`${Date.now() - interaction.createdTimestamp}\` ms`, inline: true },
            { name: "Discord API", value: `\`${Math.round(client.ws.ping)}\` ms`, inline: true },
        );

        interaction.reply({ embeds: [embed] });
    },
  };