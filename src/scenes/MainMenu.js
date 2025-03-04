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

        // Initially mute the sound so the icon correctly reflects the muted state.
        this.sound.mute = true;

        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        const baseWidth = 800;
        const scaleFactor = width / baseWidth;

        const background = this.add.image(centerX, centerY, 'background');
        background.setDisplaySize(width, height);

        this.tweens.add({
            targets: background,
            scaleX: background.scaleX * 1.02,
            scaleY: background.scaleY * 1.02,
            duration: 3000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

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

        this.add.text(centerX, centerY - 150 * scaleFactor, 'Solid Snek', {
            fontFamily: 'Arial Black',
            fontSize: `${56 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY - 100 * scaleFactor, 'A 2D browser-based dungeon crawler inspired by Metal Gear Solid', {
            fontFamily: 'Arial Black',
            fontSize: `${18 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);

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
        const textPeptech = this.add.text(textCreatedBy.width, textCreatedByYPosition, '@peptech_', creditStyle);
        const textWith = this.add.text(textCreatedBy.width + textPeptech.width, textCreatedByYPosition, ' with ', creditStyle);
        const textPhaser = this.add.text(textCreatedBy.width + textPeptech.width + textWith.width, textCreatedByYPosition, 'Phaser.js', creditStyle);

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
        this.add.container(centerX - totalWidth / 2, centerY, [
            textCreatedBy,
            textPeptech,
            textWith,
            textPhaser
        ]);

        // Create button style
        const buttonStyle = {
            fontFamily: 'Arial Black',
            fontSize: `${38 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8 * scaleFactor,
            align: 'center',
            backgroundColor: '#4a4a4a',
            padding: {
                left: 20 * scaleFactor,
                right: 20 * scaleFactor,
                top: 10 * scaleFactor,
                bottom: 10 * scaleFactor
            }
        };

        // Create "Start Game" button with background
        const startButton = this.add.text(centerX, centerY + 20 * scaleFactor, 'Start Game', buttonStyle).setOrigin(0.5);

        startButton.setInteractive({ useHandCursor: true });
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#f39c12' });
            startButton.setScale(1.05);
        });
        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#ffffff' });
            startButton.setScale(1);
        });
        startButton.on('pointerdown', () => {
            this.music.stop();
            this.scene.start('LevelSelect');
        });
        
        // Add smaller buttons for feedback, credits, and roadmap
        const smallButtonStyle = {
            fontFamily: 'Arial Black',
            fontSize: `${24 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4 * scaleFactor,
            align: 'center',
            backgroundColor: '#4a4a4a',
            padding: {
                left: 15 * scaleFactor,
                right: 15 * scaleFactor, 
                top: 8 * scaleFactor,
                bottom: 8 * scaleFactor
            }
        };
        
        // Calculate button positions with vertical spacing
        const buttonSpacing = 20 * scaleFactor;
        // Increase spacing between "Start Game" and first button
        const firstButtonY = centerY + 120 * scaleFactor;
        
        // Create Feedback button (external link)
        const feedbackButton = this.add.text(centerX, firstButtonY, 'Feedback', smallButtonStyle).setOrigin(0.5);
        
        feedbackButton.setInteractive({ useHandCursor: true });
        feedbackButton.on('pointerover', () => {
            feedbackButton.setStyle({ fill: '#f39c12' });
            feedbackButton.setScale(1.05);
        });
        feedbackButton.on('pointerout', () => {
            feedbackButton.setStyle({ fill: '#ffffff' });
            feedbackButton.setScale(1);
        });
        feedbackButton.on('pointerdown', () => {
            window.open('https://solidsnekgame.featurebase.app/', '_blank');
        });
        
        // Create Roadmap button (external link) - moved up in order
        const roadmapButton = this.add.text(centerX, firstButtonY + buttonSpacing + 40 * scaleFactor, 'Roadmap', smallButtonStyle).setOrigin(0.5);
        
        roadmapButton.setInteractive({ useHandCursor: true });
        roadmapButton.on('pointerover', () => {
            roadmapButton.setStyle({ fill: '#f39c12' });
            roadmapButton.setScale(1.05);
        });
        roadmapButton.on('pointerout', () => {
            roadmapButton.setStyle({ fill: '#ffffff' });
            roadmapButton.setScale(1);
        });
        roadmapButton.on('pointerdown', () => {
            window.open('https://solidsnekgame.featurebase.app/roadmap', '_blank');
        });
        
        // Create Credits button (internal link) - moved to the end
        const creditsButton = this.add.text(centerX, firstButtonY + (buttonSpacing + 40 * scaleFactor) * 2, 'Credits', smallButtonStyle).setOrigin(0.5);

        creditsButton.setInteractive({ useHandCursor: true });
        creditsButton.on('pointerover', () => {
            creditsButton.setStyle({ fill: '#f39c12' });
            creditsButton.setScale(1.05);
        });
        creditsButton.on('pointerout', () => {
            creditsButton.setStyle({ fill: '#ffffff' });
            creditsButton.setScale(1);
        });
        creditsButton.on('pointerdown', () => {
            this.scene.start('Credits'); // Navigate to the Credits scene
        });

        // Add a note at the bottom
        this.add.text(centerX, height - 80 * scaleFactor, 
            'Solid Snek is a fan project inspired by Metal Gear Solid.\nNo affiliation with Konami or Hideo Kojima.', {
            fontFamily: 'Arial',
            fontSize: `${14 * scaleFactor}px`,
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 2 * scaleFactor,
            align: 'center'
        }).setOrigin(0.5);
        
        // Add sound control button in the top-right corner
        const soundButton = this.add.text(width - 20, 20, '🔇', {
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