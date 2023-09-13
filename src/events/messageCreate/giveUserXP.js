const { Client, Message } = require('discord.js');
const Level = require('../../models/level');
const calculateLevelXp = require('../../utils/calculateLevelXP');
const cooldowns = new Set();

function getRandomXP(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 */
module.exports = async (client, message) => {
    if (!message.inGuild() || message.author.bot || cooldowns.has(message.author.id)) return;

    const xpToGive = getRandomXP(5, 15);

    const query = {
        userId: message.author.id,
        guildId: message.guild.id,
    };

    try {
        const level = await Level.findOne(query);
        if (level) {
            level.xp += xpToGive;
            if (level.xp > calculateLevelXp(level.level)) {
                level.xp = 0;
                level.level += 1;

                // message.channel.send(`${message.author.username} is now in level **${level.level}**!`);
            }

            await level.save().catch((e) => {
                console.log(`\x1b[1;31mERROR \x1b[0mFailed to save level: ${e}`);
                return;
            })
            cooldowns.add(message.author.id);
            setTimeout(() => { cooldowns.delete(message.author.id) }, 60000);
        }
        else {
            const newLevel = new Level({
                userId: message.author.id,
                guildId: message.guild.id,
                xp: xpToGive,
                level: 1,
            });

            await newLevel.save().catch((e) => {
                console.log(`\x1b[1;31mERROR \x1b[0mFailed to save level: ${e}`);
                return;
            })
            cooldowns.add(message.author.id);
            setTimeout(() => { cooldowns.delete(message.author.id) }, 60000);
        }
    } catch (error) {
        console.log(`\x1b[1;31mERROR \x1b[0mFailed to give XP to user: ${error}`);
    }
}