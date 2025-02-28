import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const centerX = 412;
        const centerY = 512;

        // 1) Add the background
        const background = this.add.image(centerX, centerY, 'background');

        // 2) Create a tween to add a breathing effect
        this.tweens.add({
            targets: background,
            scale: 1.05,            // slightly increase the scale
            duration: 2000,        // time (in ms) for scale to go from 1.0 to 1.05
            ease: 'Sine.easeInOut', // smooth “breathing” effect
            yoyo: true,            // reverse the tween back to scale=1
            repeat: -1             // loop forever
        });

        // Optionally, you could also tween the rotation or position a tiny bit:
        // this.tweens.add({
        //     targets: background,
        //     angle: 1,           // a slight rotation
        //     duration: 2000,
        //     ease: 'Sine.easeInOut',
        //     yoyo: true,
        //     repeat: -1
        // });

        // The rest of your menu setup
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

        // Credits container setup
        const creditStyle = {
            fontFamily: 'Arial Black',
            fontSize: 24,
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
        this.add.container(centerX - totalWidth / 2, 300, [
            textCreatedBy,
            textPeptech,
            textWith,
            textPhaser
        ]);

        // Start Game button
        const startButton = this.add.text(centerX, 400, 'Start Game', {
            fontFamily: 'Arial Black',
            fontSize: 38,
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
