var config = require('./config');
var repl = require('repl');
var _ = require('lodash');
var GameLoop = require('./bin/gameloop');
var Room = require('./bin/room');
var Tracking = require('./bin/tracking');
var UserCommands = require('./bin/usercommands');
var Raffle = require('./bin/raffle');
var Ticketing = require('./bin/ticketing');
var Messages = require('./bin/messages');
var Followers = require('./bin/followers');
var Importer = require('./bin/importer');

var gameloop = new GameLoop();
var room = new Room(config.twitch);
var raffle = new Raffle(config.raffle);
var ticketing = new Ticketing(config.contests);
var tracking = new Tracking(config);
var messages = new Messages(config.messages);
var userCommands = new UserCommands(tracking, room, raffle, ticketing, config);
var followers = new Followers(config, tracking);


// set up listeners between the services


room.on('names', function(list){
	tracking.watchUsers(list);
});
room.on('join', function(nick){
	tracking.watchUser(nick)
	.then(function(doc){
		if(gameloop.running && config.messages.welcome){
			sendMessage(config.messages.welcome, _.extend({}, {name:config.name}, doc), 'action');
		}
	});
});
room.on('part', function(nick){
	tracking.unwatchUser(nick);
});
room.on('chat', function(user, channel, msg){
	tracking.watchUser(user.username)
	.then(function(doc){
		userCommands.exec(user, channel, msg);
	});
});

messages.on('message', function(msg){
	if(gameloop.running){
		sendMessage(msg, {});
	}
});

gameloop.on('tick', function(diff){
	tracking.tick(diff);
});


tracking.on('new.user', function(doc){
	if(gameloop.running && config.messages.newuser){
		sendMessage(config.messages.newuser, doc, 'action');
	}
});

tracking.on('levelup', function(user){
	var title = userCommands.getUserLevel(user.nick);
	sendMessage(config.messages.levelup, _.extend({title:title}, user), 'action');
});


followers.on('follow', function(user, gift){
	if(gameloop.running && config.messages.newfollow){
		sendMessage(config.messages.newfollow, _.extend({gift:gift}, user));
	}	
});


userCommands.on('cmd', function(args){
	console.log(args);
	args.shift(); // remove cmd
	var result = executeFunction(globalCommands, args.join(' '), replServer.context);
	console.log(result);
});

// start the room
room.start();

