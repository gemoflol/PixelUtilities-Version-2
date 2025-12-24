const { slashCommandBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Replies with Pong and latency information!',
  async execute(message, args, client) {
    const sent = await message.reply('Pinging...');
    
    const pingTime = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);
    
    await sent.edit(`Pong! Heartbeat is ${pingTime}ms. API Latency is ${apiLatency}ms`);
  }
}