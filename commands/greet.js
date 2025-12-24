const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('greet')
    .setDescription('Greets a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to greet')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    await interaction.reply(`Hello ${user.username}! 👋`);
  }
};