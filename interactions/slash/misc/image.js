/**
 * @file Image Generation Slash Command
 * @author TechyGiraffe999
 */

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { checkAPIKey } = require("../../../functions/other/utils");
const translate = require("@iamtraction/google-translate");
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({
	filePath: path.join(__dirname, "../../../functions/other/settings.sqlite"),
});
const axios = require("axios");
const tf = require("@tensorflow/tfjs-node");
const nsfw = require("nsfwjs");

let nsfwModelPromise = null;

async function loadNsfwModel() {
	if (!nsfwModelPromise) {
		nsfwModelPromise = nsfw.load();
	}
	return nsfwModelPromise;
}

function resizeImage(imageTensor) {
	const [height, width] = imageTensor.shape.slice(0, 2);
	const aspectRatio = width / height;

	let newWidth, newHeight;

	if (aspectRatio > 1) {
		newHeight = 224;
		newWidth = Math.round(aspectRatio * 224);
	} else {
		newWidth = 224;
		newHeight = Math.round(224 / aspectRatio);
	}

	const resizedImage = tf.image.resizeBilinear(imageTensor, [
		newHeight,
		newWidth,
	]);
	return resizedImage;
}

async function nsfwGetPic(image, nsfw_embed, interaction) {
	const model = await loadNsfwModel();
	const pic = await axios.get(image, { responseType: "arraybuffer" });
	const imageTensor = tf.node.decodeImage(pic.data, 3);

	const resizedImage = resizeImage(imageTensor);
	imageTensor.dispose();

	const predictions = await model.classify(resizedImage);
	resizedImage.dispose();

	if (
		(predictions[0].probability > 0.5 && predictions[0].className === "Porn") ||
		predictions[0].className === "Hentai" ||
		predictions[0].className === "Sexy"
	) {
		await interaction.followUp({ embeds: [nsfw_embed] });
		return true;
	}
	return image;
}

let nsfwWordsCache = null;

