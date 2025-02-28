import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';

import { AUTO, Scale, Physics } from 'phaser';

const config = {
    type: AUTO,
    width: window.innerWidth,   // Set canvas width to full viewport width
    height: window.innerHeight, // Set canvas height to full viewport height
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    pixelArt: true,
    scale: {
        mode: Scale.RESIZE,              // Automatically resize the canvas
        autoCenter: Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
    ],
    plugins: {
        global: [{
            key: 'rexVirtualJoystick',
            plugin: VirtualJoystickPlugin,
            start: true
        },
        // additional pluggins here
        ]
    }
};

export default new Phaser.Game(config);
