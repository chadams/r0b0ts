var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var config = require('config')
var moment = require('moment')
var path = require('path');
var fs = require('fs')
var tools = require('../tools')
var appDir = require('app-root-path')

var magicConfig = config.get('settings.magic')

var port = magicConfig.port
var spells = magicConfig.spells


var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);




var Magic = function(){
	this.start()
};
util.inherits(Magic, EventEmitter);

// start collecting entries
Magic.prototype.start = function(params){
	if(!port){ return }

	app.use(express.static(appDir + '/server'));

	io.on('connection', function(socket){
	  console.log('a user connected');
	  //io.emit('magic', 'Hi there!');
	});

	http.listen(port, function(){
		console.log('listening on http://localhost:'+port);
	});
};

// this is sent to the HTML pages
Magic.prototype.cast = function(user, action, payload){
	// see if the spell exists
	var spell = spells[action]
	if(!spell){return}
	var canuse = tools.caniuse(user, spell)
	if(!canuse){return}
	var out = _.extend({}, {user:user, action:action}, spell, payload)
	if(user.cooldown > 0){
		this.emit('cooldown', out)
		return
	}
	io.emit('magic', out);	
	// put user on cooldown
	user.cooldown = 60
	return true
}




var magic = new Magic
module.exports = function(){
	return magic
};

