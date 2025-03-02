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