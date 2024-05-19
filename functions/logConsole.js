module.exports = (client) => {
	const { WebhookClient, EmbedBuilder } = require("discord.js");
	const { QuickDB } = require("quick.db");
	const {
		webhookUpdateEvent,
	} = require("../interactions/modals/Settings/webhooks");
	const path = require("path");
	const db = new QuickDB({
		filePath: path.join(__dirname, "./other/settings.sqlite"),
	});
	(async () => {
		const webhooks = await db.get("webhooks");
		webhookUrlConsoleLogs = webhooks.console;
		webhookURL = webhookUrlConsoleLogs;

		let webhookClient;
		const setupWebhookClient = async () => {
			const webhooks = await db.get("webhooks");
			webhookURL = webhooks.console;

			try {
				webhookClient = new WebhookClient({ url: webhookURL });
			} catch (error) {
				console.log(
					"\x1b[31m\x1b[1m%s\x1b[0m",
					"CONSOLE LOGGING IN DISCORD DISABLED. SET WEBHOOK URL WITH /SETTINGS.",
				);
			}
		};
		setupWebhookClient();

		webhookUpdateEvent.on("update", (newWebhookUrl) => {
			webhookURL = newWebhookUrl;
			setupWebhookClient();
		});

		function customLogger(type, ...messages) {
			const combinedMessage = messages
				.map((m) => (typeof m === "object" ? JSON.stringify(m, null, 2) : m))
				.join(" ");

			const blockedMessages = [
				"By not specifying 'modelOrUrl' parameter, you're using the default model: 'MobileNetV2'. See NSFWJS docs for instructions on hosting your own model (https://github.com/infinitered/nsfwjs?tab=readme-ov-file#host-your-own-model).",
				"%cBy not specifying 'modelOrUrl' parameter, you're using the default model: 'MobileNetV2'. See NSFWJS docs for instructions on hosting your own model (https://github.com/infinitered/nsfwjs?tab=readme-ov-file#host-your-own-model). color: lightblue",
			];

			if (blockedMessages.includes(combinedMessage)) return;

			let messageToSend = combinedMessage;
			if (combinedMessage.length > 4070) {
				messageToSend = `${combinedMessage.slice(0, 4067)}...`;
			}

			const embed = new EmbedBuilder()
				.setDescription(`\`\`\`console\n${messageToSend}\`\`\``)
				.setColor(0x3498db);

			if (type === "error") {
				embed.setColor("Red");
			} else if (type === "warn") {
				embed.setColor("Orange");
			} else if (
				combinedMessage === "Started refreshing application (/) commands." ||
				combinedMessage === "Successfully reloaded application (/) commands." ||
				combinedMessage.startsWith("Ready! Logged in as")
			) {
				embed.setColor("Green");
				if (combinedMessage === `Ready! Logged in as ${client.user.tag}`) {
					embed.setTitle("💾 Console Log");
				}
			}

			webhookClient
				.send({
					username: "Taurus Console",
					avatarURL: client.user.displayAvatarURL(),
					embeds: [embed],
				})
				.catch(console.error);

			console.originalLog(combinedMessage);
		}

		console.originalLog = console.log;
		console.log = customLogger.bind(null, "log");

		console.originalError = console.error;
		console.error = customLogger.bind(null, "error");

		console.originalWarn = console.warn;
		console.warn = customLogger.bind(null, "warn");

		console.originalInfo = console.info;
		console.info = customLogger.bind(null, "info");
	})();
};
