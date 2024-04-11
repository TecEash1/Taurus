/**
 * @file Image Autocomplete Interaction
 * @author TechyGiraffe999
 */

/**
 * @type {import("../../../typings").AutocompleteInteraction}
 */

const { XProdiaKey } = require("../../../config.json");

module.exports = {
	name: "image",
	async execute(interaction) {
		const focusedOption = interaction.options.getFocused();

		const sdk = require("api")("@prodia/v1.3.0#6fdmny2flsvwyf65");
		sdk.auth(XProdiaKey);

		async function fetchAndFormatModels(apiMethod) {
			try {
				const { data } = await apiMethod();
				const models = JSON.parse(data);
				return models;
			} catch (e) {
				console.error("Error fetching models: ", e);
			}
		}

		const sdModels = await fetchAndFormatModels(sdk.listModels);
		const sdxlModels = await fetchAndFormatModels(sdk.listSdxlModels);

		const allModels = sdModels.concat(sdxlModels);
		const filteredModels = allModels.filter((model) =>
			model.toLowerCase().startsWith(focusedOption.toLowerCase()),
		);

		const results = filteredModels.map((model) => ({
			name: model,
			value: model,
		}));

		await interaction.respond(results.slice(0, 25)).catch(() => {});
		return;
	},
};
