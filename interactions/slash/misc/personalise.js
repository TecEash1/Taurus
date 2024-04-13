/**
 * @file Personalise Slash Command
 * @author TechyGiraffe999
 */

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */

const {
	SlashCommandBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	EmbedBuilder,
	ButtonBuilder,
	WebhookClient,
} = require("discord.js");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const {
	webhook_url_personality_logs,
	webhook_avatar_url,
	owner,
} = require("../../../config.json");

const no_access = new EmbedBuilder()
	.setDescription(
		"**⚠️ Only my developers can update/view my global personality prompt!**\n\n> *If you want to suggest a change, please let us know!*",
	)
	.setColor("Red");

const link_error = new EmbedBuilder()
	.setDescription("**The file link is not a valid URL!**")
	.setColor("Red");

const error_null = new EmbedBuilder()
	.setDescription("**You must select at least one option!**")
	.setColor("Red");

const error_multiple = new EmbedBuilder()
	.setDescription("**You can only select one option!**")
	.setColor("Red");

const file_read_error = new EmbedBuilder()
	.setDescription("**There was an error while reading the file!**")
	.setColor("Red");

const txt_only = new EmbedBuilder()
	.setDescription("**You can only upload a .txt file!**")
	.setColor("Red");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("personalise")
		.setDescription("Customise my Personality!")
		.addAttachmentOption((option) =>
			option
				.setRequired(false)
				.setName("file")
				.setDescription("The personality text file"),
		)
		.addStringOption((option) =>
			option
				.setRequired(false)
				.setName("file-link")
				.setDescription("The personality text file link"),
		)
		.addStringOption((option) =>
			option
				.setName("other")
				.setDescription("Other Options")
				.addChoices(
					{ name: "Get", value: "get" },
					{ name: "Modal", value: "modal" },
				),
		),

	async execute(interaction) {
		const file = interaction.options.getAttachment("file");
		const file_link = interaction.options.getString("file-link");
		const other = interaction.options.getString("other");

		if (!owner.includes(interaction.user.id)) {
			return await interaction.reply({ embeds: [no_access], ephemeral: true });
		}

		const selectedOptions = [file, file_link, other].filter(
			(option) => option != null,
		).length;

		if (selectedOptions === 0 || selectedOptions > 1) {
			const errorMessage = selectedOptions === 0 ? error_null : error_multiple;
			return await interaction.reply({
				embeds: [errorMessage],
				ephemeral: true,
			});
		}

		const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
		if (file_link && !urlRegex.test(file_link)) {
			return interaction.reply({ embeds: [link_error], ephemeral: true });
		}

		let personalityPrompt;

		async function getPersonalityPrompt(file, file_link) {
			const url = file?.url || file_link;

			try {
				const response = await axios.get(url);
				return response.data;
			} catch (error) {
				return error;
			}
		}

		if (file || file_link) {
			const url = file?.url || file_link;

			const txtRegex = /\.txt(?=\?|$)/;
			if (!txtRegex.test(url)) {
				return await interaction.reply({ embeds: [txt_only], ephemeral: true });
			}

			const result = await getPersonalityPrompt(file, file_link);

			if (result instanceof Error) {
				return await interaction.reply({
					embeds: [file_read_error],
					ephemeral: true,
				});
			} else {
				personalityPrompt = result;
			}
		}

		const personalityFilePath = path.join(
			__dirname + "../../../../personality.txt",
		);

		let personalityContent;
		try {
			personalityContent = await fs.readFile(personalityFilePath, "utf-8");
		} catch (err) {
			console.error(err);
		}

		let submitted;
		let modal_error;

		if (other) {
			switch (other) {
				case "get":
					return await interaction.reply({
						files: [
							{ attachment: personalityFilePath, name: "personality.txt" },
						],
						ephemeral: true,
					});
				case "modal":
					const personalise = new ModalBuilder()
						.setTitle("Customise how Taurus responds")
						.setCustomId("taurus_ai_personality");

					const prompt = new TextInputBuilder()
						.setCustomId("personalise_taurusai")
						.setRequired(true)
						.setLabel("Personality Prompt:")
						.setStyle(TextInputStyle.Paragraph);
					const prompt2 = new TextInputBuilder()
						.setCustomId("personalise_taurusai2")
						.setRequired(false)
						.setLabel("Extra Space:")
						.setStyle(TextInputStyle.Paragraph);
					const prompt3 = new TextInputBuilder()
						.setCustomId("personalise_taurusai3")
						.setRequired(false)
						.setLabel("Extra Space:")
						.setStyle(TextInputStyle.Paragraph);

					const taurusai_personality_ActionRow =
						new ActionRowBuilder().addComponents(prompt);
					const taurusai_personality_ActionRow2 =
						new ActionRowBuilder().addComponents(prompt2);
					const taurusai_personality_ActionRow3 =
						new ActionRowBuilder().addComponents(prompt3);

					personalise.addComponents(
						taurusai_personality_ActionRow,
						taurusai_personality_ActionRow2,
						taurusai_personality_ActionRow3,
					);
					await interaction.showModal(personalise);

					submitted = await interaction
						.awaitModalSubmit({
							time: 300000,
							filter: (i) => i.user.id === interaction.user.id,
						})
						.catch((error) => {
							modal_error = true;
							return false;
						});

					if (submitted) {
						personalityPrompt = await submitted.fields.getTextInputValue(
							"personalise_taurusai",
						);
						const personalityPrompt2 = await submitted.fields.getTextInputValue(
							"personalise_taurusai2",
						);
						const personalityPrompt3 = await submitted.fields.getTextInputValue(
							"personalise_taurusai3",
						);
						if (personalityPrompt2) {
							personalityPrompt += personalityPrompt2;
						}
						if (personalityPrompt3) {
							personalityPrompt += personalityPrompt3;
						}
					}
			}
		}

		if (modal_error) return;

		success = new EmbedBuilder()
			.setDescription("✅ **Personality prompt updated successfully!**")
			.setColor("Green");

		cancel = new EmbedBuilder()
			.setDescription("❌ **Operation cancelled.**")
			.setColor("Red");

		const error = new EmbedBuilder()
			.setDescription(
				"**⚠️ There was an error while fetching the TaurusAI Log channel, please contact the Developers.**",
			)
			.setColor("Red");

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId("yes_botai_personality")
				.setLabel("Update")
				.setEmoji("✅")
				.setStyle("Primary"),
			new ButtonBuilder()
				.setCustomId("no_botai_personality")
				.setLabel("Cancel")
				.setEmoji("❌")
				.setStyle("Primary"),
		);

		let personalityContent_truncate = personalityContent;
		if (personalityContent.length > 2002) {
			personalityContent_truncate =
				personalityContent.substring(0, 2002) + "...";
		}

		let personalityPrompt_truncate = personalityPrompt;
		if (personalityPrompt.length > 2002) {
			personalityPrompt_truncate = personalityPrompt.substring(0, 2002) + "...";
		}

		let description = `**Current personality prompt:**\n\`\`\`${personalityContent_truncate}\`\`\`\n\n**New personality prompt:**\n\`\`\`${personalityPrompt_truncate}\`\`\``;

		embed = new EmbedBuilder()
			.setTitle("Are you sure you want to update the personality prompt?")
			.setDescription(description)
			.setFooter({
				text: `⚠️ This will wipe the old Prompt, resetting it with the new one.`,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setColor("Orange");

		await (submitted ?? interaction).reply({
			embeds: [embed],
			components: [row],
			files: [
				{ attachment: personalityFilePath, name: "current_personality.txt" },
			],
			ephemeral: true,
		});

		const filter = (i) =>
			i.customId === "yes_botai_personality" ||
			i.customId === "no_botai_personality";
		const collector = interaction.channel.createMessageComponentCollector({
			filter,
			time: 60000,
		});

		collector.on("collect", async (i) => {
			collector.stop();
			if (i.customId === "yes_botai_personality") {
				const personalityFilePath = path.join(
					__dirname,
					"../../../personality.txt",
				);
				const tempFilePath = path.join(__dirname, "temp.txt");

				let oldPersonalityContent;
				try {
					oldPersonalityContent = await fs.readFile(
						personalityFilePath,
						"utf-8",
					);
					await fs.writeFile(tempFilePath, oldPersonalityContent);
				} catch (err) {
					console.error(err);
				}

				await fs.writeFile(personalityFilePath, personalityPrompt);

				try {
					const webhookClient = new WebhookClient({
						url: webhook_url_personality_logs,
					});

					update = new EmbedBuilder()
						.setDescription(
							`**Personality prompt updated by <@${interaction.user.id}>**`,
						)
						.setColor("Orange")
						.setFooter({
							text: `ID: ${interaction.user.id}`,
							iconURL: interaction.user.displayAvatarURL(),
						})
						.setTimestamp();

					await webhookClient.send({
						username: "Taurus Personality",
						avatarURL: webhook_avatar_url,
						embeds: [update],
						files: [
							{ attachment: personalityFilePath, name: "new_personality.txt" },
							{ attachment: tempFilePath, name: "old_personality.txt" },
						],
					});
					await i.update({ embeds: [success], components: [], files: [] });
				} catch (err) {
					await i.update({
						embeds: [success, error],
						components: [],
						files: [],
					});
				}

				try {
					await fs.unlink(tempFilePath);
				} catch (err) {
					console.error(err);
				}
			} else {
				await i.update({ embeds: [cancel], components: [], files: [] });
			}
		});
	},
};
