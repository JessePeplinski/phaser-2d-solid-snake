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
        
        if (this.ui.isMobile && !this.ui.isLandscape) {
            // Semi-transparent dark background
            const { width, height } = this.cameras.main;
            const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
            
            // Create container for notification elements
            const container = this.add.container(width/2, height/2);
            
            // Notification text
            const messageText = this.add.text(0, -40, 'For the best experience\nrotate your device', {
                fontFamily: 'Arial Black',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);
            
            // Phone rotation icon
            const phoneWidth = 60;
            const phoneHeight = 30;
            const phoneOutline = this.add.graphics();
            phoneOutline.lineStyle(4, 0xffffff, 1);
            phoneOutline.strokeRoundedRect(-phoneWidth/2, -phoneHeight/2, phoneWidth, phoneHeight, 5);
            
            // Add arrows indicating rotation
            const arrowSize = 20;
            const arrowDistance = 50;
            
            const arrowLeft = this.add.graphics();
            arrowLeft.lineStyle(4, 0xffffff, 1);
            arrowLeft.beginPath();
            arrowLeft.moveTo(-arrowDistance - arrowSize, 0);
            arrowLeft.lineTo(-arrowDistance, arrowSize/2);
            arrowLeft.lineTo(-arrowDistance, -arrowSize/2);
            arrowLeft.closePath();
            arrowLeft.fillPath();
            
            const arrowRight = this.add.graphics();
            arrowRight.lineStyle(4, 0xffffff, 1);
            arrowRight.beginPath();
            arrowRight.moveTo(arrowDistance + arrowSize, 0);
            arrowRight.lineTo(arrowDistance, arrowSize/2);
            arrowRight.lineTo(arrowDistance, -arrowSize/2);
            arrowRight.closePath();
            arrowRight.fillPath();
            
            // Continue button
            const continueButton = this.ui.createButton(
                0, 
                80, 
                'Continue Anyway', 
                {
                    fontFamily: 'Arial Black',
                    fontSize: '16px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                    backgroundColor: '#4a4a4a',
                    padding: {
                        left: 12,
                        right: 12,
                        top: 8,
                        bottom: 8
                    }
                },
                () => {
                    // Add a fade out animation
                    this.tweens.add({
                        targets: [overlay, container],
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            overlay.destroy();
                            container.destroy();
                        }
                    });
                }
            );
            
            // Add everything to the container
            container.add([messageText, phoneOutline, arrowLeft, arrowRight, continueButton]);
            
            // Add rotation animation to phone icon
            this.tweens.add({
                targets: phoneOutline,
                angle: 90,
                duration: 1000,
                ease: 'Power2',
                yoyo: true,
                repeat: -1
            });
            
            // Add pulsing animation to arrows
            this.tweens.add({
                targets: [arrowLeft, arrowRight],
                alpha: 0.5,
                duration: 500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            
            // Listen for orientation changes
            this.scale.on('resize', (gameSize) => {
                if (this.ui.isLandscape && overlay && overlay.active) {
                    this.tweens.add({
                        targets: [overlay, container],
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            overlay.destroy();
                            container.destroy();
                        }
                    });
                }
            });
        }
        
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

        // Define styles for different button types
        const mainButtonStyle = {
            fontFamily: 'Arial Black',
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
            backgroundColor: '#4a4a4a',
            fixedWidth: 260,
            padding: {
                left: 16,
                right: 16,
                top: 8,
                bottom: 8
            }
        };
        
        // Smaller style for secondary buttons that will be arranged horizontally
        const secondaryButtonStyle = {
            fontFamily: 'Arial Black',
            fontSize: '12px', // Smaller font size
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3, // Slightly thinner stroke
            align: 'center',
            backgroundColor: '#4a4a4a',
            fixedWidth: 160, // Narrower width
            padding: {
                left: 8,
                right: 8,
                top: 6,
                bottom: 6
            }
        };

        // Position for main button
        const mainButtonY = centerY + 20;
        
        // Create Start Game button using our responsive button creator
        const startButton = this.ui.createButton(
            centerX, 
            mainButtonY, 
            'Start Game', 
            mainButtonStyle,
            () => {
                this.music.stop();
                this.scene.start('LevelSelect');
            }
        ).setOrigin(0.5);
        
        // Calculate horizontal spacing for the row of buttons below
        const secondaryButtonY = mainButtonY + 80; // Space below main button
        const buttonCount = 4; // Number of buttons in the row
        const totalWidth = secondaryButtonStyle.fixedWidth * buttonCount; // Total width of all buttons
        const spacing = 16; // Space between buttons
        const rowWidth = totalWidth + (spacing * (buttonCount - 1)); // Total width of the row
        const startX = centerX - (rowWidth / 2) + (secondaryButtonStyle.fixedWidth / 2); // Starting X position
        
        // Create a row of smaller buttons with horizontal layout
        // Feedback button
        this.ui.createButton(
            startX, 
            secondaryButtonY, 
            'Feedback', 
            secondaryButtonStyle,
            () => {
                window.open('https://solidsnekgame.featurebase.app/', '_blank');
            }
        ).setOrigin(0.5);
        
        // Roadmap button
        this.ui.createButton(
            startX + secondaryButtonStyle.fixedWidth + spacing, 
            secondaryButtonY, 
            'Roadmap', 
            secondaryButtonStyle,
            () => {
                window.open('https://solidsnekgame.featurebase.app/roadmap', '_blank');
            }
        ).setOrigin(0.5);
        
        // Credits button
        this.ui.createButton(
            startX + (secondaryButtonStyle.fixedWidth + spacing) * 2, 
            secondaryButtonY, 
            'Credits', 
            secondaryButtonStyle,
            () => {
                this.scene.start('Credits');
            }
        ).setOrigin(0.5);
        
        // Buy me a coffee button
        this.ui.createButton(
            startX + (secondaryButtonStyle.fixedWidth + spacing) * 3, 
            secondaryButtonY, 
            'Buy Coffee', 
            secondaryButtonStyle,
            () => {
                window.open('https://www.buymeacoffee.com/peptech', '_blank');
            }
        ).setOrigin(0.5);

        // Create a note at the bottom with responsive sizing and positioning
        // Adjust position for additional button
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