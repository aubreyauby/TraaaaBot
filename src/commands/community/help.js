const { 
    Client, 
    Interaction, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ActionRowBuilder, 
    EmbedBuilder,
    ComponentType,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const commandDirectory = path.join(__dirname, '..');
        const communityCommands = [];

        const readCommandsFromDirectory = (category, dir) => {
            fs.readdirSync(dir).forEach(file => {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (stats.isDirectory()) {
                    readCommandsFromDirectory(category, filePath);
                } else if (stats.isFile() && file.endsWith('.js')) {
                    const command = require(filePath);
                    if (command.name && command.description) {
                        communityCommands.push({
                            category,
                            name: command.name,
                            description: command.description
                        });
                    }
                }
            });
        };

        const formatString = (str) => `${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`;

        fs.readdirSync(commandDirectory).forEach(category => {
            const categoryPath = path.join(commandDirectory, category);
            const stats = fs.statSync(categoryPath);

            if (stats.isDirectory()) {
                readCommandsFromDirectory(category, categoryPath);
            }
        });

        const welcomeEmbed = new EmbedBuilder()
        .setTitle('Welcome to TraaaaBot!')
        .setAuthor({ name: 'TraaaaBot', iconURL: client.user.displayAvatarURL() })
        .setDescription(`Please select a category from the dropdown menu below to see the list of commands. 
        
        Alternatively, if you want to see all the commands in one page, click [here](https://www.google.com/) to view the full documentation.
        
        Are you looking for the dashboard? Click [here](https://www.google.com/) to login and access the dashboard.
        
        All commands work with either the set prefix or Discord's slash commands.`)
        .setColor(0x3498db);

        const selectOptions = [
            { label: 'Community', description: 'General commands available to all members of the server.', value: 'community', emoji: '👥' || null },
            { label: 'Economy', description: 'Economic features like ranks and TraaaaBot coins.', value: 'economy', emoji: '💰' || null },
            { label: 'Moderation', description: 'Commands ideal for server moderation.', value: 'moderation', emoji: '🛠️' || null },
            { label: 'Utilities', description: 'Server and bot management commands.', value: 'utilities', emoji: '⚙️' || null }
        ];

        const components = (state) => [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId("help-menu")
                .setPlaceholder("Select a category")
                .setDisabled(state)
                .addOptions(selectOptions.map(option => 
                    new StringSelectMenuOptionBuilder()
                        .setLabel(option.label)
                        .setDescription(option.description)
                        .setValue(option.value)
                        .setEmoji(option.emoji)
                ))
            ),
        ];

        const initialMessage = await interaction.reply({
            embeds: [welcomeEmbed],
            components: components(false),
            ephemeral: true
        });

        const filter = (interaction) => interaction.user.id === interaction.user.id;

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: ComponentType.SelectMenu,
        });

        collector.on('collect', async (interaction) => {
            const [directory] = interaction.values;
            const categoryCommands = communityCommands.filter(cmd => cmd.category === directory);

            const categoryEmbed = new EmbedBuilder()
                .setTitle(`${formatString(directory)}`).setColor(0x3498db)
                .setAuthor({ name: 'TraaaaBot', iconURL: client.user.displayAvatarURL() })
                .setDescription(`A list of all the commands categorized under ${directory}:`)
                .addFields(
                    categoryCommands.map((cmd) => {
                        return {
                            name: `\`${cmd.name}\``,
                            value: cmd.description || 'No description provided.',
                            inline: true,
                        };
                    })
                );

            interaction.update({embeds: [categoryEmbed], ephemeral: true});
        });

        collector.on("end", () => {
            initialMessage.edit({ components: components(true) });
        });
    },
    name: 'help',
    description: "Shows the list of commands from TraaaaBot."
}