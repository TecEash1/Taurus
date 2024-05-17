/**
 * @file Settings Webhook button interaction
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
	id: ["personality", "console"],

	async execute(interaction) {
		if (!checkOwnerAndReply(interaction)) {
			return;
		}
		const modal = new ModalBuilder()
			.setCustomId(`${interaction.customId}`)
			.setTitle("Webhook Configuration");

		const webhookForm = new TextInputBuilder()
			.setCustomId("webhook")
			.setLabel("Your Webhook")
			.setPlaceholder("Your Webhook URL Here")
			.setStyle(TextInputStyle.Paragraph);

		modal.addComponents(new ActionRowBuilder().addComponents(webhookForm));
		return await interaction.showModal(modal);
	},
};
