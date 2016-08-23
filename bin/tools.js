_ = require('lodash')


module.exports = {

	flattenObjToList: function(obj){
	  return _.reduce(obj, function(acc, _list){
	    return _.union(acc, _list)
	  }, [])
	},

	// tests if a user can use something based off settings
	caniuse: function(user, settings){
		var min_xp = settings["min-xp"] | 0
		var min_gold = settings["min-gold"] | 0
		var allowedTitles = settings["min-titles"] | []
		var allowed = true
		if(allowedTitles.length > 0){
			allowed = _.indexOf(allowedTitles, user.title) >= 0
		}		
		if(user.xp < min_xp){
			allowed = false
		}
		if(user.gold < min_gold){
			allowed = false
		}
		return allowed
	}

}