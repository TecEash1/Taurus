/**
 * @file TaurusAI Reply 
 * @author TechyGiraffe999
 */

// Declares constants (destructured) to be used in this file.

const { Events, EmbedBuilder } = require("discord.js");
const path = require('path');
const fs = require('fs').promises;
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const Gemini_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(Gemini_API_KEY);

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (message.author.bot || message.author.id === message.client.user.id) return;
        if (!message.reference) return;

         if (!Gemini_API_KEY || Gemini_API_KEY.length < 4) {
             const invalid_api = new EmbedBuilder()
                 .setTitle("⚠️ Invalid API Key")
                 .setDescription("> **The API Key for Gemini is invalid or not provided.**")
                 .setColor("Red")
             return message.reply({ embeds: [invalid_api] });
        }
            
        const originalMessage = await message.channel.messages.fetch(message.reference.messageId);
        
        if (originalMessage.author.id !== message.client.user.id) {
            return;
        }

        let threadMessages = [];
        if (originalMessage.author.id === message.client.user.id) {
            let currentMessage = message;
        
            while (currentMessage.reference) {
                currentMessage = await message.channel.messages.fetch(currentMessage.reference.messageId);
                const sender = currentMessage.author.id === message.client.user.id ? 'model' : 'user';
                let content = currentMessage.content;
                if (sender === 'user') {
                    content = content.replace(/<@\d+>\s*/, ''); 
                }
                threadMessages.unshift({ role: sender, parts: content });
            }
        }
            

        const userQuestion = message.content

        
        const sendTypingInterval = setInterval(() => {
            message.channel.sendTyping();
        }, 5000);

        const user =  message.author;

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

        const personalityFilePath = path.join(__dirname, '../personality.txt');
        const personalityContent = await fs.readFile(personalityFilePath, 'utf-8');
        const personalityLines = personalityContent.split('\n');


        const safetySettings = [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ];

        async function run() {
            const generationConfig = {
                maxOutputTokens: 750,
            };
            const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings, generationConfig}); 

            var history = [
                {
                    role: "user",
                    parts: `${personalityLines}\n Please greet the user with a greeting and then there name which is: <@${message.author.id}>.`,
                },
                {
                    role: "model",
                    parts: `I will greet the user with their name: <@${message.author.id}>. I will also limit all of my responses to 2000 characters or less, regardless of what you say. Feel feel free to ask me anything! 😊`,
                },
            ];
            
            if (history.length > 0 && threadMessages.length > 0 && history[history.length - 1].role === 'model' && threadMessages[0].role === 'model') {
                history[history.length - 1].parts += threadMessages[0].parts;
                threadMessages.shift();
            }
            
            history = history.concat(threadMessages);
                
            const chat = model.startChat({
                history,
                generationConfig: {
                maxOutputTokens: 750,
                },
            });
            const result = await chat.sendMessage(userQuestion);
            const response = await result.response;
            
            const responseLength = response.text().length;
            if (responseLength > 2000) {
              response.text = response.text().substring(0, 1928 - "... \n\n".length) + "... \n\n*Response was cut short due to Discords character limit of 2000*";
            }
            clearInterval(loadingInterval);
            clearInterval(sendTypingInterval);

            let responseText = response.text();
            const regex = /<@&?\d+>/g;
            let match;

            while ((match = regex.exec(responseText)) !== null) {
                if (match[0] !== `<@${message.author.id}>`) {
                    const ping_error = new EmbedBuilder()
                        .setTitle("⚠️ Response Cannot Be Sent")
                        .setDescription("> *The generated message contains a mention of a Role or different User to the one that sent the original message/command.*")
                        .setColor("Red")
                    return await loadingMsg.edit({ embeds: [ping_error] });
                }
            }
            responseText = responseText.replace(/(https?:\/\/[^\s]+)/g, "<$1>")
            return await loadingMsg.edit({ content: response.text(), embeds: [] });
        }
          
        try{
            await run();
        } catch (err) {
            clearInterval(loadingInterval);
            clearInterval(sendTypingInterval);

            switch (err.message) {
                case "[GoogleGenerativeAI Error]: Text not available. Response was blocked due to SAFETY":
                    const safety_error = new EmbedBuilder()
                    .setTitle("⚠️ An Error Occurred")
                    .setDescription("> *The response was blocked due to **SAFETY**.*")
                    .setColor("Red")

                    return await loadingMsg.edit({ embeds: [safety_error]});

                case "[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent: [400 Bad Request] User location is not supported for the API use.":
                    const location_error = new EmbedBuilder()
                    .setTitle("⚠️ An Error Occurred")
                    .setDescription("> *The user location is not supported for Gemini API use. Please contact the Developers.*")
                    .setColor("Red")

                    return await loadingMsg.edit({ embeds: [location_error]});

                case "Cannot send an empty message":
                case "response.text is not a function":
                    const error = new EmbedBuilder()
                        .setTitle("⚠️ An Error Occurred")
                        .setDescription("An error occurred while processing your request. Please try again later, or in a few minutes. \n*If this issue persists, please contact the Developers.* \n\n> - Generated response may be too long. *(Fix this by specifying for the generated response to be smaller, e.g. 10 Lines)*\n> - Token Limit for this minute may have been reached.")
                        .setColor("Red")

                    return await loadingMsg.edit({ embeds: [error]});

                default:
                    const error_unknown = new EmbedBuilder()
                        .setTitle("⚠️ An Error Occurred")
                        .setDescription("An unknown error occurred while processing your request. Please try again later, or in a few minutes. \n*If this issue persists, please contact the Developers*\n> - Token Limit for this minute may have been reached.")
                        .setColor("Red")

                    await loadingMsg.edit({embeds: [error_unknown] 
                    });
                }
            }
        }
    }