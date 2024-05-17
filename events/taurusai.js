/**
 * @file TaurusAI Events
 * @author TechyGiraffe999
 */

const { Events, EmbedBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
	safetySettings,
	handleGeminiError,
	handleResponse,
	fetchThreadMessages,
} = require("../functions/other/utils");
const { QuickDB } = require("quick.db");
const db = new QuickDB({
	filePath: path.join(__dirname, "../functions/other/settings.sqlite"),
});

module.exports = {
	name: Events.MessageCreate,

	async execute(message) {
		if (message.author.bot || message.author.id === message.client.user.id)
			return;
		if ([18, 21].includes(message.type)) return;

		const apiKeys = await db.get("apiKeys");
		const geminiApiKey = apiKeys.gemini;
		const other = await db.get("other");
		let modelId = other.model;
		const genAI = new GoogleGenerativeAI(geminiApiKey);

		let userQuestion;
		let messageDeleted;
		let threadMessages = [];

		if (message.reference) {
			const {
				userQuestion: fetchedUserQuestion,
				threadMessages: fetchedThreadMessages,
				messageDeleted: fetchedMessageDeleted,
			} = await fetchThreadMessages(geminiApiKey, message);
			if (fetchedUserQuestion === null && fetchedThreadMessages === null)
				return;
			threadMessages = fetchedThreadMessages;
			userQuestion = fetchedUserQuestion;
			messageDeleted = fetchedMessageDeleted;
		} else if (!message.reference) {
			const botMention = `<@${message.client.user.id}>`;
			const regex = new RegExp(`^${botMention}\\s+.+`);

			if (!regex.test(message.content)) return;
			userQuestion = message.content.replace(botMention, "").trim();
		}

		const user = message.author;
		const sendTypingInterval = setInterval(() => {
			message.channel.sendTyping();
		}, 5000);

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
				: await message.reply({ embeds: [loadingEmbed] });
			const loadingDots = [" ⌛ ", " ⏳ "];
			let i = 0;
			loadingInterval = setInterval(() => {
				loadingEmbed.setTitle(`**${loadingDots[i]} Loading your response**`);
				loadingMsg.edit({ embeds: [loadingEmbed] });
				i = (i + 1) % loadingDots.length;
			}, 2000);

			const user_status = message.member?.presence.clientStatus || {};
			const status_devices = Object.entries(user_status)
				.map(([platform, status]) => `${platform}: ${status}`)
				.join("\n");

			const personalityFilePath = path.join(__dirname, "../personality.txt");
			const personalityContent = await fs.readFile(
				personalityFilePath,
				"utf-8",
			);
			const personalityLines = personalityContent.split("\n");

			instruction = `${personalityLines}\n Please greet the user with a greeting and then their name which is: <@${message.author.id}> and limit your responses to 2000 characters or less.`;

			if (Object.keys(user_status).length) {
				instruction += ` The user's status/presence is currently:\n${status_devices}`;
			}

			const generationConfig = {
				maxOutputTokens: 750,
			};

			const model = genAI.getGenerativeModel(
				{
					model: modelId,
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
			clearInterval(sendTypingInterval);
			await handleResponse(
				chat,
				userQuestion,
				false,
				message,
				loadingMsg,
				messageDeleted,
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
				if (errorType === "quotaErrorBalance") {
					modelId =
						modelId === "gemini-1.5-pro-latest"
							? "gemini-1.5-flash-latest"
							: "gemini-1.5-pro-latest";
				}
			}
		} while (errorType === "quota_error" || errorType === "quotaErrorBalance");
	},
};
