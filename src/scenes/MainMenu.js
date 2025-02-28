import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Add and stretch the background image to fill the screen.
        const background = this.add.image(centerX, centerY, 'background');
        background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Breathing effect removed.

        // Title text positioned above the center.
        this.add.text(centerX, centerY - 150, 'Solid Snek', {
            fontFamily: 'Arial Black',
            fontSize: '38px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Subtitle text positioned slightly below the title.
        this.add.text(centerX, centerY - 80, 'A simple browser based 2D metal gear solid game', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Credits container setup.
        const creditStyle = {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        };

        const textCreatedBy = this.add.text(0, 0, 'Created by ', creditStyle);
        const textPeptech = this.add.text(textCreatedBy.width, 0, '@peptech', creditStyle);
        const textWith = this.add.text(textCreatedBy.width + textPeptech.width, 0, ' with ', creditStyle);
        const textPhaser = this.add.text(textCreatedBy.width + textPeptech.width + textWith.width, 0, 'Phaser.js', creditStyle);

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
        const startButton = this.add.text(centerX, centerY + 150, 'Start Game', {
            fontFamily: 'Arial Black',
            fontSize: '38px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
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
