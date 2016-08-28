# Twitch Chat bot with *MAGIC*

## Rotating messages (CRON formats excepted)
## Raffles!
## Dice roller
## add commands that pull from any JSON endpoint (examples include "chuck norris, and ron swanson quotes"
## user levels with auto level up notifications
## easily administered via the command line interface

## MAGIC - user commands (spells) system for streaming magic! 
Users can type in commands such as "!hello" and an animated gif will appear in the stream. 
It's very easy to add, just edit the config and add in the following code to the "magic=>spells" area

    "hello":{ "gfx":"images/hello.gif", "pause":3, "min-xp":1},
    
min-xp is the minimum XP required to cast the spell. All spells have a 60 second cooldown. once added, put the image into the "images" folder, and point OBS to the local webserver created 

- more coming soon. please post suggestions or questions
