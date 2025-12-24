const { EmbedBuilder } = require('discord.js');
const levels = require('../levels');

module.exports = {
  name: 'leaderboard',
  description: 'Show the top users by XP',
  async execute(message, args, client) {
    // Get leaderboard
    const leaderboard = levels.getLeaderboard(message.guild, 10);

    if (leaderboard.length === 0) {
      return message.reply('No users have earned XP yet!');
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 Server Leaderboard')
      .setDescription('Top 10 users by XP')
      .setTimestamp();

    // Add users to leaderboard
    let description = '';
    for (let i = 0; i < leaderboard.length; i++) {
      const data = leaderboard[i];
      const user = await client.users.fetch(data.userId).catch(() => null);
      
      if (!user) continue;

      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      description += `${medal} **${user.tag}** - Level ${data.level} (${data.xp} XP)\n`;
    }

    embed.setDescription(description);

    await message.reply({ embeds: [embed] });
  }
}