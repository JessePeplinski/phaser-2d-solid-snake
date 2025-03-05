import { Scene } from 'phaser';
import { ResponsiveUI } from '../utils/ResponsiveUI';
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
        // Initialize responsive UI helper
        this.ui = new ResponsiveUI(this);
        
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;
        const safeZone = this.ui.getSafeZone();
        
        // Set background
        const background = this.add.image(centerX, centerY, 'background');
        background.setDisplaySize(width, height);

        // Add title with responsive text
        this.ui.createText(centerX, safeZone.top + 40, 'Select Level', {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
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
        
        // Listen for orientation changes
        this.scale.on('resize', () => {
            this.ui.handleResize(this.cameras.main);
            // Recreate buttons with new layout
            this.createLevelButtons();
        });
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
        const safeZone = this.ui.getSafeZone();
        
        // If no levels found, show a message
        if (this.levelFiles.length === 0) {
            this.ui.createText(centerX, height / 2, 'No levels found!', {
                fontFamily: 'Arial Black',
                fontSize: '32px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);
            
            // Add back button
            this.createBackButton();
            return;
        }
        
        // Calculate layout parameters for the grid based on device
        // Adapt grid layout based on orientation and device type
        let columns, rows;
        
        if (this.ui.isLandscape) {
            columns = this.ui.isMobile ? 3 : 4;
            rows = this.ui.isMobile ? 2 : 3;
        } else {
            columns = this.ui.isMobile ? 2 : 3;
            rows = this.ui.isMobile ? 3 : 3;
        }
        
        // Update levels per page based on the new grid size
        this.levelsPerPage = columns * rows;
        
        // Calculate button sizes based on available space
        const maxGridWidth = width - safeZone.left - safeZone.right - 40;
        const maxGridHeight = height - safeZone.top - safeZone.bottom - 200; // Leave room for title and nav buttons
        
        const buttonSpacing = this.ui.isMobile ? 10 : 20;
        const buttonWidth = Math.min(
            200, 
            (maxGridWidth - (buttonSpacing * (columns - 1))) / columns
        );
        const buttonHeight = Math.min(
            60, 
            (maxGridHeight - (buttonSpacing * (rows - 1))) / rows
        );
        
        // Calculate total levels and pages
        const totalLevels = this.levelFiles.length;
        const totalPages = Math.ceil(totalLevels / this.levelsPerPage);
        
        // Ensure current page index is valid
        if (this.pageIndex >= totalPages) {
            this.pageIndex = Math.max(0, totalPages - 1);
        }
        
        // Calculate starting Y position to center the grid vertically
        const gridHeight = rows * buttonHeight + (rows - 1) * buttonSpacing;
        let startY = safeZone.top + 120;
        
        if (gridHeight < maxGridHeight) {
            startY = safeZone.top + 120 + (maxGridHeight - gridHeight) / 2;
        }
        
        // Calculate start and end index for this page
        const startIndex = this.pageIndex * this.levelsPerPage;
        const endIndex = Math.min(startIndex + this.levelsPerPage, totalLevels);
        
        // Create buttons for levels on this page
        for (let i = startIndex; i < endIndex; i++) {
            const relativeIndex = i - startIndex;
            const row = Math.floor(relativeIndex / columns);
            const col = relativeIndex % columns;
            
            // Calculate position for this button
            const gridWidth = columns * buttonWidth + (columns - 1) * buttonSpacing;
            const gridStartX = centerX - gridWidth / 2;
            
            let buttonX = gridStartX + (col * (buttonWidth + buttonSpacing)) + buttonWidth / 2;
            let buttonY = startY + (row * (buttonHeight + buttonSpacing)) + buttonHeight / 2;
            
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
            
            // Create responsive button
            const buttonStyle = {
                fontFamily: 'Arial Black',
                fontSize: '24px', 
                color: buttonColor,
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: buttonBgColor,
                fixedWidth: buttonWidth,
                fixedHeight: buttonHeight,
                align: 'center',
                padding: {
                    top: 8,
                    bottom: 8
                }
            };
            
            const button = this.ui.createText(buttonX, buttonY, buttonText, buttonStyle).setOrigin(0.5);
            
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
            this.createPaginationControls(totalPages);
        }
        
        // Add back button below the level buttons
        this.createBackButton();
    }
    
    createPaginationControls(totalPages) {
        const { width, height } = this.cameras.main;
        const safeZone = this.ui.getSafeZone();
        
        // Create page indicator text with responsive sizing
        const pageText = this.ui.createText(
            width / 2, 
            height - safeZone.bottom - 80, 
            `Page ${this.pageIndex + 1} / ${totalPages}`, 
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        ).setOrigin(0.5);
        
        this.buttons.push(pageText);
        
        // Previous page button - with responsive positioning and sizing
        if (this.pageIndex > 0) {
            const prevButton = this.ui.createText(
                (width / 2) - 80, 
                height - safeZone.bottom - 80, 
                '◀ Prev', 
                {
                    fontFamily: 'Arial',
                    fontSize: '18px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3,
                    align: 'center'
                }
            ).setOrigin(0.5);
            
            prevButton.setInteractive({ useHandCursor: true })
                .on('pointerover', () => prevButton.setStyle({ color: '#f39c12' }))
                .on('pointerout', () => prevButton.setStyle({ color: '#ffffff' }))
                .on('pointerdown', () => {
                    this.pageIndex--;
                    this.createLevelButtons();
                });
                
            this.buttons.push(prevButton);
        }
        
        // Next page button - with responsive positioning and sizing
        if (this.pageIndex < totalPages - 1) {
            const nextButton = this.ui.createText(
                (width / 2) + 80, 
                height - safeZone.bottom - 80, 
                'Next ▶', 
                {
                    fontFamily: 'Arial',
                    fontSize: '18px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3,
                    align: 'center'
                }
            ).setOrigin(0.5);
            
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
    
    createBackButton() {
        const { width, height } = this.cameras.main;
        const safeZone = this.ui.getSafeZone();
        
        // Create back button with responsive sizing
        const backButton = this.ui.createButton(
            width / 2, 
            height - safeZone.bottom - 20, 
            'Back to Menu', 
            {
                fontFamily: 'Arial Black',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: '#4a4a4a'
            },
            () => this.scene.start('MainMenu')
        ).setOrigin(0.5, 1);
        
        this.buttons.push(backButton);
        
        // Add a reset progress button in bottom corner (for testing)
        const resetButton = this.ui.createText(
            width - safeZone.right - 20, 
            height - safeZone.bottom - 20, 
            '🔄 Reset Progress', 
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#aaaaaa',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(1, 1);
        
        resetButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => resetButton.setStyle({ color: '#f39c12' }))
            .on('pointerout', () => resetButton.setStyle({ color: '#aaaaaa' }))
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