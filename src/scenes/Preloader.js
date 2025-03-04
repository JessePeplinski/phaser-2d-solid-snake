import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        // We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 512, 'background');

        // A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        // This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        // Add loading text above the progress bar
        this.loadingText = this.add.text(512, 340, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {
            // Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

            // Update the loading text with percentage
            this.loadingText.setText(`Loading... ${Math.floor(progress * 100)}%`);
        });

        // Handle file loading completion
        this.load.on('complete', () => {
            this.loadingText.setText('Ready!');
        });

        // Optional: Display what file is currently being loaded
        this.load.on('fileprogress', (file) => {
            this.loadingText.setText(`Loading... ${file.key}`);
        });
    }

    preload ()
    {
        // Set the base path for all assets
        this.load.setPath('assets');

        // --- IMAGES ---
        // UI and Logo
        this.load.image('logo', 'logo.png');
        
        // Tilesets
        this.load.image('tiles', 'tilemaps/catastrophi_tiles_16.png');
        
        // --- SPRITESHEETS ---
        this.load.spritesheet('player', 'spaceman.png', { 
            frameWidth: 16, 
            frameHeight: 16 
        });
        
        // --- TILEMAPS ---
        // this.load.tilemapCSV('map', 'tilemaps/catastrophi_level2.csv');
        this.load.tilemapCSV('level1', 'tilemaps/level1.csv');
        this.load.tilemapCSV('level2', 'tilemaps/level2.csv');
        this.load.tilemapCSV('level3', 'tilemaps/level3.csv');
        
        // --- AUDIO ---
        // Music
        this.load.audio('mgs-intro-music', 'sounds/mgs-intro-music.mp3');

        // Sound Effects
        this.load.audio('footstep', 'sounds/footstep.mp3');
        
        // Sound Effects - Add any game sound effects here
        // this.load.audio('footstep', 'sounds/footstep.wav');
        // this.load.audio('alert', 'sounds/alert.wav');
        
        // --- ATLASES & BITMAP FONTS ---
        // If you have any texture atlases or bitmap fonts, load them here
        // this.load.atlas('game-atlas', 'atlases/game-atlas.png', 'atlases/game-atlas.json');
        // this.load.bitmapFont('pixel-font', 'fonts/pixel.png', 'fonts/pixel.xml');

        // --- PLUGINS ---
        // You can also load plugin files here if needed
        // Note: Some plugins might need to be loaded via the game config instead
    }

    create ()
    {
        // Create animations that will be used across the game
        this.createAnimations();
        
        // When all assets have loaded, move to the MainMenu
        this.scene.start('MainMenu');
    }

    createAnimations()
    {
        // Player animations
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 9 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('player', { start: 11, end: 13 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 6 }),
            frameRate: 10,
            repeat: -1
        });
        
        // Add more animations as needed
    }
}