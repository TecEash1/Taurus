/**
 * @file Settings API Key button interaction
 * @author TechyGiraffe999
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
const {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require("discord.js");
const { checkOwnerAndReply } = require("../../../functions/other/utils");
module.exports = {
	id: ["gemini", "prodia"],

	async execute(interaction) {
		if (!checkOwnerAndReply(interaction)) {
			return;
		}
		const modal = new ModalBuilder()
			.setCustomId(`${interaction.customId}`)
			.setTitle("API Key Configuration");

		const apiKeyForm = new TextInputBuilder()
			.setCustomId("apiKey")
			.setLabel("Your API Key")
			.setPlaceholder("Your API Key Here")
			.setMinLength(35)
			.setMaxLength(50)
			.setStyle(TextInputStyle.Short);

		modal.addComponents(new ActionRowBuilder().addComponents(apiKeyForm));
		return await interaction.showModal(modal);
	},
};
