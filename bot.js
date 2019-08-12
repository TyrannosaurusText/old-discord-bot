var Discord = require("discord.js");
var imgur = require("./imgurIF.js");
var bot = new Discord.Client();
var splitObject;
var counter;
var channelIndex = [];
var channelIgnore = [];
var channelName = [];
var theChannels;
var voiceChannel = -1;
var audioPromise;
var playlist = [];
var playlistInfo = [];
var audioMutex = false;
var botsecret; //
const ytdl = require('ytdl-core');

var Channel;
var name = "";

var timer;
function AsyncCheckUpdate(msg, message) {
    if (!imgur.updateDone()) {
        timer = bot.setInterval((msg, message) => {
            console.log(msg.channel);
            msg.channel.sendMessage(message);
            bot.clearInterval(timer);
        }, 100, msg, message);
    }
    else
    {
            msg.channel.sendMessage(message);
    }
}
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var musicResponses = {
    "Ignore channel": function (msg) { channelIgnore[channelName.indexOf(msg.channel.name)] = true; },
    ">>join": function (msg, splitObject) {
        {
            if (voiceChannel != -1) {
                msg.channel.sendMessage("Already in a voice channel.");
                return;
            }
            voiceChannel = msg.member.voiceChannel;
            audioPromise = voiceChannel.join();
            return;
        }
    },
    ">>setVolume": function (msg, splitObject) {
        {
            if (dispatcher == null) return;
            if (parseFloat(splitObject[1]) <= 1)
                dispatcher.setVolume(parseFloat(splitObject[1]));
            return;
        }
    },


    ">>play": function (msg, splitObject) {
        if (voiceChannel == -1) {
            msg.channel.sendMessage("Enter a voice channel and type \">>play <link>\" to get started");
            return;
        }
        if (splitObject.length != 2) {
            msg.channel.sendMessage("Missing link.");
        }
        ytdl.getInfo(splitObject[1], function (err, info) {
            if (err) {
                msg.channel.sendMessage(err);
            }
            playlistInfo.push(info["title"]);

        });
        playlist.push(splitObject[1]);
        if (!audioMutex)
            msg.channel.sendMessage("Playing music.");
        else
            msg.channel.sendMessage("Added to playlist.");

        if (!audioMutex) //something is playing
        {
            playAudio();
        }
        if (msg.deletable) {
            msg.delete(300);
        }
        return;
    },
    ">>skip": function (msg, splitObject) {
        if (audioMutex) //if its playing skip to next song, or end if no songs remaining
        {
            if (dispatcher == null) return;
            dispatcher.end();
            // msg.channel.sendMessage("Skipping", loadInfo(playlist[0]));
        }
        else {
            msg.channel.sendMessage("Nothing to skip.");
        }
        return;

    },
    ">>remove": function (msg, splitObject) {
        if (splitObject.length != 2 || splitObject[1].isNaN()) {
            msg.channel.sendMessage("usage: >>remove <number>");
        }
        if (playlist.length == 0) {
            msg.channel.sendMessage("Nothing is in the playlist!");
            return;
        }
        if (splitObject[0] == 0) {
            musicResponses["skip"](msg, splitObject);
            return;
        }
        else {
            playlist.splice(splitObject[1], 1);
            playlistInfo.splice(splitObject[1], 1);
            msg.channel.sendMessage("Music removed!");
        }

    }
    ,
    ">>leave": function (msg, splitObject) {
        playlist.splice(0, playlist.length); // clear playlist        
        playlistInfo.splice(0, playlistInfo.length); // clear playlist

        if (audioMutex)
            dispatcher.end(); // end current song
        if (voiceChannel != null) {
            voiceChannel.leave();
            voiceChannel = -1;
        }
        else
            msg.channel.sendMessage("Not in a voice channel");

        return;
    },
    ">>musichelp": function (msg, splitObject) {
        msg.channel.sendMessage(Object.keys(musicResponses));
    },
    ">>playlist": function (msg, splitObject) {
        if (playlistInfo.length == 0) {
            msg.channel.sendMessage("Nothing in queue.");
            return;
        }
        var musicTitles = "";
        for (counter = 0; counter < playlistInfo.length; counter++) {
            musicTitles = musicTitles.concat(counter + 1, ". ", playlistInfo[counter], "\n");
        }
        msg.channel.sendMessage(musicTitles);

    }
};

