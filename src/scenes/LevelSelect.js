import { Scene } from 'phaser';
import { gameProgress } from './GameProgress';

export class LevelSelect extends Scene {
    constructor() {
        super('LevelSelect');
        this.levelFiles = [];
        this.buttons = [];
        this.pageIndex = 0;
        this.levelsPerPage = 9; // 3x3 grid
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
                this.levelFiles = ['level1', 'level2', 'level3', 'level4'];
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
        // Clear any existing buttons
        this.buttons.forEach(button => button.destroy());
        this.buttons = [];
        
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
        
        // Calculate rows and columns for our grid
        const columns = 3;
        const rows = 3;
        
        // Calculate total levels and pages
        const totalLevels = this.levelFiles.length;
        const totalPages = Math.ceil(totalLevels / this.levelsPerPage);
        
        // Calculate starting Y position to center the grid vertically
        const gridHeight = rows * buttonHeight + (rows - 1) * padding;
        let startY = (height - gridHeight) / 2;

        // Calculate start and end index for this page
        const startIndex = this.pageIndex * this.levelsPerPage;
        const endIndex = Math.min(startIndex + this.levelsPerPage, totalLevels);
        
        // Create buttons for levels on this page
        for (let i = startIndex; i < endIndex; i++) {
            const relativeIndex = i - startIndex;
            const row = Math.floor(relativeIndex / columns);
            const col = relativeIndex % columns;
            
            // Calculate position for this button
            let buttonX = centerX + (col - 1) * (buttonWidth + padding);
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
        
        // Add pagination if we have multiple pages
        if (totalPages > 1) {
            this.createPaginationControls(totalPages, scaleFactor);
        }
        
        // Add back button below the level buttons
        this.createBackButton(scaleFactor);
    }
    
    createPaginationControls(totalPages, scaleFactor) {
        const { width, height } = this.cameras.main;
        
        // Create page indicator text
        const pageText = this.add.text(width / 2, height - 130 * scaleFactor, 
            `Page ${this.pageIndex + 1} / ${totalPages}`, {
            fontFamily: 'Arial',
            fontSize: `${18 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);
        
        this.buttons.push(pageText);
        
        // Previous page button
        if (this.pageIndex > 0) {
            const prevButton = this.add.text(width / 2 - 80 * scaleFactor, height - 130 * scaleFactor, '◀ Prev', {
                fontFamily: 'Arial',
                fontSize: `${18 * scaleFactor}px`,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3 * scaleFactor,
                align: 'center'
            }).setOrigin(0.5);
            
            prevButton.setInteractive({ useHandCursor: true })
                .on('pointerover', () => prevButton.setStyle({ color: '#f39c12' }))
                .on('pointerout', () => prevButton.setStyle({ color: '#ffffff' }))
                .on('pointerdown', () => {
                    this.pageIndex--;
                    this.createLevelButtons();
                });
                
            this.buttons.push(prevButton);
        }
        
        // Next page button
        if (this.pageIndex < totalPages - 1) {
            const nextButton = this.add.text(width / 2 + 80 * scaleFactor, height - 130 * scaleFactor, 'Next ▶', {
                fontFamily: 'Arial',
                fontSize: `${18 * scaleFactor}px`,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3 * scaleFactor,
                align: 'center'
            }).setOrigin(0.5);
            
            nextButton.setInteractive({ useHandCursor: true })
                .on('pointerover', () => nextButton.setStyle({ color: '#f39c12' }))
                .on('pointerout', () => nextButton.setStyle({ color: '#ffffff' }))
                .on('pointerdown', () => {
                    this.pageIndex++;
                    this.createLevelButtons();
                });
                
            this.buttons.push(nextButton);
        }
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
            
        this.buttons.push(backButton);
        
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
            
        this.buttons.push(resetButton);
    }
    
    startLevel(levelKey) {
        // Pass selected level key to Game scene and start it
        this.scene.start('Game', { levelKey: levelKey });
    }
}