/**
 * @file  Mention Handler
 * @author TechyGiraffe999
 */

const { Events, EmbedBuilder } = require("discord.js");


module.exports = {
	name: Events.MessageCreate,


	async execute(message) {

		const {client} = message;

		if (
			message.content == `<@${client.user.id}>` ||
			message.content == `<@!${client.user.id}>`
		) {
			const bot_message = new EmbedBuilder()
				.setDescription(`Hi ${message.author}! I am Taurus. Chat to me by mentioning me and typing your message! Or alternatively run \`/taurus:ask\`!`)
				.setColor("Gold");

			return message.reply({embeds: [bot_message]});
		}
	},
};
