var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var config = require('config')
var stringsConfig = config.get('settings.strings')


var compiledStrings = _.mapValues(stringsConfig, function(str){
	return _.template(str)
})


function runTemplate(id, data){
	try{
		if(compiledStrings[id]){
			return compiledStrings[id](data)
		}
	}catch(e){
		console.error(e)
	}
	return null
}

module.exports = function(logger){

	return {
		log: function(id, data){
			var val = runTemplate(id, data)
			if(val && logger){
				logger(val)
			}
			return val
		},
		text: function(id, data){
			return runTemplate(id, data)
		},
	}



}