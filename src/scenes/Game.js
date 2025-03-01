import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.showDebug = false;
        this.darknessEnabled = true; // Flag for enabling/disabling darkness
        this.player = null;
        this.helpText = null; // Developer debug menu text
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
        this.gameWon = false; // Flag for win condition
        this.gameOver = false; // Flag for overall game over (win or lose)
        this.timeLimit = 60;  // 60 seconds to complete the level
        this.timerEvent = null;
        this.timerText = null;
    }

    preload() {
        this.load.setPath('assets');
        // Load the tilemap assets
        this.load.image('tiles', 'tilemaps/catastrophi_tiles_16.png');
        this.load.tilemapCSV('map', '/tilemaps/level1.csv');
        this.load.spritesheet('player', 'spaceman.png', { frameWidth: 16, frameHeight: 16 });
        // Ensure rexVirtualJoystick plugin is loaded via a script tag or plugin config
    }

    create() {
        // Create the tilemap and store the layer for later use
        this.map = this.make.tilemap({ key: 'map', tileWidth: 16, tileHeight: 16 });
        const tileset = this.map.addTilesetImage('tiles');
        this.layer = this.map.createLayer(0, tileset, 0, 0);
        this.map.setCollisionBetween(54, 83);
        // tile 32 is the player spawn tile
        // tile 31 is the goal tile

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

        // Create the player. We start by creating it at (0, 0) then update its position.
        this.player = this.physics.add.sprite(0, 0, 'player', 1);
        this.physics.add.collider(this.player, this.layer);

        // Find the spawn tile (tile index 32) and position the player there.
        let spawnTile = null;
        this.layer.forEachTile(tile => {
            if (tile.index === 32) {
                spawnTile = tile;
            }
        });
        if (spawnTile) {
            this.player.setPosition(
                spawnTile.pixelX + spawnTile.width / 2,
                spawnTile.pixelY + spawnTile.height / 2
            );
        } else {
            // Fallback if no spawn tile found
            this.player.setPosition(50, 100);
        }

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player);

        this.debugGraphics = this.add.graphics();

        // Create the developer help text (debug menu), but hide it by default.
        this.helpText = this.add.text(16, 50, this.getHelpMessage(), {
            fontSize: '18px',
            fill: '#ffffff'
        });
        this.helpText.setScrollFactor(0);
        this.helpText.setVisible(false);

        // Create a timer text to display the remaining time (always visible).
        this.timerText = this.add.text(16, 16, `Time remaining: ${this.timeLimit}`, {
            fontSize: '18px',
            fill: '#ffffff'
        });
        this.timerText.setScrollFactor(0);

        // Start the 60-second timer
        this.timerEvent = this.time.addEvent({
            delay: this.timeLimit * 1000, // 60 seconds in milliseconds
            callback: this.onTimeExpired,
            callbackScope: this
        });

        // Toggle the developer debug menu with the backtick (`) key.
        this.input.keyboard.on('keydown', (event) => {
            if (event.key === '`') {
                this.helpText.visible = !this.helpText.visible;
                if (this.helpText.visible) {
                    this.updateHelpText();
                }
            }
        });

        // The following keys only work if the dev menu (helpText) is visible.
        this.input.keyboard.on('keydown-C', () => {
            if (!this.helpText.visible) return;
            this.showDebug = !this.showDebug;
            this.drawDebug();
        });

        this.input.keyboard.on('keydown-D', () => {
            if (!this.helpText.visible) return;
            this.darknessEnabled = !this.darknessEnabled;
            if (!this.darknessEnabled) {
                this.resetDarkness();
            }
        });

        this.input.keyboard.on('keydown-Z', () => {
            if (!this.helpText.visible) return;
            this.smoothZoomTo(1); // Reset zoom
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        // Create virtual joystick for touch devices
        if (this.sys.game.device.input.touch) {
            this.createVirtualJoystick();
        }

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
            if (this.helpText.visible) {
                this.updateHelpText();
            }
        }
    }
    
    zoomOut() {
        if (this.currentZoom > this.minZoom) {
            this.currentZoom -= this.zoomFactor;
            this.cameras.main.setZoom(this.currentZoom);
            if (this.helpText.visible) {
                this.updateHelpText();
            }
        }
    }

    smoothZoomTo(targetZoom) {
        targetZoom = Phaser.Math.Clamp(targetZoom, this.minZoom, this.maxZoom);
        this.tweens.add({
            targets: this.cameras.main,
            zoom: targetZoom,
            duration: 200,
            ease: 'Sine.easeOut'
        });
        this.currentZoom = targetZoom;
        if (this.helpText.visible) {
            this.updateHelpText();
        }
    }
    
    updateHelpText() {
        this.helpText.setText(this.getHelpMessage());
    }

    getHelpMessage() {
        return `Use the arrow keys on desktop or virtual joystick on mobile to move.
Mouse wheel to zoom in/out (Current zoom: ${this.currentZoom.toFixed(1)}x)
Press "C" to toggle debug visuals: ${this.showDebug ? 'on' : 'off'}
Press "D" to toggle darkness: ${this.darknessEnabled ? 'on' : 'off'}
Press "Z" to reset zoom`;
    }

    update(time, delta) {
        // Stop update loop if the game is over (win or lose)
        if (this.gameOver) {
            return;
        }

        // Update timer text display (calculating remaining seconds)
        if (this.timerEvent) {
            const remainingSeconds = Math.ceil((this.timerEvent.delay - this.timerEvent.elapsed) / 1000);
            this.timerText.setText(`Time remaining: ${remainingSeconds}`);
        }

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

        // Check for win condition: if the player is on the goal tile (tile 31)
        const goalTile = this.layer.getTileAtWorldXY(this.player.x, this.player.y);
        if (goalTile && goalTile.index === 31) {
            this.gameOver = true;
            this.gameWon = true;
            this.showWinScreen();
            this.player.body.setVelocity(0);
            return;
        }

        // Update darkness system only if enabled
        if (this.darknessEnabled) {
            this.updateDarkness();
        }
    }

    onTimeExpired() {
        if (!this.gameWon && !this.gameOver) {
            this.gameOver = true;
            this.showLoseScreen();
            // Stop player movement
            this.player.body.setVelocity(0);
        }
    }

    updateDarkness() {
        // Define our visibility radii in world pixels.
        const frontRadius = 12 * 16;  // Maximum visibility in the forward direction
        const sideRadius = 3 * 16;    // Visibility for tiles at 90° (the sides)
        const behindRadius = 3 * 16;  // Minimal visibility behind the player
        const defaultRadius = 8 * 16; // Fallback if no facing direction is set

        const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y);
        const facingAngle = (this.player.facingAngle !== undefined) ? this.player.facingAngle : 0;

        this.layer.forEachTile((tile) => {
            const tileCenterX = tile.pixelX + tile.width / 2;
            const tileCenterY = tile.pixelY + tile.height / 2;
            const tilePos = new Phaser.Math.Vector2(tileCenterX, tileCenterY);

            const toTile = tilePos.clone().subtract(playerPos);
            const distance = toTile.length();

            let effectiveRadius;
            if (this.player.facingAngle !== undefined) {
                const tileAngle = toTile.angle();
                let angleDiff = Phaser.Math.Angle.Wrap(tileAngle - facingAngle);
                angleDiff = Math.abs(angleDiff);
                if (angleDiff <= Math.PI / 2) {
                    effectiveRadius = sideRadius + (frontRadius - sideRadius) * (1 - angleDiff / (Math.PI / 2));
                } else {
                    effectiveRadius = sideRadius + (behindRadius - sideRadius) * ((angleDiff - Math.PI / 2) / (Math.PI / 2));
                }
            } else {
                effectiveRadius = defaultRadius;
            }

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
        if (this.helpText.visible) {
            this.updateHelpText();
        }
    }

    // Display a simple win screen
    showWinScreen() {
        const centerX = this.cameras.main.worldView.x + this.cameras.main.worldView.width / 2;
        const centerY = this.cameras.main.worldView.y + this.cameras.main.worldView.height / 2;
        const winText = this.add.text(centerX, centerY, 'You won!', {
            fontSize: '48px',
            fill: '#ffffff'
        });
        winText.setOrigin(0.5);
    }

    // Display a simple lose screen
    showLoseScreen() {
        const centerX = this.cameras.main.worldView.x + this.cameras.main.worldView.width / 2;
        const centerY = this.cameras.main.worldView.y + this.cameras.main.worldView.height / 2;
        const loseText = this.add.text(centerX, centerY, 'You lost!', {
            fontSize: '48px',
            fill: '#ffffff'
        });
        loseText.setOrigin(0.5);
    }
}
