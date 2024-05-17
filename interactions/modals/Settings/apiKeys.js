/**
 * @file APIKey Settings Modal.
 * @author TechyGiraffe999
 */

/**
 * @type {import("../../../../typings").ModalInteractionCommand}
 */
const fs = require("fs").promises;
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const { checkAPIKey } = require("../../../functions/other/utils");
const { emojis } = require("../../../config.json");
const { QuickDB } = require("quick.db");
const db = new QuickDB({
	filePath: path.join(__dirname, "../../../functions/other/settings.sqlite"),
});

module.exports = {
	id: ["gemini", "prodia"],

	async execute(interaction) {
		const apiKeyName =
			interaction.customId.charAt(0).toUpperCase() +
			interaction.customId.slice(1);
		embed = new EmbedBuilder()
			.setDescription(`**${emojis.loading} Checking ${apiKeyName} API Key**`)
			.setColor("Green");

		await interaction.reply({ embeds: [embed], ephemeral: true });
		const apiKey = interaction.fields.getTextInputValue("apiKey");
		const apiKeys = await db.get("apiKeys");

		if (apiKeys[interaction.customId] === apiKey) {
			const alreadyRegistered = new EmbedBuilder()
				.setDescription(
					`**🔑 ${apiKeyName} API Key is already registered. (Duplicate Key)**`,
				)
				.setColor("Yellow");
			await interaction.editReply({
				embeds: [alreadyRegistered],
				ephemeral: true,
			});
			return;
		}

		let isValidKey;
		isValidKey = await checkAPIKey(interaction.customId, apiKey);

		if (!isValidKey) {
			const invalidKey = new EmbedBuilder()
				.setDescription(
					`**🔑 ${apiKeyName} API Key Checking Failed, Key invalid**`,
				)
				.setColor("Red");
			await interaction.editReply({ embeds: [invalidKey] });
			return;
		}

		const successEmbed = new EmbedBuilder()
			.setDescription(
				`**🔑 ${apiKeyName} API Key Checking Successful, the Key was updated!**`,
			)
			.setColor("Green");
		await interaction.editReply({ embeds: [successEmbed] });

		const message = await interaction.message.fetch();
		const embedData = message.embeds[0];

		const apiKeysFieldIndex = embedData.data.fields.findIndex(
			(field) => field.name === "🔑 API Keys:",
		);
		const apiKeysFieldValue = embedData.data.fields[apiKeysFieldIndex].value;
		const prodiaKeyStatus = apiKeysFieldValue.split("\n")[0];
		const geminiKeyStatus = apiKeysFieldValue.split("\n")[1];

		switch (interaction.customId) {
			case "prodia":
				apiKeys.prodia = apiKey;
				embedData.data.fields[apiKeysFieldIndex].value =
					`${isValidKey ? emojis.working : emojis.failed} **Prodia**\n${geminiKeyStatus}`;
				break;
			case "gemini":
				apiKeys.gemini = apiKey;
				embedData.data.fields[apiKeysFieldIndex].value =
					`${prodiaKeyStatus}\n${isValidKey ? emojis.working : emojis.failed} **Gemini**`;
		}

		await db.set("apiKeys", apiKeys);
		await message.edit({ embeds: [embedData] });
	},
};
