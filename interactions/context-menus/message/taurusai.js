/**
 * @file Taurus Context Menu.
 * @author TechyGiraffe999
 */

/**
 * @type {import("../../../typings").ContextInteractionCommand}
 */

const { EmbedBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
	safetySettings,
	handleGeminiError,
	handleResponse,
	checkGeminiApiKey,
	fetchThreadMessages,
} = require("../../../functions/other/utils");
const { Gemini_API_KEY } = require("../../../config.json");
const genAI = new GoogleGenerativeAI(Gemini_API_KEY);

module.exports = {
	data: {
		name: "Taurus",
		type: 3,
	},

	async execute(interaction) {
		const { channel, targetId } = interaction;

		const message = await channel.messages.fetch(targetId);

		if (await checkGeminiApiKey(Gemini_API_KEY, interaction, false)) return;

		if (message.author.bot || message.author.id === message.client.user.id) {
			return interaction.reply({
				content: "I cant reply to myself or another bot!",
				ephemeral: true,
			});
		}

		let userQuestion;
		let messageDeleted;
		let threadMessages = [];

		if (message.reference) {
			const {
				userQuestion: fetchedUserQuestion,
				threadMessages: fetchedThreadMessages,
				messageDeleted: fetchedMessageDeleted,
			} = await fetchThreadMessages(Gemini_API_KEY, message);
			if (fetchedUserQuestion === null && fetchedThreadMessages === null)
				return;
			threadMessages = fetchedThreadMessages;
			userQuestion = fetchedUserQuestion;
			messageDeleted = fetchedMessageDeleted;
		} else if (!message.reference) {
			const botMention = `<@${message.client.user.id}>`;
			const regex = new RegExp(`^${botMention}\\s+.+`);

			if (await checkGeminiApiKey(Gemini_API_KEY, false, message)) return;
			userQuestion = message.content.replace(botMention, "").trim();
		}

		const sendTypingInterval = setInterval(() => {
			interaction.channel.sendTyping();
		}, 5000);

		const user = message.author;

		let loadingInterval;
		let loadingMsg;

		async function run() {
			const loadingEmbed = new EmbedBuilder()
				.setTitle("**⌛Loading your response**")
				.setDescription(
					"*TaurusAI may display innacurate/offensive info.*\n\n> *I am powered by Google's Generative AI, [Gemini](https://gemini.google.com) and was integrated by <@719815864135712799>.*",
				)
				.setFooter({
					text: "This may take a while",
					iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`,
				})
				.setTimestamp();
			loadingMsg = loadingMsg
				? await loadingMsg.edit({ embeds: [loadingEmbed] })
				: await interaction.reply({ embeds: [loadingEmbed] });
			const loadingDots = [" ⌛ ", " ⏳ "];
			let i = 0;
			const loadingInterval = setInterval(() => {
				loadingEmbed.setTitle(`**${loadingDots[i]} Loading your response**`);
				loadingMsg.edit({ embeds: [loadingEmbed] });
				i = (i + 1) % loadingDots.length;
			}, 2000);

			const personalityFilePath = path.join(
				__dirname + "../../../../personality.txt",
			);
			const personalityContent = await fs.readFile(
				personalityFilePath,
				"utf-8",
			);
			const personalityLines = personalityContent.split("\n");

			const botMention = `<@${message.client.user.id}>`;

			if (await checkGeminiApiKey(Gemini_API_KEY, false, message)) return;
			userQuestion = message.content.replace(botMention, "").trim();

			const user_status = message.member?.presence.clientStatus || {};
			const status_devices = Object.entries(user_status)
				.map(([platform, status]) => `${platform}: ${status}`)
				.join("\n");

			instruction = `${personalityLines}\n Please greet the user with a greeting and then their name which is: <@${message.author.id}> and limit your responses to 2000 characters or less.`;

			if (Object.keys(user_status).length) {
				instruction += ` The user's status/presence is currently:\n${status_devices}`;
			}

			const generationConfig = {
				maxOutputTokens: 750,
			};

			const model = genAI.getGenerativeModel(
				{
					model: "gemini-1.5-flash-latest",
					systemInstruction: instruction,
				},
				{
					safetySettings,
					generationConfig,
				},
			);

			if (
				threadMessages &&
				threadMessages.length > 0 &&
				threadMessages[0].role === "model"
			) {
				messageDeleted = "threadDeleted";
				threadMessages = [];
			}

			const chat = model.startChat({
				history: threadMessages,
				generationConfig: {
					maxOutputTokens: 750,
				},
			});

			clearInterval(loadingInterval);
			sendTypingInterval && clearInterval(sendTypingInterval);
			await handleResponse(
				chat,
				userQuestion,
				interaction,
				message,
				loadingMsg,
				messageDeleted,
				true,
			);
		}

		let errorType = null;
		do {
			try {
				await run();
				errorType = null;
			} catch (err) {
				clearInterval(loadingInterval);
				sendTypingInterval && clearInterval(sendTypingInterval);

				errorType = await handleGeminiError(err, loadingMsg);
			}
		} while (errorType === "quota_error");
	},
};
