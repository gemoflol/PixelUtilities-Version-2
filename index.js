require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    ActivityType,
    PresenceUpdateStatus,
    Events,
    EmbedBuilder
} = require('discord.js');
const levels = require('./levels');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ]
});

// Set your command prefix here (e.g., !, ?, ., etc.)
const PREFIX = process.env.PREFIX || '!';

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filepath = path.join(commandsPath, file);
  const command = require(filepath);

  if ('name' in command && 'execute' in command) {
    client.commands.set(command.name, command);
    console.log(`Loaded command: ${command.name}`);
  } else {
    console.log(`The command at ${filepath} is missing a required "name" or "execute" property.`);
  }
}

client.once(Events.ClientReady, async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    const statusType = process.env.BOT_STATUS || 'online';
    const activityType = process.env.ACTIVITY_TYPE || 'PLAYING';
    const activityName = process.env.ACTIVITY_NAME || 'Discord';

    const activityTypeMap = {
        'PLAYING': ActivityType.Playing,
        'WATCHING': ActivityType.Watching,
        'LISTENING': ActivityType.Listening,
        'STREAMING': ActivityType.Streaming,
        'COMPETING': ActivityType.Competing
    };

    const statusMap = {
      'online': PresenceUpdateStatus.Online,
      'idle': PresenceUpdateStatus.Idle,
      'dnd': PresenceUpdateStatus.DoNotDisturb,
      'invisible': PresenceUpdateStatus.Invisible
    };

    client.user.setPresence({
      status: statusMap[statusType],
      activities: [{
        name: activityName,
        type: activityTypeMap[activityType]
      }] 
    });

    console.log(`Bot status set to: ${statusType}`);
    console.log(`Activity set to: ${activityType} ${activityName}`);
});

// Handle prefix commands
client.on(Events.MessageCreate, async message => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Award XP for messages (excluding commands)
  if (message.guild && !message.content.startsWith(PREFIX)) {
    const result = await levels.addXP(message.guild, message.member);

    if (result && result.leveledUp) {
      // Create level up embed
      const levelUpEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎉 Level Up!')
        .setDescription(`${message.author} has reached **Level ${result.newLevel}**!`)
        .addFields(
          { name: 'Total XP', value: `${result.xp}`, inline: true },
          { name: 'Previous Level', value: `${result.oldLevel}`, inline: true }
        )
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp();

      // Send level up message
      await message.channel.send({ embeds: [levelUpEmbed] });

      // Check and award role if configured
      const role = await levels.checkAndAwardRole(message.guild, message.member, result.newLevel);
      
      if (role) {
        const roleEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setDescription(`🎊 ${message.author} has been awarded the ${role} role!`)
          .setTimestamp();

        await message.channel.send({ embeds: [roleEmbed] });
      }
    }
  }

  // Check if message starts with prefix
  if (!message.content.startsWith(PREFIX)) return;

  // Parse command and arguments
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Get command
  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    await message.reply('There was an error executing that command!');
  }
});

client.login(process.env.BOT_TOKEN);