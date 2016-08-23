var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var config = require('config')
var moment = require('moment')
var path = require('path');
var fs = require('fs')
var appDir = require('app-root-path')
var raffleConfig = config.get('settings.raffle')


function writeToFile(message){
	fs.appendFile(appDir+'/data/winners.txt', message, function (err) {});
}


var Raffle = function(){
	this.isRunning = false;
	this.entries = [];
};
util.inherits(Raffle, EventEmitter);

// start collecting entries
Raffle.prototype.start = function(params){
	this.entries = [];
	this.isRunning = true;
	params.label = params.label || '-'
	this.params = params // save in order to pass though
	this.params.amount = this.params.amount | 100
	this.label = params.label || '-'
	this.emit('start', this.params)
};

Raffle.prototype.add = function(nick){
	var self = this;
	if(!this.isRunning){
		return;
	}
	if(!_.includes(this.entries, nick)){
		this.entries.push(nick);
	}
};

Raffle.prototype.status = function(){
	return {
		isRunning:this.isRunning,
		entries:_.clone(this.entries)
	};
};


Raffle.prototype.stop = function(params){
	this.isRunning = false;
	this.emit('stop', this.params)
};

Raffle.prototype.clear = function(){
	this.entries = [];
	this.isRunning = false;
};

Raffle.prototype.draw = function(params){
	this.stop();
	if(this.entries.length <= 0){
		return null;
	}
	var amount = params.amount ? +params.amount : +this.params.amount;
	this.entries = _.shuffle(this.entries);
	var winner = this.entries.pop();
	this.emit('winner', _.extend({}, this.params, {username:winner, amount:amount}))
	var date = moment().format('MMMM Do YYYY, h:mm:ss a')
	writeToFile(`${this.params.label} | ${date} | ${winner} | ${this.params.amount}`)
	return winner;
};


var raffle = new Raffle
module.exports = function(){
	return raffle
};

