const Discord = require('discord.js');
const { MessageEmbed } = require("discord.js");


module.exports = {
  name: "invite",
  description: "Send bot invite link",
  execute(message) {
    const embed = new MessageEmbed()
      .setColor('#03a9f4')
      .setAuthor('Invite V!BE to your Discord server!', 'https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif')
      .addField('<:invite:804697380506042368>Invite Me', '[**Click here to invite me!**](https://discord.com/oauth2/authorize?client_id=802509186059337778&permissions=70282305&scope=bot)', true)
      .addField('<:server:804696840200126504>Support Server', '[**Join for help!**](https://discord.com/invite/GaczkwfgV9)', true)
      .setTimestamp()
      .setFooter('Aniket ©', 'https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif');
    
    message.channel.send(embed)
  }
};
