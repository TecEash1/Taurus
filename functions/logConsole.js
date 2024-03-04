module.exports = (client) => {
    const { WebhookClient, EmbedBuilder } = require('discord.js');
    const {webhook_url_console_logs} = require('../config.json');
    const webhookURL = webhook_url_console_logs;

    let webhookClient;
    try {
        webhookClient = new WebhookClient({ url: webhookURL });
    } catch (error) {
        console.log('\x1b[31m\x1b[1m%s\x1b[0m', 'CONSOLE LOGGING IN DISCORD DISABLED. WEBHOOK URL NOT PROVIDED OR INVALID.');
        return;
    }

    function customLogger(type, ...messages) {
        const combinedMessage = messages.map(m => (typeof m === 'object' ? JSON.stringify(m, null, 2) : m)).join(' ');
        
        if (combinedMessage === "By passing no model path, you're using the model hosted by Infinite.red - Please download and host the model before releasing this in production. See NSFWJS docs for instructions.") {
            return;
        }

        let messageToSend = combinedMessage;
        if (combinedMessage.length > 4070) { 
            messageToSend = `${combinedMessage.slice(0, 4067)}...`; 
        }
        
        const embed = new EmbedBuilder() 
            .setDescription(`\`\`\`console\n${messageToSend}\`\`\``)
            .setColor(0x3498DB) 
    
        if (type === 'error') {
            embed.setColor('Red');
        } else if (type === 'warn') {
            embed.setColor('Orange');
        } else if (combinedMessage === 'Started refreshing application (/) commands.' || 
                   combinedMessage === 'Successfully reloaded application (/) commands.' || 
                   combinedMessage.startsWith('Ready! Logged in as')) {
            embed.setColor('Green');
            if (combinedMessage === 'Started refreshing application (/) commands.') {
                embed.setTitle('💾 Console Log');
            }
        }
    
        webhookClient.send({
            username: 'Taurus Console',
            avatarURL: 'https://github.com/TecEash1/TecEash1/assets/92249532/bd4aca7e-daab-4eeb-9265-e53cc1925e8c',
            embeds: [embed]
        }).catch(console.error);
    
        console.originalLog(combinedMessage);
    }
    
    console.originalLog = console.log;
    console.log = customLogger.bind(null, 'log');
    
    console.originalError = console.error;
    console.error = customLogger.bind(null, 'error');
    
    console.originalWarn = console.warn;
    console.warn = customLogger.bind(null, 'warn');
    
    console.originalInfo = console.info;
    console.info = customLogger.bind(null, 'info');

};