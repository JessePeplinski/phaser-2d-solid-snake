# Generic Start of Question
I'm using v3.88.2 of Phaser. 

Since this file is so large, continue the file in a new artifact exactly where you left off. 

<prompt>

# Question
I need to account for a larger background image for the Main Menu screen of my Phaser.js, sized 1024 x 1024 from 512 x 384. What do I need to update in my code to do so? Attached are my relevant assets.

# Question
Can you update this Main Menu screen in Phaser.js v3.88.2 to include basic "breathing" animation? I want to the overall background and the pipes sort of look like they are "breathing" and "moving" in a cyber-punk kind of way. I've uploaded the image here as well.  

# Question
Can you add a very simple sort of small shake or rainfall affect on the page? I'm going for a gritty/grainy/cyber-punk feel. Make it very subtle. I don't have any assets on hand to use for this.

# Darkness
Can you update the darkness mechanic so that the current direction the player is looking is further than the other directions? Then, make the other directions smaller in size to emulate "perception" for the player looking around

This changed worked well. I want to expand this further - there are collision tiles between setCollisionBetween(54, 83) in the tilemap. Can you update the visibility so that nothing can be seen beyond an collision tile?

# Game Mechanics Implementation
## Spawn and Goal Tiles
I need to implement my actual game mechanics. The goal of the game is for the player to make it from their player spawn to the goal tile. 

// tile 32 is the player spawn tile
// tile 31 is the goal tile

Can you implement the following:
1. The player needs to spawn on tile 32.
2. Once the player reaches tile 31, the game has been won. Display a "You won" screen. 

Here is the code. 

## Add Time Limit for the Level
This code worked as expected. Now, add a time limit that the user has to complete the level. Start with 60 seconds. If the time limit expires, they lose the game. 

## Add Level Screen
I want to add a Level screen to my game. 

When the "Start Game" button is pressed, bring the user to a new screen where they can select a level. This will load file in `public/assets/tilemaps/levelX.csv`. All of my levels follow the convention `level1.csv`, `level2.csv`, `level3.csv`, etc. 

Make this account for whatever number of CSV files I have. When files are added or removed, it will dynamically display number of levels on the Level screen game. 

Do not upload anything else yet - I want to get this code working then we can move on to "Next Level" and additional options. 

-- 
I can click on the start game then one of my levels and I can play it just fine. However after I finish a level and I click the “Next level” button, I see the new map generated but I can't move anywhere on the map. The same thing is true if I go to the main menu screen from completing a level and then try to select on the level it's the same issue. I'm not seeing any console errors. The log does say loading level with the correct level. I can clearly see that on the screen but something with my game loop or something is broken and I can't move anywhere. I can however toggle the debug menu and use C key and the zoom reset key along with my mouse wheel to scroll. The darkness effect is also broken - I can’t turn it on and off and there is no darkness when I try to go to the next level. These issues occur on desktop and mobile.

# Preloader
I don't think that I'm using my Preloader.js in the best way yet to load all my assets. Can you make sure my assets are all loaded from this file and use the best practices for loading assets? I assume a loading progress indicator would be helpful here, too.

# Question
On mobile, I scale down my resolution so that everything fits and sizes to the users device. However, I'm noticing scaling everything makes the text pretty distorted along with the Game screen itself.

Do you have suggestions on how I can improve this?

## Add AI
Now that I have basic game elements implemented, I want to add a basic AI system that attempts to hunt the player. The idea that is if the AI catches up and touches the player, they are captured, and therefore lose the game.

The AI should appear in the game and use the same movement and animations as the player for movement, though make them a bit slower so the player has a chance to out-run them. 

I will use tile 33 in my code to specify the AI spawn points. When they spawn, they should wander through the map and try to hunt down the player. They should have the same sight line as the player (i.e. they can only see as much as the player can in their darkness).

The player should also be able to see the AI's vision as well. Make this the same way as we did the darkness, but make it a slightly yellow cone so it's clear to the user what the line of sight for the AI is. 

## Patrol Paths
I want to implement AI patrol paths for more deterministic movement. Therefore, I have specified another tile in my game, 34, that will be a fully connected path from their spawn point.

If the AI tries to pursue the player, keep having them do so, but once they their lose line of sight, have them return to this path after a few moments. 

Assume the AI's spawn tile (tile 33) will alwaysbe somewhere within the path. When the AI patrols, they should follow the fully connected path for their patrol.

In the case the path is a square or rectangle path (which it often will be) the AI should not have a draw path within the square, it's path should be the perimeter of the rectangle or square. 

# AI
This code is now working.

I need another change - the movement of the AI still does not feel very natural. AI currently goes to a tile, stop for a moment, then go to the next tile in their path.

The movement should feel more natural, meaning they should not stop for a moment on each tile. The AI needs to have continuous movement. 

# Question
I need to update my AI code. The code for exploring the last known location is not working as I expect it to.

