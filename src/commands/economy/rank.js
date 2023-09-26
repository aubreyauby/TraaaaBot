const { 
    Client, 
    Interaction, 
    ApplicationCommandOptionType, 
    AttachmentBuilder,
    EmbedBuilder,
 } = require('discord.js');
const canvacord = require('canvacord');
const calculateLevelXp = require('../../utils/calculateLevelXP');
const Level = require('../../models/level');

module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const mentionedUserId = interaction.options.get('member')?.value;
        const targetUserId = mentionedUserId || interaction.member.id;
        const targetUserObj = await interaction.guild.members.fetch(targetUserId);
        const isBot = targetUserObj.user.bot;
        const fetchedLevel = await Level.findOne({guildId: interaction.guild.id, userId: targetUserId});

        if (!fetchedLevel) {
            if (isBot) {
                const botStrikeEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
                .setDescription(`:x: <@${targetUserObj.user.id}> is a bot.`)
                .setThumbnail(targetUserObj.user.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 }));
                return await interaction.reply({ embeds: [botStrikeEmbed], ephemeral: true });
            } else {
                const notRankedEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Error`)
                .setDescription(mentionedUserId ? `❌ ${targetUserObj.user.tag} is currently not ranked.` : `❌ You are not in a level. To earn XP and level up, interact with other members throughout the server.`)
                .setThumbnail(target.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 }));
                return await interaction.reply({ embeds: [notRankedEmbed], ephemeral: true });
            }
        }

        let allLevels = await Level.find({guildId: interaction.guild.id}).select('-_id userId level xp');

        allLevels.sort((a, b) => { if (a.level === b.level) { return b.xp - a.xp; } else { return b.level - a.level; } });

        let currentRank = allLevels.findIndex((lvl) => lvl.userId === targetUserId) + 1;

        const rank = new canvacord.Rank()
        .setAvatar(targetUserObj.user.displayAvatarURL({ size: 256 }))
        .setRank(currentRank)
        .setLevel(fetchedLevel.level)
        .setCurrentXP(fetchedLevel.xp)
        .setRequiredXP(calculateLevelXp(fetchedLevel.level))
        .setProgressBar('#FFC300', 'COLOR')
        .setUsername(targetUserObj.user.username)
  
        const data = await rank.build();
        const attachment = new AttachmentBuilder(data);
        interaction.reply({ files: [attachment] });
    },

    name: 'rank',
    description: "Shows the current rank of a member.",
    options: [
        {
            name: 'member',
            description: 'The member to check the rank of.',
            type: ApplicationCommandOptionType.Mentionable,
        }
    ]
}