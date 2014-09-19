var util = require('util');
var EventEmitter = require('events').EventEmitter;


var GameLoop = function(){
	this.running = false;
	this.startTime = new Date().getTime();
};
util.inherits(GameLoop, EventEmitter);

GameLoop.prototype.start = function(){
	this.running = true;
	var self = this;
	setImmediate(function(){
		self._loop();
	});
};


GameLoop.prototype.stop = function(){
	this.running = false;
};

GameLoop.prototype._loop = function(){
	var self = this;
	if(this.running){
		// do work
		var tick = new Date().getTime();
		if(tick !== this.currentTime){
			this.currentTime = tick; //  prevent duplicates
			var diff = this.currentTime - this.startTime;
			self.emit('tick', diff);
		}
		
		setImmediate(function(){
			self._loop();
		});
	}
};

module.exports = GameLoop;