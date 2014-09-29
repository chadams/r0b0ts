var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');


// returns true if input starts with "!"
var isUserCommand = function(input){
	return input.substr(0,1) === '!';
};

// gets command with parameters "start app param2"
var getCommand = function(input){
		var re = /\!([\w\s\-]+\w)/;
		var m = re.exec(input); 
		if(m && m.length > 1){
			return m[1];
		}
		return null;
};

var UserCommands = function(tracking, room, raffle, ticketing, config){
	this.tracking = tracking; // user commands depends on tracking
	this.room = room;
	this.raffle = raffle;
	this.ticketing = ticketing;
	this.admins = config.admins;
	this.commands = config.commands;
	this.bot_nick = config.twitch.nickname;
	this.megabotLevels = config.megabotLevels;
	this.subscriptionLevels = config.subscriptionLevels;
	this.cooldown = config.settings.cooldown || 1;
};
util.inherits(UserCommands, EventEmitter);

UserCommands.prototype.exec = function(user, channel, msg){
	var self = this;
	if(user.username === this.bot_nick){
		return; // bot cannot send commands to its self
	}
	if(!isUserCommand(msg)){
		return;
	}
	var txt = getCommand(msg);
	if(!txt){
		return
	}
	var parts = txt.split(' ');
	var funName = parts.shift();
	parts.unshift({
		user: user,
		channel:channel,
		msg:msg
	});
	if(!_.isFunction(this['command_'+funName])){
		// see if it's a custom command here
		parts.unshift(funName);
		return this._runCustomFunction.apply(this, parts);
	}

	return this['command_'+funName].apply(this, parts);
};

// runs a custom function from config
UserCommands.prototype._runCustomFunction = function(funName, cmd, val1, val2, val3){
	var self = this;
	var user = this.tracking.getUser(cmd.user.username);
	var command = _.find(this.commands, function(obj, indx){
		return indx === '!'+funName;
	});
	//console.log(command);
	if(command){
		// check level
		if(command.minLevel !== undefined && command.minLevel !== null){
			if(user.level < command.minLevel || (!_.contains(this.admins, cmd.user.username) && command.adminOnly)){
				//console.log('no access to command', user.level, command.level, _.contains(this.admins, cmd.user.username));
				return; // no access to command
			}
		}
		if(command.minMegabotLevel !== undefined && command.minMegabotLevel !== null){
			if(user.megabots < command.minMegabotLevel || (!_.contains(this.admins, cmd.user.username) && command.adminOnly)){
				//console.log('no access to command', user.level, command.level, _.contains(this.admins, cmd.user.username));
				return; // no access to command
			}
		}
		var data = _.extend({
			val1:val1,
			val2:val2,
			val3:val3,
			title:self.getUserLevel(user.nick)
		}, command, user);
		if(command.response){
			var template = _.template(command.response);
			//console.log(data, template(data));
			this.room.say(template(data));
		}
		if(command.gfx && user.cooldown <= 0){
			if(!_.contains(this.admins, cmd.user.username)){
				user.cooldown = self.cooldown;
			}
			self.emit('magic', data);
		}
		return;
	}
};


UserCommands.prototype.command_cmd = function(cmd){
	var args = Array.prototype.slice.call(arguments, 0);
	if(_.contains(this.admins, cmd.user.username)){
		this.emit('cmd', args);
	}
};


UserCommands.prototype.command_raffle = function(cmd){
	if(this.raffle.isRunning){
		this.raffle.add(cmd.user.username);
	}
};



UserCommands.prototype.command_ticket = function(cmd, quantity){
	var self = this;
	var template;
	if(!this.ticketing.isRunning){
		return;
	}
	var nick = cmd.user.username;
	var user = this.tracking.getUser(nick);
	var price = this.ticketing.amount;

	if(!quantity){
		// print number of tickets
		var quantity = this.ticketing.getUserTickets(nick);
		quantity = quantity || 0;
		template = _.template('<%= nick %>: - <%= quantity %> tickets');
		var out = template(  _.extend({quantity:quantity}, user)  );
		this.room.say(out);
		return;
	}

	if(quantity === 'refund'){
		if(this.ticketing.hasTickets(nick)){
			var tickets_to_refund = this.ticketing.getUserTickets(nick);
			this.ticketing.remove(nick);
			var nanobots_to_refund = tickets_to_refund * price;
			user.nanobots = user.nanobots + nanobots_to_refund;
		}
		return;
	}

	quantity = +quantity;
	if(isNaN(quantity)){
		// bad number entered
		return;
	}
	if(quantity <= 0){
		return;// negative not allowed!
	}
	var nanobots = user.nanobots;
	var maxNanobotsICanAfford = Math.floor(nanobots / price);
	quantity = Math.min(maxNanobotsICanAfford, quantity);
	var costInNanobots = quantity * price;
	if(quantity > 0){
		user.nanobots = user.nanobots - costInNanobots;
		this.ticketing.add(nick, quantity);
	}


};

