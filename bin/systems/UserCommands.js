var util = require('util')
var config = require('config')
var EventEmitter = require('events').EventEmitter
var _ = require('lodash')

var userCommandsConfig = config.get('settings.commands')

var prefix = userCommandsConfig.prefix


var UserCommands = function(){} 
util.inherits(UserCommands, EventEmitter)
UserCommands.prototype.compileCommand = function(user, commandStr){
	if(!user){return}
	commandStr = commandStr.trim()
	if(commandStr.indexOf(prefix) !== 0){
		return
	}
	commandStr = commandStr.substr(prefix.length) // remove the prefix
	var parts = commandStr.split(' ')
	parts = _.compact(parts)
	var action = parts.shift()
	action = action.toLowerCase()
	var out = {user:user, action:action, params:parts, text:commandStr, prefix:prefix}
	if(action === 'cmd' && _.indexOf(userCommandsConfig.admins, user.username) >= 0){
		return this.emit('admin', out)
	}
	this.emit('command', out)
	this.emit(action, out)
};


var uc = new UserCommands


module.exports = function(){
	return uc
}