async function getNsfwWords() {
	if (!nsfwWordsCache) {
		const response = await fetch(
			"https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en",
		);
		const data = await response.text();
		nsfwWordsCache = data
			.split("\n")
			.filter((word) => word !== "suck" && word !== "sucks");
	}
	return nsfwWordsCache;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("image")
		.setDescription("Have AI generate an image!")
		.addStringOption((o) =>
			o
				.setName("prompt")
				.setDescription("The description of the image to generate!")
				.setRequired(true),
		)
		.addStringOption((o) =>
			o
				.setName("model")
				.setDescription("The Model to Use")
				.setAutocomplete(true),
		)
		.addStringOption((o) =>
			o.setName("negative-prompt").setDescription("The Negative Prompt to Use"),
		)
		.addIntegerOption((option) =>
			option
				.setName("steps")
				.setDescription("The Number of Steps to Use")
				.setMinValue(1)
				.setMaxValue(50),
		)
		.addIntegerOption((option) =>
			option
				.setName("cfg-scale")
				.setDescription("The CFG Scale")
				.setMinValue(1)
				.setMaxValue(20),
		)
		.addIntegerOption((option) =>
			option.setName("seed").setDescription("The Seed").setMinValue(-1),
		)
		.addStringOption((option) =>
			option
				.setName("style-preset")
				.setDescription("The Image Style Preset")
				.addChoices(
					{ name: "3d Model", value: "3d-model" },
					{ name: "Analog Film", value: "analog-film" },
					{ name: "Anime", value: "anime" },
					{ name: "Cinematic", value: "cinematic" },
					{ name: "Comic Book", value: "comic-book" },
					{ name: "Digital Art", value: "digital-art" },
					{ name: "Enhance", value: "enhance" },
					{ name: "Fantasy Art", value: "fantasy-art" },
					{ name: "Isometric", value: "isometric" },
					{ name: "Line Art", value: "line-art" },
					{ name: "Low Poly", value: "low-poly" },
					{ name: "Neon Punk", value: "neon-punk" },
					{ name: "Origami", value: "origami" },
					{ name: "Photographic", value: "photographic" },
					{ name: "Pixel Art", value: "pixel-art" },
					{ name: "Texture", value: "texture" },
					{ name: "Craft Clay", value: "craft-clay" },
				),
		)
		.addStringOption((option) =>
			option.setName("sampler").setDescription("The Image Sampler").addChoices(
				{ name: "Euler a", value: "Euler a" },
				{ name: "LMS", value: "LMS" },
				{ name: "Heun", value: "Heun" },
				{ name: "DPM2", value: "DPM2" },
				{ name: "DPM2 a", value: "DPM2 a" },
				{ name: "DPM++ 2S a", value: "DPM++ 2S a" },
				{ name: "DPM++ 2M", value: "DPM++ 2M" },
				{ name: "DPM++ 2M SDE", value: "DPM++ 2M SDE" },
				{
					name: "DPM++ 2M SDE Heun Karras",
					value: "DPM++ 2M SDE Heun Karras",
				},
				{ name: "DPM++ 3M SD", value: "DPM++ 3M SD" },
				{ name: "DPM++ 3M SD Karras", value: "DPM++ 3M SD Karras" },
				{ name: "DPM++ 3M SD Exponential", value: "DPM++ 3M SD Exponential" },
				{ name: "DPM fast", value: "DPM fast" },
				{ name: "DPM adaptive", value: "DPM adaptive" },
				{ name: "LMS Karras", value: "LMS Karras" },
				{ name: "DPM2 Karras", value: "DPM2 Karras" },
				{ name: "DPM2 a Karras", value: "DPM2 a Karras" },
				{ name: "DPM++ 2S a Karras", value: "DPM++ 2S a Karras" },
				{ name: "DPM++ 2M Karras", value: "DPM++ 2M Karras" },
				{ name: "DPM++ SDE Karras", value: "DPM++ SDE Karras" },
				{ name: "DPM++ SDE Karras", value: "DPM++ SDE Karras" },
				{
					name: "DPM++ 2M SDE Exponential",
					value: "DPM++ 2M SDE Exponential",
				},
				{ name: "DDIM", value: "DDIM" },
				{ name: "PLMS", value: "PLMS" },
				{ name: "UniPC", value: "UniPC" },
			),
		)
		.addBooleanOption((o) =>
			o.setName("upscale").setDescription("Enable 2x Upscale"),
		)
		.addIntegerOption((option) =>
			option
				.setName("width")
				.setDescription("The Width of the Image")
				.setMinValue(1)
				.setMaxValue(1024),
		)
		.addIntegerOption((option) =>
			option
				.setName("height")
				.setDescription("The Height of the Image")
				.setMinValue(1)
				.setMaxValue(1024),
		),

	async execute(interaction) {
		const apiKeys = await db.get("apiKeys");
		const XProdiaKey = apiKeys.prodia;

		const other = await db.get("other");
		const blockNSFWImages = other.blockNSFWImages;

		const invalid_api = new EmbedBuilder()
			.setTitle("⚠️ Invalid API Key")
			.setDescription(
				"> *The API Key for Prodia is invalid or not provided*\n> **Please contact the developers**",
			)
			.setColor("Red");

		if (!XProdiaKey || XProdiaKey.length < 4) {
			return interaction.reply({ embeds: [invalid_api] });
		}

		await interaction.deferReply();

		const isValidKey = await checkAPIKey("prodia", XProdiaKey);
		if (!isValidKey) {
			return interaction.reply({ embeds: [invalid_api] });
		}

		const error = new EmbedBuilder()
			.setTitle("⚠️ Error!")
			.setDescription(
				"**An Error Occured, please try again later!**\n\n> - API Monthly Credits may have been used up\n> - Might be a problem with the API at the moment\n> - Or the Model/Sampler/Style is not available.",
			)
			.setColor("Red");

		const style_preset = interaction.options.getString("style-preset");
		const steps = interaction.options.getInteger("steps");
		const cfg_scale = interaction.options.getInteger("cfg-scale");
		const seed = interaction.options.getInteger("seed");
		const sampler = interaction.options.getString("sampler");
		const upscale = interaction.options.getBoolean("upscale");
		const width = interaction.options.getInteger("width");
		const height = interaction.options.getInteger("height");

		let prompt = interaction.options.getString("prompt");
		let negative_prompt = interaction.options.getString("negative-prompt");
		let model = interaction.options.getString("model");

		prompt = (await translate(prompt, { to: "en" })).text;
		negative_prompt = (await translate(negative_prompt, { to: "en" })).text;

		const nsfw_embed = new EmbedBuilder()
			.setDescription(`**⚠️ NSFW content detected!**`)
			.setColor("Red");

		if (blockNSFWImages) {
			try {
				const nsfw_words = await getNsfwWords();
				let promptWords = prompt.split(" ");
				for (let word of nsfw_words) {
					if (promptWords.includes(word)) {
						await interaction.followUp({ embeds: [nsfw_embed] });
						return;
					}
				}
			} catch (err) {
				console.error(err);
			}
		}

		const sdk = require("api")("@prodia/v1.3.0#6fdmny2flsvwyf65");

		sdk.auth(XProdiaKey);

		async function fetchModels(apiMethod) {
			try {
				const { data } = await apiMethod();
				return JSON.parse(data);
			} catch (e) {
				console.error(e);
				return interaction.followUp({ embeds: [error] });
			}
		}

		const [choices, sdxlChoices] = await Promise.all([
			fetchModels(sdk.listModels),
			fetchModels(sdk.listSdxlModels),
		]);

		const allModels = [...choices, ...sdxlChoices];

		if (model && !allModels.includes(model)) {
			const no_model = new EmbedBuilder()
				.setDescription(
					`**${model}** is not a valid model!\n\n> Run \`/models\` to see the available models!`,
				)
				.setColor("Red");

			return interaction.followUp({ embeds: [no_model] });
		}

		if (!model) {
			model = "absolutereality_V16.safetensors [37db0fc3]";
		}

		let generateParams = {
			model: model,
			prompt: prompt,
			...(style_preset && { style_preset: style_preset }),
			...(negative_prompt && { negative_prompt: negative_prompt }),
			...(steps && { steps: steps }),
			...(sampler && { sampler: sampler }),
			...(cfg_scale && { cfg_scale: cfg_scale }),
			...(seed && { seed: seed }),
			...(upscale && { upscale: upscale }),
			...(width && { width: width }),
			...(height && { height: height }),
		};

		try {
			const generateMethod = sdxlChoices.includes(model)
				? sdk.sdxlGenerate
				: sdk.generate;
			generateMethod(generateParams)
				.then(({ data }) => {
					const jobId = data.job;
					const intervalId = setInterval(() => {
						sdk
							.getJob({ jobId: jobId })
							.then(({ data }) => {
								if (data.status === "succeeded") {
									clearInterval(intervalId);

									let image = data.imageUrl;

									(async () => {
										if (blockNSFWImages) {
											const newImage = await nsfwGetPic(
												image,
												nsfw_embed,
												interaction,
											);
											image = newImage;
											if (image === true) {
												return;
											}
										}

										const success = new EmbedBuilder()
											.setImage(image)
											.setTitle("🖼️ Generated Image!")
											.setDescription(`> **${prompt}**`)
											.setColor("Random")
											.setFooter({
												text: `Requested by ${interaction.user.tag}, Powered By Prodia`,
												iconURL: interaction.user.displayAvatarURL(),
											});

										return interaction.followUp({ embeds: [success] });
									})();
								} else if (data.status === "failed") {
									clearInterval(intervalId);
									return interaction.followUp({ embeds: [error] });
								}
							})
							.catch((err) => console.error(err));
					}, 5000);
				})
				.catch((err) => console.error(err));
		} catch (err) {
			return interaction.followUp({ embeds: [error] });
		}
	},
};
