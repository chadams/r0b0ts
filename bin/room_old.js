
var irc = require('irc');
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
	var config = this.config;

	this.client = new irc.Client(config.server, config.nick, config);
	
	this.client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    //self.client.say('#'+self.config.channel, 'omg');
	});

	this.client.addListener('names', function (channel, nicks) {
    var names = _.map(nicks, function(val, indx){
    	return indx;
    });
    console.log(channel, names, nicks);
    self.emit('names', names);
	});
};


module.exports = Room;