var ImgurResponses = {
    '>>upload': function (msg, splitObject) {
        imgur.update();
        if (splitObject.length < 3) {
            msg.channel.sendMessage("usage: >>upload \'name\' \'link\' optional: \'replace\' (forces replace if name is already used.)");
            return;
        }
        var fileExtension = splitObject[2].substr(splitObject[2].lastIndexOf('.'));
        var notify = (splitObject.length == 4 && splitObject[3] != 'silent');
        var validFileExtensions = [".jpg", ".jpeg", ".png", ".gif", "gifv"];
        if (!validFileExtensions.includes(fileExtension))
            msg.channel.sendMessage("Bad file format");
        if (splitObject.length == 4 && splitObject[3] == 'replace')
        {
            imgur.upload(splitObject[1], splitObject[2], true);       

            imgur.update();

        }
        else if (!imgur.find(splitObject[1])) {
            imgur.upload(splitObject[1], splitObject[2]);

            imgur.update();
            if(notify)
            AsyncCheckUpdate(msg, "Image uploaded.");
        }
        else if (splitObject.length == 4 && splitObject[3] != 'silent')
        {
            msg.channel.sendMessage("Name in use, add \'replace\' to force");

        }
        // console.log(splitObject[2]);
    },
    '>>draw': function (msg, splitObject) {
        imgur.update();
        if (splitObject.length != 2)
            msg.channel.sendMessage("usage: >>name \'name\'");
        msg.channel.sendMessage(imgur.draw(splitObject[1]));
    },
    '>>delete': function (msg, splitObject) {

        imgur.update();
        if (splitObject.length != 2)
            msg.channel.sendMessage("usage: >>delete \'name\'");
        imgur.deleteImage(splitObject[1]);
        imgur.update();
        if(notify)
        AsyncCheckUpdate(msg, "Image deleted.");
        imgur.displayImage();

    },
    '>>help': function(msg,splitObject)
    {
        msg.channel.sendMessage(Object.keys(ImgurResponses));
    }

}
bot.on("ready", msg => {
    imgur.initialize();

    theChannels = bot.channels.array();
    for (counter = 0; counter < theChannels.length; counter++) {
        channelIndex.push(counter);
        channelIgnore.push(false);
        channelName.push(theChannels[counter].name);
    } 
});

bot.on("message", msg => {
    if (msg.author.bot) return; // ignore msgs from bots
    if (msg.content.localeCompare("") == 0) {
        channelIgnore[channelName.indexOf(msg.channel.name)] = false;
        return;
    }
    if (channelIgnore[channelName.indexOf(msg.channel.name)]) return;

    splitObject = msg.content.split(" ");


    if (responseObject[msg.content.toLowerCase()]) {
        msg.channel.sendMessage(responseObject[msg.content]);
        return;
    }

    if (musicResponses[splitObject[0]]) {
        musicResponses[splitObject[0]](msg, splitObject);
        return;
    }
    
    var temp = msg.content.match('<:(\\w+):(\\d+)>');
    if(temp != null)
        {
        var imagename = temp[1];
        var pathconstruct = 'https://cdn.discordapp.com/emojis/'+temp[2]+'.png';
        msg.content = ">>upload "+imagename+" "+pathconstruct + " silent";
        ImgurResponses['>>upload'](msg.content,msg.content.split(" "));
    }

});
function playAudio() {
    const streamOptions = { seek: 0, volume: 1 };
    try {
        audioPromise.then(connection => {
            const stream = ytdl(playlist[0], { filter: 'audioonly' });
            dispatcher = connection.playStream(stream, streamOptions).on('end', () => {
                console.log("Stream ended");
                playlist.splice(0, 1);
                playlistInfo.splice(0, 1);

                if (playlist.length == 0) {
                    audioMutex = false;
                    return;
                }
                else {
                    playAudio();
                    return;
                }
             });
        })
    }
    catch (err) {
        console.log('Failure!');
        console.log(err);
    }
}

bot.login(botsecret);