/**
 * @file TaurusAI Personality Prompt Modal.
 * @author TechyGiraffe999
 */

/**
 * @type {import("../../../../typings").ModalInteractionCommand}
 */
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
const fs = require('fs').promises;
const path = require('path');

const guild_id_logs = process.env.GUILD_ID_LOGS;
const channel_id_logs = process.env.CHANNEL_ID_LOGS;

const serverId = guild_id_logs;
const channelId = channel_id_logs;

module.exports = {
    id: "taurus_ai_personality",

    async execute(interaction) {
        let personalityPrompt = interaction.fields.getTextInputValue("personalise_taurusai");
        const personalityPrompt2 = interaction.fields.getTextInputValue("personalise_taurusai2");
        const personalityPrompt3 = interaction.fields.getTextInputValue("personalise_taurusai3");

        if (personalityPrompt2) {
                personalityPrompt +=  personalityPrompt2;
        }
        if (personalityPrompt3) {
            personalityPrompt +=  personalityPrompt3;
        
        }
        
        const personalityFilePath = __dirname + '../../../../personality.txt';

        let personalityContent;
        try {
            personalityContent = await fs.readFile(personalityFilePath, 'utf-8');
        } catch (err) {
            console.error(err);
        }
        
        success = new EmbedBuilder()
            .setDescription("✅ **Personality prompt updated successfully!**")
            .setColor("Green");
        
        cancel = new EmbedBuilder()
            .setDescription("❌ **Operation cancelled.**")
            .setColor("Red");

        const error = new EmbedBuilder()
            .setDescription("⚠️ There was an error while fetching the TaurusAI Log channel, please contact the Developers.")
            .setColor("Red");

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('yes_botai_personality')
                    .setLabel('Update')
                    .setEmoji('✅')
                    .setStyle('Primary'),
                new ButtonBuilder()
                    .setCustomId('no_botai_personality')
                    .setLabel('Cancel')
                    .setEmoji('❌')
                    .setStyle('Primary'),
            );

        let personalityContent_truncate = personalityContent;
        if (personalityContent.length > 2002) {
            personalityContent_truncate = personalityContent.substring(0, 2002) + '...';
        }
            
        let personalityPrompt_truncate = personalityPrompt;
        if (personalityPrompt.length > 2002) {
            personalityPrompt_truncate = personalityPrompt.substring(0, 2002) + '...';
        }
            
        let description = `**Current personality prompt:**\n\`\`\`${personalityContent_truncate}\`\`\`\n\n**New personality prompt:**\n\`\`\`${personalityPrompt_truncate}\`\`\``;

        embed = new EmbedBuilder()
            .setTitle("Are you sure you want to update the personality prompt?")
            .setDescription(description)
            .setFooter({ text: `⚠️ This will wipe the old Prompt, resetting it with the new one.`, iconURL: interaction.user.displayAvatarURL() })
            .setColor("Orange")


        await interaction.reply({ 
            embeds: [embed], 
            components: [row], 
            files: [{ attachment: personalityFilePath, name: 'current_personality.txt' }],
            ephemeral: true 
        });

        const filter = i => i.customId === 'yes_botai_personality' || i.customId === 'no_botai_personality';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'yes_botai_personality') {

                const personalityFilePath = path.join(__dirname, '../../../personality.txt');
                const tempFilePath = path.join(__dirname, 'temp.txt');
        
                let oldPersonalityContent;
                try {
                    oldPersonalityContent = await fs.readFile(personalityFilePath, 'utf-8');
                    await fs.writeFile(tempFilePath, oldPersonalityContent);
                } catch (err) {
                    console.error(err);
                }
        
                await fs.writeFile(personalityFilePath, personalityPrompt);
                
                try{ 
                    const guild = interaction.client.guilds.cache.get(serverId);
                    const channel = guild.channels.cache.get(channelId);

        
                update = new EmbedBuilder()
                    .setDescription(`**Personality prompt updated by <@${interaction.user.id}>**`)
                    .setColor("Orange")
                    .setFooter({ text: `ID: ${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                await channel.send({
                    embeds: [update],
                    files: [
                        { attachment: personalityFilePath, name: 'new_personality.txt' },
                        { attachment: tempFilePath, name: 'old_personality.txt' }
                    ]
                });
                await i.update({ embeds: [success], components: [], files: []  });
                } catch (err) {
                    await i.update({ embeds: [success,error], components: [], files: [] });
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
    }
};