const { EmbedBuilder } = require('discord.js');
const levels = require('../levels');

module.exports = {
  name: 'rank',
  description: 'Check your level and XP',
  async execute(message, args, client) {
    // Get target user (mention or self)
    const target = message.mentions.members.first() || message.member;

    // Get user data
    const userData = await levels.getUserData(message.guild, target.id);

    // Calculate progress percentage
    const progressPercent = Math.floor((userData.xpProgress / userData.xpNeeded) * 100);
    const progressBar = this.createProgressBar(progressPercent);

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`📊 Rank for ${target.user.tag}`)
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: 'Level', value: `${userData.level}`, inline: true },
        { name: 'Total XP', value: `${userData.xp}`, inline: true },
        { name: 'Next Level', value: `${userData.nextLevel}`, inline: true },
        { name: 'Progress', value: `${progressBar} ${userData.xpProgress}/${userData.xpNeeded} XP (${progressPercent}%)`, inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  createProgressBar(percent) {
    const filled = Math.floor(percent / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
};