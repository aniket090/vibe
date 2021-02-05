const ytdl = require("erit-ytdl");
const scdl = require("soundcloud-downloader").default;
const { canModifyQueue, STAY_TIME } = require("../util/EvobotUtil");
const { Client, Collection, MessageEmbed, splitMessage, escapeMarkdown,MessageAttachment } = require("discord.js");
const createBar = require("string-progressbar");
const lyricsFinder = require("lyrics-finder");
const ytsr = require("youtube-sr")

module.exports = {
  async play(song, message, client, filters) {
    const { SOUNDCLOUD_CLIENT_ID } = require("../util/EvobotUtil");

    let config;

    try {
      config = require("../config.json");
    } catch (error) {
      config = null;
    }

    const PRUNING = config ? config.PRUNING : process.env.PRUNING;

    const queue = message.client.queue.get(message.guild.id);

    if (!song) {
      setTimeout(function () {
        if (queue.connection.dispatcher && message.guild.me.voice.channel) return;
        queue.channel.leave();
        queue.textChannel.send("Leaving voice channel...");  
      }, STAY_TIME * 1000);
      queue.textChannel.send("❌ Music queue ended.").catch(console.error);
      return message.client.queue.delete(message.guild.id);
    }

    let stream = null;
    let streamType = song.url.includes("youtube.com") ? "opus" : "ogg/opus";
    let seekTime = 0;
    let oldSeekTime = queue.realseek;
    let encoderArgstoset;
    if (filters === "remove") {
        queue.filters = ['-af','dynaudnorm=f=200'];
        encoderArgstoset = queue.filters;
        try{
          seekTime = (queue.connection.dispatcher.streamTime - queue.connection.dispatcher.pausedTime) / 1000 + oldSeekTime;
        } catch{
          seekTime = 0;
        } 
          queue.realseek = seekTime;
    } else if (filters)
    {
      try{
        seekTime = (queue.connection.dispatcher.streamTime - queue.connection.dispatcher.pausedTime) / 1000 + oldSeekTime;
      } catch{
        seekTime = 0;
      } 
        queue.realseek = seekTime;
        queue.filters.push(filters)
        encoderArgstoset = ['-af', queue.filters]
    }

    try {
      if (song.url.includes("youtube.com")) {
        stream = await ytdl(song.url, { 
          filter: "audioonly",
          bitrate: 320,
          seek: seekTime, 
          highWaterMark: 1 << 25,
      
        });
      } else if (song.url.includes("soundcloud.com")) {
        try {
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.OPUS, SOUNDCLOUD_CLIENT_ID);
        } catch (error) {
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.MP3, SOUNDCLOUD_CLIENT_ID);
          streamType = "unknown";
        }
      }
    } catch (error) {
      if (queue) {
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      }

      console.error(error);
      return message.channel.send(`Error: ${error.message ? error.message : error}`);
    }

    queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));

    const dispatcher = queue.connection
      .play(stream, { type: streamType })
      .on("finish", () => {
        if (collector && !collector.ended) collector.stop();

        if (queue.loop) {
          // if loop is on, push the song back at the end of the queue
          // so it can repeat endlessly
          let lastSong = queue.songs.shift();
          queue.songs.push(lastSong);
          module.exports.play(queue.songs[0], message);
        } else {
          // Recursively play the next song
          queue.songs.shift();
          module.exports.play(queue.songs[0], message);
        }
      })
      .on("error", (err) => {
        console.error(err);
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      });
    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    try {
      var playingMessage = await queue.textChannel.send(`🎶 Started playing: **${song.title}** ${song.url}`);
      await playingMessage.react("⏭");
      await playingMessage.react("⏯");
      await playingMessage.react("🔇");
      await playingMessage.react("🔉");
      await playingMessage.react("🔊");
      await playingMessage.react("🔁");
      await playingMessage.react("⏹");
      await playingMessage.react("❓");
      await playingMessage.react("📑");
    } catch (error) {
      console.error(error);
    }

    const filter = (reaction, user) => user.id !== message.client.user.id;
    var collector = playingMessage.createReactionCollector(filter, {
      time: song.duration > 0 ? song.duration * 1000 : 600000
    });

    collector.on("collect", async (reaction, user) => {
      if (!queue) return;
      const member = message.guild.member(user);

      switch (reaction.emoji.name) {
        case "⏭":
          queue.playing = true;
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.connection.dispatcher.end();
          queue.textChannel.send(`${user} ⏩ skipped the song`).catch(console.error);
          collector.stop();
          break;

        case "⏯":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.playing) {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.pause(true);
            queue.textChannel.send(`${user} ⏸ paused the music.`).catch(console.error);
          } else {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.resume();
            queue.textChannel.send(`${user} ▶ resumed the music!`).catch(console.error);
          }
          break;

        case "🔇":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.volume <= 0) {
            queue.volume = 100;
            queue.connection.dispatcher.setVolumeLogarithmic(100 / 100);
            queue.textChannel.send(`${user} 🔊 unmuted the music!`).catch(console.error);
          } else {
            queue.volume = 0;
            queue.connection.dispatcher.setVolumeLogarithmic(0);
            queue.textChannel.send(`${user} 🔇 muted the music!`).catch(console.error);
          }
          break;

        case "🔉":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member) || queue.volume == 0) return;
          if (queue.volume - 10 <= 0) queue.volume = 0;
          else queue.volume = queue.volume - 10;
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(`${user} 🔉 decreased the volume, the volume is now ${queue.volume}%`)
            .catch(console.error);
          break;

        case "🔊":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member) || queue.volume == 100) return;
          if (queue.volume + 10 >= 100) queue.volume = 100;
          else queue.volume = queue.volume + 10;
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(`${user} 🔉 decreased the volume, the volume is now ${queue.volume}%`)
            .catch(console.error);
          break;

        case "🔁":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.loop = !queue.loop;
          queue.textChannel.send(`Loop is now ${queue.loop ? "**on**" : "**off**"}`).catch(console.error);
          break;

        case "⏹":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.songs = [];
          queue.textChannel.send(`${user} ⏹ stopped the music!`).catch(console.error);
          try {
            queue.connection.dispatcher.end();
          } catch (error) {
            console.error(error);
            queue.connection.disconnect();
          }
          collector.stop();
          break;

        default:
          reaction.users.remove(user).catch(console.error);
          break;
          
        case "❓":
        reaction.users.remove(user).catch(console.error);
        const song = queue.songs[0];
        const seek = (queue.connection.dispatcher.streamTime - queue.connection.dispatcher.pausedTime) / 1000;
        const left = song.duration - seek;
        //define embed
        let nowPlaying = new MessageEmbed()
          .setAuthor('Now playing', 'https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif')
          .setDescription(`[**${song.title}**](${song.url})`)
          .setColor("#03a9f4")
          .setFooter('Aniket ©', 'https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif'); 
          //if its a stream
        
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

        break;  
          
        case "📑":
        
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          let lyrics = null;
          let temEmbed = new MessageEmbed()
          .setAuthor("Searching...", "https://cdn.discordapp.com/attachments/801132434283954199/804753009375445022/vibe.gif").setFooter("Lyrics")
          .setColor("#F0EAD6")
          let result = await message.channel.send(temEmbed)
          try {
            lyrics = await lyricsFinder(queue.songs[0].title,"");
            if (!lyrics) lyrics = `No lyrics found for ${queue.songs[0].title}.`;
          } catch (error) {
            lyrics = `No lyrics found for ${queue.songs[0].title}.`;
          }
      
          let lyricsEmbed = new MessageEmbed()
            .setTitle(`${queue.songs[0].title} — Lyrics🗒️`)
            .setDescription(lyrics)
            .setColor("#03a9f4")
            .setTimestamp();
      
          if (lyricsEmbed.description.length >= 2048)
      
            lyricsEmbed.description = `${lyricsEmbed.description.substr(0, 2045)}...`;
            message.react("✅");
          return result.edit(lyricsEmbed).catch(console.error);

          break;  
      }
    });

    collector.on("end", () => {
      playingMessage.reactions.removeAll().catch(console.error);
      if (PRUNING && playingMessage && !playingMessage.deleted) {
        playingMessage.delete({ timeout: 3000 }).catch(console.error);
      }
    });
  }
};
