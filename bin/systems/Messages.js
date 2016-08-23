var util = require('util')
var config = require('config')
var EventEmitter = require('events').EventEmitter
var _ = require('lodash')
var later = require('later')


var messagesConfig = config.get('settings.messages')


var Messages = function(){
	var list = messagesConfig.list
	var self = this
	if(!list){return}
	list.map(function(item){
		var action = item.cron ? 'cron' : 'text'
		var location = item.cron ? 'cron' : 'when'
		item.index = 0
		item.schedule = later.parse[action](item[location])
		item.timer = later.setInterval(function(){
			var msg = item.what[item.index % item.what.length]
			self.emit('message', {message:msg})
			item.index++
		}, item.schedule)
	})

} 
util.inherits(Messages, EventEmitter)



var messages = new Messages


module.exports = function(){
	return messages
}


