r0b0ts
======

Basic command list for app:

 * __start__ giving bots
 * __stop__ giving bots
 * __save__ database immediately 
 * __stats__ | "enter" will display basic stats
 * __import 'name'__ a database setup in config by name
 
 
 Raffles
 
 * __raffle start__
 * __raffle stop__
 * __raffle clear__ - removes all entries
 * __raffle status__
 * __raffle draw__ - uses default amout from config file
 * __raffle draw 'amount'__
 
 
 Contests
 
 * __contest start 'amount'__ - starts contest, sets price per ticket in nanobots 
 * __contest stop__
 * __contest clear__ - removes all entries
 * __contest status__
 * __contest draw__
 
 
 Users
 
 * __'user' set 'property' 'value'__ - valid properties are anything set in user file
 
 
 Ticker
 
 * __adjust nb 2__ - adjust global nanobot rate
 * __adjust mb 2__ - adjust global megabot rate
 * __adjust nb|mb 0__ - resets rate


---

Chat Commands for users

* __!nanobots__ - shows number of nanobots
* __!megabots__ - shows number of megabots
* __!raffle__ - enter raffle
* __!ticket 'num'__ - buy tickets for contest
* __!ticket refund__ - refund all tickets for contest
* __!level__ - get user level based on megabots and subscription



Chat commands for Admins only

* __!nanobots add|rm 'number' 'user'|'all'__
* __ !cmd 'command parameters...'__ - runs a command as if from the console



