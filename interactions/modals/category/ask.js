/**
 * @file TaurusAI Ask Modal.
 * @author TechyGiraffe999
 */

/**
 * @type {import("../../../../typings").ModalInteractionCommand}
 */
const fs = require('fs').promises;
const path = require('path');
const {  EmbedBuilder } = require("discord.js");
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const Gemini_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(Gemini_API_KEY);


module.exports = {
    id: "taurus_ai",

    async execute(interaction) {
        if (!Gemini_API_KEY || Gemini_API_KEY.length < 4) {
            invalid_api = new EmbedBuilder()
                .setTitle("⚠️ Invalid API Key")
                .setDescription("> **The API Key for Gemini is invalid or not provided.**")
                .setColor("Red")
            return interaction.reply({ embeds: [invalid_api] });
        }
        
        const personalityFilePath = path.join(__dirname + '../../../../personality.txt');
        const personalityContent = await fs.readFile(personalityFilePath, 'utf-8');
        const personalityLines = personalityContent.split('\n');

        const userQuestion = interaction.fields.getTextInputValue("question_taurusai");

        const sendTypingInterval = setInterval(() => {
            interaction.channel.sendTyping();
        }, 5000);

        const loadingEmbed = new EmbedBuilder()
            .setTitle("**Loading your response . . .**")
            .setDescription("*TaurusAI may display innacurate/offensive info.*\n\n> *I am powered by Google's Generative AI, [Gemini](https://gemini.google.com) and was integrated by <@719815864135712799>.*")
            .setFooter({text: "⏳ This may take a while", iconURL: interaction.user.displayAvatarURL()})
            .setTimestamp()
        const loadingMsg = await interaction.reply({ embeds: [loadingEmbed]
            //, ephemeral: true 
        });
        const loadingDots = [""," .  ", " . . ", " . . ."];
        let i = 0;
        const loadingInterval = setInterval(async () => {
            loadingEmbed.setTitle(`**Loading your response ${loadingDots[i]}**`);
            await loadingMsg.edit({ embeds: [loadingEmbed] });
            i = (i + 1) % loadingDots.length;
        }, 500);

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

        const user_status = interaction.member?.presence.clientStatus || {}
        const status_devices = Object.entries(user_status)
            .map(([platform, status]) => `${platform}: ${status}`)
            .join("\n");
      
        parts1 = `${personalityLines}\n Please greet the user with a greeting and then their name which is: <@${interaction.user.id}>.`
  
        if (Object.keys(user_status).length) {
            parts1 += ` The user's presence is currently:\n${status_devices}`;
        }  

        async function run() {
            const generationConfig = {
                maxOutputTokens: 750,
            };
            const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings, generationConfig});

            const chat = model.startChat({
                history: [
                {
                    role: "user",
                    parts: parts1,
                },
                {
                    role: "model",
                    parts: `I will greet the user with their name: <@${interaction.user.id}>. I will also limit all of my responses to 2000 characters or less, regardless of what you say. Feel feel free to ask me anything! 😊`,
                },
                ],
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
                if (match[0] !== `<@${interaction.user.id}>`) {
                    const ping_error = new EmbedBuilder()
                        .setTitle("⚠️ Response Cannot Be Sent")
                        .setDescription("> *The generated message contains a mention of a Role or different User to the one that sent the original message/command.*")
                        .setColor("Red")
                    return await interaction.editReply({ embeds: [ping_error] });
                }
            }
            
            responseText = responseText.replace(/(?!<)(https?:\/\/(?!media\.discordapp\.net\/attachments\/)[^\s\)]+)/gi,"<$1>");
            return await loadingMsg.edit({ content: responseText, embeds: [] });
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

                    return await interaction.editReply({ embeds: [safety_error]});

                case "[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent: [400 Bad Request] User location is not supported for the API use.":
                    const location_error = new EmbedBuilder()
                    .setTitle("⚠️ An Error Occurred")
                    .setDescription("> *The user location is not supported for Gemini API use. Please contact the Developers.*")
                    .setColor("Red")

                    return await interaction.editReply({ embeds: [location_error]});

                case "Cannot send an empty message":
                case "response.text is not a function":
                    const error = new EmbedBuilder()
                        .setTitle("⚠️ An Error Occurred")
                        .setDescription("An error occurred while processing your request. Please try again later, or in a few minutes. \n*If this issue persists, please contact the Developers.* \n\n> - Generated response may be too long. *(Fix this by specifying for the generated response to be smaller, e.g. 10 Lines)*\n> - Token Limit for this minute may have been reached.")
                        .setColor("Red")

                    return await interaction.editReply({ embeds: [error]});

                default:
                    const error_unknown = new EmbedBuilder()
                        .setTitle("⚠️ An Error Occurred")
                        .setDescription("An unknown error occurred while processing your request. Please try again later, or in a few minutes. \n*If this issue persists, please contact the Developers.*\n> - Token Limit for this minute may have been reached.")
                        .setColor("Red")

                    await interaction.editReply({embeds: [error_unknown] 
                    });
                }
        }
    }
};