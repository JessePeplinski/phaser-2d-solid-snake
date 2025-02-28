import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const centerX = 412;
        const centerY = 512;

        this.add.image(centerX, centerY, 'background');

        // this.add.image(centerX, 300, 'logo');

        this.add.text(centerX, 150, 'Solid Snek', {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(centerX, 250, 'A simple browser based 2D metal gear solid game', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Create interactive credit text with clickable parts.
        const creditStyle = {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        };

        // Split the text into several parts:
        // "Created by " + "@peptech" + " with " + "Phaser.js" + "."
        const textCreatedBy = this.add.text(0, 0, 'Created by ', creditStyle);
        const textPeptech = this.add.text(textCreatedBy.width, 0, '@peptech', creditStyle);
        const textWith = this.add.text(textCreatedBy.width + textPeptech.width, 0, ' with ', creditStyle);
        const textPhaser = this.add.text(textCreatedBy.width + textPeptech.width + textWith.width, 0, 'Phaser.js', creditStyle);

        // Make the "@peptech" text interactive.
        textPeptech.setInteractive({ useHandCursor: true });
        textPeptech.on('pointerover', () => {
            textPeptech.setStyle({ fill: '#f39c12' });
        });
        textPeptech.on('pointerout', () => {
            textPeptech.setStyle({ fill: '#ffffff' });
        });
        textPeptech.on('pointerdown', () => {
            window.open('https://x.com/peptech', '_blank');
        });

        // Make the "Phaser.js" text interactive.
        textPhaser.setInteractive({ useHandCursor: true });
        textPhaser.on('pointerover', () => {
            textPhaser.setStyle({ fill: '#f39c12' });
        });
        textPhaser.on('pointerout', () => {
            textPhaser.setStyle({ fill: '#ffffff' });
        });
        textPhaser.on('pointerdown', () => {
            window.open('https://phaser.io', '_blank');
        });

        // Calculate total width and center the container.
        const totalWidth = textCreatedBy.width + textPeptech.width + textWith.width + textPhaser.width
        const creditContainer = this.add.container(centerX - totalWidth / 2, 300, [
            textCreatedBy,
            textPeptech,
            textWith,
            textPhaser
        ]);

        // Create the Start Game button as interactive text.
        const startButton = this.add.text(centerX, 400, 'Start Game', {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        startButton.setInteractive({ useHandCursor: true });
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#f39c12' });
        });
        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#ffffff' });
        });
        startButton.on('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
