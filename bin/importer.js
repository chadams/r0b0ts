var util = require('util');
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');




var Importer = function(){

};
util.inherits(Importer, EventEmitter);



Importer.prototype.modbot = function(file, config, tracking){
	var db = new sqlite3.Database(file, sqlite3.OPEN_READONLY);
	db.serialize(function(){
		db.each("SELECT * FROM "+config.name+"", {}, function (err, row){
			if(err){
				return console.log(err);
			}
			tracking.adjustNanobots(row.user, +row.currency);
		});

	});
	db.close();
	return "modbot import";
};



Importer.prototype.linebot = function(file, config, tracking){
	var instream = fs.createReadStream(file);
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);

	rl.on('line', function(line) {
		var parts = line.split(':');
		var nick = parts[0];
		var megabots = +parts[1];
		if(megabots > 0){
			tracking.adjustMegabots(nick, megabots);
		}
	});

	rl.on('close', function() {
	  // do something on finish here
	});
  return "linebot import";
};


module.exports = Importer;