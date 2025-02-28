import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Use a base width (e.g., 800) as your design reference.
        const baseWidth = 800;
        const scaleFactor = width / baseWidth;

        // Add and stretch the background image to fill the screen.
        const background = this.add.image(centerX, centerY, 'background');
        background.setDisplaySize(width, height);

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
        this.add.text(centerX, centerY - 100 * scaleFactor, 'A simple browser based 2D metal gear solid game', {
            fontFamily: 'Arial Black',
            fontSize: `${24 * scaleFactor}px`,
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
        const startButton = this.add.text(centerX, centerY + 50 * scaleFactor, 'Start Game', {
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
            this.scene.start('Game');
        });
    }
}
