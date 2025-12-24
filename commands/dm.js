module.exports = {
  name: 'dm',
  description: 'Send a DM to a user (bot owner only)',
  async execute(message, args) {
    // Check if user is bot owner
    if (message.author.id !== process.env.OWNER_ID && message.author.id !== process.env.OWNER_ID_2) {
      return message.reply('You do not have permission to use this command.');
    }

    const userId = args[0];
    const dmContent = args.slice(1).join(' ');

    if (!userId || !dmContent) {
      return message.reply('Usage: !dm <userID> <message>');
    }

    try {
      const user = await message.client.users.fetch(userId);
      await user.send(dmContent);
      message.reply(`DM sent to ${user.tag}`);
    } catch (error) {
      message.reply('Could not send DM. Invalid user ID or user has DMs disabled.');
      console.error(error);
    }
  },
};