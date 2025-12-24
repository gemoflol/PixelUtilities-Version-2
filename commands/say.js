module.exports = {
  name: 'say',
  description: 'Bot owner command to make the bot say something',
  ownerOnly: true,
  execute(message, args) {
    if (!args.length) {
      return message.reply('Please provide text for me to say!');
    }

    const text = args.join(' ');
    message.channel.send(text);
    message.delete().catch(() => {});
  }
};