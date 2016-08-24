var util = require('util')
var config = require('config')
var EventEmitter = require('events').EventEmitter
var _ = require('lodash')
var vorpal = require('vorpal')()

var vorpalConfig = config.get('settings.panel')
vorpal.delimiter(vorpalConfig.delimiter).show()

function vorpalCatch(e){vorpal.log(e)}
function log(msg){vorpal.log(msg)}

var AdminCommands = function(){
  this.vorpal = vorpal
} 
util.inherits(AdminCommands, EventEmitter)
AdminCommands.prototype.log = log;
AdminCommands.prototype.sendCommand = function(commandName, args){
	var package = {
		command:commandName,
		args, args,
		log:log
	}
	this.emit('command', package) // any command
	this.emit(commandName, package) // specific command
};


var ac = new AdminCommands


/* COMMANDS */
vorpal
  .command('users')
  .description('lists all users')
  .action(function(args, cb) {
    ac.sendCommand('users', args)
    cb()
  })

vorpal
  .command('raffle <action> [amount]')
  .description('actions: start stop draw')
  .autocomplete(['start', 'stop', 'draw'])
  .action(function(args, cb) {
    ac.sendCommand('raffle', args)
    cb()
  }) 


vorpal
  .command('give <username>')
  .description('gives a user stuff')
  .option('-x, --xp <amount>', 'Give XP')
  .option('-g, --gold <amount>', 'Give Gold')
  .option('-t, --title <id>', 'Give a user a Title')
  .action(function(args, cb) {
    ac.sendCommand('give', args)
    cb()
  }) 



module.exports = function(){
	return ac
}


