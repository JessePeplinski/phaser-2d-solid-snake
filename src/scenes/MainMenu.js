import { Scene } from 'phaser';
import { ResponsiveUI } from '../utils/ResponsiveUI';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
        this.music = null;
    }

    create() {
        // Initialize our responsive UI helper
        this.ui = new ResponsiveUI(this);
        
        // Set up the background music but don't play it yet
        this.music = this.sound.add('mgs-intro-music', {
            volume: 0.5,
            loop: true
        });

        // Initially mute the sound
        this.sound.mute = true;

        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Create background that fits the screen
        const background = this.add.image(centerX, centerY, 'background');
        background.setDisplaySize(width, height);

        // Apply scale animations
        this.tweens.add({
            targets: background,
            scaleX: background.scaleX * 1.02,
            scaleY: background.scaleY * 1.02,
            duration: 3000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Background glitch effect
        this.time.addEvent({
            delay: 2500,
            loop: true,
            callback: () => {
                const glitchX = Phaser.Math.Between(-3, 3);
                const glitchY = Phaser.Math.Between(-3, 3);
                const glitchAngle = Phaser.Math.Between(-1, 1);
                
                this.tweens.add({
                    targets: background,
                    x: centerX + glitchX,
                    y: centerY + glitchY,
                    angle: glitchAngle,
                    duration: 100,
                    ease: 'Sine.easeInOut',
                    yoyo: true
                });
            }
        });

        // Create title text with responsive sizing (reduced size)
        this.ui.createText(centerX, centerY - 150, 'Solid Snek', {
            fontFamily: 'Arial Black',
            fontSize: '48px', // Decreased from 56px
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Create subtitle with responsive sizing (reduced size)
        this.ui.createText(centerX, centerY - 100, 'A 2D browser-based dungeon crawler inspired by Metal Gear Solid', {
            fontFamily: 'Arial Black',
            fontSize: '16px', // Decreased from 18px
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6, // Reduced from 8
            align: 'center'
        }).setOrigin(0.5);

        // Credit text - use responsive text function with smaller font
        const creditStyle = {
            fontFamily: 'Arial Black',
            fontSize: '20px', // Decreased from 24px
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6, // Reduced from 8
            align: 'center'
        };

        // Position based on layout
        const textYPosition = this.ui.isLandscape ? 
            (centerY - 80) : // Landscape layout
            (centerY - 40);  // Portrait layout (more compact)

        // Helper function to create a credit text container
        const createCreditsText = () => {
            const textCreatedBy = this.ui.createText(0, 0, 'Created by ', creditStyle);
            const textPeptech = this.ui.createText(textCreatedBy.width, 0, '@peptech_', creditStyle);
            const textWith = this.ui.createText(textCreatedBy.width + textPeptech.width, 0, ' with ', creditStyle);
            const textPhaser = this.ui.createText(textCreatedBy.width + textPeptech.width + textWith.width, 0, 'Phaser.js', creditStyle);
            
            textPeptech.setInteractive({ useHandCursor: true });
            textPeptech.on('pointerover', () => textPeptech.setStyle({ fill: '#f39c12' }));
            textPeptech.on('pointerout', () => textPeptech.setStyle({ fill: '#ffffff' }));
            textPeptech.on('pointerdown', () => {
                window.open('https://x.com/peptech_', '_blank');
            });

            textPhaser.setInteractive({ useHandCursor: true });
            textPhaser.on('pointerover', () => textPhaser.setStyle({ fill: '#f39c12' }));
            textPhaser.on('pointerout', () => textPhaser.setStyle({ fill: '#ffffff' }));
            textPhaser.on('pointerdown', () => {
                window.open('https://phaser.io', '_blank');
            });
            
            const totalWidth = textCreatedBy.width + textPeptech.width + textWith.width + textPhaser.width;
            return this.add.container(centerX - totalWidth / 2, textYPosition, [
                textCreatedBy,
                textPeptech,
                textWith,
                textPhaser
            ]);
        };
        
        createCreditsText();

        // Define consistent button style for smaller buttons
        const smallButtonStyle = {
            fontFamily: 'Arial Black',
            fontSize: '22px', // Standardized size (decreased from 24px)
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
            backgroundColor: '#4a4a4a',
            fixedWidth: 240, // Same width as main button
            padding: {
                left: 16,
                right: 16,
                top: 8,
                bottom: 8
            }
        };

        // Calculate equal button spacing
        const buttonHeight = 50; // Approximate height of button
        const buttonPadding = 25; // Space between buttons
        const firstButtonY = centerY + 20;
        
        // Create Start Game button using our responsive button creator
        const startButton = this.ui.createButton(
            centerX, 
            firstButtonY, 
            'Start Game', 
            smallButtonStyle,
            () => {
                this.music.stop();
                this.scene.start('LevelSelect');
            }
        ).setOrigin(0.5);
        
        // Create remaining buttons with equal spacing
        this.ui.createButton(
            centerX, 
            firstButtonY + buttonHeight + buttonPadding, 
            'Feedback', 
            smallButtonStyle,
            () => {
                window.open('https://solidsnekgame.featurebase.app/', '_blank');
            }
        ).setOrigin(0.5);
        
        this.ui.createButton(
            centerX, 
            firstButtonY + (buttonHeight + buttonPadding) * 2, 
            'Roadmap', 
            smallButtonStyle,
            () => {
                window.open('https://solidsnekgame.featurebase.app/roadmap', '_blank');
            }
        ).setOrigin(0.5);
        
        this.ui.createButton(
            centerX, 
            firstButtonY + (buttonHeight + buttonPadding) * 3, 
            'Credits', 
            smallButtonStyle,
            () => {
                this.scene.start('Credits');
            }
        ).setOrigin(0.5);

        this.ui.createButton(
            centerX, 
            firstButtonY + (buttonHeight + buttonPadding) * 3, 
            'Credits', 
            smallButtonStyle,
            () => {
                this.scene.start('Credits');
            }
        ).setOrigin(0.5);
        
        // Add Buy me a coffee button
        this.ui.createButton(
            centerX, 
            firstButtonY + (buttonHeight + buttonPadding) * 4, 
            'Buy me a coffee', 
            smallButtonStyle,
            () => {
                window.open('https://buymeacoffee.com/jessepeplinski', '_blank');
            }
        ).setOrigin(0.5);

        // Create a note at the bottom with responsive sizing and positioning
        // Position at bottom with safe area margins
        const bottomMargin = this.ui.getSafeZone().bottom + 20;
        
        this.ui.createText(
            centerX, 
            height - bottomMargin, 
            'Solid Snek is a fan project inspired by Metal Gear Solid.\nNo affiliation with Konami or Hideo Kojima.', 
            {
                fontFamily: 'Arial',
                fontSize: '12px', // Decreased from 14px
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Add sound control button with margin for notches/safe areas
        const soundButtonX = width - this.ui.getSafeZone().right - 20;
        const soundButtonY = this.ui.getSafeZone().top + 20;
        
        const soundButton = this.ui.createText(
            soundButtonX, 
            soundButtonY, 
            '🔇', 
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(1, 0);
        
        soundButton.setInteractive({ useHandCursor: true });
        soundButton.on('pointerover', () => soundButton.setAlpha(0.7));
        soundButton.on('pointerout', () => soundButton.setAlpha(1));
        soundButton.on('pointerdown', () => {
            if (this.sound.mute) {
                this.sound.mute = false;
                if (!this.music.isPlaying) {
                    this.music.play();
                }
                soundButton.setText('🔊');
            } else {
                this.sound.mute = true;
                soundButton.setText('🔇');
            }
        });
    }
}