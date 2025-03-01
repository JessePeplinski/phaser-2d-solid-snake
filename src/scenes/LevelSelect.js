import { Scene } from 'phaser';
import { gameProgress } from './GameProgress';

export class LevelSelect extends Scene {
    constructor() {
        super('LevelSelect');
        this.levelFiles = [];
        this.buttons = [];
    }

    preload() {
        // We'll discover available level files in create()
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;
        const baseWidth = 800;
        const scaleFactor = width / baseWidth;

        // Set background
        const background = this.add.image(centerX, centerY, 'background');
        background.setDisplaySize(width, height);

        // Add title
        this.add.text(centerX, 100 * scaleFactor, 'Select Level', {
            fontFamily: 'Arial Black',
            fontSize: `${48 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);

        // Discover available level files
        this.discoverLevelFiles();
        
        // If no levels found, create a fallback with at least one level
        if (this.levelFiles.length === 0) {
            console.log('No levels found. Using fallback level.');
            // If there's a 'map' key, use it as level1
            if (this.cache.tilemap.exists('map')) {
                this.levelFiles = ['map'];
                console.log('Using "map" as fallback level.');
            } else {
                // Just create a manual list as last resort
                this.levelFiles = ['level1', 'level2', 'level3'];
                console.log('Using hardcoded level list as fallback.');
            }
            this.createLevelButtons();
        }
    }

    discoverLevelFiles() {
        // Get the cache keys for all loaded CSV files
        const keys = this.cache.tilemap.getKeys();
        
        console.log('Available tilemap keys:', keys);
        
        // Filter keys to only include level files that match our naming convention
        this.levelFiles = keys.filter(key => /^level\d+$/.test(key))
                             .sort((a, b) => {
                                 // Extract level numbers and sort numerically
                                 const numA = parseInt(a.replace('level', ''));
                                 const numB = parseInt(b.replace('level', ''));
                                 return numA - numB;
                             });
        
        console.log('Found level files:', this.levelFiles);
        
        // Create level selection buttons
        this.createLevelButtons();
    }

    createLevelButtons() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const baseWidth = 800;
        const scaleFactor = width / baseWidth;
        
        // If no levels found, show a message
        if (this.levelFiles.length === 0) {
            this.add.text(centerX, height / 2, 'No levels found!', {
                fontFamily: 'Arial Black',
                fontSize: `${32 * scaleFactor}px`,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4 * scaleFactor,
                align: 'center'
            }).setOrigin(0.5);
            
            // Add back button
            this.createBackButton(scaleFactor);
            return;
        }
        
        // Calculate layout parameters for the grid
        const buttonWidth = 200 * scaleFactor;
        const buttonHeight = 60 * scaleFactor;
        const padding = 20 * scaleFactor;
        const buttonsPerRow = Math.min(3, this.levelFiles.length);
        const rows = Math.ceil(this.levelFiles.length / buttonsPerRow);
        
        // Calculate starting Y position to center the grid vertically
        const gridHeight = rows * buttonHeight + (rows - 1) * padding;
        let startY = (height - gridHeight) / 2;

        // Create buttons for each level
        for (let i = 0; i < this.levelFiles.length; i++) {
            const row = Math.floor(i / buttonsPerRow);
            const col = i % buttonsPerRow;
            
            // Calculate position for this button
            let buttonX = centerX + (col - (buttonsPerRow - 1) / 2) * (buttonWidth + padding);
            let buttonY = startY + row * (buttonHeight + padding);
            
            // Get level number from filename
            const levelNumber = parseInt(this.levelFiles[i].replace('level', ''));
            const levelKey = this.levelFiles[i];
            
            // Check if this level is unlocked
            const isUnlocked = gameProgress.isLevelUnlocked(levelKey);
            const isCompleted = gameProgress.getCompletedLevels().includes(levelKey);
            
            // Set color based on status
            let buttonColor, buttonBgColor, buttonText;
            if (isCompleted) {
                // Completed levels - green tint
                buttonColor = '#ffffff';
                buttonBgColor = '#2ecc71';
                buttonText = `✓ Level ${levelNumber}`;
            } else if (isUnlocked) {
                // Unlocked but not completed - normal
                buttonColor = '#ffffff';
                buttonBgColor = '#4a4a4a';
                buttonText = `Level ${levelNumber}`;
            } else {
                // Locked levels - darker with lock icon
                buttonColor = '#999999';
                buttonBgColor = '#2d2d2d';
                buttonText = `🔒 Level ${levelNumber}`;
            }
            
            // Create the button
            const button = this.add.text(buttonX, buttonY, buttonText, {
                fontFamily: 'Arial Black',
                fontSize: `${24 * scaleFactor}px`,
                color: buttonColor,
                stroke: '#000000',
                strokeThickness: 4 * scaleFactor,
                align: 'center',
                backgroundColor: buttonBgColor,
                padding: {
                    left: 16 * scaleFactor,
                    right: 16 * scaleFactor,
                    top: 8 * scaleFactor,
                    bottom: 8 * scaleFactor
                }
            }).setOrigin(0.5);
            
            // Only add interaction if the level is unlocked
            if (isUnlocked) {
                button.setInteractive({ useHandCursor: true })
                    .on('pointerover', () => button.setStyle({ color: '#f39c12' }))
                    .on('pointerout', () => button.setStyle({ color: buttonColor }))
                    .on('pointerdown', () => this.startLevel(levelKey));
            }
            
            this.buttons.push(button);
        }
        
        // Add back button below the level buttons
        this.createBackButton(scaleFactor);
    }
    
    createBackButton(scaleFactor) {
        const { width, height } = this.cameras.main;
        
        const backButton = this.add.text(width / 2, height - 80 * scaleFactor, 'Back to Menu', {
            fontFamily: 'Arial Black',
            fontSize: `${24 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);
        
        backButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ color: '#f39c12' }))
            .on('pointerout', () => backButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.scene.start('MainMenu'));
            
        // Add a reset progress button (for testing)
        const resetButton = this.add.text(width - 20, height - 20, '🔄 Reset Progress', {
            fontFamily: 'Arial',
            fontSize: `${16 * scaleFactor}px`,
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 2 * scaleFactor,
        }).setOrigin(1, 1);
        
        resetButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                resetButton.setStyle({ color: '#f39c12' });
            })
            .on('pointerout', () => {
                resetButton.setStyle({ color: '#aaaaaa' });
            })
            .on('pointerdown', () => {
                gameProgress.reset();
                this.scene.restart();
            });
    }
    
    startLevel(levelKey) {
        // Pass selected level key to Game scene and start it
        this.scene.start('Game', { levelKey: levelKey });
    }
}