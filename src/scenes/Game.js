import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.showDebug = false;
        this.darknessEnabled = true; // Flag for enabling/disabling darkness
        this.player = null;
        this.helpText = null;
        this.debugGraphics = null;
        this.cursors = null;
        this.joystick = null;
        this.joystickCursor = null;
        this.map = null;
        this.layer = null; // Reference to our tilemap layer
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
        // Ensure rexVirtualJoystick plugin is loaded via a script tag or plugin config
    }

    create() {
        // Create the tilemap and store the layer for later use
        this.map = this.make.tilemap({ key: 'map', tileWidth: 16, tileHeight: 16 });
        const tileset = this.map.addTilesetImage('tiles');
        this.layer = this.map.createLayer(0, tileset, 0, 0);
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

        // Toggle debug visuals using "C"
        this.input.keyboard.on('keydown-C', () => {
            this.showDebug = !this.showDebug;
            this.drawDebug();
        });

        // Toggle the darkness system using "D"
        this.input.keyboard.on('keydown-D', () => {
            this.darknessEnabled = !this.darknessEnabled;
            if (!this.darknessEnabled) {
                this.resetDarkness();
            }
            this.updateHelpText();
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

        // Create virtual joystick for touch devices
        if (this.sys.game.device.input.touch) {
            this.createVirtualJoystick();
        }
    }
    
    createVirtualJoystick() {
        const margin = 20; // margin from the screen edges
        const radius = 50;
        const gameWidth = Number(this.sys.game.config.width);
        const gameHeight = Number(this.sys.game.config.height);
        this.joystick = this.plugins.get('rexVirtualJoystick').add(this, {
            x: gameWidth - margin - radius,
            y: gameHeight - margin - radius,
            radius: radius,
            base: this.add.circle(0, 0, radius, 0x888888),
            thumb: this.add.circle(0, 0, radius * 0.5, 0xcccccc)
        }).setScrollFactor(0);
        this.joystickCursor = this.joystick.createCursorKeys();
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

        let velocityX = 0;
        let velocityY = 0;
        
        // Keyboard input
        if (this.cursors.left.isDown) {
            velocityX = -100;
        } else if (this.cursors.right.isDown) {
            velocityX = 100;
        }
        if (this.cursors.up.isDown) {
            velocityY = -100;
        } else if (this.cursors.down.isDown) {
            velocityY = 100;
        }
        
        // Virtual joystick input (if available)
        if (this.joystickCursor) {
            if (this.joystickCursor.left.isDown) {
                velocityX = -100;
            } else if (this.joystickCursor.right.isDown) {
                velocityX = 100;
            }
            if (this.joystickCursor.up.isDown) {
                velocityY = -100;
            } else if (this.joystickCursor.down.isDown) {
                velocityY = 100;
            }
        }

        this.player.body.setVelocity(velocityX, velocityY);

        // Update player's facing direction only when moving.
        // This value is later used to shape the visibility cone.
        if (velocityX !== 0 || velocityY !== 0) {
            this.player.facingAngle = Phaser.Math.Angle.Between(0, 0, velocityX, velocityY);
        }

        // Update animations based on movement
        if (velocityX < 0) {
            this.player.anims.play('left', true);
        } else if (velocityX > 0) {
            this.player.anims.play('right', true);
        } else if (velocityY < 0) {
            this.player.anims.play('up', true);
        } else if (velocityY > 0) {
            this.player.anims.play('down', true);
        } else {
            this.player.anims.stop();
        }

        // Update darkness system only if enabled
        if (this.darknessEnabled) {
            this.updateDarkness();
        }
    }

    updateDarkness() {
        // Define our visibility radii in world pixels.
        // (Assuming a tile is 16x16 pixels.)
        const frontRadius = 12 * 16;  // Maximum visibility in the forward direction
        const sideRadius = 3 * 16;    // Visibility for tiles at 90° (the sides)
        const behindRadius = 3 * 16;  // Minimal visibility behind the player
        const defaultRadius = 8 * 16; // Fallback if no facing direction is set

        // Player's current position as a vector.
        const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y);
        // Use the stored facingAngle if available; default to 0.
        const facingAngle = (this.player.facingAngle !== undefined) ? this.player.facingAngle : 0;

        this.layer.forEachTile((tile) => {
            // Compute the tile center position in world coordinates.
            const tileCenterX = tile.pixelX + tile.width / 2;
            const tileCenterY = tile.pixelY + tile.height / 2;
            const tilePos = new Phaser.Math.Vector2(tileCenterX, tileCenterY);

            // Calculate vector from the player to this tile.
            const toTile = tilePos.clone().subtract(playerPos);
            const distance = toTile.length();

            // Determine the effective visibility radius based on the tile’s angle relative to the player's facing direction.
            let effectiveRadius;
            if (this.player.facingAngle !== undefined) {
                const tileAngle = toTile.angle();
                let angleDiff = Phaser.Math.Angle.Wrap(tileAngle - facingAngle);
                angleDiff = Math.abs(angleDiff);
                if (angleDiff <= Math.PI / 2) {
                    // For tiles in front (0° to 90°), interpolate from frontRadius down to sideRadius.
                    effectiveRadius = sideRadius + (frontRadius - sideRadius) * (1 - angleDiff / (Math.PI / 2));
                } else {
                    // For tiles behind (90° to 180°), interpolate from sideRadius down to behindRadius.
                    effectiveRadius = sideRadius + (behindRadius - sideRadius) * ((angleDiff - Math.PI / 2) / (Math.PI / 2));
                }
            } else {
                effectiveRadius = defaultRadius;
            }

            // Set the tile's alpha based on its distance relative to the effective radius.
            if (distance <= effectiveRadius) {
                const alpha = Phaser.Math.Clamp(1 - (distance / effectiveRadius), 0, 1);
                tile.setAlpha(alpha);
            } else {
                tile.setAlpha(0);
            }
        });
    }

    resetDarkness() {
        this.layer.forEachTile(function(tile) {
            tile.setAlpha(1);
        });
    }

    drawDebug() {
        this.debugGraphics.clear();
        if (this.showDebug) {
            this.map.renderDebug(this.debugGraphics, {
                tileColor: null,
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200),
                faceColor: new Phaser.Display.Color(40, 39, 37, 255)
            });
        }
        this.updateHelpText();
    }

    getHelpMessage() {
        return `Use the arrow keys on desktop or virtual joystick on mobile to move.
Mouse wheel to zoom in/out (Current zoom: ${this.currentZoom.toFixed(1)}x)
Press "C" to toggle debug visuals: ${this.showDebug ? 'on' : 'off'}
Press "D" to toggle darkness: ${this.darknessEnabled ? 'on' : 'off'}
Press "Z" to reset zoom`;
    }
}
