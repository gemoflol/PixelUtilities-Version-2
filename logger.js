const { EmbedBuilder } = require('discord.js');
const db = require('./database');

module.exports = {
  // Set the log channel for a guild
  async setLogChannel(guildId, channelId) {
    try {
      await db.setLogChannel(guildId, channelId);
      return true;
    } catch (error) {
      console.error('Error setting log channel:', error);
      return false;
    }
  },

  // Get the log channel for a guild
  async getLogChannel(guildId) {
    try {
      return await db.getLogChannel(guildId);
    } catch (error) {
      console.error('Error getting log channel:', error);
      return null;
    }
  },

  // Remove log channel
  async removeLogChannel(guildId) {
    try {
      await db.removeLogChannel(guildId);
      return true;
    } catch (error) {
      console.error('Error removing log channel:', error);
      return false;
    }
  },

  // Log a moderation action
  async logAction(guild, action, data) {
    try {
      const logChannelId = await db.getLogChannel(guild.id);
      
      if (!logChannelId) return; // No log channel set

      const logChannel = guild.channels.cache.get(logChannelId);
      
      if (!logChannel) {
        await db.removeLogChannel(guild.id); // Channel no longer exists
        return;
      }

      let embed;

      switch (action) {
        case 'BAN':
          embed = new EmbedBuilder()
            .setColor('#d31111ff')
            .setTitle('🔨 Member Banned')
            .setThumbnail(data.target.displayAvatarURL())
            .addFields(
              { name: 'User', value: `${data.target.tag} (${data.target.id})`, inline: true },
              { name: 'Moderator', value: `${data.moderator.tag}`, inline: true },
              { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `User ID: ${data.target.id}` });
          break;

        case 'MUTE':
          embed = new EmbedBuilder()
            .setColor('#2ce37cff')
            .setTitle('🔇 Member Muted')
            .setThumbnail(data.target.displayAvatarURL())
            .addFields(
              { name: 'User', value: `${data.target.tag} (${data.target.id})`, inline: true },
              { name: 'Moderator', value: `${data.moderator.tag}`, inline: true },
              { name: 'Duration', value: `${data.duration} minute(s)`, inline: true },
              { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `User ID: ${data.target.id}` });
          break;

        case 'WARN':
          embed = new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle('⚠️ Member Warned')
            .setThumbnail(data.target.displayAvatarURL())
            .addFields(
              { name: 'User', value: `${data.target.tag} (${data.target.id})`, inline: true },
              { name: 'Moderator', value: `${data.moderator.tag}`, inline: true },
              { name: 'Total Warnings', value: `${data.totalWarnings}`, inline: true },
              { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `User ID: ${data.target.id}` });
          break;

        case 'WARN_CLEAR':
          embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Warnings Cleared')
            .setThumbnail(data.target.displayAvatarURL())
            .addFields(
              { name: 'User', value: `${data.target.tag} (${data.target.id})`, inline: true },
              { name: 'Moderator', value: `${data.moderator.tag}`, inline: true },
              { name: 'Warnings Cleared', value: `${data.warningsCleared}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `User ID: ${data.target.id}` });
          break;

        default:
          return;
      }

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send log message:', error);
    }
  }
};