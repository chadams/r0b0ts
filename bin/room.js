
var irc = require('node-twitch-irc');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

var Room = function(config){
	this.config = config;
	this.config.channels = [this.config.channel];
};
util.inherits(Room, EventEmitter);

Room.prototype.start = function(){
	var self = this;
	this.client = new irc.connect(this.config, function(err, event){
		if(err){
			return console.error(err);
		}
		event.on('join', function(channel, username){
			//console.log('joined', channel, username);
			self.emit('join', username);
		});
		event.on("chat", function (user, channel, message) {
		  //console.log('chat', user, channel, message);
		  self.emit('chat', user, channel, message);
		});
		event.on("action", function (user, channel, message) {
		  //console.log('action', user, channel, message);
		});
		event.on('connected', function(){
			//console.log('connected');
		});
		event.on('disconnected', function(reason){
			//console.log('disconnected', reason);
		});
		event.on('names', function(channel, names){
			//console.log('names', channel, names);
			 self.emit('names', names.split(' '));
		});
		event.on("part", function (channel, username) {
		  //console.log('part', channel, username);
		  self.emit('part', username);
		});
		event.on("subscribe", function (channel, username) {
		  console.log('subscribe', channel, username);
		});
		event.on("raw", function (message) {
		  //console.log('raw', message);
		});
		// user is timed out
		event.on("timeout", function (channel, username) {
		  //console.log('timeout', channel, username);
		  self.emit('part', username);
		});
	});
};


Room.prototype.say = function(message){
	var self = this;
	if(!this.client){
		return; 
	}
	if(this.config.debug === true){
		console.log(message);
	}else{
		this.client.say('#'+this.config.channel, ' '+message);
	}
};

Room.prototype.action = function(message){
	var self = this;
	if(!this.client){
		return; 
	}
	if(this.config.debug === true){
		console.log(message);
	}else{
		this.client.action('#'+this.config.channel, ' '+message);
	}
};

Room.prototype.stop = function(){
	return;
	var self = this;
	if(!this.client){return; }
	this.client.part('#'+this.config.channel);
};


module.exports = Room;