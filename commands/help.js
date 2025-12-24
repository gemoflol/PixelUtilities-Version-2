const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Displays help information',
  execute(message) {
    const userId = message.author.id;
    const guildOwnerId = message.guild.ownerId;
    const isStaff = message.member.permissions.has('ModerateMembers');
    const isBotOwner = userId === process.env.OWNER_ID;

    const embeds = [];

    // Bot Owner Section
    if (isBotOwner) { process.env.OWNER_ID && userId === process.env.OWNER_ID || process.env.OWNER_ID_2 && userId === process.env.OWNER_ID_2
      embeds.push(
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🔧 Bot Owner Commands')
          .addFields(
            { name: '!reload', value: 'Reload all commands' },
            { name: '!shutdown', value: 'Shutdown the bot' },
            { name: '!dm', value: 'Send a DM to a user' },
            { name: '!eval', value: 'Evaluate JavaScript code' },
            { name: '!setstatus', value: 'Set the bot status and activity' }
          )
      );
    }

    // Staff Section
    if (isStaff || isBotOwner) {
      embeds.push(
        new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('👮 Staff Commands')
          .addFields(
            { name: '!kick', value: 'Kick a member' },
            { name: '!ban', value: 'Ban a member' },
            { name: '!warn', value: 'Warn a member' }
          )
      );
    }

    // Members Section
    embeds.push(
      new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('👥 Member Commands')
        .addFields(
          { name: '!ping', value: 'Check bot latency' },
          { name: '!profile', value: 'View your profile' }
        )
    );

    message.reply({ embeds });
  }
};