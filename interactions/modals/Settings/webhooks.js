/**
 * @file Webhook Settings Modal.
 * @author TechyGiraffe999
 */

/**
 * @type {import("../../../../typings").ModalInteractionCommand}
 */
const fs = require("fs").promises;
const path = require("path");
const { EmbedBuilder, WebhookClient } = require("discord.js");
const { checkWebhook } = require("../../../functions/other/utils");
const { emojis } = require("../../../config.json");
const { QuickDB } = require("quick.db");
const db = new QuickDB({
	filePath: path.join(__dirname, "../../../functions/other/settings.sqlite"),
});

module.exports = {
	id: ["personality", "console"],

	async execute(interaction) {
		const webhookName =
			interaction.customId.charAt(0).toUpperCase() +
			interaction.customId.slice(1);
		embed = new EmbedBuilder()
			.setDescription(`**${emojis.loading} Checking ${webhookName} Webhook**`)
			.setColor("Green");

		await interaction.reply({ embeds: [embed], ephemeral: true });
		const webhook = interaction.fields.getTextInputValue("webhook");
		const webhooks = await db.get("webhooks");

		let isValidWebhook;
		isValidWebhook = await checkWebhook(webhook);

		if (webhooks[interaction.customId] === webhook) {
			const alreadyRegistered = new EmbedBuilder()
				.setDescription(
					`**🔑 ${webhookName} Webhook is already registered. (Duplicate Webhook)**`,
				)
				.setColor("Yellow");
			await interaction.editReply({
				embeds: [alreadyRegistered],
				ephemeral: true,
			});
			return;
		}

		if (!isValidWebhook) {
			const invalidWebhook = new EmbedBuilder()
				.setDescription(
					`**🔑 ${webhookName} Webhook Checking Failed, Webhook invalid**`,
				)
				.setColor("Red");
			await interaction.editReply({ embeds: [invalidWebhook] });
			return;
		}

		webhookClient = new WebhookClient({ url: webhook });
		const emoji = interaction.customId === "console" ? "💾" : "✨";
		const webhookEmbed = new EmbedBuilder()
			.setDescription(
				`**${emoji} Taurus ${webhookName} Webhook Registered, Updates will be logged here**`,
			)
			.setColor("Green");
		webhookClient
			.send({
				username: `Taurus ${webhookName}`,
				avatarURL: interaction.client.user.displayAvatarURL(),
				embeds: [webhookEmbed],
			})
			.catch(console.error);

		const successEmbed = new EmbedBuilder()
			.setDescription(
				`**🔑 ${webhookName} Webhook Checking Successful, the Webhook was updated!**`,
			)
			.setColor("Green");
		await interaction.editReply({ embeds: [successEmbed] });

		const message = await interaction.message.fetch();
		const embedData = message.embeds[0];

		const webhookFieldIndex = embedData.data.fields.findIndex(
			(field) => field.name === "🔗 Webhooks:",
		);
		const webhooksFieldValue = embedData.data.fields[webhookFieldIndex].value;
		const personalityWebhookStatus = webhooksFieldValue.split("\n")[0];
		const consoleWebhookStatus = webhooksFieldValue.split("\n")[1];

		switch (interaction.customId) {
			case "personality":
				webhooks.personality = webhook;
				embedData.data.fields[webhookFieldIndex].value =
					`${isValidWebhook ? emojis.working : emojis.failed} **Personality**\n${consoleWebhookStatus}`;
				break;
			case "console":
				webhooks.console = webhook;
				embedData.data.fields[webhookFieldIndex].value =
					`${personalityWebhookStatus}\n${isValidWebhook ? emojis.working : emojis.failed} **Console**`;
		}

		await db.set("webhooks", webhooks);
		await message.edit({ embeds: [embedData] });
	},
};
