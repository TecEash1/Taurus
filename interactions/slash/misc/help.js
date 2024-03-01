/**
 * @file Help Command
 * @author TechyGiraffe999
 */


const { EmbedBuilder, SlashCommandBuilder, Embed } = require("discord.js");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display available slash commands'),
  async execute(interaction, client) {
    const commands = interaction.client.slashCommands;
    const commandList = commands.map((command) => `**/${command.data.name}**: ${command.data.description}`).join('\n');

	const embed = new EmbedBuilder()
		.setTitle("⚙️ Available Commands")
		.setDescription(commandList)
		.setColor("Blurple")

    await interaction.reply({ embeds: [embed] });
  },
};