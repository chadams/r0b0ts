var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Datastore = require('nedb');
var moment = require('moment');

var Ticketing = function(config){
	config.autoload = true;
	this.db = new Datastore(config);
	this.config = config;
	this.isRunning = false;
	this.entries = {};
};
util.inherits(Ticketing, EventEmitter);

// start collecting entries
Ticketing.prototype.start = function(amount){
	var self = this;
	var amt = +amount;
	if(!amount || isNaN(amt)){
		amount = this.config.defaultTicketCost;
	}else{
		amount = amt;
	}
	this.amount = amount; // price of each ticket in nanobots
	this.entries = {};
	this.isRunning = true;
};

Ticketing.prototype.add = function(nick, numOfTickets){
	var self = this;
	if(!this.isRunning){
		return;
	}
	if(!self.entries[nick]){
		self.entries[nick] = 0;
	}
	self.entries[nick] = self.entries[nick] + numOfTickets;

};

Ticketing.prototype.hasTickets = function(nick){
	return this.entries[nick] !== undefined;
};

// removes all tickets (refunds)
Ticketing.prototype.remove = function(nick){
	var tickets = this.entries[nick];
	delete this.entries[nick];
	return tickets;
};

Ticketing.prototype.getUserTickets = function(nick){
	return this.entries[nick];
};

Ticketing.prototype.status = function(){
	return {
		isRunning:this.isRunning,
		entries:this.entries
	};
};


Ticketing.prototype.stop = function(){
	this.isRunning = false;
};

Ticketing.prototype.clear = function(){
	this.entries = {};
	this.isRunning = false;
};

Ticketing.prototype._getTotalTickets = function(){
	var total = 0;
	for(var i in this.entries){
		var t = this.entries[i];
		total = total + t;
	};
	return total;
};

Ticketing.prototype.draw = function(){
	var self = this;
	self.stop();
	var total = self._getTotalTickets();
	var winningNumber = _.random(total);
	// find out "who" won
	var tic = 0;
	for(var i in this.entries){
		var currentUser = i;
		var userEntries = this.entries[i];
		if(winningNumber <= tic+userEntries){
			// winner!!!!
			this.entries[i] = this.entries[i] - 1; //  remove the ticket
			return currentUser;
		}
		tic = tic+userEntries;
	};
	return false;
};



Ticketing.prototype.saveAsWinner = function(winner){
	var date = new Date();
	var m = moment(date);
	var doc = {
		timestamp:date,
		date:m.format('MMMM Do YYYY, h:mm:ss a'),
		winner:winner
	};
	this.db.insert(doc, function(err, newDoc){

	});	
};


module.exports = Ticketing;