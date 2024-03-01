/**
 * @file TaurusAI Slash Command.
 * @author TechyGiraffe999
 */

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const { owner } = require("../../../config.json");

const no_access = new EmbedBuilder()
	.setDescription("**Only my developers can directly update my personality prompt!**\n\nIf you want to suggest a change, please let us know!")
	.setColor("Red");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('taurus')
        .setDescription('Ask Taurus a question!')
        .addStringOption(option =>
			option.setName("options")
				.setDescription("Category info options")
				.setRequired(true)
				.addChoices(
					{ name: "Personalise", value: "personalise" },
					{ name: "Ask", value: "ask" }
				)),
    async execute(interaction) {
        const { options } = interaction;
        const categorys = options.getString('options');

        switch (categorys) {
            case "ask":
                const taurus = new ModalBuilder()
					.setTitle("Ask TaurusAI something")
					.setCustomId("taurus_ai");

				const question = new TextInputBuilder()
					.setCustomId("question_taurusai")
					.setRequired(true)
					.setLabel("Question:")
					.setStyle(TextInputStyle.Paragraph);
				const taurusai_question_ActionRow = new ActionRowBuilder().addComponents(question);
				taurus.addComponents(taurusai_question_ActionRow);
				await interaction.showModal(taurus);
				break;
            case "personalise":
				if (!owner.includes(interaction.user.id)) {
					return await interaction.reply({ embeds: [no_access], ephemeral: true });
				}

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


				const taurusai_personality_ActionRow = new ActionRowBuilder().addComponents(prompt);
				const taurusai_personality_ActionRow2 = new ActionRowBuilder().addComponents(prompt2);
				const taurusai_personality_ActionRow3 = new ActionRowBuilder().addComponents(prompt3);

				personalise.addComponents(taurusai_personality_ActionRow, taurusai_personality_ActionRow2, taurusai_personality_ActionRow3);
				await interaction.showModal(personalise);
				break;

        }
    }
};