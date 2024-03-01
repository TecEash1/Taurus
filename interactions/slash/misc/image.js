/**
 * @file Image Generation Slash Command
 * @author TechyGiraffe999
 */


/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {XProdiaKey} = require('../../../config.json')


module.exports = {
  data: new SlashCommandBuilder()
    .setName('image')
    .setDescription('Have AI generate an image!')
    .addStringOption(o => o.setName('prompt').setDescription('The description of the image to generate!').setRequired(true))
    .addStringOption(o => o.setName('model').setDescription('The Model to Use'))
    .addStringOption(o => o.setName('negative-prompt').setDescription('The Negative Prompt to Use'))
    .addIntegerOption(option =>
      option.setName("steps")
          .setDescription("The Number of Steps to Use")
          .setMinValue(1)
          .setMaxValue(30)
    )
    .addIntegerOption(option =>
      option.setName("cfg-scale")
          .setDescription("The CFG Scale")
          .setMinValue(1)
          .setMaxValue(30)
    )
    .addIntegerOption(option =>
      option.setName("seed")
          .setDescription("The Seed")
          .setMinValue(-1)
    )
    .addStringOption(option =>
			option.setName("style-preset")
				.setDescription("The Image Style Prese")
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
				))
    .addStringOption(option =>
			option.setName("sampler")
				.setDescription("The Image Sampler")
				.addChoices(
          { name: "Euler a", value: "Euler a" },
          { name: "LMS", value: "LMS" },
          { name: "Heun", value: "Heun" },
          { name: "DPM2", value: "DPM2" },
          { name: "DPM2 a", value: "DPM2 a" },
          { name: "DPM++ 2S a", value: "DPM++ 2S a" },
          { name: "DPM++ 2M", value: "DPM++ 2M" },
          { name: "DPM++ 2M SDE", value: "DPM++ 2M SDE" },
          { name: "DPM++ 2M SDE Heun Karras", value: "DPM++ 2M SDE Heun Karras" },
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
          { name: "DPM++ 2M SDE Exponential", value: "DPM++ 2M SDE Exponential" },
          { name: "DDIM", value: "DDIM" },
          { name: "PLMS", value: "PLMS" },
          { name: "UniPC", value: "UniPC" },
				)),

  async execute(interaction, client) {
    
    if (!XProdiaKey || XProdiaKey.length < 4) {
      invalid_api = new EmbedBuilder()
          .setTitle("⚠️ Invalid API Key")
          .setDescription("> **The API Key for Prodia is invalid or not provided.**")
          .setColor("Red")
      return interaction.reply({ embeds: [invalid_api] });
   }

    const error = new EmbedBuilder()
      .setTitle('⚠️ Error!')
      .setDescription('**An Error Occured, please try again later!**\n\n> - API Monthly Credits may have been used up\n> - Might be a problem with the API at the moment\n> - Or the Model/Sampler/Style is not available.')
      .setColor('Red');

    await interaction.deferReply();

    const prompt = interaction.options.getString('prompt');
    const style_preset = interaction.options.getString('style-preset');
    const negative_prompt = interaction.options.getString('negative-prompt');
    const steps = interaction.options.getInteger('steps');
    const cfg_scale = interaction.options.getInteger('cfg-scale');
    const seed = interaction.options.getInteger('seed');
    const sampler = interaction.options.getString('sampler');

    let model = interaction.options.getString('model');

    const sdk = require('api')('@prodia/v1.3.0#6fdmny2flsvwyf65');

    sdk.auth(XProdiaKey);

    let choices = []
    sdk.listModels()
    .then(({ data }) => {
      choices = JSON.parse(data);
      choices = choices.filter(choice => choice.includes('.safetensors'));
    })
    .catch(err => console.error(err));

    if (model && !choices.includes(model)) {
      const no_model = new EmbedBuilder()
        .setDescription(`**${model}** is not a valid model!\n\n> Run \`/models\` to see the available models!`)
        .setColor('Red');

      return interaction.followUp({embeds: [no_model]});
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
      ...(seed && { seed: seed })
    };

    try{
      sdk.generate(generateParams)
      .then(({ data }) => {
        const jobId = data.job;
        const intervalId = setInterval(() => {
          sdk.getJob({jobId: jobId})
            .then(({ data }) => {
              if (data.status === 'succeeded') {
                clearInterval(intervalId);

                const image = data.imageUrl;

                const success = new EmbedBuilder()
                  .setImage(image)
                  .setTitle('🖼️ Generated Image!')
                  .setDescription(`> **${prompt}**`)
                  .setColor('Random')
                  .setFooter({ text: `Requested by ${interaction.user.tag}, Powered By Prodia`, iconURL: interaction.user.displayAvatarURL() })
                
                return interaction.followUp({embeds: [success]});

              } else if (data.status === 'failed') {
                clearInterval(intervalId);
                return interaction.followUp({embeds: [error]});
              }
            })
            .catch(err => console.error(err));
        }, 2000); 
      })
      .catch(err => console.error(err));
    } catch(err) {
      return interaction.followUp({embeds: [error]});
    }
  }
}