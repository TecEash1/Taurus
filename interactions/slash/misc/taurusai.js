/**
 * @file TaurusAI Slash Command.
 * @author TechyGiraffe999
 */

const {
	SlashCommandBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	EmbedBuilder,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("taurus")
		.setDescription("Ask Taurus a question!"),
	async execute(interaction) {
		const taurus = new ModalBuilder()
			.setTitle("Ask TaurusAI something")
			.setCustomId("taurus_ai");

		const question = new TextInputBuilder()
			.setCustomId("question_taurusai")
			.setRequired(true)
			.setLabel("Question:")
			.setStyle(TextInputStyle.Paragraph);

		const taurusai_question_ActionRow = new ActionRowBuilder().addComponents(
			question,
		);
		taurus.addComponents(taurusai_question_ActionRow);
		await interaction.showModal(taurus);
	},
};
