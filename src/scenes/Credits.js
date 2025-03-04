import { Scene } from 'phaser';

export class Credits extends Scene {
    constructor() {
        super('Credits');
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
        background.setAlpha(0.6); // Dimmer background for better text readability
        
        // Add title
        this.add.text(centerX, 80 * scaleFactor, 'Credits', {
            fontFamily: 'Arial Black',
            fontSize: `${48 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);
        
        // Credits content
        const credits = [
            { title: 'Game Design & Development', name: '@peptech' },
            { title: 'Game Engine', name: 'Phaser 3', url: 'https://phaser.io' },
            { title: 'Project Template', name: 'Phaser Vite Template', url: 'https://github.com/phaserjs/template-vite' },
            { title: 'Graphics', name: 'Phaser 3 Examples' },
            { title: 'Sound Effects', name: 'Various Royalty-Free Sources' },
            { title: 'Special Thanks', name: 'The Phaser Community' }
        ];
        
        // Calculate the total height needed for credits
        const lineHeight = 40 * scaleFactor;
        const startY = centerY - ((credits.length * lineHeight) / 2);
        
        // Add each credit line
        credits.forEach((credit, index) => {
            const yPos = startY + (index * lineHeight);
            
            // Credit title
            this.add.text(centerX - 150 * scaleFactor, yPos, credit.title + ':', {
                fontFamily: 'Arial',
                fontSize: `${20 * scaleFactor}px`,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4 * scaleFactor,
                align: 'right'
            }).setOrigin(1, 0.5);
            
            // Credit name (with URL if available)
            const nameText = this.add.text(centerX - 130 * scaleFactor, yPos, credit.name, {
                fontFamily: 'Arial Bold',
                fontSize: `${22 * scaleFactor}px`,
                color: credit.url ? '#66ccff' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 4 * scaleFactor
            }).setOrigin(0, 0.5);
            
            // Make clickable if URL exists
            if (credit.url) {
                nameText.setInteractive({ useHandCursor: true });
                nameText.on('pointerover', () => nameText.setStyle({ fill: '#f39c12' }));
                nameText.on('pointerout', () => nameText.setStyle({ fill: '#66ccff' }));
                nameText.on('pointerdown', () => window.open(credit.url, '_blank'));
            }
        });
        
        // Add a note at the bottom
        this.add.text(centerX, height - 100 * scaleFactor, 
            'Solid Snek is a fan project inspired by Metal Gear Solid.\nNo affiliation with Konami or Hideo Kojima.', {
            fontFamily: 'Arial',
            fontSize: `${16 * scaleFactor}px`,
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 2 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);
        
        // Back button
        const backButton = this.add.text(centerX, height - 50 * scaleFactor, 'Back to Menu', {
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