// title
UserCommands.prototype.getUserLevel = function(nick){
	var user = this.tracking.getUser(nick);
	var megabot_level = 'noob';

	_.forEach(this.megabotLevels, function(mb_level, name){
		if(user.megabots >= mb_level){
			megabot_level = name;
		}
	});
	// subscription
	var subscription_level = null;
	_.forEach(this.subscriptionLevels, function(s_level, name){
		if(user.subscription >= s_level.amount){
			subscription_level = name;
		}
	});
	var title = [];
	if(subscription_level){
		title.push(subscription_level);
	}
	title.push(megabot_level);
	title = title.join(' ');
	return title;
}



UserCommands.prototype.command_level = function(cmd){
	var user = this.tracking.getUser(cmd.user.username);
	var title = this.getUserLevel(cmd.user.username);

	var template = _.template('level: <%= nick %> - <%= title %>');
	var out = template(  _.extend({title:title}, user)  );
	this.room.say(out);
	return title;
};




// action: add | rm | set
UserCommands.prototype.command_nanobots = function(cmd, action, amount, who){
	var user, template;



	// !nanobots
	if(!action){
		user = this.tracking.getUser(cmd.user.username);
		//console.log(user);
		template = _.template('nanobots: <%= nick %> - <%= nanobots %>');
		this.room.say(template(user));
		return;
	}


	if(action && amount === undefined && _.contains(this.admins, cmd.user.username)){
		user = this.tracking.getUser(action);
		if(user){
			template = _.template('nanobots: <%= nick %> - <%= nanobots %>');
			this.room.say(template(user));
			return;
		}
	}


	// we have action so only admis allowed
	if(action && amount && who && _.contains(this.admins, cmd.user.username)){
		var amount = +amount;

		if(who === 'all'){
			if(!isNaN(amount)){
				var users = this.tracking.users;
				_.forEach(users, function(user){
					if(action === 'add'){
						template = _.template('<%= amount %> nanobots for everyone!');
						user.nanobots = user.nanobots + amount;
					}else if(action === 'rm'){
						template = _.template('<%= amount %> nanobots removed for all');
						user.nanobots = user.nanobots - amount;
					}
				});
				this.room.say(template(_.extend({
					amount:amount
				})));
			}
			return;
		}

		user = this.tracking.getUser(who);
		if(!user || isNaN(amount)){
			return;
		}
		template = _.template('nanobots <%= action %> (<%= amount %>): <%= nick %> - <%= nanobots %>');

		// !nanobots add 100 ddn1515
		if(action === 'add'){
			user.nanobots = user.nanobots + amount;
			
			this.room.say(template(_.extend({
				amount:amount,
				action:'added'
			}, user)));
		}

		// !nanobots rm 100 ddn1515
		if(action === 'rm'){
			user.nanobots = user.nanobots - amount;
			this.room.say(template(_.extend({
				amount:amount,
				action:'removed'
			}, user)));
		}

		// !nanobots set 100 ddn1515
		if(action === 'set'){
			user.nanobots = amount;
			this.room.say(template(_.extend({
				amount:amount,
				action:'set'
			}, user)));
		}
		
	}

};









// action: add | rm | set
UserCommands.prototype.command_megabots = function(cmd, action, amount, who){
	var user, template;
	// !megabots
	if(!action){
		user = this.tracking.getUser(cmd.user.username);
		//console.log(user);
		template = _.template('megabots: <%= nick %> - <%= megabots %>');
		this.room.say(template(user));
		return;
	}


	if(action && amount === undefined && _.contains(this.admins, cmd.user.username)){
		user = this.tracking.getUser(action);
		if(user){
			template = _.template('megabots: <%= nick %> - <%= megabots %>');
			this.room.say(template(user));
			return;
		}
	}


	// we have action so only admis allowed
	if(action && amount && who && _.contains(this.admins, cmd.user.username)){
		var amount = +amount;


		if(who === 'all'){
			if(!isNaN(amount)){
				
				var users = this.tracking.users;
				_.forEach(users, function(user){
					if(action === 'add'){
						template = _.template('<%= amount %> megabots for everyone!');
						user.megabots = user.megabots + amount;
					}else if(action === 'rm'){
						template = _.template('<%= amount %> megabots removed for all');
						user.megabots = user.megabots - amount;
					}
				});
				this.room.say(template(_.extend({
					amount:amount
				})));
			}
			return;
		}

		user = this.tracking.getUser(who);
		if(!user || isNaN(amount)){
			return;
		}
		template = _.template('megabots <%= action %> (<%= amount %>): <%= nick %> - <%= megabots %>');

		// !megabots add 100 ddn1515
		if(action === 'add'){
			user.megabots = user.megabots + amount;
			
			this.room.say(template(_.extend({
				amount:amount,
				action:'added'
			}, user)));
		}

		// !megabots rm 100 ddn1515
		if(action === 'rm'){
			user.megabots = user.megabots - amount;
			this.room.say(template(_.extend({
				amount:amount,
				action:'removed'
			}, user)));
		}

		// !megabots set 100 ddn1515
		if(action === 'set'){
			user.megabots = amount;
			this.room.say(template(_.extend({
				amount:amount,
				action:'set'
			}, user)));
		}
		
	}

};





module.exports = UserCommands;




