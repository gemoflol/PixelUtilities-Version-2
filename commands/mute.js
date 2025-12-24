const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../logger');
const db = require('../database');

module.exports = {
  name: 'mute',
  description: 'Timeout a user (use !mutes @user to view history)',
  async execute(message, args, client) {
    const subcommand = args[0]?.toLowerCase();

    // !mutes @user - Check mute history for a user
    if (subcommand === 'mutes' || message.content.startsWith(`${process.env.PREFIX || '!'}mutes`)) {
      const target = message.mentions.members.first() || await message.guild.members.fetch(args[1]).catch(() => null);
      
      if (!target) {
        return message.reply('Please mention a user or provide a valid user ID to check mute history!');
      }

      const userMutes = await db.getMutes(message.guild.id, target.id);
      
      if (userMutes.length === 0) {
        return message.reply(`${target.user.tag} has no mute history.`);
      }

      const embed = new EmbedBuilder()
        .setColor('#2ce37cff')
        .setTitle(`🔇 Mute History for ${target.user.tag}`)
        .setThumbnail(target.user.displayAvatarURL())
        .setDescription(`Total mutes: **${userMutes.length}**`)
        .setTimestamp();

      userMutes.forEach((mute, index) => {
        const date = new Date(mute.timestamp).toLocaleString();
        embed.addFields({
          name: `Mute #${index + 1}`,
          value: `**Duration:** ${mute.duration} minute(s)\n**Reason:** ${mute.reason}\n**Moderator:** ${mute.moderator_tag}\n**Date:** ${date}`,
          inline: false
        });
      });

      return message.reply({ embeds: [embed] });
    }

    // !mute @user [duration] [reason] - Mute a user
    // Check if user has permission to timeout members
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('You do not have permission to timeout members!');
    }

    // Check if bot has permission to timeout members
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('I do not have permission to timeout members!');
    }

    // Get the user to mute (mention or ID)
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!target) {
      return message.reply('Please mention a user or provide a valid user ID to mute!');
    }

    // Prevent muting yourself
    if (target.id === message.author.id) {
      return message.reply('You cannot mute yourself!');
    }

    // Prevent muting the bot
    if (target.id === client.user.id) {
      return message.reply('I cannot mute myself!');
    }

    // Check if target is moderatable (role hierarchy)
    if (!target.moderatable) {
      return message.reply('I cannot mute this user! They may have a higher role than me.');
    }

    // Get duration in minutes (default 10 minutes)
    const duration = parseInt(args[1]) || 10;

    // Discord timeout limit is 28 days (40320 minutes)
    if (duration > 40320) {
      return message.reply('Timeout duration cannot exceed 28 days (40320 minutes)!');
    }

    if (duration < 1) {
      return message.reply('Timeout duration must be at least 1 minute!');
    }

    // Get reason (everything after user and duration)
    const reason = args.slice(2).join(' ') || 'No reason provided';

    try {
      // Mute the user
      await target.timeout(duration * 60 * 1000, reason); // Convert minutes to milliseconds
      
      // Save to database
      await db.addMute(message.guild.id, target.id, target.user.tag, message.author.tag, duration, reason);
      
      await message.reply(`✅ Successfully muted ${target.user.tag} for ${duration} minute(s). Reason: ${reason}`);
      
      // Log the action
      await logger.logAction(message.guild, 'MUTE', {
        target: target.user,
        moderator: message.author,
        duration: duration,
        reason: reason
      });
    } catch (error) {
      console.error(error);
      await message.reply('Failed to mute the user. Please try again.');
    }
  }
};