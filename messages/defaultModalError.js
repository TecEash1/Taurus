/**
 * @file Default Error Message On Error Modal Interaction
 * @author Naman Vrati & TechyGiraffe999
 */
const { EmbedBuilder } = require("discord.js");

const error = new EmbedBuilder()
	.setDescription(
		"**There was an issue while fetching this modal!\n\nPlease contact the Developers.**",
	)
	.setColor("Red");

module.exports = {
	/**
	 * @description Executes when the modal interaction could not be fetched.
	 * @author Naman Vrati
	 * @param {import('discord.js').ModalSubmitInteraction} interaction The Interaction Object of the command.
	 */

	async execute(interaction) {
		await interaction.reply({
			embeds: [error],
			ephemeral: true,
		});
		return;
	},
};
