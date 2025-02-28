import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.showDebug = false;
        this.player = null;
        this.helpText = null;
        this.debugGraphics = null;
        this.cursors = null;
        this.map = null;
        this.currentZoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        this.zoomFactor = 0.1;
    }

    preload() {
        this.load.setPath('assets');
        
        // Load the tilemap assets
        this.load.image('tiles', 'tilemaps/catastrophi_tiles_16.png');
        this.load.tilemapCSV('map', '/tilemaps/catastrophi_level2.csv');
        // this.load.tilemapCSV('map', '/tilemaps/level1.csv');
        this.load.spritesheet('player', 'spaceman.png', { frameWidth: 16, frameHeight: 16 });
    }

    create() {
        // When loading a CSV map, make sure to specify the tileWidth and tileHeight
        this.map = this.make.tilemap({ key: 'map', tileWidth: 16, tileHeight: 16 });
        const tileset = this.map.addTilesetImage('tiles');
        const layer = this.map.createLayer(0, tileset, 0, 0);

        // This indicates that the tilemap items 54 through 83 use collision. 
        this.map.setCollisionBetween(54, 83);

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

        this.player = this.physics.add.sprite(50, 100, 'player', 1);

        // Set up the player to collide with the tilemap layer
        this.physics.add.collider(this.player, layer);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player);

        this.debugGraphics = this.add.graphics();

        this.input.keyboard.on('keydown-C', event => {
            this.showDebug = !this.showDebug;
            this.drawDebug();
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.helpText = this.add.text(16, 16, this.getHelpMessage(), {
            fontSize: '18px',
            fill: '#ffffff'
        });

        this.helpText.setScale(1 / this.currentZoom);
        
        // Add mouse wheel zoom listener
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            let targetZoom = this.currentZoom;
            if (deltaY > 0) {
                targetZoom -= this.zoomFactor;  // Zoom out
            } else if (deltaY < 0) {
                targetZoom += this.zoomFactor;  // Zoom in
            }
            this.smoothZoomTo(targetZoom);
        });

        this.input.keyboard.on('keydown-Z', () => {
            this.smoothZoomTo(1); // Reset to default zoom (1x)
        });
        
        
    }
    
    zoomIn() {
        if (this.currentZoom < this.maxZoom) {
            this.currentZoom += this.zoomFactor;
            this.cameras.main.setZoom(this.currentZoom);
            // Adjust the text scale to cancel out the camera zoom
            this.helpText.setScale(1 / this.currentZoom);
            this.updateHelpText();
        }
    }
    
    zoomOut() {
        if (this.currentZoom > this.minZoom) {
            this.currentZoom -= this.zoomFactor;
            this.cameras.main.setZoom(this.currentZoom);
            // Adjust the text scale to cancel out the camera zoom
            this.helpText.setScale(1 / this.currentZoom);
            this.updateHelpText();
        }
    }

    smoothZoomTo(targetZoom) {
        // Clamp the target zoom value to your min and max bounds
        targetZoom = Phaser.Math.Clamp(targetZoom, this.minZoom, this.maxZoom);
        this.tweens.add({
            targets: this.cameras.main,
            zoom: targetZoom,
            duration: 200,
            ease: 'Sine.easeOut',
            onUpdate: () => {
                // Adjust the text scale in real-time to counteract the camera zoom
                this.helpText.setScale(1 / this.cameras.main.zoom);
            }
        });
        this.currentZoom = targetZoom;
    }
    
    updateHelpText() {
        this.helpText.setText(this.getHelpMessage());
    }

    update(time, delta) {
        this.player.body.setVelocity(0);

        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-100);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(100);
        }

        // Vertical movement
        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-100);
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(100);
        }

        // Update the animation last and give left/right animations precedence over up/down animations
        if (this.cursors.left.isDown) {
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.anims.play('right', true);
        } else if (this.cursors.up.isDown) {
            this.player.anims.play('up', true);
        } else if (this.cursors.down.isDown) {
            this.player.anims.play('down', true);
        } else {
            this.player.anims.stop();
        }
    }

    drawDebug() {
        this.debugGraphics.clear();

        if (this.showDebug) {
            // Pass in null for any of the style options to disable drawing that component
            this.map.renderDebug(this.debugGraphics, {
                tileColor: null, // Non-colliding tiles
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200), // Colliding tiles
                faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Colliding face edges
            });
        }

        this.updateHelpText();
    }

    getHelpMessage() {
        return `Arrow keys to move.\nPress "C" to toggle debug visuals: ${this.showDebug ? 'on' : 'off'}\nMouse wheel to zoom in/out (Current zoom: ${this.currentZoom.toFixed(1)}x)\nPress "Z" to reset zoom`;
    }
}