
var irc = require('node-twitch-irc');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

var Messages = function(config){
	this.config = config;
	this.index = 0;

	
	var self = this;
	var len = self.config.rotation.length;
	self.id = setInterval(function(){
		var msg = self.config.rotation[self.index % len];
		self.emit('message', msg);
		self.index++;
	}, 1000*60*this.config.minutes);

};
util.inherits(Messages, EventEmitter);




module.exports = Messages;