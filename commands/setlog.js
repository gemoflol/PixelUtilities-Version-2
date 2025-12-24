const { PermissionFlagsBits, ChannelType } = require('discord.js');
const logger = require('../logger');

module.exports = {
  name: 'setlog',
  description: 'Set the moderation log channel',
  async execute(message, args, client) {
    // Check if user has administrator permission
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('You need Administrator permission to set the log channel!');
    }

    // Get the channel (mention or ID)
    const channel = message.mentions.channels.first() || 
                    message.guild.channels.cache.get(args[0]) ||
                    message.channel;

    // Make sure it's a text channel
    if (channel.type !== ChannelType.GuildText) {
      return message.reply('Please specify a valid text channel!');
    }

    // Check if bot can send messages in that channel
    if (!channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
      return message.reply('I do not have permission to send messages in that channel!');
    }

    // Set the log channel
    logger.setLogChannel(message.guild.id, channel.id);

    await message.reply(`✅ Moderation log channel has been set to ${channel}!`);
    
    // Send a test message to the log channel
    await channel.send('✅ This channel is now set as the moderation log channel. All moderation actions will be logged here.');
  }
}