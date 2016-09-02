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
var whisper = twitch.whisper.bind(twitch)
var strings_say = systems.Strings(say).log
var strings_whisper = systems.Strings(whisper).log
var strings_log = systems.Strings(log).log

adminCommands.on('raffle', function(params){
  raffle[params.args.action](params.args)
})
adminCommands.on('give', function(params){
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
userCommands.on('admin', function(params){
  adminCommands.vorpal.exec(params.params.join(' '))
})
userCommands.on('command', function(params){
  var user = audience.getUser(params.user.username)
  var magicCasted = magic.cast(user, params.action, params)
  if(magicCasted){strings_say('magic.cast', params, user.username)}
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


magic.on('magic.cantuse', function(params){
  strings_say('magic.cantuse', params)
})
magic.on('magic.cooldown', function(params){
  strings_say('magic.cooldown', params)
})

audience.on('give', function(params){
  strings_say('audience.give', params)
  strings_log('audience.give', params)
})
audience.on('about', function(params){
  strings_say('audience.about', params)
})
audience.on('levelup', function(params){
  strings_say('audience.levelup', params)
})


raffle.on('start', function(params){
  strings_say('raffle.start', params)
})
raffle.on('stop', function(params){
  strings_say('raffle.stop', params)
})
raffle.on('winner', function(params){
  var user = audience.getUser(params.username)
  user.xp += +params.amount
  strings_say('raffle.winner', params)
})


messages.on('message', function(params){
  say(params.message)
})


roll.on('roll', function(params){
  strings_say('roll', _.extend(params, params.user))
})

gameLoop.on('tick', function(diff){
  audience.tick(diff)
})


// start the app
gameLoop.start()
twitch.connect()









