const { Client, Interaction, ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
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
        if (!interaction.inGuild()) {
            interaction.reply("You can only run this command in the server!");
            return;
        }

        await interaction.deferReply();

        const mentionedUserId = interaction.options.get('target-user')?.value;
        const targetUserId = mentionedUserId || interaction.member.id;
        const targetUserObj = await interaction.guild.members.fetch(targetUserId);
        const isBot = targetUserObj.user.bot;

        const fetchedLevel = await Level.findOne({
            guildId: interaction.guild.id,
            userId: targetUserId
        });

        if (!fetchedLevel) {
            if (isBot) {
                interaction.editReply(`❌ ${targetUserObj.user.displayName} is a bot!`);
                return;
            } else {
                interaction.editReply(
                    mentionedUserId ? `❌ ${targetUserObj.user.tag} does not appear to be in a level.` : `❌ You are not in a level. To earn XP and level up, interact with other members throughout the server.`
                );
                return;
            }
        }

        let allLevels = await Level.find({guildId: interaction.guild.id}).select('-_id userId level xp');

        allLevels.sort((a, b) => {
            if (a.level === b.level) {
                return b.xp - a.xp;
            } else {
                return b.level - a.level;
            }
        });

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
        interaction.editReply({ files: [attachment] });
    },

    name: 'rank',
    description: "Shows the current rank of a member.",
    options: [
        {
            name: 'user',
            description: 'The user to check the current rank of.',
            type: ApplicationCommandOptionType.Mentionable,
        }
    ]
}