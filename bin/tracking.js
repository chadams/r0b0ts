var Datastore = require('nedb');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var q = require('q');


// defaults
var userSchema = {
	nanobots:0,
	nano_rate:2, // in minutes
	megabots:0,
	mega_rate:60, // in minutes
	subscription:0, // in dollars
	time:0, // the tick time
	level:0,
};

var Tracking = function(config){
	config.database.autoload = true;
	this.config = config;
	this.db = new Datastore(config.database);
	this.users = {};
	this.nanobot_adjust = 0;
	this.megabot_adjust = 0;

	var minToSave = this.config.database.minToSave || 5;

	var self = this;
	this.save_timer = setInterval(function(){
		self.saveAllUsers();
	}, 1000*60*minToSave);

};
util.inherits(Tracking, EventEmitter);


Tracking.prototype.tick = function(diff){
	var self = this;
	var sec = 1000;
	var min = sec * 60;
	_.forEach(self.users, function(user){

		user.time++;

		var subscription_level = null;
		if(user.subscription >= 0){
			_.forEach(self.config.subscriptionLevels, function(s_level, name){
				if(user.subscription >= s_level.amount){
					subscription_level = s_level;
				}
			});
		}

		var nb_rate = ((user.nano_rate + self.nanobot_adjust) *min);
		var mb_rate = ((user.mega_rate + self.megabot_adjust) *min);

		// adjust rate based off subscription
		if(subscription_level){
			mb_rate = Math.round(mb_rate * subscription_level.rate);
		}



		if(user.time % nb_rate === 0){
			user.nanobots++;
		}
		if(user.time % mb_rate === 0){
			user.megabots++;
			// see if anyone gained a level
			_.forEach(self.config.megabotLevels, function(val, indx){
				if(val === user.megabots && val > 10){
					self.emit('levelup', user);
				}
			});
		}

	});
};


Tracking.prototype.numUsers = function(diff){
	return _.size(this.users);
};

// list = [nicks]
Tracking.prototype.watchUsers = function(list){
	var self = this;
	_.forEach(list, function(nick){
		self.watchUser(nick);
	});
};

Tracking.prototype.watchUser = function(nick){
	var self = this;
	nick = nick.toLowerCase();
	var deferred = q.defer();
	// make sure user isn't already in the watch list
	if(self.isWatchingUser(nick)){
		deferred.resolve(self.getUser(nick));
		return deferred.promise;
	}
	self._findOne({_id:nick}, function(err, doc){
		if(!doc){
			return self.addUser(nick, {}, function(err, newUserDoc){
				if(err){
					return deferred.reject(err);
				}
				self.users[newUserDoc._id] = newUserDoc;
				self.emit('new.user', newUserDoc);
				deferred.resolve(doc);
			});
		}else{
			self.users[doc._id] = doc;
			deferred.resolve(doc);
		}

	});
	return deferred.promise;
};

Tracking.prototype._findOne = function(query, cb){
	var self = this;
	self.db.findOne(query, function(err, doc){
		if(err){
			return cb(err, doc);
		}
		if(!doc){
			return cb(new Error('no doc'));
		}
		// merge
		for(var i in userSchema){
			if(doc[i] === undefined){
				doc[i] = userSchema[i];
			}
		}
		return cb(err, doc);
	});
};



Tracking.prototype.unwatchUser = function(nick){
	var self = this;
	nick = nick.toLowerCase();
	// save the user
	self.saveUser(nick);
	// remove from users list
	delete self.users[nick];
};

Tracking.prototype.saveUser = function(nick){
	var self = this;
	nick = nick.toLowerCase();
	// save the user
	var user = self.getUser(nick);
	self.db.update({_id:nick}, user);
};


// forces a record update, even if the user isn't tracked
Tracking.prototype.updateUser = function(nick, prop, value){
	var self = this;
	nick = nick.toLowerCase();
	// make sure it's a changable value
	if(userSchema[prop] === undefined){
		return false;
	}
	// save the user if tracked
	var user = self.getUser(nick);
	if(user){
		user[prop] = value;
	}else{
		self._findOne({_id:nick}, function(err, doc){
			if(doc){
				doc[prop] = value;
				self.db.update({_id:nick}, doc);
			}
		});
	}
	return true;
};


Tracking.prototype.viewUser = function(nick, cb){
	var self = this;
	nick = nick.toLowerCase();
	// save the user if tracked
	var user = self.getUser(nick);
	//console.log('user', user);
	if(user){
		return cb(null, user);
	}else{
		self._findOne({_id:nick}, function(err, doc){
			//console.log('doc', doc);
			return cb(err, doc);
		});
	}
};


Tracking.prototype.saveAllUsers = function(cb){
	var self = this;
	_.forEach(self.users, function(doc){
		self.db.update({_id:doc._id}, doc, {}, cb);
	});
};

Tracking.prototype.isWatchingUser = function(nick){
	var self = this;
	nick = nick.toLowerCase();
	var doc = self.users[nick];
	var result = doc ? true : false;
	//console.log('isWatchingUser', nick, result);
	return result;
};

Tracking.prototype.getUser = function(nick){
	var self = this;
	nick = nick.toLowerCase();
	return self.users[nick];
};

Tracking.prototype.addUser = function(nick, overrides, cb){
	cb = cb || function(){};
	nick = nick.toLowerCase();
	var self = this;
	var doc = _.extend({
		_id:nick,
		created: new Date(),
		nick:nick
	}, userSchema);
	_.extend(doc, overrides);
	this.db.insert(doc, function(err, newDoc){
		cb(err, newDoc);
	});
};


Tracking.prototype.adjustNanobots = function(nick, amount){
	var self = this;
	self._adjust(nick, 'nanobots', amount);
};


Tracking.prototype.adjustMegabots = function(nick, amount){
	var self = this;
	self._adjust(nick, 'megabots', amount);
};

// adjusts prop, will create a new record if doesn;t exist
Tracking.prototype._adjust = function(nick, prop, amount){
	nick = nick.toLowerCase();
	var self = this;
	var deferred = q.defer();
	// save the user if tracked
	var user = self.getUser(nick);
	if(user){
		user[prop] += amount;
		deferred.resolve(user);
	}else{
		self._findOne({_id:nick}, function(err, doc){
			if(doc){
				doc[prop] += amount;
				self.db.update({_id:nick}, doc, {}, function(e, o){

				});
				deferred.resolve(doc);
			}else{
				var obj = {};
				obj[prop] = amount;
				return self.addUser(nick, obj, function(err, newUserDoc){
					if(err){
						return deferred.reject(err);
					}
					deferred.resolve(newUserDoc);
				});
			}
		});
	}
	return deferred.promise;
};



Tracking.prototype.compact = function(cb){
	var self = this;
	self.saveAllUsers(function(err, res){
		self.db.persistence.compactDatafile();
		if(cb){
			setTimeout(function(){
				cb(null, null)
			}, 1000);
		}
	});
	
};


module.exports = Tracking; 