# Twitch Chat bot with *MAGIC*

### Rotating messages 
(CRON formats excepted, rotate messages on specific days)

### Raffles!
automatically give users XP when they win

### Dice roller
!roll 2d20

### add commands that pull from any JSON endpoint 
(examples include "chuck norris, and ron swanson quotes"
"!ron" or "!chuck"

### user levels with auto level up notifications
users will get 1 XP every minute

### easily administered via the command line interface
- clone the repo
- "npm install"
- add a "config/production.json" file to override "default.json" settings
- "npm run mac" or "npm run windows"

### MAGIC - user commands (spells) system for streaming magic! 
Users can type in commands such as "!hello" and an animated gif will appear in video the stream. 
It's very easy to add, just edit the config and add in the following code to the "magic->spells" area

    "hello":{ "gfx":"images/hello.gif", "pause":3, "min-xp":1},
    
min-xp is the minimum XP required to cast the spell. All spells have a 60 second cooldown. once added, put the image into the "images" folder, and point OBS to the local webserver created 

- more coming soon. please post suggestions or questions
