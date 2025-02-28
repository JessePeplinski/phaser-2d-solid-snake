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
        this.layer = null; // Store the tilemap layer for later use.
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
        this.load.spritesheet('player', 'spaceman.png', { frameWidth: 16, frameHeight: 16 });
    }

    create() {
        // Create the tilemap and store the layer for later use
        this.map = this.make.tilemap({ key: 'map', tileWidth: 16, tileHeight: 16 });
        const tileset = this.map.addTilesetImage('tiles');
        this.layer = this.map.createLayer(0, tileset, 0, 0);

        // Set collision if needed
        this.map.setCollisionBetween(54, 83);

        // Create player animations
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

        // Create the player and enable collisions with the layer
        this.player = this.physics.add.sprite(50, 100, 'player', 1);
        this.physics.add.collider(this.player, this.layer);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player);

        this.debugGraphics = this.add.graphics();

        this.input.keyboard.on('keydown-C', () => {
            this.showDebug = !this.showDebug;
            this.drawDebug();
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.helpText = this.add.text(16, 16, this.getHelpMessage(), {
            fontSize: '18px',
            fill: '#ffffff'
        });
        this.helpText.setScale(1 / this.currentZoom);
        
        // Mouse wheel zoom listener
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            let targetZoom = this.currentZoom;
            if (deltaY > 0) {
                targetZoom -= this.zoomFactor;  // Zoom out
            } else if (deltaY < 0) {
                targetZoom += this.zoomFactor;  // Zoom in
            }
            this.smoothZoomTo(targetZoom);
        });

        this.input.keyboard.on('keydown-Z', () => {
            this.smoothZoomTo(1); // Reset zoom
        });
    }
    
    zoomIn() {
        if (this.currentZoom < this.maxZoom) {
            this.currentZoom += this.zoomFactor;
            this.cameras.main.setZoom(this.currentZoom);
            this.helpText.setScale(1 / this.currentZoom);
            this.updateHelpText();
        }
    }
    
    zoomOut() {
        if (this.currentZoom > this.minZoom) {
            this.currentZoom -= this.zoomFactor;
            this.cameras.main.setZoom(this.currentZoom);
            this.helpText.setScale(1 / this.currentZoom);
            this.updateHelpText();
        }
    }

    smoothZoomTo(targetZoom) {
        targetZoom = Phaser.Math.Clamp(targetZoom, this.minZoom, this.maxZoom);
        this.tweens.add({
            targets: this.cameras.main,
            zoom: targetZoom,
            duration: 200,
            ease: 'Sine.easeOut',
            onUpdate: () => {
                this.helpText.setScale(1 / this.cameras.main.zoom);
            }
        });
        this.currentZoom = targetZoom;
    }
    
    updateHelpText() {
        this.helpText.setText(this.getHelpMessage());
    }

    update(time, delta) {
        // Reset player velocity
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

        // Update animations with left/right taking precedence
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

        // Update the darkness system each frame
        this.updateDarkness();
    }

    updateDarkness() {
        // Convert the player's world position to tile coordinates
        const playerTile = this.map.worldToTileXY(this.player.x, this.player.y);
        // Define the visibility radius in tiles
        const visibilityRadius = 10;
        
        // Iterate over each tile in the layer and adjust its alpha
        this.layer.forEachTile(tile => {
            // Use the "Snake" distance (grid-based) to determine distance from player
            const dist = Phaser.Math.Distance.Snake(playerTile.x, playerTile.y, tile.x, tile.y);
            if (dist <= visibilityRadius) {
                // For a smooth fade effect, linearly interpolate alpha from 1 at the player to 0 at the edge
                const alpha = Phaser.Math.Clamp(1 - (dist / visibilityRadius), 0, 1);
                tile.setAlpha(alpha);
            } else {
                // Outside the radius, the tile is completely dark
                tile.setAlpha(0);
            }
        });
    }

    drawDebug() {
        this.debugGraphics.clear();

        if (this.showDebug) {
            // Render debug outlines for colliding tiles, etc.
            this.map.renderDebug(this.debugGraphics, {
                tileColor: null,
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200),
                faceColor: new Phaser.Display.Color(40, 39, 37, 255)
            });
        }
        this.updateHelpText();
    }

    getHelpMessage() {
        return `Arrow keys to move.
Press "C" to toggle debug visuals: ${this.showDebug ? 'on' : 'off'}
Mouse wheel to zoom in/out (Current zoom: ${this.currentZoom.toFixed(1)}x)
Press "Z" to reset zoom`;
    }
}
