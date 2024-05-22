/**
 * @file Settings Other/Model Button interaction
 * @author TechyGiraffe999
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
const { EmbedBuilder } = require("discord.js");
const path = require("path");
const { QuickDB } = require("quick.db");
const { emojis } = require("../../../config.json");
const db = new QuickDB({
	filePath: path.join(__dirname, "../../../functions/other/settings.sqlite"),
});
const { checkOwnerAndReply } = require("../../../functions/other/utils");

module.exports = {
	id: ["fallbackSystem", "safetySystem", "model"],

	async execute(interaction) {
		if (!checkOwnerAndReply(interaction)) {
			return;
		}
		const modelSettings = await db.get("model");
		let updatedSetting;

		switch (interaction.customId) {
			case "fallbackSystem":
				modelSettings.fallbackSystem = !modelSettings.fallbackSystem;
				updatedSetting = `**🛡️ Fallback System ${modelSettings.fallbackSystem ? "Enabled" : "Disabled"}**`;
				break;
			case "safetySystem":
				modelSettings.safetySystem = !modelSettings.safetySystem;
				updatedSetting = `**${modelSettings.safetySystem ? "🔒" : "🔓"} Safety System ${modelSettings.safetySystem ? "Enabled" : "Disabled"}**`;
				break;
			case "model":
				modelSettings.model =
					modelSettings.model === "gemini-1.5-flash-latest"
						? "gemini-1.5-pro-latest"
						: "gemini-1.5-flash-latest";
				updatedSetting = `**🧠 Model switched to \`\`${modelSettings.model === "gemini-1.5-flash-latest" ? "Gemini 1.5 Flash" : "Gemini 1.5 Pro"}\`\`**`;
				break;
		}

		await db.set("model", modelSettings);
		const embed = new EmbedBuilder()
			.setDescription(updatedSetting)
			.setColor("Green");

		const message = await interaction.message.fetch();
		const embedData = message.embeds[0];
		const otherFieldIndex = embedData.data.fields.find(
			(field) => field.name === "🧠 Model:",
		);
		otherFieldIndex.value = `${modelSettings.fallbackSystem ? emojis.working : emojis.failed} **Fallback System**\n${modelSettings.safetySystem ? emojis.working : emojis.failed} **Safety System**\n${modelSettings.model === "gemini-1.5-flash-latest" ? "⚡" : "💪"} **${modelSettings.model
			.replace(/-latest$/, "")
			.replace(/-/g, " ")
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ")}**`;

		message.edit({ embeds: [embedData] });

		return await interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	},
};
