var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

var Raffle = function(config){
	this.config = config;
	this.isRunning = false;
	this.entries = [];
};
util.inherits(Raffle, EventEmitter);

// start collecting entries
Raffle.prototype.start = function(){
	var self = this;
	this.entries = [];
	this.isRunning = true;
};

Raffle.prototype.add = function(nick){
	var self = this;
	if(!this.isRunning){
		return;
	}
	if(!_.contains(this.entries, nick)){
		this.entries.push(nick);
	}
};

Raffle.prototype.status = function(){
	return {
		isRunning:this.isRunning,
		entries:_.clone(this.entries)
	};
};


Raffle.prototype.stop = function(){
	this.isRunning = false;
};

Raffle.prototype.clear = function(){
	this.entries = [];
	this.isRunning = false;
};

Raffle.prototype.draw = function(){
	var self = this;
	self.stop();
	if(this.entries.length <= 0){
		return null;
	}
	this.entries = _.shuffle(this.entries);
	var winner = this.entries.pop();
	return winner;
};


module.exports = Raffle;