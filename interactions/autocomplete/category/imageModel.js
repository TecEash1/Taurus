/**
 * @file Image Autocomplete Interaction
 * @author TechyGiraffe999
 */

/**
 * @type {import("../../../typings").AutocompleteInteraction}
 */

const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({
	filePath: path.join(__dirname, "../../../functions/other/settings.sqlite"),
});
module.exports = {
	name: "image",
	async execute(interaction) {
		const focusedOption = interaction.options.getFocused();

		const apiKeys = await db.get("apiKeys");
		const XProdiaKey = apiKeys.prodia;

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

		const [sdModels, sdxlModels] = await Promise.all([
			fetchAndFormatModels(sdk.listModels),
			fetchAndFormatModels(sdk.listSdxlModels),
		]);

		const allModels = [...sdModels, ...sdxlModels];
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
