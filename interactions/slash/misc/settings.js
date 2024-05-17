/**
 * @file Settings Command
 * @author TechyGiraffe999
 */

const {
	EmbedBuilder,
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Embed,
} = require("discord.js");
const path = require("path");
const {
	checkWebhook,
	checkAPIKey,
	checkOwnerAndReply,
} = require("../../../functions/other/utils");
const { emojis } = require("../../../config.json");
const { QuickDB } = require("quick.db");
const db = new QuickDB({
	filePath: path.join(__dirname, "../../../functions/other/settings.sqlite"),
});

async function updateFieldValueAndReply(
	interaction,
	settings,
	fieldName,
	fieldValue,
) {
	const field = settings.data.fields.find((field) => field.name === fieldName);
	field.value = fieldValue;
	await interaction.editReply({ embeds: [settings] });
}

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("settings")
		.setDescription("View the settings for Taurus"),
	async execute(interaction) {
		try {
			const settings = new EmbedBuilder()
				.setTitle("Taurus Settings")
				.setColor("6414eb")
				.addFields(
					{
						name: "🔗 Webhooks:",
						value: `${emojis.loading} **Personality**\n${emojis.loading} **Console**`,
						inline: true,
					},
					{
						name: "🔑 API Keys:",
						value: `${emojis.loading} **Prodia**\n${emojis.loading} **Gemini**`,
						inline: true,
					},
					{
						name: "⚙️ Other:",
						value: `${emojis.loading} **NSFW Image Blocking**\n${emojis.loading} **Load Balancing**\n${emojis.loading} **Model**`,
						inline: true,
					},
				)
				.setThumbnail(
					"https://github.com/TecEash1/TecEash1/assets/92249532/bd4aca7e-daab-4eeb-9265-e53cc1925e8c",
				);

			if (!checkOwnerAndReply(interaction)) {
				return;
			}
			await interaction.reply({ embeds: [settings] });

			const webhooks = await db.get("webhooks");
			const apiKeys = await db.get("apiKeys");
			const otherSettings = await db.get("other");

			// WEBHOOK CHECKING
			let isPersonalityWebhookValid = await checkWebhook(webhooks.personality);
			await updateFieldValueAndReply(
				interaction,
				settings,
				"🔗 Webhooks:",
				`${isPersonalityWebhookValid ? emojis.working : emojis.failed} **Personality**\n${emojis.loading} **Console**`,
			);

			let isConsoleWebhookValid = await checkWebhook(webhooks.console);
			await updateFieldValueAndReply(
				interaction,
				settings,
				"🔗 Webhooks:",
				`${isPersonalityWebhookValid ? emojis.working : emojis.failed} **Personality**\n${isConsoleWebhookValid ? emojis.working : emojis.failed} **Console**`,
			);

			// API KEY CHECKING
			let isProdiaKeyValid = await checkAPIKey("prodia", apiKeys.prodia);
			await updateFieldValueAndReply(
				interaction,
				settings,
				"🔑 API Keys:",
				`${isProdiaKeyValid ? emojis.working : emojis.failed} **Prodia**\n${emojis.loading} **Gemini**`,
			);

			let isGeminiKeyValid = await checkAPIKey("gemini", apiKeys.gemini);
			await updateFieldValueAndReply(
				interaction,
				settings,
				"🔑 API Keys:",
				`${isProdiaKeyValid ? emojis.working : emojis.failed} **Prodia**\n${isGeminiKeyValid ? emojis.working : emojis.failed} **Gemini**`,
			);

			// OTHER SETTINGS CHECKING
			let isNSFWBlockingEnabled = otherSettings.blockNSFWImages;
			await updateFieldValueAndReply(
				interaction,
				settings,
				"⚙️ Other:",
				`${isNSFWBlockingEnabled ? emojis.working : emojis.failed} **NSFW Image Blocking**\n${emojis.loading} **Load Balancing**\n${emojis.loading} **Model**`,
			);

			let isLoadBalancingEnabled = otherSettings.loadBalancing;
			await updateFieldValueAndReply(
				interaction,
				settings,
				"⚙️ Other:",
				`${isNSFWBlockingEnabled ? emojis.working : emojis.failed} **NSFW Image Blocking**\n${isLoadBalancingEnabled ? emojis.working : emojis.failed} **Load Balancing**\n${emojis.loading} **Model**`,
			);

			let modelName = otherSettings.model;
			let modelEmoji = modelName === "gemini-1.5-flash-latest" ? "⚡" : "💪";
			let modelNameFormatted = modelName
				.replace(/-latest$/, "")
				.replace(/-/g, " ")
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ");
			await updateFieldValueAndReply(
				interaction,
				settings,
				"⚙️ Other:",
				`${isNSFWBlockingEnabled ? emojis.working : emojis.failed} **NSFW Image Blocking**\n${isLoadBalancingEnabled ? emojis.working : emojis.failed} **Load Balancing**\n${modelEmoji} **${modelNameFormatted}**`,
			);

			// BUTTONS
			const personality = new ButtonBuilder()
				.setCustomId("personality")
				.setLabel("Personality")
				.setEmoji("✨")
				.setStyle(ButtonStyle.Secondary);
			const console = new ButtonBuilder()
				.setCustomId("console")
				.setLabel("Console")
				.setEmoji("💾")
				.setStyle(ButtonStyle.Secondary);
			const webhooksRow = new ActionRowBuilder().addComponents(
				personality,
				console,
			);

			const prodia = new ButtonBuilder()
				.setCustomId("prodia")
				.setLabel("Prodia")
				.setEmoji("🖼️")
				.setStyle(ButtonStyle.Secondary);
			const gemini = new ButtonBuilder()
				.setCustomId("gemini")
				.setLabel("Gemini")
				.setEmoji("🤖")
				.setStyle(ButtonStyle.Secondary);
			const apiKeysRow = new ActionRowBuilder().addComponents(prodia, gemini);

			const nsfw = new ButtonBuilder()
				.setCustomId("blockNSFWImages")
				.setLabel("NSFW Image Blocking")
				.setEmoji("🔞")
				.setStyle(ButtonStyle.Secondary);
			const loadBalance = new ButtonBuilder()
				.setCustomId("loadBalancing")
				.setLabel("Load Balancing")
				.setEmoji("⚖️")
				.setStyle(ButtonStyle.Secondary);
			const model = new ButtonBuilder()
				.setCustomId("model")
				.setLabel("Model")
				.setEmoji("🔁")
				.setStyle(ButtonStyle.Secondary);
			const otherRow = new ActionRowBuilder().addComponents(
				nsfw,
				loadBalance,
				model,
			);

			await interaction.editReply({
				components: [webhooksRow, apiKeysRow, otherRow],
			});
		} catch (error) {
			console.error(error);
			// console.dir(error, { showHidden: true, depth: null });
			error = new EmbedBuilder()
				.setDescription("⚠️ **An Error occurred**")
				.setColor("Red");
			await interaction.followUp({
				embeds: [errors],
				ephemeral: true,
			});
		}
	},
};
