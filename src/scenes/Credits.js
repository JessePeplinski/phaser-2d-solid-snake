import { Scene } from 'phaser';

export class Credits extends Scene {
    constructor() {
        super('Credits');
    }
    
    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const baseWidth = 800;
        const scaleFactor = width / baseWidth;
        
        // Set background
        const background = this.add.image(centerX, height/2, 'background');
        background.setDisplaySize(width, height);
        background.setAlpha(0.6); // Dimmer background for better text readability
        
        // Add title
        const title = this.add.text(centerX, 60 * scaleFactor, 'Credits', {
            fontFamily: 'Arial Black',
            fontSize: `${48 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);
        
        // Credits content with multiple items per section
        const creditSections = [
            {
                header: 'Game Design & Development',
                items: [
                    { name: '@peptech_', url: 'https://x.com/peptech_' }
                ]
            },
            {
                header: 'Game Engine',
                items: [
                    { name: 'Phaser 3', url: 'https://phaser.io' },
                    { name: 'Phaser Vite Template', url: 'https://github.com/phaserjs/template-vite' }
                ]
            },
            {
                header: 'Graphics',
                items: [
                    { name: 'Map Tileset', url: 'https://cdn.phaserfiles.com/v385/assets/tilemaps/tiles/catastrophi_tiles_16.png' },
                    { name: 'Sprite Tileset', url: 'https://cdn.phaserfiles.com/v385/assets/sprites/spaceman.png' },
                ]
            },
            {
                header: 'Sound Effects',
                items: [
                    { name: 'Intro Music', url: 'https://pixabay.com/sound-effects/mgs-first-one-my-own-version-of-music-by-kris-demo-sample-done-on-ableton-live-and-made-up-31742/' },
                    { name: 'Footsteps', url: 'https://pixabay.com/sound-effects/footstep-1-83098//' },
                    { name: 'Alert Sound', url: 'https://pixabay.com/sound-effects/metal-gear-solid-alarm-42627/' },
                    { name: 'Alarm Sound', url: 'https://pixabay.com/sound-effects/alert-33762/' }
                    
                ]
            },
            {
                header: 'Other Helpful Resources',
                items: [
                    { name: 'Phaser - CSV Map Arcade Physics', url: 'https://phaser.io/examples/v3.85.0/tilemap/collision/view/csv-map-arcade-physics' },
                    { name: 'Phaser - CSV Map', url: 'https://phaser.io/examples/v3.85.0/tilemap/view/csv-map' }
                ]
            },
            {
                header: 'Special Thanks',
                items: [
                    { name: 'The Phaser Community', url: 'https://discord.gg/phaser' },
                    { name: 'Phaser Studio', url: 'https://phaser.io' }
                ]
            }
        ];
        
        // Create a scrollable container for credits content
        const containerWidth = width * 0.8;
        const containerHeight = height - 180 * scaleFactor;
        const creditsMask = this.add.graphics()
            .fillStyle(0xffffff)
            .fillRect((width - containerWidth) / 2, 120 * scaleFactor, containerWidth, containerHeight);
        
        const creditsContainer = this.add.container(0, 120 * scaleFactor);
        creditsContainer.setMask(creditsMask.createGeometryMask());
        
        // Track total height for positioning
        let currentY = 0;
        const sectionSpacing = 30 * scaleFactor;
        const itemSpacing = 10 * scaleFactor;
        
        // Add each credit section
        creditSections.forEach(section => {
            // Add section header
            const headerText = this.add.text(centerX, currentY, section.header, {
                fontFamily: 'Arial Black',
                fontSize: `${28 * scaleFactor}px`,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4 * scaleFactor,
                align: 'center'
            }).setOrigin(0.5, 0);
            
            creditsContainer.add(headerText);
            currentY += headerText.height + itemSpacing;
            
            // Add each item under this header
            section.items.forEach(item => {
                const itemText = this.add.text(centerX, currentY, item.name, {
                    fontFamily: 'Arial',
                    fontSize: `${22 * scaleFactor}px`,
                    color: item.url ? '#66ccff' : '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3 * scaleFactor,
                    align: 'center'
                }).setOrigin(0.5, 0);
                
                creditsContainer.add(itemText);
                
                // Make clickable if URL exists
                if (item.url) {
                    itemText.setInteractive({ useHandCursor: true });
                    itemText.on('pointerover', () => itemText.setStyle({ fill: '#f39c12' }));
                    itemText.on('pointerout', () => itemText.setStyle({ fill: '#66ccff' }));
                    itemText.on('pointerdown', () => window.open(item.url, '_blank'));
                }
                
                currentY += itemText.height + itemSpacing;
            });
            
            // Add spacing after each section
            currentY += sectionSpacing;
        });
        
        // Add scrolling functionality
        const contentHeight = currentY;
        const maxScroll = Math.max(0, contentHeight - containerHeight);
        
        if (maxScroll > 0) {
            // Add scroll instructions
            const scrollText = this.add.text(centerX, height - 120 * scaleFactor, 
                'Scroll with mouse wheel or drag to see more', {
                fontFamily: 'Arial',
                fontSize: `${14 * scaleFactor}px`,
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: 2 * scaleFactor,
                align: 'center'
            }).setOrigin(0.5);
            
            // Mouse wheel scrolling
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                const newY = Phaser.Math.Clamp(
                    creditsContainer.y - deltaY * 0.5, 
                    120 * scaleFactor - maxScroll, 
                    120 * scaleFactor
                );
                creditsContainer.y = newY;
            });
            
            // Drag scrolling
            let isDragging = false;
            let lastY = 0;
            
            this.input.on('pointerdown', (pointer) => {
                if (pointer.y > 120 * scaleFactor && pointer.y < 120 * scaleFactor + containerHeight) {
                    isDragging = true;
                    lastY = pointer.y;
                }
            });
            
            this.input.on('pointermove', (pointer) => {
                if (isDragging) {
                    const deltaY = pointer.y - lastY;
                    const newY = Phaser.Math.Clamp(
                        creditsContainer.y + deltaY, 
                        120 * scaleFactor - maxScroll, 
                        120 * scaleFactor
                    );
                    creditsContainer.y = newY;
                    lastY = pointer.y;
                }
            });
            
            this.input.on('pointerup', () => {
                isDragging = false;
            });
        }
        

        
        // Back button
        const backButton = this.add.text(centerX, height - 30 * scaleFactor, 'Back to Menu', {
            fontFamily: 'Arial Black',
            fontSize: `${24 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4 * scaleFactor,
            backgroundColor: '#4a4a4a',
            padding: {
                left: 15 * scaleFactor,
                right: 15 * scaleFactor,
                top: 8 * scaleFactor,
                bottom: 8 * scaleFactor
            }
        }).setOrigin(0.5);
        
        backButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                backButton.setStyle({ fill: '#f39c12' });
                backButton.setScale(1.05);
            })
            .on('pointerout', () => {
                backButton.setStyle({ fill: '#ffffff' });
                backButton.setScale(1);
            })
            .on('pointerdown', () => {
                this.scene.start('MainMenu');
            });
    }
}