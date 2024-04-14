/**
 * @file Ready Event File.
 * @author Naman Vrati
 * @since 1.0.0
 * @version 3.2.2
 */

const { Events, ActivityType } = require("discord.js");

module.exports = {
	name: Events.ClientReady,
	once: true,

	/**
	 * @description Executes when client is ready (bot initialization).
	 * @param {import('../typings').Client} client Main Application Client.
	 */
	execute(client) {
		client.user.setPresence({
			activities: [
				{
					type: ActivityType.Custom,
					name: "Status",
					state: "💾 Chilling on my owners computer!",
				},
			],
		});

		setTimeout(() => {
			console.log(`Ready! Logged in as ${client.user.tag}`);
		}, 25);
	},
};
