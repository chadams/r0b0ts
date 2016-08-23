var util = require('util');
var EventEmitter = require('events').EventEmitter;


var GameLoop = function(){
	this.running = false;
	this.ticks = 0
	this.timer = setInterval(this.tick.bind(this), 1000)
};
util.inherits(GameLoop, EventEmitter);

GameLoop.prototype.start = function(){
	this.running = true;
};


GameLoop.prototype.stop = function(){
	this.running = false;
};

GameLoop.prototype.tick = function(){
	if(this.running){
		this.ticks++
		this.emit('tick', this.ticks);
	}
};

var gameloop = new GameLoop
module.exports = function(){
	return gameloop
}




/*
var GameLoop = function(){
	this.running = false;
	this.startTime = new Date().getTime();
};
util.inherits(GameLoop, EventEmitter);

GameLoop.prototype.start = function(){
	this.running = true;
	this._loop();
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

var g = new GameLoop
module.exports = function(){
	return g
}

*/