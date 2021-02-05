const createBar = require("string-progressbar");
const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "np",
  description: "Show now playing song",
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.reply("There is nothing playing.").catch(console.error);

    const song = queue.songs[0];
    const seek = (queue.connection.dispatcher.streamTime - queue.connection.dispatcher.pausedTime) / 1000;
    const left = song.duration - seek;

    let nowPlaying = new MessageEmbed()
      .setAuthor('Now playing', 'https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif')
      .setDescription(`[**${song.title}**](${song.url})`)
      .setColor("#03a9f4")
      .setFooter('Aniket ©', 'https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif');

    if (song.duration > 0) {
      nowPlaying.addField(
        "\u200b",
        new Date(seek * 1000).toISOString().substr(11, 8) +
          "[" +
          createBar(song.duration == 0 ? seek : song.duration, seek, 20)[0] +
          "]" +
          (song.duration == 0 ? " ◉ LIVE" : new Date(song.duration * 1000).toISOString().substr(11, 8))+ "]" + "\n" + "\n **Time Remaining:**" + "``" + new Date(left * 1000).toISOString().substr(11, 8) + "``",
        false
      );
    }
    
    return message.channel.send(nowPlaying);
  }
};
