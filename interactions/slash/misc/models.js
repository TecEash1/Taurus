/**
 * @file Models Slash Command
 * @author TechyGiraffe999
 */

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {XProdiaKey} = require('../../../config.json')


module.exports = {
  data: new SlashCommandBuilder()
    .setName('models')
    .setDescription('List the available models for image generation!'),

  async execute(interaction, client) {
    
    if (!XProdiaKey || XProdiaKey.length < 4) {
      invalid_api = new EmbedBuilder()
          .setTitle("⚠️ Invalid API Key")
          .setDescription("> **The API Key for Prodia is invalid or not provided.**")
          .setColor("Red")
      return interaction.reply({ embeds: [invalid_api] });
   }

    const error = new EmbedBuilder()
      .setTitle("⚠️ An Unknown Error Occured")
      .setDescription("> **The Prodia API Key usage may have been used up, or the API is invalid or not working at the moment.**\n\n> Please try again later or contact the developers.")
      .setColor("Red")

    await interaction.deferReply();

    const sdk = require('api')('@prodia/v1.3.0#6fdmny2flsvwyf65');

    sdk.auth(XProdiaKey);

    let choices = []
    sdk.listModels()
      .then(({ data }) => {
        choices = JSON.parse(data);

        const choices_string = "```\n- " + choices.join("\n- ") + "\n```";
        
        const models = new EmbedBuilder()
          .setTitle('🖼️ Available Models')
          .setDescription(choices_string)
          .setColor('Random')

        return interaction.followUp({embeds: [models]});
      })
      .catch(err => interaction.followUp({embeds: [error]}));
    }
};

