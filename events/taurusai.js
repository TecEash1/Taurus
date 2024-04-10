/**
 * @file TaurusAI Events
 * @author TechyGiraffe999
 */


const { Events, EmbedBuilder } = require("discord.js");
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Gemini_API_KEY } = require("../config.json"); 
const { safetySettings, handleGeminiError, handleResponse, checkGeminiApiKey, fetchThreadMessages } = require("../utils");
const genAI = new GoogleGenerativeAI(Gemini_API_KEY);

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (message.author.bot || message.author.id === message.client.user.id) return;
        if (message.type === 21) return;

        let userQuestion
        let threadMessages = [];

        if (message.reference) {
            const { userQuestion: fetchedUserQuestion, threadMessages: fetchedThreadMessages } = await fetchThreadMessages(Gemini_API_KEY, message);
            if (fetchedUserQuestion === null && fetchedThreadMessages === null) return;
            threadMessages = fetchedThreadMessages;
            userQuestion = fetchedUserQuestion
        } else if (!message.reference) {
            const botMention = `<@${message.client.user.id}>`;
            const regex = new RegExp(`^${botMention}\\s+.+`);
        
            if (!regex.test(message.content)) return;
            if (await checkGeminiApiKey(Gemini_API_KEY, false, message)) return;
            userQuestion = message.content
                .replace(botMention, "")
                .trim();
        }

        const user =  message.author;
        const sendTypingInterval = setInterval(() => {
            message.channel.sendTyping();
        }, 5000);

        const loadingEmbed = new EmbedBuilder()
            .setTitle("**⌛Loading your response**")
            .setDescription("*TaurusAI may display innacurate/offensive info.*\n\n> *I am powered by Google's Generative AI, [Gemini](https://gemini.google.com) and was integrated by <@719815864135712799>.*")
            .setFooter({text: "This may take a while", iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`})
            .setTimestamp()
        const loadingMsg = await message.reply({ embeds: [loadingEmbed] });
        const loadingDots = [" ⌛ ", " ⏳ "];
        let i = 0;
        const loadingInterval = setInterval(() => {
            loadingEmbed.setTitle(`**${loadingDots[i]} Loading your response**`);
            loadingMsg.edit({ embeds: [loadingEmbed] });
            i = (i + 1) % loadingDots.length;
        }, 2000);

        const user_status = message.member?.presence.clientStatus || {}
        const status_devices = Object.entries(user_status)
            .map(([platform, status]) => `${platform}: ${status}`)
            .join("\n");
      
        const personalityFilePath = path.join(__dirname, '../personality.txt');
        const personalityContent = await fs.readFile(personalityFilePath, 'utf-8');
        const personalityLines = personalityContent.split('\n');    

        parts1 = `${personalityLines}\n Please greet the user with a greeting and then their name which is: <@${message.author.id}>.`
  
        if (Object.keys(user_status).length) {
            parts1 += ` The user's presence is currently:\n${status_devices}`;
        }

        async function run() {
            const generationConfig = {
                maxOutputTokens: 750,
            };

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }, {
                apiVersion: 'v1beta',
                safetySettings,
                generationConfig
            });
            
            var history = [
                {
                    role: "user",
                    parts: [{text: parts1}],
                },
                {
                    role: "model",
                    parts: [{text:`I will greet the user with their name: <@${message.author.id}>. I will also limit all of my responses to 2000 characters or less, regardless of what you say. Feel feel free to ask me anything! 😊`}],
                },
            ];
            
            if (history.length > 0 && threadMessages && threadMessages.length > 0 && history[history.length - 1].role === 'model' && threadMessages[0].role === 'model' && Array.isArray(history[history.length - 1].parts) && Array.isArray(threadMessages[0].parts)) {
                history[history.length - 1].parts = history[history.length - 1].parts.concat(threadMessages[0].parts);                
                threadMessages.shift();
            }
            history.push(...threadMessages);     
                       
            const chat = model.startChat({
                history,
                generationConfig: {
                maxOutputTokens: 750,
                },
            });
            
        clearInterval(loadingInterval);
        clearInterval(sendTypingInterval);
        await handleResponse(chat, userQuestion, false, message, loadingMsg)
        }
          
        try{
            await run();
        } catch (err) {
            clearInterval(loadingInterval);
            sendTypingInterval && clearInterval(sendTypingInterval);
            
            handleGeminiError(err, loadingMsg);
            
        }
    },
};