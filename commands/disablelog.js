const { PermissionFlagsBits } = require('discord.js');
const logger = require('../logger');

module.exports = {
  name: 'disablelog',
  description: 'Disable moderation logging',
  async execute(message, args, client) {
    // Check if user has administrator permission
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('You need Administrator permission to disable logging!');
    }

    // Check if logging is enabled
    const logChannel = logger.getLogChannel(message.guild.id);
    
    if (!logChannel) {
      return message.reply('❌ Logging is not enabled in this server!');
    }

    // Remove the log channel
    logger.removeLogChannel(message.guild.id);

    await message.reply('✅ Moderation logging has been disabled!');
  }
}