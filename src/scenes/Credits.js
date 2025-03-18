import { Scene } from 'phaser';
import { ResponsiveUI } from '../utils/ResponsiveUI';

export class Credits extends Scene {
    constructor() {
        super('Credits');
    }
    
    create() {
        // Initialize responsive UI helper
        this.ui = new ResponsiveUI(this);
        
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const safeZone = this.ui.getSafeZone();
        
        // Set background without any overlays
        const background = this.add.image(centerX, height/2, 'background');
        background.setDisplaySize(width, height);
        background.setAlpha(0.7); // Slightly dimmed background for readability
        
        // Add title - with left alignment and smaller font
        const titleText = this.ui.createText(safeZone.left + 20, safeZone.top + 20, 'Credits', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'left'
        }).setOrigin(0, 0);
        
        // Create a scrollable container for credits content with responsive sizing
        const containerWidth = width - safeZone.left - safeZone.right - 40;
        const containerTop = safeZone.top + 80; // Position below title
        const containerHeight = height - containerTop - safeZone.bottom - 80;
        
        const creditsMask = this.add.graphics()
            .fillStyle(0xffffff)
            .fillRect(safeZone.left + 20, containerTop, containerWidth, containerHeight);
        
        const creditsContainer = this.add.container(0, containerTop);
        creditsContainer.setMask(creditsMask.createGeometryMask());
        
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
        
        // Track total height for positioning with tighter spacing
        let currentY = 0;
        const sectionSpacing = this.ui.fontSize(14);
        const itemSpacing = this.ui.fontSize(5);
        const leftMargin = safeZone.left + 20; // Consistent left margin
        
        // Add each credit section
        creditSections.forEach(section => {
            // Add section header with left-aligned text and smaller font
            const headerText = this.ui.createText(leftMargin, currentY, section.header, {
                fontFamily: 'Arial Black',
                fontSize: '14px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'left'
            }).setOrigin(0, 0);
            
            creditsContainer.add(headerText);
            currentY += headerText.height + itemSpacing;
            
            // Add each item under this header
            section.items.forEach(item => {
                // Create item text with left alignment and much smaller font
                const itemText = this.ui.createText(leftMargin + 20, currentY, item.name, {
                    fontFamily: 'Arial',
                    fontSize: '12px',
                    color: item.url ? '#66ccff' : '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 1,
                    align: 'left'
                }).setOrigin(0, 0);
                
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
        
        // Only add scroll instructions if content needs scrolling
        if (maxScroll > 0) {
            // Add scroll instructions
            this.ui.createText(
                safeZone.left + 300, 
                height - safeZone.bottom - 60, 
                'Scroll with mouse wheel or drag to see more', {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: 1,
                align: 'left'
            }).setOrigin(0, 0).setScrollFactor(0);
            
            // Mouse wheel scrolling
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                const newY = Phaser.Math.Clamp(
                    creditsContainer.y - deltaY * 0.5, 
                    containerTop - maxScroll, 
                    containerTop
                );
                creditsContainer.y = newY;
            });
            
            // Drag scrolling
            let isDragging = false;
            let lastY = 0;
            
            this.input.on('pointerdown', (pointer) => {
                if (pointer.y > containerTop && pointer.y < containerTop + containerHeight) {
                    isDragging = true;
                    lastY = pointer.y;
                }
            });
            
            this.input.on('pointermove', (pointer) => {
                if (isDragging) {
                    const deltaY = pointer.y - lastY;
                    const newY = Phaser.Math.Clamp(
                        creditsContainer.y + deltaY, 
                        containerTop - maxScroll, 
                        containerTop
                    );
                    creditsContainer.y = newY;
                    lastY = pointer.y;
                }
            });
            
            this.input.on('pointerup', () => {
                isDragging = false;
            });
        }
        
        // Back button with responsive sizing and positioning
        this.ui.createButton(
            safeZone.left + 20, 
            height - safeZone.bottom - 20, 
            'Back to Menu', 
            {
                fontFamily: 'Arial Black',
                fontSize: '16px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
                backgroundColor: '#4a4a4a'
            },
            () => {
                this.scene.start('MainMenu');
            }
        ).setOrigin(0, 1);
    }
}