const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Change the bot status')
    .addStringOption(option =>
      option
        .setName('activity')
        .setDescription('The activity type')
        .setRequired(true)
        .addChoices(
          { name: 'Playing', value: 'Playing' },
          { name: 'Streaming', value: 'Streaming' },
          { name: 'Listening', value: 'Listening' },
          { name: 'Watching', value: 'Watching' }
        )
    )
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('Status text')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    // Check if user is bot owner
    if (interaction.user.id !== interaction.client.ownerId) {
      return interaction.reply({ content: 'Only the bot owner can use this command.', ephemeral: true });
    }

    const activity = interaction.options.getString('activity');
    const text = interaction.options.getString('text');

    try {
      await interaction.client.user.setActivity(text, { type: activity.toUpperCase() });
      await interaction.reply({ content: `Bot status changed to: ${activity} ${text}`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Failed to change status.', ephemeral: true });
    }
  }
};