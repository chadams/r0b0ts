var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var config = require('config')
var Roll = require('roll')
var tools = require('../tools')
var rollConfig = config.get('settings.roll')

var roller = new Roll

var Roll = function(){

};
util.inherits(Roll, EventEmitter);

Roll.prototype.throw = function(params){

	var canuse = tools.caniuse(params.user, rollConfig)
	if(!canuse){return}

	var result = roller.roll(params.dice)
	var out = _.extend(params, {rolled:result.rolled, result:result.result})
	var text = `[${result.result}]`
	if(result.rolled.length > 1){
		text = `[${result.rolled.join(',')}] = ${result.result}`
	}
	out.resultText = text
	this.emit('roll', out)
}


var roll = new Roll
module.exports = function(){
	return roll
};

