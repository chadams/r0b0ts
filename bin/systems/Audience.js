var util = require('util')
var config = require('config')
var EventEmitter = require('events').EventEmitter
var _ = require('lodash')
var Datastore = require('nedb')
var path = require('path');
var appDir = require('app-root-path')

var audienceConfig = config.get('settings.audience')
var levelsConfig = config.get('settings.levels')
var titlesConfig = config.get('settings.titles')

var allLevels = _.reverse(_.sortBy(levelsConfig, ['xp']))

var db = new Datastore({filename:appDir+'/data/audience.db', autoload:true, timestampData:true})
db.ensureIndex({ fieldName: 'username'}, function (err) {});
//db.persistence.setAutocompactionInterval(0)


// defaults
var userSchema = {
  username:null,
  xp:0,
  gold:0,
  type:'default',
  time:0, // the tick time
  cooldown:0, // cooldown time on magic
  title:'0' 
};



var Audience = function(){
  this.users = {}
  this.running = true
} 
Audience.prototype.tick = function(diff){
  if(!this.running) return
  _.forEach(this.users, function(user){
    user.time++
    
    var title = audience.getTitle(user.title)
    var xpBoost = title ? title['xp-boost'] || 0 : 0


    // in seconds
    var rate = {
      cooldown: 1,
      xp:       60
    }

    if(user.time % rate.cooldown === 0){
      if(user.cooldown > 0){
        user.cooldown--
      }
    }


    if(user.time % rate.xp === 0){
      var old_level = audience.getLevel(user.xp)
      user.xp += (1+xpBoost)
      var new_level = audience.getLevel(user.xp)
      if(new_level.name !== old_level.name){
        audience.emit('levelup', audience.getUserData(user)) 
      }
    }   


  })
  
  if(diff % audienceConfig.dataSaveInterval === 0){
    this.flushData(this.users)
  }

}

Audience.prototype.flushData = function(usersList){
  usersList = usersList || this.users
  var pms = _.values(_.mapValues(usersList, function(user){
    return audience.save(user) 
  }))
  Promise.all(pms)
  .then(function(){
    db.persistence.compactDatafile()
    audience.emit('flushed')
  })  
  .catch(function(err){
    console.error(err)
  })
}
Audience.prototype.watchUsers = function(usersList){
  usersList.map(function(username){
    audience.watchUser(username)  
  })
}
Audience.prototype.watchUser = function(username){
  username = username.toLowerCase()
  if(this.users[username]){ return;} // don't add if already tracking
  // lookup user in db
  return this.findOne({username:username})
  .then(function(user){
    audience.users[user.username] = user
    audience.emit('watch', user)
  })
  // not found create one and add it
  .catch(function(err){
    audience.createNewUser(username)
    .then(function(user){
      audience.users[user.username] = user
      audience.emit('watch', user)
    })
  })
}
Audience.prototype.unwatchUser = function(username){
  username = username.toLowerCase()
  if(!this.users[username]){ return;} 
  var user = audience.users[username]
  this.save(user)
  .then(function(){
    delete audience.users[username]
    audience.emit('unwatch', user)
  })

}
Audience.prototype.findOne = function(search){
  return new Promise(function(resolve, reject){
    db.findOne(search, function(err, doc){
      if(err){return reject(err)}
      if(!doc){return reject('document not found')}
      resolve(doc)
    })
  })
}
Audience.prototype.insert = function(user){
  return new Promise(function(resolve, reject){
    db.insert(user, function(err, doc){
      if(err){return reject(err)}
      resolve(doc)
    })
  })
}
Audience.prototype.save = function(user){
  return new Promise(function(resolve, reject){
    db.update({username:user.username}, user, function(err, numReplaced){
      if(err){return reject(err)}
      resolve(numReplaced)
    })
  })
}
Audience.prototype.createNewUser = function(username){
  var user = _.assign({}, userSchema, {username:username})
  return audience.insert(user)
}
Audience.prototype.getLiveUsers = function(username){
  return this.users
}
Audience.prototype.getUser = function(username){
  username = username.toLowerCase()
  return this.users[username]
}
Audience.prototype.giveUser = function(username, stuff){
  username = username.toLowerCase()
  var self = this
  var user = this.getUser(username)
  if(!user){return}
  _.forOwn(stuff, function(val, key){
    if(user[key]){
      // handle number value
      if(_.indexOf(['xp', 'gold', 'time', 'cooldown']) >= 0){

        var newAmount = +val;
        var currentAmount = user[key];
        var amount = currentAmount + newAmount
        if(amount < 0){
          amount = 0
        }
        user[key] = amount

      }else if(_.indexOf(['title']) >= 0){
        user[key] = val
      }
      var obj = _.extend({}, user, {user:user, given:key, amount:val})
      self.emit('give', obj)
    }
  })
}
Audience.prototype.aboutUser = function(username){
  username = username.toLowerCase()
  var self = this
  var user = this.getUser(username)
  if(!user){return}
  var out = this.getUserData(user)
  this.emit('about', out)
}
Audience.prototype.getLevel = function(xp){
  return _.find(allLevels, function(item){
    return xp >= item.xp
  })
}
Audience.prototype.getTitle = function(id){
  id = id || '0'
  return titlesConfig[id] 
}
Audience.prototype.getFullName = function(user){
  var level = this.getLevel(user.xp)
  var title = this.getTitle(user.title)
  var full = _.compact([title.name, level.name]).join(' ')
  return full
}
Audience.prototype.getUserData = function(user){
  var level = this.getLevel(user.xp)
  var title = this.getTitle(user.title)
  var full = this.getFullName(user)
  var out = {user:user, level:level, title:title, fulltitle:full}
  return out
}
util.inherits(Audience, EventEmitter)



var audience = new Audience
module.exports = function(){
	return audience
}


