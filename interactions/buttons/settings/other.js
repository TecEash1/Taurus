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
	id: ["blockNSFWImages"],

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
		otherFieldIndex.value = `${otherSettings.blockNSFWImages ? emojis.working : emojis.failed} **NSFW Image Blocking**`;

		message.edit({ embeds: [embedData] });

		return await interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	},
};