// gets command with parameters "start app param2"
var getCommand = function(input){
		var re = /\(([\w\s\-]+\w)/;
		var m = re.exec(input); 
		if(m && m.length > 1){
			return m[1];
		}
		return 'stats';
};



var executeFunction = function(context, cmd, thisContext){
	var txt = cmd;
	var parts = txt.split(' ');
	var funName = parts.shift();
	if(!_.isFunction(context[funName])){
		return funName+ ' is not a command';
	}
	return context[funName].apply(thisContext, parts);
};


var makeMessage = function(templateString, data){
	var template = _.template(templateString);
	var out = template(data);
	return out;
};

var sendMessage = function(templateString, data, type){
	if(!type){type = 'say';}// say | action
	var out = makeMessage(templateString, data);
	room[type](out);	
	return out;
};

var globalCommands = {
	help: function(){
		return 'help doc';
	},
	start:function(){
		gameloop.start();
		followers.start();
		return 'Engine Started';
	},
	stop:function(){
		gameloop.stop();
		tracking.compact();
		followers.stop();
		return 'Engine Stopped';
	},
	save: function(){
		tracking.saveAllUsers();
		tracking.compact();
		return 'Saved users data';
	}
	stats: function(){
		var data = {running:gameloop.running, users:tracking.numUsers(), nanobot_adjust:tracking.nanobot_adjust, megabot_adjust:tracking.megabot_adjust};		
		return data;
	},
	import: function(type){
		importer = new Importer();
		if(importer[type] && config.import && config.import[type]){
			return importer[type](config.import[type], config, tracking);
		}
		return 'no import';
	},
	raffle: function(cmd, amount){
		if(cmd === 'start'){
			raffle.start();
			room.say('Raffle started! type \"!raffle\" to enter.');
			return 'raffle started';
		}
		if(cmd === 'stop'){
			raffle.stop();
			room.say('Raffle Finished. Good Luck!');
			return 'raffle stopped';
		}
		if(cmd === 'clear'){
			raffle.clear();
			return 'cleared raffle entries';
		}
		if(cmd === 'status'){
			var status = raffle.status()
			var entries = status.entries.join(', ');
			var running = status.isRunning ? 'live' : 'off';
			return '('+running+') entries:'+entries;
		}
		if(cmd === 'draw'){
			var amount = +amount;
			if(isNaN(amount)){
				return 'bad amount';
			}
			var winner = raffle.draw();
			if(!winner){
				return 'no entries';
			}
			var user = tracking.getUser(winner);
			if(!user){
				return 'user no longer available';
			}
			user.nanobots = user.nanobots + amount;
			var data = _.extend({amount:amount}, user);
			return sendMessage('WINNER! <%= nick %>, you just won <%= amount %> nanobots!', data);
		}
		return 'start stop clear draw status';
	},
	contest: function(cmd, amount){
		if(cmd === 'start'){
			ticketing.start(amount);
			amount = ticketing.amount;
			var data = {amount:amount};
			return sendMessage('Contest started! type \"!ticket [quantity]\" to enter. price <%= amount %> nanobots per ticket.', data);
			return 'contest started';
		}
		if(cmd === 'stop'){
			ticketing.stop();
			room.say('Contest Finished. Good Luck!');
			return 'contest stopped';
		}
		if(cmd === 'clear'){
			ticketing.clear();
			return 'cleared contest entries';
		}
		if(cmd === 'status'){
			var status = ticketing.status()
			var entries = JSON.stringify(status.entries);
			var running = status.isRunning ? 'live' : 'off';
			return '('+running+') entries:'+entries;
		}
		if(cmd === 'draw'){
			var winner = ticketing.draw();
			if(!winner){
				return 'no entries';
			}
			var user = tracking.getUser(winner);
			if(!user){
				return 'user no longer available';
			}
			ticketing.saveAsWinner(winner);
			var data = _.extend({}, user);
			return sendMessage('WINNER! <%= nick %>, you just won the contest!', data);
		}
		if(cmd === 'test'){
			ticketing.add(amount, 10);
			return 'testing';
		}
		return 'start stop clear draw status';
	},	
	user:function(name, action, prop, val){
		// set the number to a number, or leave as a string;
		var value = +val;
		if(isNaN(value)){
			value = ''+val;
		}
		if(action === 'set'){
			if(prop && val){
				var success = tracking.updateUser(name, prop, value);
				if(!success){
					return 'unknown property '+prop;
				}
				var data = _.extend({name:name, action:action, prop:prop, value:value}, {});
				return makeMessage('SET <%= name %>.<%= prop %> = <%= value %>', data); 
			}
		}

		if(!action){
			// display user prefs
			tracking.viewUser(name, function(err, doc){
				console.log('viewing user', doc);
			});
			return 'Looking up user...';
		}
	},
	adjust:function(type, amount){
		amount = +amount;
		var good = false;
		if(!isNaN(amount)){
			if(type === 'nanobot' || type === 'nb'){
				type = 'nanobot';
				good = true;
			}else if(type === 'megabot' || type === 'mb'){
				type = 'megabot';
				good = true;
			}
			if(good){
				var prev = tracking[type+'_adjust'];
				var curr = tracking[type+'_adjust'] = amount;
				var template = '<%= type %>s normal';
				if(curr === 0){
					template = '<%= type %>s normal';
				}else if(curr > prev){
					template = '<%= type %>s taking <%= amount %> minutes longer.';
				}else if(curr < prev){
					template = '<%= type %>s taking <%= amount %> minutes less.';
				}
				var data = {type:type, amount:amount};
				return sendMessage(template, data);
			}
		}
		return 'nanobots(nb), megabots(mb)';
	}
};



var replServer = repl.start({
	prompt:config.name+' > ',
	eval:function(cmd, context, filename, cb){
		var result = executeFunction(globalCommands, getCommand(cmd), replServer.context);
		cb(null, result);
	}
});

//replServer.context.val




