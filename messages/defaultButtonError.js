/**
 * @file Default Error Message On Error Button Interaction
 * @author Naman Vrati
 * @since 3.0.0
 */
const excluded_ids = ["yes_botai_personality", "no_botai_personality"];

module.exports = {
	/**
	 * @description Executes when the button interaction could not be fetched.
	 * @author Naman Vrati
	 * @param {import('discord.js').ButtonInteraction} interaction The Interaction Object of the command.
	 */

	async execute(interaction) {
		if (excluded_ids.includes(interaction.customId)) return;
		await interaction.reply({
			content: "There was an issue while fetching this button!",
			ephemeral: true,
		});
		return;
	},
};
