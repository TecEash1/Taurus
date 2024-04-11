const { HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { EmbedBuilder } = require("discord.js");

function botInGuild(interaction) {
	const botGuilds = interaction.client.guilds.cache;
	return botGuilds.has(interaction.guildId);
}

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

async function handleGeminiError(err, loadingMsg) {
	switch (err.message) {
		case "[GoogleGenerativeAI Error]: Candidate was blocked due to SAFETY":
			const safety_error = new EmbedBuilder()
				.setTitle("⚠️ An Error Occurred")
				.setDescription(
					"> *The response was blocked due to **SAFETY**.* \n- *Result based on your input. Safety Blocking may not be 100% correct.*",
				)
				.setColor("Red");

			return await loadingMsg.edit({ embeds: [safety_error] });
		case "[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent: [400 Bad Request] User location is not supported for the API use.":
			const location_error = new EmbedBuilder()
				.setTitle("⚠️ An Error Occurred")
				.setDescription(
					"> *The user location is not supported for Gemini API use. Please contact the Developers.*",
				)
				.setColor("Red");

			return await loadingMsg.edit({ embeds: [location_error] });
		case "[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent: [429 Too Many Requests] Resource has been exhausted (e.g. check quota).":
			const quota_error = new EmbedBuilder()
				.setTitle("⚠️ An Error Occurred")
				.setDescription(
					"There are alot of requests at the moment Please try again later, or in a few minutes. \n*If this issue persists, please contact the Developers.* \n\n> - Token Limit for this minute has been reached.",
				)
				.setColor("Red");

			return await loadingMsg.edit({ embeds: [quota_error] });
		case "Cannot send an empty message":
		case "response.text is not a function":
			const error = new EmbedBuilder()
				.setTitle("⚠️ An Error Occurred")
				.setDescription(
					"An error occurred while processing your request. Please try again later, or in a few minutes. \n*If this issue persists, please contact the Developers.* \n\n> - Generated response may be too long. *(Fix this by specifying for the generated response to be smaller, e.g. 10 Lines)*\n> - Token Limit for this minute may have been reached.",
				)
				.setColor("Red");

			return await loadingMsg.edit({ embeds: [error] });
		default:
			console.error(err.message);
			const error_unknown = new EmbedBuilder()
				.setTitle("⚠️ An Error Occurred")
				.setDescription(
					"An unknown error occurred while processing your request. Please try again later, or in a few minutes. \n*If this issue persists, please contact the Developers.*\n> - Token Limit for this minute may have been reached.",
				)
				.setColor("Red");

			return await loadingMsg.edit({ embeds: [error_unknown] });
	}
}

async function handleResponse(
	chat,
	userQuestion,
	interaction,
	message,
	loadingMsg,
	isContextMenuCommand,
) {
	const result = await chat.sendMessage(userQuestion);
	const response = await result.response;

	const responseLength = response.text().length;
	if (responseLength > 2000) {
		response.text =
			response.text().substring(0, 1928 - "... \n\n".length) +
			"... \n\n*Response was cut short due to Discords character limit of 2000*";
	}

	let responseText = response.text();
	const regex = /<@&?\d+>/g;
	let match;

	while ((match = regex.exec(responseText)) !== null) {
		const id = interaction ? interaction.user.id : message.author.id;

		if (match[0] !== `<@${id}>`) {
			const ping_error = new EmbedBuilder()
				.setTitle("⚠️ Response Cannot Be Sent")
				.setDescription(
					"> *The generated message contains a mention of a Role or different User to the one that sent the original message/command.*",
				)
				.setColor("Red");
			return await loadingMsg.edit({ embeds: [ping_error] });
		}
	}

	let info_embed = [];
	if (isContextMenuCommand) {
		const footerText = `Response to message by ${message.author.tag}\n\n${message.content}`;
		const truncatedFooterText =
			footerText.length > 2030 ? `${footerText.slice(0, 2027)}...` : footerText;

		const info = new EmbedBuilder()
			.setFooter({ text: truncatedFooterText })
			.setColor("Blue");

		info_embed.push(info);
	}

	// responseText = responseText.replace(/(https?:\/\/(?!media\.discordapp\.net\/attachments\/)[^\s\)]+)/g, "<$1>");
	return await loadingMsg.edit({ content: responseText, embeds: info_embed });
}

async function checkGeminiApiKey(Gemini_API_KEY, interaction, message) {
	if (!Gemini_API_KEY || Gemini_API_KEY.length < 4) {
		const invalid_api = new EmbedBuilder()
			.setTitle("⚠️ Invalid API Key")
			.setDescription(
				"> **The API Key for Gemini is invalid or not provided.**",
			)
			.setColor("Red");

		return interaction
			? interaction.reply({ embeds: [invalid_api] })
			: message.reply({ embeds: [invalid_api] });
	}
}

async function fetchThreadMessages(Gemini_API_KEY, message) {
	let userQuestion;
	let threadMessages = [];

	if (await checkGeminiApiKey(Gemini_API_KEY, false, message)) return;
	const originalMessage = await message.channel.messages.fetch(
		message.reference.messageId,
	);

	if (originalMessage.author.id !== message.client.user.id)
		return { userQuestion: null, threadMessages: null };

	if (originalMessage.author.id === message.client.user.id) {
		let currentMessage = message;

		while (currentMessage.reference) {
			currentMessage = await message.channel.messages.fetch(
				currentMessage.reference.messageId,
			);
			const sender =
				currentMessage.author.id === message.client.user.id ? "model" : "user";
			let content = currentMessage.content;
			if (sender === "user") {
				content = content.replace(/<@\d+>\s*/, "");
			}
			threadMessages.unshift({ role: sender, parts: [{ text: content }] });
		}
	}
	userQuestion = message.content;

	return { userQuestion, threadMessages };
}

module.exports = {
	botInGuild,
	safetySettings,
	handleGeminiError,
	handleResponse,
	checkGeminiApiKey,
	fetchThreadMessages,
};
