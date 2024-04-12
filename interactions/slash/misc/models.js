/**
 * @file Models Slash Command
 * @author TechyGiraffe999
 */

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { XProdiaKey } = require("../../../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("models")
		.setDescription("List the available models for image generation!"),

	async execute(interaction, client) {
		if (!XProdiaKey || XProdiaKey.length < 4) {
			invalid_api = new EmbedBuilder()
				.setTitle("⚠️ Invalid API Key")
				.setDescription(
					"> **The API Key for Prodia is invalid or not provided.**\n> **Please contact the developers**",
				)
				.setColor("Red");
			return interaction.reply({ embeds: [invalid_api] });
		}

		const error = new EmbedBuilder()
			.setTitle("⚠️ An Unknown Error Occured")
			.setDescription(
				"> **The Prodia API Key usage may have been used up, or the API is invalid or not working at the moment.**\n\n> Please try again later or contact the developers.",
			)
			.setColor("Red");

		await interaction.deferReply();

		const sdk = require("api")("@prodia/v1.3.0#6fdmny2flsvwyf65");

		sdk.auth(XProdiaKey);

		async function fetchAndFormatModels(apiMethod) {
			try {
				const { data } = await apiMethod();
				const models = JSON.parse(data);
				return "```\n- " + models.join("\n- ") + "\n```";
			} catch (e) {
				return interaction.followUp({ embeds: [error] });
			}
		}

		const choices_string = await fetchAndFormatModels(sdk.listModels);
		const sdxlChoices_string = await fetchAndFormatModels(sdk.listSdxlModels);

		const models = new EmbedBuilder()
			.setTitle("🖼️ Available Models")
			.setDescription(
				`**\n🌟 SD Models:**\n\n ${choices_string}\n\n**🚀 SDXL Models:**\n\n ${sdxlChoices_string}`,
			)
			.setColor("Random");

		return interaction.followUp({ embeds: [models] });
	},
};