I see the points get plotted on the map, but the AI does not explore each point. I would like them to do so. THey currently remaining stationary and spin around in a 360-degree circle. 

# Footsteps
If the user toggles on sound for the game from the Main Menu, I want a footstep sound to play when they walk. The AI should also have footstep sounds. The asset is found in /public/sounds/footstep.mp3. This file is less than a second long and should loop as needed.

# Question
Add a minimap system in the upper right hand corner that shows where the player is on the map and the alert status. This should display at all times, debug or no debug mode. (The alerts should match what the game is: No alert (nothing shows), low alert, medium alert, high alert)

# Debug menu fix
The AI view (non-debug menu) in the game screen is showing too much that should be hidden behind the debug menu.

Can you move the following into the debug menu:
1. The drawn paths should be moved into the debug.
2. The small circle that diplays above the AI can be removed in both debug and non-debug mode. 

# Question
My AI pathing behavior is not working very well when there are more than one AI introduced. They seem to jump around to each others paths and patterns. 

Can you update the pathfinding so that when the AI spawns, they remain on the path that they originally started on?

# AI Converging on player position in high alert

When an AI enters high alert mode, all enemies should converge on the players location. 

Have the enemy randomly say one of the following phrases above their head: 
“I need assistance—now!”
“They’re pushing hard; send reinforcements!”
“I can’t hold them off on my own!”
“Back me up before it’s too late!”
“They’ve breached my position—requesting support!”
“Multiple hostiles detected! I need backup!”
“Cover me! I’m taking heavy fire!”
“I’m pinned down! Get over here!”
“We have a situation. All units converge!”
“Reinforcements needed—over!”

The enemies should then attempt to converge on the player. They should say one of the following phrases above their head:
“We’re on our way—sit tight!”
“Reinforcements inbound; hold your position!”
“Copy that; moving to support!”
“Don’t worry, we’ve got your six!”
“Moving in! Keep them busy until we arrive!”
“Hang in there—backup is here!”
“We’ve got eyes on the target; going in!”
“We’re with you. Let’s turn the tide!”
“Stay alert, we’re taking over from here!”
“Time to wrap this up!”

Please make this update. 


# AI Display
Please make two changes to the AI:
1. The ! or the !? displays above the enemies head when they enter the low, medium or high alert. When there is no alert state, please remove the ! and the !? from the enemy.   
2. When returning back to the normal state, show the message above the enemy heads "Guess it was nothing..."


# AI: Last known location
The code I have for the AI searching the "last known" location is not working. I can points plot on the map, but then the AI does not attempt to visit the points. Instead, they remain in one location, and spin in a circle. 

Can you fix or simplify the search for the last known location?

# Question
My game uses a scaling affect on mobile / different device sizes. However, I'm finding that during my testing, this isn't working very well on mobile because the text shrinks down significantly and my game suffers a much worse quality.

What do you suggest as the best practice to ensure this game will look OK on all devices?

# Question
I have implemented the ResponsiveUI.js code and it's working well and sizing things better on different screen devices. 

However, on mobile, the virtual joystick is too far over to the right on both potrait and landscape layouts. 

Can you fix this?

# Question
Can you update my MainMenu.js file as follows:
1. Decrease all font sizes a bit
2. Make all buttons the same size
3. Space all buttons out equally 

# Mobile UI Height Options
I've recently implemented a new way to make this game responsive. However, playing on mobile, I have two problems:
1. The UI is very zoomed out and it's hard to actually see what is going on in the game. 
2. I'm not able to take advantage of any of the vertical screen space I have. 

Is there a good solution for these issues I'm having? 

# Game UI Improvements
1. Under the game's minimap: Display the level, time remaining, and alert status at all times underneath the minimap. Make it the same size as the current alert text. Then remove the level and time remaining from the upper left hand corner. 
2. Move the "Main menu" button location from behind the minimap to the upper left hand corner of the screen. 

# Noise
I want to add the ability for the player to "Yell" by pressing the "Q" key. On mobile, add a button to yell to the bottom left hand corner of the screen.

When they yell, AI will say above their heads "What was that noise?" and if they are within a certain range, they will move toward the players position. 

# AI Pathing
I have an issue with my AI pathing system. I have my AI spawn tile and then my AI paths that each AI should follow. However, when I open my debug menu for my view path, I see the AI is still trying to access other AI's view paths. This should not happen. Can you fix this?

# AI Generated Points
I have an issue with my AI search functionality when exploring the generated points. In the maps I create, I will typically have the area bound by collision tiles so the player and enemies cannot escape it.

As a result, sometimes the generateSearchPoints() function will map points they can never reach as a result of being bound within the collision tiles. This scenario happens especially when they are generating their search points in a small area like a hallways. 

Can you fix this so that this function will only generate search points within the bounds of the collision tiles? The AI should have knowledge on the tiles they can and cannot visit, which should help solve this. 

Think hard about the problem before responding. 