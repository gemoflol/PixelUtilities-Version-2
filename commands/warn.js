const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../logger');
const db = require('../database');

module.exports = {
  name: 'warn',
  description: 'Warn a user (supports warn, warnings, clearwarns subcommands)',
  async execute(message, args, client) {
    const subcommand = args[0]?.toLowerCase();

    // !warnings @user - Check warnings for a user
    if (subcommand === 'warnings' || message.content.startsWith(`${process.env.PREFIX || '!'}warnings`)) {
      const target = message.mentions.members.first() || await message.guild.members.fetch(args[1]).catch(() => null);
      
      if (!target) {
        return message.reply('Please mention a user or provide a valid user ID to check warnings!');
      }

      const userWarnings = await db.getWarnings(message.guild.id, target.id);
      
      if (userWarnings.length === 0) {
        return message.reply(`${target.user.tag} has no warnings.`);
      }

      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`⚠️ Warnings for ${target.user.tag}`)
        .setThumbnail(target.user.displayAvatarURL())
        .setDescription(`Total warnings: **${userWarnings.length}**`)
        .setTimestamp();

      userWarnings.forEach((warn, index) => {
        const date = new Date(warn.timestamp).toLocaleString();
        embed.addFields({
          name: `Warning #${index + 1}`,
          value: `**Reason:** ${warn.reason}\n**Moderator:** ${warn.moderator_tag}\n**Date:** ${date}`,
          inline: false
        });
      });

      return message.reply({ embeds: [embed] });
    }

    // !clearwarns @user - Clear all warnings for a user
    if (subcommand === 'clearwarns' || message.content.startsWith(`${process.env.PREFIX || '!'}clearwarns`)) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('You need Administrator permission to clear warnings!');
      }

      const target = message.mentions.members.first() || await message.guild.members.fetch(args[1]).catch(() => null);
      
      if (!target) {
        return message.reply('Please mention a user or provide a valid user ID to clear warnings!');
      }

      const userWarnings = await db.getWarnings(message.guild.id, target.id);

      if (userWarnings.length === 0) {
        return message.reply(`${target.user.tag} has no warnings to clear.`);
      }

      const warningsCleared = await db.clearWarnings(message.guild.id, target.id);
      
      // Log the action
      await logger.logAction(message.guild, 'WARN_CLEAR', {
        target: target.user,
        moderator: message.author,
        warningsCleared: warningsCleared
      });
      
      return message.reply(`✅ Successfully cleared all ${warningsCleared} warning(s) for ${target.user.tag}.`);
    }

    // !warn @user [reason] - Warn a user
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('You do not have permission to warn members!');
    }

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!target) {
      return message.reply('Please mention a user or provide a valid user ID to warn!');
    }

    // Prevent warning yourself
    if (target.id === message.author.id) {
      return message.reply('You cannot warn yourself!');
    }

    // Prevent warning the bot
    if (target.id === client.user.id) {
      return message.reply('You cannot warn me!');
    }

    // Get reason
    const reason = args.slice(1).join(' ') || 'No reason provided';

    // Store warning in database
    await db.addWarning(message.guild.id, target.id, target.user.tag, message.author.tag, reason);

    // Get updated warning count
    const userWarnings = await db.getWarnings(message.guild.id, target.id);

    // Create warning embed
    const warnEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⚠️ You have been warned!')
      .setDescription(`You have been warned in **${message.guild.name}**`)
      .addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Total Warnings', value: `${userWarnings.length}`, inline: true }
      )
      .setTimestamp();

    // Try to DM the user
    try {
      await target.send({ embeds: [warnEmbed] });
    } catch (error) {
      // User has DMs disabled
      console.log(`Could not DM ${target.user.tag}`);
    }

    // Confirm in channel
    const confirmEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('⚠️ Warning Issued')
      .setDescription(`${target.user.tag} has been warned.`)
      .addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Total Warnings', value: `${userWarnings.length}`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [confirmEmbed] });
    
    // Log the action
    await logger.logAction(message.guild, 'WARN', {
      target: target.user,
      moderator: message.author,
      reason: reason,
      totalWarnings: userWarnings.length
    });
  }
};