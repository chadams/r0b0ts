var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var config = require('config')
var request = require('request')
var tools = require('../tools')
var apiConfig = config.get('settings.apis')


var APIMessages = function(){

};
util.inherits(APIMessages, EventEmitter);

APIMessages.prototype.get = function(params){
	return new Promise(function(resolve, reject){
		var user = params.user
		var action = params.action
		// see if the spell exists
		var api = apiConfig[action]
		if(!api){return reject('no api')}
		var canuse = tools.caniuse(user, api)
		if(!canuse){return reject('not enough xp')}
		
		if(user.cooldown > 0){
			this.emit('cooldown', out)
			return reject('on cooldown')
		}

		
		request.get({url:api.endpoint, json:true}, function(err, response, body){
			if(err){
				return reject(err)
			}
			var value = _.get(body, api.path)
			var template = _.template(api.message)
			var data = _.extend({}, params, user, {value:value})
			var out = template(data)
			user.cooldown = 60
			resolve(out)
		})
	})

	
}


var messages = new APIMessages
module.exports = function(){
	return messages
};

