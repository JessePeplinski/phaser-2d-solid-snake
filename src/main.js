// Updated main.js config

import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { LevelSelect } from './scenes/LevelSelect';
import { Credits } from './scenes/Credits';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';

import { AUTO, Scale, Physics } from 'phaser';

const config = {
    type: AUTO,
    // Define reference size that works well across devices
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    pixelArt: true,
    scale: {
        // Use FIT mode instead of RESIZE for better cross-device consistency
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        // Set minimum and maximum sizes to prevent extreme scaling
        min: {
            width: 480,
            height: 270
        },
        max: {
            width: 1920,
            height: 1080
        }
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
        LevelSelect,
        Credits,
        Game,
    ],
    plugins: {
        global: [{
            key: 'rexVirtualJoystick',
            plugin: VirtualJoystickPlugin,
            start: true
        },
        // additional plugins here
        ]
    }
};

export default new Phaser.Game(config);