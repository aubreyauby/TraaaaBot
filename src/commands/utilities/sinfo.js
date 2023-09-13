const {
    EmbedBuilder
} = require('discord.js');
const number = require('easy-number-formatter');

module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        let owner = await interaction.guild.fetchOwner()

        const icon = interaction.guild.iconURL({ dynamic: true, size: 4096 });

        const localeToRegion = {
            "en-US": '🇺🇸 \`en-US\`',
            "de": '🇩🇪 \`de\`',
            "da": '🇩🇰 \`da\`',
            "es-ES": '🇪🇸 \`es-ES\`',
            "fr": '🇫🇷 \`fr\`',
            "hr": '🇭🇷 \`hr\`',
            "it": '🇮🇹 \`it\`',
            "lt": '🇱🇹 \`lt\`',
            "hu": '🇭🇺 \`hu\`',
            "nl": '🇳🇱 \`nl\`',
            "no": '🇳🇴 \`no\`',
            "pl": '🇵🇱 \`pl\`',
            "pt-BR": '🇧🇷 \`pt-BR\`',
            "ro": '🇷🇴 \`ro\`',
            "fi": '🇫🇮 \`fi\`',
            "sv-SE": '🇸🇪 \`sv-SE\`',
            "vi": '🇻🇳 \`vi\`',
            "tr": '🇹🇷 \`tr\`',
            "cs": '🇨🇿 \`cs\`',
            "el": '🇬🇷 \`el\`',
            "bg": '🇧🇬 \`bg\`',
            "ru": '🇷🇺 \`ru\`',
            "uk": '🇺🇦 \`uk\`',
            "hi": '🇮🇳 \`hi\`',
            "th": '🇹🇭 \`th\`',
            "zh-CN": '🇨🇳 \`zh-CN\`',
            "ja": '🇯🇵 \`ja\`',
            "zh-TW": '🇹🇼 \`zh-TW\`',
            "ko": '🇰🇷 \`ko\`',
        };

        const preferredLocale = interaction.guild.preferredLocale;
        const region = localeToRegion[preferredLocale];

        const members = interaction.guild.members.cache;

        const botCount = members.filter(member => member.user.bot).size;
        const userCount = members.filter(member => !member.user.bot).size;
        const totalMemberCount = interaction.guild.memberCount;

        const roles = interaction.guild.roles.cache.filter(role => role.name !== '@everyone' && role.name !== '@here');
        const roleMentions = roles.map(role => `<@&${role.id}>`).join(' ');

        const embed = new EmbedBuilder().setColor('#b434eb')
        .setAuthor({name: interaction.guild.name, iconURL: icon}).setThumbnail(icon)
        .addFields(
            { name: "Owner", value: `${owner}`, inline: true },
            { name: "Created", value: `<t:${parseInt(interaction.guild.createdAt / 1000)}:F>`, inline: true },
            { name: "ID", value: `${interaction.guild.id}`, inline: true },
            { name: "Humans", value: `${number.formatNumber(userCount)}`, inline: true },
            { name: "Bots", value: `${number.formatNumber(botCount)}`, inline: true },
            { name: "Total Members", value: `${number.formatNumber(totalMemberCount)}`, inline: true },
            { name: "Roles", value: roleMentions || "No roles available", inline: false },
            { name: "Server Primary Language", value: `${region || preferredLocale}` }
        );

        await interaction.reply({embeds: [embed], ephemeral: true});
    },
    name: 'sinfo',
    description: "Gets information about the server."
}