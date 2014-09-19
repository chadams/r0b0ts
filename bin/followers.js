



var util = require('util');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
var _ = require('lodash');


var url = "http://api.twitch.tv/kraken/channels/<%= name %>/follows?limit=10&offset=0&on_site=1";

var Followers = function(config, tracking){
	this.config = config;
	this.running = false;
	this.tracking = tracking;
};
util.inherits(Followers, EventEmitter);

Followers.prototype.start = function(){
	this.running = true;
	var self = this;
	var time = this.config.minutes || 1;
	if(this.id){
		self.stop();
	}
	this.id = setInterval(function(){

		self.getFollowers(true);

	}, 1000*60*time);

	this.getFollowers(false, false);
};


Followers.prototype.stop = function(){
	this.running = false;
	if(this.id){
		clearInterval(this.id);
	}
};

Followers.prototype.getFollowers = function(emitFollowers, giveGift){
	giveGift = giveGift || true;
	var self = this;
	if(this.running){
		var template = _.template(url);
		var _url = template(self.config);
		request({url:_url}, function(err, res, body){
			var json = JSON.parse(body);
			var follows = json.follows;
			_.forEach(follows, function(follow){
				var name = follow.user.name;
				var user = self.tracking.getUser(name);
				if(user){
					if(user.hasFollowed !== true){
						user.hasFollowed = true;
						if(giveGift){
							var gift = self.config.settings.newFollowNanobots || 100;
							user.nanobots += gift;
						}
						// yeah! new follow!!
						if(emitFollowers === true){
							self.emit('follow', user, gift);
						}

					}
				}
			});
		})
	}
};

module.exports = Followers;