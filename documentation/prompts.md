# Generic Start of Question
I'm using v3.88.2 of Phaser. 

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

When the "Start Game" button is pressed, bring the user to a new screen where they can select a level. This will load a new file in `public/assets/tilemaps`. All of my levels follow the convention `level1.csv`, `level2.csv`, `level3.csv`, etc. 

Make this dynamic so that whatever number of CSV files I have with my naming convention are present will display that number of levels on the screen. 

## Add AI

# Preloader
I don't think that I'm using my Preloader.js in the best way yet to load all my assets. Can you make sure my assets are all loaded from this file and use the best practices for loading assets? I assume a loading progress indicator would be helpful here, too.