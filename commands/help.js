const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "help",
  aliases: ["h"],
  description: "**Display all commands and descriptions**",
  execute(message) {
    let commands = message.client.commands.array();

    let helpEmbed = new MessageEmbed()
      .setAuthor('V!BE Help Page', 'https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif')
      .setDescription("List of all commands")
      .setColor("#03A9F4")
      .setFooter('Aniket ©', 'https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif');

    commands.forEach((cmd) => {
      helpEmbed.addField(
        `**${message.client.prefix}${cmd.name} ${cmd.aliases ? `(${cmd.aliases})` : ""}**`,
        `${cmd.description}`,
        true
      );
    });

    helpEmbed.setTimestamp();
    helpEmbed.addField('Important Links<:links:804777389010976788>', '[Invite Me](https://discord.com/oauth2/authorize?client_id=802509186059337778&permissions=70282305&scope=bot)-[Support Server](https://discord.com/invite/GaczkwfgV9)')

    return message.channel.send(helpEmbed).catch(console.error);
  }
};
