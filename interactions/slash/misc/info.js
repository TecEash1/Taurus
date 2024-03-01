/**
 * @file Info Command
 * @author TechyGiraffe999
 */


const { EmbedBuilder, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Displays info on me!'),
  async execute(interaction) {

    const github = new ButtonBuilder()
      .setURL('https://github.com/TecEash1/taurus')
      .setLabel('GitHub Repository')
      .setEmoji("⚒️")
      .setStyle(ButtonStyle.Link);

    const buttons = new ActionRowBuilder()
		  .addComponents(github);

    let totalSecs = (interaction.client.uptime / 1000);
    let days = Math.floor(totalSecs / 86400);totalSecs %= 86400;
    let hrs = Math.floor(totalSecs / 3600);totalSecs %= 3600;
    let mins = Math.floor(totalSecs / 60);
    let seconds = Math.floor(totalSecs % 60);
    let uptime = `**${days}**d **${hrs}**h **${mins}**m **${seconds}**s`;

	const embed = new EmbedBuilder()
		.setTitle("🤖 Info")
		.setDescription("I am a bot created by TechyGiraffe999. I was made to be a specialised AI Bot.")
    .addFields(
        { name: `**⌛ UPTIME**`, value: `${uptime}`},
        { name: `**📡 PING**`, value: `Responded in \`\`${interaction.client.ws.ping}ms\`\``}
    )
    .setThumbnail("https://github.com/TecEash1/TecEash1/assets/92249532/bd4aca7e-daab-4eeb-9265-e53cc1925e8c")
		.setColor("Blurple");

    await interaction.reply({ embeds: [embed], components: [buttons]});
  },
};