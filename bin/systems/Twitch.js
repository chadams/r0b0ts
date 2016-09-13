var util = require('util')
var config = require('config')
var EventEmitter = require('events').EventEmitter
var _ = require('lodash')
var tmi = require("tmi.js")


var endpoints = {
  tmi:'http://tmi.twitch.tv'
}


function kraken(endpoint, url){
  return new Promise(function(resolve, reject){
    client.api({
        url: endpoints[endpoint]+url,
        method: "GET",
        headers: {
            "Accept": "application/vnd.twitchtv.v3+json",
            "Authorization": "OAuth "+twitchConfig.identity.password.replace(/oauth\:/, ''),
            "Client-ID": twitchConfig.identity.clientID
        }
    }, function(err, res, body) {
        if(err || body.error){
          return reject(err || body.error)
        }
        resolve(body)
    });
  })
}


var twitchConfig = config.get('settings.twitch')
var channel = twitchConfig.channel
twitchConfig.channels = ['#'+channel]
var client = new tmi.client(twitchConfig);

var majorError = function(err){
	console.error(err)
}

var Twitch = function(){
  this.connected = false
} 
util.inherits(Twitch, EventEmitter)
Twitch.prototype.connect = function(){
	client.connect()
	.then(function(){
    twitch.connected = true
		twitch.emit('connected')
	})
	.catch(majorError)
};
Twitch.prototype.getChatters = function(){
  kraken('tmi', `/group/user/${channel}/chatters`)
  .then(function(res){
    twitch.emit('chatters', {room:res})
  })
  .catch(majorError)
}
Twitch.prototype.say = function(message){
  if(!this.connected){return}
  client.say(channel, message)
}
Twitch.prototype.whisper = function(message, username){
  if(!this.connected){return}
  client.whisper(username, message)
}

var twitch = new Twitch

// listen for events
client.on("chat", function (channel, userstate, message, self) {
    //if (self) return;// Don't listen to my own messages..
    twitch.emit('chat.raw', {channel:channel, userstate:userstate, message:message})
    twitch.emit('chat', {channel:channel, username:userstate.username, message:message})
});
client.on("disconnected", function (reason) {
    twitch.emit('disconnected', {reason:reason})
});
client.on("join", function (channel, username, self) {
    twitch.emit('join', {channel:channel, username:username})
});
client.on("message", function (channel, userstate, message, self) {
    if (self) return;
    twitch.emit('message', {channel:channel, userstate:userstate, message:message})
    switch(userstate["message-type"]) {
        case "action":
            twitch.emit('message.action', {channel:channel, userstate:userstate, message:message})
            break;
        case "chat":
            twitch.emit('message.chat', {channel:channel, userstate:userstate, message:message})
            break;
        case "whisper":
            twitch.emit('message.whisper', {channel:channel, userstate:userstate, message:message})
            break;
        default:
            // Something else ?
            break;
    }
});
client.on("names", function (channel, users) {
  twitch.emit('names', {channel:channel, users:users})
});
client.on("part", function (channel, username, self) { // when a user leaves
	if(self) return;
  twitch.emit('part', {channel:channel, username:username})
});
client.on("resub", function (channel, username, months, message) {
	// give rewards for this!
  twitch.emit('resub', {channel:channel, username:username, months:months, message:message})
});
client.on("subscription", function (channel, username) {
    twitch.emit('subscription', {channel:channel, username:username})
});
client.on("timeout", function (channel, username, reason, duration) {
    twitch.emit('timeout', {channel:channel, username:username, reason:reason, duration:duration})
});
client.on("unhost", function (channel, viewers) {
  twitch.emit('unhost', {channel:channel, viewers:viewers})
});

module.exports = function(){
	return twitch
}


