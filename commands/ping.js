const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "ping",
  cooldown: 10,
  description: "Show the bot's average ping",
  execute(message) {
    const embed = new MessageEmbed()
      .setAuthor('Ping!', 'https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif')
      .setDescription(`🏓Pong: ${Math.round(message.client.ws.ping)} ms`)
      .setColor("#03A9F4");
    
    message.channel.send(embed)
  }
};
