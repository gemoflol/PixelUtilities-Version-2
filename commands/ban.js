const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../logger');
const db = require('../database');

module.exports = {
  name: 'ban',
  description: 'Ban a user from the server (use !bans @user to view history)',
  async execute(message, args, client) {
    const subcommand = args[0]?.toLowerCase();

    // !bans @user - Check ban history for a user
    if (subcommand === 'bans' || message.content.startsWith(`${process.env.PREFIX || '!'}bans`)) {
      const target = message.mentions.members.first() || await message.guild.members.fetch(args[1]).catch(() => null);
      
      if (!target) {
        return message.reply('Please mention a user or provide a valid user ID to check ban history!');
      }

      const userBans = await db.getBans(message.guild.id, target.id);
      
      if (userBans.length === 0) {
        return message.reply(`${target.user.tag} has no ban history.`);
      }

      const embed = new EmbedBuilder()
        .setColor('#d31111ff')
        .setTitle(`🔨 Ban History for ${target.user.tag}`)
        .setThumbnail(target.user.displayAvatarURL())
        .setDescription(`Total bans: **${userBans.length}**`)
        .setTimestamp();

      userBans.forEach((ban, index) => {
        const date = new Date(ban.timestamp).toLocaleString();
        embed.addFields({
          name: `Ban #${index + 1}`,
          value: `**Reason:** ${ban.reason}\n**Moderator:** ${ban.moderator_tag}\n**Date:** ${date}`,
          inline: false
        });
      });

      return message.reply({ embeds: [embed] });
    }

    // !ban @user [reason] - Ban a user
    // Check if user has permission to ban members
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('You do not have permission to ban members!');
    }

    // Check if bot has permission to ban members
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('I do not have permission to ban members!');
    }

    // Get the user to ban (mention or ID)
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!target) {
      return message.reply('Please mention a user or provide a valid user ID to ban!');
    }

    // Prevent banning yourself
    if (target.id === message.author.id) {
      return message.reply('You cannot ban yourself!');
    }

    // Prevent banning the bot
    if (target.id === client.user.id) {
      return message.reply('I cannot ban myself!');
    }

    // Check if target is bannable (role hierarchy)
    if (!target.bannable) {
      return message.reply('I cannot ban this user! They may have a higher role than me.');
    }

    // Get reason (everything after the user mention/ID)
    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      // Ban the user
      await target.ban({ reason: reason });
      
      // Save to database
      await db.addBan(message.guild.id, target.id, target.user.tag, message.author.tag, reason);
      
      await message.reply(`✅ Successfully banned ${target.user.tag} for: ${reason}`);
      
      // Log the action
      await logger.logAction(message.guild, 'BAN', {
        target: target.user,
        moderator: message.author,
        reason: reason
      });
    } catch (error) {
      console.error(error);
      await message.reply('Failed to ban the user. Please try again.');
    }
  }
};