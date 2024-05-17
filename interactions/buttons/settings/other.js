/**
 * @file Settings Other Button interaction
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
	id: ["blockNSFWImages", "model"],

	async execute(interaction) {
		if (!checkOwnerAndReply(interaction)) {
			return;
		}
		const otherSettings = await db.get("other");
		let updatedSetting;

		switch (interaction.customId) {
			case "blockNSFWImages":
				otherSettings.blockNSFWImages = !otherSettings.blockNSFWImages;
				updatedSetting = `**🔞 NSFW Image Blocking ${otherSettings.blockNSFWImages ? "Enabled" : "Disabled"}**`;
				break;
			case "model":
				otherSettings.model =
					otherSettings.model === "gemini-1.5-flash-latest"
						? "gemini-1.5-pro-latest"
						: "gemini-1.5-flash-latest";
				updatedSetting = `**🧠 Model switched to \`\`${otherSettings.model === "gemini-1.5-flash-latest" ? "Gemini 1.5 Flash" : "Gemini 1.5 Pro"}\`\`**`;
				break;
		}

		await db.set("other", otherSettings);
		const embed = new EmbedBuilder()
			.setDescription(updatedSetting)
			.setColor("Green");

		const message = await interaction.message.fetch();
		const embedData = message.embeds[0];
		const otherFieldIndex = embedData.data.fields.find(
			(field) => field.name === "⚙️ Other:",
		);
		otherFieldIndex.value = `${otherSettings.blockNSFWImages ? emojis.working : emojis.failed} **NSFW Image Blocking**\n${otherSettings.model === "gemini-1.5-flash-latest" ? "⚡" : "💪"} **${otherSettings.model
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
