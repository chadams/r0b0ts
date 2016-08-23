var config = require('config')
var _ = require('lodash')
var tool = require('./bin/tools')
var all = require('require-all')

var systems = all(__dirname+'/bin/systems')

var adminCommands = systems.AdminCommands()
var userCommands = systems.UserCommands()
var twitch = systems.Twitch()
var audience = systems.Audience()
var gameLoop = systems.GameLoop()
var raffle = systems.Raffle()
var magic = systems.Magic()
var roll = systems.Roll()
var messages = systems.Messages()
var apis = systems.APIMessages()
var log = adminCommands.log
var say = twitch.say.bind(twitch)
var strings = systems.Strings(say).log
var strings_log = systems.Strings(log).log

adminCommands.on('raffle', function(params){
  raffle[params.args.action](params.args)
})
adminCommands.on('give', function(params){
  log(params)
  audience.giveUser(params.args.username, params.args.options)
})
adminCommands.on('users', function(params){
  log(audience.getLiveUsers())
})

userCommands.on('raffle', function(params){
  raffle.add(params.user.username)
})
userCommands.on('roll', function(params){
  roll.throw(_.extend({}, params, {dice:params.params[0]}))
})
userCommands.on('me', function(params){
  audience.aboutUser(params.user.username)
})
userCommands.on('command', function(params){
  var user = audience.getUser(params.user.username)
  var magicCasted = magic.cast(user, params.action, params)
  if(magicCasted){strings('magic.cast', params)}
  apis.get(params)
  .then(function(msg){
    say(msg)
  }) 
})


twitch.on('connected', function(){
  log('twitch connected')
  twitch.getChatters()
})
twitch.on('chatters', function(obj){
  var chatters = obj.room.chatters
  var list = tool.flattenObjToList(chatters)
  audience.watchUsers(list)
})
twitch.on('join', function(obj){
  audience.watchUser(obj.username)
})
twitch.on('part', function(obj){
  audience.unwatchUser(obj.username)
})
twitch.on('chat', function(obj){
  var user = audience.getUser(obj.username)
  userCommands.compileCommand(user, obj.message)
})


audience.on('give', function(params){
  strings('audience.give', params)
  strings_log('audience.give', params)
})
audience.on('about', function(params){
  strings('audience.about', params)
})
audience.on('levelup', function(params){
  strings('audience.levelup', params)
})


raffle.on('start', function(params){
  strings('raffle.start', params)
})
raffle.on('stop', function(params){
  strings('raffle.stop', params)
})
raffle.on('winner', function(params){
  var user = audience.getUser(params.username)
  user.xp += +params.amount
  strings('raffle.winner', params)
})


messages.on('message', function(params){
  say(params.message)
})


roll.on('roll', function(params){
  strings('roll', _.extend(params, params.user))
})

gameLoop.on('tick', function(diff){
  audience.tick(diff)
})


// start the app
gameLoop.start()
twitch.connect()









