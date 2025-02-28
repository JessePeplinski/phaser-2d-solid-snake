import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
        this.music = null;
    }

    create() {
        // Set up the background music but don't play it yet
        this.music = this.sound.add('mgs-intro-music', {
            volume: 0.5,
            loop: true
        });
        
        // Add a one-time interaction listener to the entire scene to start audio
        this.input.once('pointerdown', () => {
            if (!this.music.isPlaying) {
                this.music.play();
            }
        });
        
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Use a base width (e.g., 800) as your design reference.
        const baseWidth = 800;
        const scaleFactor = width / baseWidth;

        // Add and stretch the background image to fill the screen.
        const background = this.add.image(centerX, centerY, 'background');
        background.setDisplaySize(width, height);

        // Add a "breathing" tween animation to the background.
        this.tweens.add({
            targets: background,
            scaleX: background.scaleX * 1.02,
            scaleY: background.scaleY * 1.02,
            duration: 3000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Add subtle visual glitches every few seconds.
        this.time.addEvent({
            delay: 2500, // every 2.5 seconds
            loop: true,
            callback: () => {
                // Generate small random offsets and a slight angle change.
                const glitchX = Phaser.Math.Between(-3, 3);
                const glitchY = Phaser.Math.Between(-3, 3);
                const glitchAngle = Phaser.Math.Between(-1, 1);
                
                // Apply a quick tween to create a subtle glitch effect.
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

        // Add a message to prompt user interaction
        const tapText = this.add.text(centerX, height - 40 * scaleFactor, 'Tap anywhere to enable sound', {
            fontFamily: 'Arial',
            fontSize: `${16 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);
        
        // Make the text pulse to draw attention
        this.tweens.add({
            targets: tapText,
            alpha: 0.5,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Remove the prompt after first interaction
        this.input.once('pointerdown', () => {
            tapText.destroy();
        });
        
        // Title text positioned above the center.
        this.add.text(centerX, centerY - 150 * scaleFactor, 'Solid Snek', {
            fontFamily: 'Arial Black',
            fontSize: `${56 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);

        // Subtitle text positioned slightly below the title.
        this.add.text(centerX, centerY - 100 * scaleFactor, 'A 2D browser-based dungeon crawler inspired by Metal Gear Solid', {
            fontFamily: 'Arial Black',
            fontSize: `${18 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);

        // Credit text style using scaling.
        const creditStyle = {
            fontFamily: 'Arial Black',
            fontSize: `${24 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8 * scaleFactor,
            align: 'center'
        };

        const textCreatedByYPosition = -80 * scaleFactor;
        const textCreatedBy = this.add.text(0, textCreatedByYPosition, 'Created by ', creditStyle);
        const textPeptech = this.add.text(textCreatedBy.width, textCreatedByYPosition, '@peptech', creditStyle);
        const textWith = this.add.text(textCreatedBy.width + textPeptech.width, textCreatedByYPosition, ' with ', creditStyle);
        const textPhaser = this.add.text(textCreatedBy.width + textPeptech.width + textWith.width, textCreatedByYPosition, 'Phaser.js', creditStyle);

        // Make interactive links for credits.
        textPeptech.setInteractive({ useHandCursor: true });
        textPeptech.on('pointerover', () => textPeptech.setStyle({ fill: '#f39c12' }));
        textPeptech.on('pointerout', () => textPeptech.setStyle({ fill: '#ffffff' }));
        textPeptech.on('pointerdown', () => {
            window.open('https://x.com/peptech', '_blank');
        });

        textPhaser.setInteractive({ useHandCursor: true });
        textPhaser.on('pointerover', () => textPhaser.setStyle({ fill: '#f39c12' }));
        textPhaser.on('pointerout', () => textPhaser.setStyle({ fill: '#ffffff' }));
        textPhaser.on('pointerdown', () => {
            window.open('https://phaser.io', '_blank');
        });

        const totalWidth = textCreatedBy.width + textPeptech.width + textWith.width + textPhaser.width;
        this.add.container(centerX - totalWidth / 2, centerY, [
            textCreatedBy,
            textPeptech,
            textWith,
            textPhaser
        ]);

        // Start Game button positioned below the center.
        const startButton = this.add.text(centerX, centerY + 20 * scaleFactor, 'Start Game', {
            fontFamily: 'Arial Black',
            fontSize: `${38 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);

        startButton.setInteractive({ useHandCursor: true });
        startButton.on('pointerover', () => startButton.setStyle({ fill: '#f39c12' }));
        startButton.on('pointerout', () => startButton.setStyle({ fill: '#ffffff' }));
        startButton.on('pointerdown', () => {
            // Simply stop the music and start the game
            this.music.stop();
            this.scene.start('Game');
        });
        
        // Add sound control button in the top-right corner
        const soundButton = this.add.text(width - 20, 20, '🔊', {
            fontFamily: 'Arial',
            fontSize: `${24 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4 * scaleFactor
        }).setOrigin(1, 0);
        
        soundButton.setInteractive({ useHandCursor: true });
        soundButton.on('pointerover', () => soundButton.setAlpha(0.7));
        soundButton.on('pointerout', () => soundButton.setAlpha(1));
        soundButton.on('pointerdown', () => {
            if (this.sound.mute) {
                this.sound.mute = false;
                soundButton.setText('🔊');
            } else {
                this.sound.mute = true;
                soundButton.setText('🔇');
            }
        });
    }
}