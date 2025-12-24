const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'modlogs',
  description: 'View recent moderation actions (bans, mutes, warnings)',
  async execute(message, args, client) {
    // Check if user has permission to view mod logs
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('You need Moderate Members permission to view moderation logs!');
    }

    const type = args[0]?.toLowerCase() || 'all';
    const limit = parseInt(args[1]) || 10;

    if (limit < 1 || limit > 25) {
      return message.reply('Limit must be between 1 and 25!');
    }

    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle(`📋 Moderation Logs`)
      .setTimestamp();

    try {
      if (type === 'bans' || type === 'all') {
        const bans = await db.getAllBans(message.guild.id, limit);
        
        if (bans.length > 0) {
          let banText = '';
          bans.slice(0, 5).forEach((ban, index) => {
            const date = new Date(ban.timestamp).toLocaleDateString();
            banText += `\`${index + 1}.\` **${ban.user_tag}** - ${ban.reason}\n*By ${ban.moderator_tag} on ${date}*\n\n`;
          });
          embed.addFields({ name: `🔨 Recent Bans (${bans.length})`, value: banText || 'None', inline: false });
        }
      }

      if (type === 'mutes' || type === 'all') {
        const mutes = await db.getAllMutes(message.guild.id, limit);
        
        if (mutes.length > 0) {
          let muteText = '';
          mutes.slice(0, 5).forEach((mute, index) => {
            const date = new Date(mute.timestamp).toLocaleDateString();
            muteText += `\`${index + 1}.\` **${mute.user_tag}** (${mute.duration}m) - ${mute.reason}\n*By ${mute.moderator_tag} on ${date}*\n\n`;
          });
          embed.addFields({ name: `🔇 Recent Mutes (${mutes.length})`, value: muteText || 'None', inline: false });
        }
      }

      if (type === 'warns' || type === 'warnings' || type === 'all') {
        const warnings = await db.getAllWarnings(message.guild.id, limit);
        
        if (warnings.length > 0) {
          let warnText = '';
          warnings.slice(0, 5).forEach((warn, index) => {
            const date = new Date(warn.timestamp).toLocaleDateString();
            // Fetch user tag if available
            const userTag = warn.user_tag || `User ID: ${warn.user_id}`;
            warnText += `\`${index + 1}.\` **${userTag}** - ${warn.reason}\n*By ${warn.moderator_tag} on ${date}*\n\n`;
          });
          embed.addFields({ name: `⚠️ Recent Warnings (${warnings.length})`, value: warnText || 'None', inline: false });
        }
      }

      if (embed.data.fields?.length === 0) {
        embed.setDescription('No moderation actions found.');
      } else {
        embed.setDescription(`Showing recent moderation actions for this server.\n\nUsage: \`!modlogs [bans|mutes|warns|all] [limit]\``);
      }

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching mod logs:', error);
      await message.reply('Failed to retrieve moderation logs.');
    }
  }
};