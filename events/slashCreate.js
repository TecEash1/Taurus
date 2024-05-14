/**
 * @file Slash Command Interaction Handler
 * @author Naman Vrati
 * @contributor TechyGiraffe999
 * @since 3.0.0
 * @version 3.4.0
 */

const { Collection, EmbedBuilder, Events } = require("discord.js"),
	{ botInGuild } = require("../functions/other/utils"),
	{ owner } = require("../config.json");

module.exports = {
	name: Events.InteractionCreate,

	/**
	 * @description Executes when an interaction is created and handle it.
	 * @author Naman Vrati
	 * @param {import("discord.js").CommandInteraction & { client: import("../typings").Client }} interaction The interaction which was created
	 */

	async execute(interaction) {
		// Deconstructed client from interaction object.
		const { client } = interaction;
		// Checks if the interaction is a command (to prevent weird bugs)

		if (!interaction.isChatInputCommand()) return;

		const command = client.slashCommands.get(interaction.commandName);

		// If the interaction is not a command in cache.

		if (!command) return;

		// Cooldowns
		const { cooldowns } = client;
		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Collection());
		}
		const now = Date.now();
		const timestamps = cooldowns.get(command.name);
		const defaultCooldownDuration = 0;
		let cooldownAmount = command.cooldown ?? defaultCooldownDuration;

		if (interaction.inGuild()) {
			if (botInGuild(interaction)) {
				allowedRoleIds = ["...", "..."];
				if (
					interaction.member.roles.cache.some((role) =>
						allowedRoleIds.includes(role.id),
					)
				) {
					const cooldownPercentage = 0.5;
					cooldownAmount = Math.floor(cooldownAmount * cooldownPercentage);
				}
			}
		}

		const isOwner = owner.includes(interaction.user.id);
		if (!isOwner && timestamps.has(interaction.user.id)) {
			const expirationTime =
				timestamps.get(interaction.user.id) + cooldownAmount * 1000;
			const timeLeft = (expirationTime - now) / 1000;
			const embed = new EmbedBuilder()
				.setDescription(
					`Please wait \`\`${timeLeft.toFixed(1)}\`\` more second(s) before reusing the \`${interaction.commandName}\` command.`,
				)
				.setColor("Orange");
			if (now < expirationTime) {
				const expiredTimestamp = Math.round(expirationTime / 1000);
				return interaction.reply({ embeds: [embed], ephemeral: true });
			}
		}

		timestamps.set(interaction.user.id, now);
		setTimeout(
			() => timestamps.delete(interaction.user.id),
			cooldownAmount * 1000,
		);

		const error = new EmbedBuilder()
			.setDescription(
				"**There was an issue while executing that command!\n\nPlease contact the Developers.**",
			)
			.setColor("Red");

		try {
			await command.execute(interaction);
		} catch (err) {
			await interaction.reply({
				embeds: [error],
				ephemeral: true,
			});
		}
	},
};
