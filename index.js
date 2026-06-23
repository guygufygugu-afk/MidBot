const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`MidBot este online!`);
});

client.on('messageCreate', async (message) => {
    // Verificări critice: dacă e bot sau nu începe cu +, ignorăm
    if (message.author.bot) return;
    if (!message.content.startsWith('+')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    
    // Execută comanda doar dacă ea există în folderul commands
    if (command) {
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(error);
        }
    }
});

client.login(process.env.TOKEN);
