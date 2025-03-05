import { Scene } from 'phaser';
import { ResponsiveUI } from '../utils/ResponsiveUI';
import { gameProgress } from './GameProgress';
import { AI } from '../entities/AI';

// Add this Minimap class at the top of your Game.js file, 
// just before the Game class definition

class Minimap {
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Default configuration
        this.config = {
            x: 0,
            y: 0,
            width: 160,
            height: 120,
            scale: 0.1,
            borderThickness: 1,
            backgroundColor: 0x001918,
            backgroundAlpha: 0.5,
            borderColor: 0xffffff,
            playerColor: 0x00ff00,
            wallColor: 0x175E45,
            exitColor: 0x00ffff,
            spawnColor: 0x66ff66,
            enemyColors: {
                patrol: 0x00ff00,      // Green - no alert
                suspicious: 0xffff00,   // Yellow - low alert
                searching: 0xff9900,    // Orange - medium alert
                alert: 0xff0000,        // Red - high alert
                returning: 0x0099ff     // Blue - returning to patrol
            },
            // Flash timing configuration
            flashVisibleDuration: 200,  // How long entities remain visible (ms)
            flashHiddenDuration: 100    // How long entities remain hidden (ms)
        };
        
        // Apply any custom options
        Object.assign(this.config, options);
        
        // Create the graphics objects
        this.container = scene.add.container(this.config.x, this.config.y);
        this.container.setScrollFactor(0); // Fix to camera
        
        // Background
        this.background = scene.add.rectangle(
            this.config.width / 2, 
            this.config.height / 2, 
            this.config.width, 
            this.config.height, 
            this.config.backgroundColor, 
            this.config.backgroundAlpha
        );
        
        // Border
        this.border = scene.add.rectangle(
            this.config.width / 2, 
            this.config.height / 2, 
            this.config.width, 
            this.config.height
        );
        this.border.setStrokeStyle(this.config.borderThickness, this.config.borderColor);
        
        // Graphics for map layout
        this.mapGraphics = scene.add.graphics();
        
        // Graphics for entities
        this.entitiesGraphics = scene.add.graphics();
        
        // Add to container
        this.container.add([this.background, this.border, this.mapGraphics, this.entitiesGraphics]);
        
        // Create 'alerting' text
        this.alertText = scene.add.text(
            this.config.width / 2, 
            this.config.height + 5, 
            '', 
            {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        this.alertText.setOrigin(0.5, 0);
        this.container.add(this.alertText);
        
        // Set up flashing behavior for entities
        this.flashVisible = true;
        this.currentFlashDuration = this.config.flashVisibleDuration;
        this.setupFlashTimer();
        
        // Draw the map layout once
        this.drawMapLayout();
    }
    
    // Setup the flash timer
    setupFlashTimer() {
        // Clear any existing timer
        if (this.flashTimer) {
            this.flashTimer.remove();
        }
        
        // Create new timer with current duration
        this.flashTimer = this.scene.time.addEvent({
            delay: this.currentFlashDuration,
            callback: this.toggleFlash,
            callbackScope: this,
            loop: false  // We'll reset the timer with new duration each time
        });
    }
    
    // Toggle flash visibility state and update timer duration
    toggleFlash() {
        // Toggle visibility
        this.flashVisible = !this.flashVisible;
        
        // Set the appropriate duration based on current state
        if (this.flashVisible) {
            // Entities just became visible, use visible duration
            this.currentFlashDuration = this.config.flashVisibleDuration;
        } else {
            // Entities just became hidden, use hidden duration
            this.currentFlashDuration = this.config.flashHiddenDuration;
        }
        
        // Reset the timer with new duration
        this.setupFlashTimer();
    }
    
    // Method to update flash timing settings
    setFlashTiming(visibleDuration, hiddenDuration) {
        // Update config values
        this.config.flashVisibleDuration = visibleDuration;
        this.config.flashHiddenDuration = hiddenDuration;
        
        // Update current duration based on current visibility state
        this.currentFlashDuration = this.flashVisible ? 
            this.config.flashVisibleDuration : 
            this.config.flashHiddenDuration;
            
        // Reset the timer with new duration
        this.setupFlashTimer();
    }
    
    // Draw the map layout including walls, spawn point, and exit
    drawMapLayout() {
        this.mapGraphics.clear();
        
        const map = this.scene.map;
        if (!map || !this.scene.layer) return;
        
        // Calculate scale factors
        const scaleX = this.config.width / map.widthInPixels;
        const scaleY = this.config.height / map.heightInPixels;
        
        // Draw walls and special tiles
        this.scene.layer.forEachTile(tile => {
            const x = tile.pixelX * scaleX;
            const y = tile.pixelY * scaleY;
            const width = tile.width * scaleX;
            const height = tile.height * scaleY;
            
            if (tile.collides) {
                // Wall tiles
                this.mapGraphics.fillStyle(this.config.wallColor, 0.7);
                this.mapGraphics.fillRect(x, y, width, height);
            }
            
            // Special tiles
            switch (tile.index) {
                case 31: // Exit/goal
                    this.mapGraphics.fillStyle(this.config.exitColor, 0.7);
                    this.mapGraphics.fillRect(x, y, width, height);
                    break;
                case 32: // Spawn point
                    this.mapGraphics.fillStyle(this.config.spawnColor, 0.7);
                    this.mapGraphics.fillRect(x, y, width, height);
                    break;
            }
        });
    }
    
    update(player, enemies = []) {
        this.entitiesGraphics.clear();
        
        // Calculate world to minimap scale
        const mapWidth = this.scene.map.widthInPixels;
        const mapHeight = this.scene.map.heightInPixels;
        
        const scaleX = this.config.width / mapWidth;
        const scaleY = this.config.height / mapHeight;
        
        // Only draw entities if they should be visible in the current flash state
        if (this.flashVisible) {
            // Draw player
            const playerX = player.x * scaleX;
            const playerY = player.y * scaleY;
            
            this.entitiesGraphics.fillStyle(this.config.playerColor, 1);
            this.entitiesGraphics.fillCircle(playerX, playerY, 4);
            
            // Draw enemies
            enemies.forEach(enemy => {
                const enemyX = enemy.x * scaleX;
                const enemyY = enemy.y * scaleY;
                
                // Select color based on alert state
                const color = this.config.enemyColors[enemy.alertState] || 0xffffff;
                
                // Draw enemy
                this.entitiesGraphics.fillStyle(color, 1);
                this.entitiesGraphics.fillCircle(enemyX, enemyY, 3);
            });
        }
        
        // Track highest alert level for the text display
        let highestAlertState = '';
        let highestAlertLevel = 0;
        
        enemies.forEach(enemy => {
            if (enemy.alertLevel > highestAlertLevel) {
                highestAlertLevel = enemy.alertLevel;
                highestAlertState = enemy.alertState;
            }
        });
        
        // Update alert text based on highest alert state
        if (highestAlertLevel > 10) {
            let alertMessage = '';
            let textColor = '#ffffff';
            
            switch (highestAlertState) {
                case 'suspicious':
                    alertMessage = 'Low Alert';
                    textColor = '#ffff00';
                    break;
                case 'searching':
                    alertMessage = 'Medium Alert';
                    textColor = '#ff9900';
                    break;
                case 'alert':
                    alertMessage = 'HIGH ALERT';
                    textColor = '#ff0000';
                    break;
                default:
                    alertMessage = '';
            }
            
            this.alertText.setText(alertMessage);
            this.alertText.setStyle({ color: textColor });
        } else {
            this.alertText.setText('');
        }
    }
    
    resize(width, height) {
        // Reposition minimap when window is resized
        this.container.setPosition(width - this.config.width - 20, 20);
    }
    
    destroy() {
        // Clean up the flash timer
        if (this.flashTimer) {
            this.flashTimer.remove();
            this.flashTimer = null;
        }
        this.container.destroy();
    }
}

export class Game extends Scene {
    constructor() {
        super('Game');
        this.initialize();
    }

    // Initialize all class variables
    initialize() {
        this.ui = null;
        this.showDebug = false;
        this.darknessEnabled = true;
        this.player = null;
        this.helpText = null;
        this.debugGraphics = null;
        this.cursors = null;
        this.joystick = null;
        this.joystickCursor = null;
        this.map = null;
        this.layer = null;
        this.currentZoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        this.zoomFactor = 0.1;
        this.gameWon = false;
        this.gameOver = false;
        this.timeLimit = 60;
        this.timerEvent = null;
        this.timerText = null;
        this.currentLevel = null;
        this.keyListeners = [];
        this.enemies = [];
        this.captureDistance = 24; // Distance at which an AI can capture the player
        this.footstepSound = null;
        this.playerFootstepsEnabled = false;
        this.footstepTimer = 0;
        this.footstepDelay = 300; // Delay between player footstep sounds in ms
        
        // Footstep management for AI entities
        this.lastAIFootstepTime = 0;
        this.minAIFootstepInterval = 300; // Minimum time between any AI footsteps
        
        // Add minimap property
        this.minimap = null;
    }

    init(data) {
        // Reset all game state variables
        this.initialize();
        
        // Get level key from scene data
        this.currentLevel = data.levelKey || 'level1';
        console.log('Loading level:', this.currentLevel);
        
        // If level isn't in cache but 'map' is, use that instead
        if (!this.scene.systems.cache.tilemap.exists(this.currentLevel) && 
            this.scene.systems.cache.tilemap.exists('map')) {
            console.log('Level not found in cache. Using "map" instead.');
            this.currentLevel = 'map';
        }
    }

    create() {
        // Initialize responsive UI helper
        this.ui = new ResponsiveUI(this);

        // Debug graphics
        this.debugGraphics = this.add.graphics();

        // Create a graphics object for visualizing patrol paths
        this.patrolPathGraphics = this.add.graphics();

        // Create the tilemap
        this.map = this.make.tilemap({ key: this.currentLevel, tileWidth: 16, tileHeight: 16 });
        const tileset = this.map.addTilesetImage('tiles');
        this.layer = this.map.createLayer(0, tileset, 0, 0);
        this.map.setCollisionBetween(54, 83);

        // Load footstep sound
        this.footstepSound = this.sound.add('footstep', {
            volume: 0.4,
            loop: false
        });

        // Create the player
        this.player = this.physics.add.sprite(0, 0, 'player', 1);
        this.physics.add.collider(this.player, this.layer);

        // Find the spawn tile and position the player
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

        // Set up camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(this.currentZoom);

        // Display current level in the UI with proper positioning
        let levelNumber;
        if (this.currentLevel === 'map') {
            levelNumber = 1;
        } else {
            levelNumber = parseInt(this.currentLevel.replace('level', '')) || 1;
        }
        
        // Apply different layouts for different orientations
        this.setupGameUI(levelNumber);
        
        // Listen for orientation changes to update the UI
        this.scale.on('resize', (gameSize) => {
            this.ui.handleResize(gameSize);
            this.setupGameUI(levelNumber);
            if (this.minimap) {
                this.minimap.resize(gameSize.width, gameSize.height);
            }
        });

        // Start the timer
        this.timerEvent = this.time.addEvent({
            delay: this.timeLimit * 1000,
            callback: this.onTimeExpired,
            callbackScope: this
        });

        // Set up keyboard input
        this.setupKeyboardInput();
        
        // Set up cursor keys
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create virtual joystick for touch devices
        if (this.sys.game.device.input.touch || this.ui.isMobile) {
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
        
        // Initialize darkness if enabled
        if (this.darknessEnabled) {
            this.updateDarkness();
        }
        
        // Spawn enemies
        this.spawnEnemies();
    }

    // New method to set up UI based on orientation
    setupGameUI(levelNumber) {
        const { width, height } = this.cameras.main;
        const safeZone = this.ui.getSafeZone();
        
        // Clear existing UI elements if they exist
        if (this.timerText) this.timerText.destroy();
        if (this.helpText) this.helpText.destroy();
        if (this.menuButton) this.menuButton.destroy();
        
        // Recreate UI elements with appropriate positioning
        if (this.ui.isLandscape) {
            // Landscape layout - UI at top
            this.timerText = this.ui.createText(
                safeZone.left + 16, 
                safeZone.top + 16, 
                `Level ${levelNumber} - Time remaining: ${this.timeLimit}`, 
                { fontSize: '18px', fill: '#ffffff' }
            ).setScrollFactor(0);
            
            // Create help text
            this.helpText = this.ui.createText(
                safeZone.left + 16, 
                safeZone.top + 80, 
                this.getHelpMessage(), 
                { fontSize: '14px', fill: '#ffffff' }
            ).setScrollFactor(0).setVisible(false);
            
            // Menu button at top right
            this.menuButton = this.ui.createButton(
                width - safeZone.right - 120, 
                safeZone.top + 16, 
                'Main Menu', 
                {
                    fontSize: '14px',
                    fill: '#ffffff',
                    backgroundColor: '#4a4a4a',
                    padding: { left: 8, right: 8, top: 4, bottom: 4 }
                },
                () => this.cleanupAndChangeScene('MainMenu')
            ).setScrollFactor(0);
            
            // Create minimap in top right corner with appropriate size
            if (this.minimap) this.minimap.destroy();
            
            this.minimap = new Minimap(this, {
                x: width - safeZone.right - 180,
                y: safeZone.top + 20,
                width: 160,
                height: 120
            });
        } else {
            // Portrait layout - more compact UI
            this.timerText = this.ui.createText(
                width / 2, 
                safeZone.top + 16, 
                `Level ${levelNumber} - Time: ${this.timeLimit}`, 
                { fontSize: '16px', fill: '#ffffff' }
            ).setScrollFactor(0).setOrigin(0.5, 0);
            
            // Create help text
            this.helpText = this.ui.createText(
                safeZone.left + 16, 
                safeZone.top + 60, 
                this.getHelpMessage(), 
                { fontSize: '12px', fill: '#ffffff' }
            ).setScrollFactor(0).setVisible(false);
            
            // Menu button below timer
            this.menuButton = this.ui.createButton(
                width / 2, 
                safeZone.top + 45, 
                'Menu', 
                {
                    fontSize: '12px',
                    fill: '#ffffff',
                    backgroundColor: '#4a4a4a',
                    padding: { left: 6, right: 6, top: 3, bottom: 3 }
                },
                () => this.cleanupAndChangeScene('MainMenu')
            ).setScrollFactor(0).setOrigin(0.5, 0);
            
            // Create smaller minimap in corner
            if (this.minimap) this.minimap.destroy();
            
            this.minimap = new Minimap(this, {
                x: width - safeZone.right - 120,
                y: safeZone.top + 20,
                width: 110,
                height: 80
            });
        }
        
        // Optimize joystick positioning for the current orientation if it exists
        if (this.joystick) {
            this.joystick.destroy();
            this.createVirtualJoystick();
        }
    }
    
    // New toggle debug function for more effective debug toggling
    toggleDebug() {
        this.showDebug = !this.showDebug;
        
        // Force redraw debug graphics
        this.drawDebug();
        
        // Update help text if visible
        if (this.helpText.visible) {
            this.updateHelpText();
        }
        
        // Force the enemies to update their vision cones and patrol paths
        // This is the key part - make sure all enemies redraw based on current showDebug state
        this.enemies.forEach(enemy => {
            enemy.updateVisionCone();
        });
        
        // Clear patrol path graphics if debug is turned off
        if (!this.showDebug) {
            this.patrolPathGraphics.clear();
        } else {
            // Redraw patrol paths if debug is turned on
            this.visualizePatrolPaths();
        }
        
        console.log(`Debug mode: ${this.showDebug ? 'ON' : 'OFF'}`);
    }
    
    // Set up keyboard event listeners
    setupKeyboardInput() {
        // Toggle debug menu
        const toggleDebugListener = (event) => {
            if (event.key === '`') {
                this.helpText.visible = !this.helpText.visible;
                if (this.helpText.visible) {
                    this.updateHelpText();
                }
            }
        };
        this.input.keyboard.on('keydown', toggleDebugListener);
        this.keyListeners.push({ event: 'keydown', handler: toggleDebugListener });

        // Toggle debug visuals
        const toggleDebugVisualsListener = () => {
            if (!this.helpText.visible) return;
            this.toggleDebug();
        };
        this.input.keyboard.on('keydown-C', toggleDebugVisualsListener);
        this.keyListeners.push({ event: 'keydown-C', handler: toggleDebugVisualsListener });

        // Toggle darkness
        const toggleDarknessListener = () => {
            if (!this.helpText.visible) return;
            this.darknessEnabled = !this.darknessEnabled;
            if (!this.darknessEnabled) {
                this.resetDarkness();
            }
        };
        this.input.keyboard.on('keydown-D', toggleDarknessListener);
        this.keyListeners.push({ event: 'keydown-D', handler: toggleDarknessListener });

        // Reset zoom
        const resetZoomListener = () => {
            if (!this.helpText.visible) return;
            this.smoothZoomTo(1);
        };
        this.input.keyboard.on('keydown-Z', resetZoomListener);
        this.keyListeners.push({ event: 'keydown-Z', handler: resetZoomListener });

        // Exit to level select
        const exitToLevelSelectListener = () => {
            this.cleanupAndChangeScene('LevelSelect');
        };
        this.input.keyboard.on('keydown-ESC', exitToLevelSelectListener);
        this.keyListeners.push({ event: 'keydown-ESC', handler: exitToLevelSelectListener });
    }
    
    // Properly clean up resources before changing scenes
    cleanupAndChangeScene(sceneName, data = {}) {
        // Remove all keyboard listeners
        for (const listener of this.keyListeners) {
            this.input.keyboard.off(listener.event, listener.handler);
        }
        this.keyListeners = [];
        
        // Clear any timers
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = null;
        }
        
        // Stop any sounds
        if (this.footstepSound) {
            this.footstepSound.stop();
        }
        
        // Destroy the joystick if it exists
        if (this.joystick) {
            this.joystick.destroy();
            this.joystick = null;
            this.joystickCursor = null;
        }
        
        // Destroy all enemies
        if (this.enemies) {
            this.enemies.forEach(enemy => enemy.destroy());
            this.enemies = [];
        }
        
        // Destroy the minimap
        if (this.minimap) {
            this.minimap.destroy();
            this.minimap = null;
        }
        
        // Start the new scene
        this.scene.start(sceneName, data);
    }
    
    // Update virtual joystick creation to be orientation-aware
    createVirtualJoystick() {
        const margin = 20;
        const radius = this.ui.isMobile ? 
            (this.ui.isLandscape ? 60 : 50) : // Larger on mobile landscape, smaller on portrait
            50;
            
        const gameWidth = Number(this.sys.game.config.width);
        const gameHeight = Number(this.sys.game.config.height);
        
        // Position differently based on orientation
        let x, y;
        
        if (this.ui.isLandscape) {
            // Bottom right corner in landscape
            x = gameWidth - margin - radius;
            y = gameHeight - margin - radius;
        } else {
            // Bottom center in portrait (better for thumb access)
            x = gameWidth / 2;
            y = gameHeight - margin - radius;
        }
        
        // Create a new joystick
        this.joystick = this.plugins.get('rexVirtualJoystick').add(this, {
            x: x,
            y: y,
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
    
    // Method to visualize patrol paths:
    visualizePatrolPaths() {
        this.patrolPathGraphics.clear();
        
        // Only show if debug is enabled - early return if debug is not enabled
        if (!this.showDebug) {
            return;
        }
        
        // Collect all patrol tiles
        const patrolTiles = [];
        this.layer.forEachTile(tile => {
            if (tile.index === 34) {
                patrolTiles.push({
                    x: tile.pixelX + tile.width / 2,
                    y: tile.pixelY + tile.height / 2,
                    pixelX: tile.pixelX,
                    pixelY: tile.pixelY,
                    width: tile.width,
                    height: tile.height
                });
            }
        });
        
        // Draw tiles with high-visibility colors
        this.patrolPathGraphics.lineStyle(2, 0xff00ff, 0.8); // Bright magenta outline
        this.patrolPathGraphics.fillStyle(0x00ff00, 0.4);    // Bright green fill with transparency
        
        patrolTiles.forEach(tile => {
            // Draw as a rectangle matching the tile size
            this.patrolPathGraphics.strokeRect(
                tile.pixelX, tile.pixelY, 
                tile.width, tile.height
            );
            this.patrolPathGraphics.fillRect(
                tile.pixelX, tile.pixelY, 
                tile.width, tile.height
            );
        });
        
        // Add visual connections between tiles to show the path
        if (patrolTiles.length > 1) {
            this.patrolPathGraphics.lineStyle(2, 0xffff00, 0.6); // Yellow line
            this.patrolPathGraphics.beginPath();
            this.patrolPathGraphics.moveTo(patrolTiles[0].x, patrolTiles[0].y);
            
            for (let i = 1; i < patrolTiles.length; i++) {
                this.patrolPathGraphics.lineTo(patrolTiles[i].x, patrolTiles[i].y);
            }
            
            // Connect back to the first point
            this.patrolPathGraphics.lineTo(patrolTiles[0].x, patrolTiles[0].y);
            this.patrolPathGraphics.strokePath();
        }
    }
    
    updateHelpText() {
        let aiStates = '';
        if (this.enemies.length > 0) {
            const states = this.enemies.map(enemy => enemy.state);
            const stateCount = {};
            states.forEach(state => {
                stateCount[state] = (stateCount[state] || 0) + 1;
            });
            
            aiStates = '\nAI States: ' + 
                Object.entries(stateCount)
                    .map(([state, count]) => `${state}=${count}`)
                    .join(', ');
        }
        
        this.helpText.setText(this.getHelpMessage() + aiStates);
    }

    getHelpMessage() {
        return `Use the arrow keys on desktop or virtual joystick on mobile to move.
Mouse wheel to zoom in/out (Current zoom: ${this.currentZoom.toFixed(1)}x)
Press "C" to toggle debug visuals: ${this.showDebug ? 'on' : 'off'}
Press "D" to toggle darkness: ${this.darknessEnabled ? 'on' : 'off'}
Press "Z" to reset zoom
Enemies: ${this.enemies.length}
AI Behavior: Enemies follow patrol paths (tile 34) and chase when they spot you!`;
    }

    update(time, delta) {
        // Stop update loop if the game is over
        if (this.gameOver) {
            return;
        }

        if (this.minimap) {
            this.minimap.update(this.player, this.enemies);
        }

        // Call this in the update method:
        if (this.showDebug) {
            this.visualizePatrolPaths();
        }

        // Update timer text
        if (this.timerEvent) {
            let levelNumber;
            if (this.currentLevel === 'map') {
                levelNumber = 1;
            } else {
                levelNumber = parseInt(this.currentLevel.replace('level', '')) || 1;
            }
            const remainingSeconds = Math.ceil((this.timerEvent.delay - this.timerEvent.elapsed) / 1000);
            this.timerText.setText(`Level ${levelNumber} - Time remaining: ${remainingSeconds}`);
        }

        // Reset player velocity
        this.player.body.setVelocity(0);

        let velocityX = 0;
        let velocityY = 0;
        
        // Keyboard input
        if (this.cursors && this.cursors.left && this.cursors.left.isDown) {
            velocityX = -100;
        } else if (this.cursors && this.cursors.right && this.cursors.right.isDown) {
            velocityX = 100;
        }
        
        if (this.cursors && this.cursors.up && this.cursors.up.isDown) {
            velocityY = -100;
        } else if (this.cursors && this.cursors.down && this.cursors.down.isDown) {
            velocityY = 100;
        }

        // Virtual joystick input - improved with analog values
        if (this.joystick && this.joystick.force > 0) {
            // Use the actual joystick angle and force for more precise analog control
            const force = Math.min(1, this.joystick.force / 50); // Normalize force
            velocityX = Math.cos(this.joystick.angle) * force * 100;
            velocityY = Math.sin(this.joystick.angle) * force * 100;
        } 
        // Fallback to digital cursor keys if using the older joystick implementation
        else if (this.joystickCursor) {
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

        // Set player velocity
        this.player.body.setVelocity(velocityX, velocityY);

        // Update player's facing direction
        if (velocityX !== 0 || velocityY !== 0) {
            this.player.facingAngle = Phaser.Math.Angle.Between(0, 0, velocityX, velocityY);
            
            // Only play footsteps if enabled
            if (this.playerFootstepsEnabled) {
                // Play footstep sound when moving
                this.footstepTimer += delta;
                if (this.footstepTimer >= this.footstepDelay) {
                    if (!this.sound.mute) {
                        this.footstepSound.setVolume(0.35);
                        this.footstepSound.play();
                    }
                    this.footstepTimer = 0;
                }
            }
        } else {
            // Reset footstep timer when not moving
            this.footstepTimer = this.footstepDelay;
        }

        // Update animations
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

        // Check for win condition
        const goalTile = this.layer.getTileAtWorldXY(this.player.x, this.player.y);
        if (goalTile && goalTile.index === 31) {
            this.gameOver = true;
            this.gameWon = true;
            
            // Track progress
            gameProgress.completeLevel(this.currentLevel);
            
            this.showWinScreen();
            this.player.body.setVelocity(0);
            return;
        }

        // Update darkness
        if (this.darknessEnabled) {
            this.updateDarkness();
        }
        
        // Update enemies
        this.updateEnemies(time, delta);
    }
    
    // Spawn enemies from tile index 33
    spawnEnemies() {
        // Clear any existing enemies
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
        
        console.log('Looking for enemy spawn points (tile index 33)...');
        
        // First collect all patrol tiles for debugging
        const patrolTiles = [];
        this.layer.forEachTile(tile => {
            if (tile.index === 34) {
                patrolTiles.push({
                    x: tile.x,
                    y: tile.y,
                    pixelX: tile.pixelX,
                    pixelY: tile.pixelY
                });
            }
        });
        console.log(`Found ${patrolTiles.length} patrol tiles (index 34)`);
        
        // Look for enemy spawn points (tile index 33)
        let spawnPoints = [];
        this.layer.forEachTile(tile => {
            if (tile.index === 33) {
                spawnPoints.push({
                    x: tile.pixelX + tile.width / 2,
                    y: tile.pixelY + tile.height / 2,
                    tileX: tile.x,
                    tileY: tile.y
                });
            }
        });
        
        console.log(`Found ${spawnPoints.length} enemy spawn points (tile index 33)`);
        
        // Create enemies at each spawn point
        spawnPoints.forEach((spawn, index) => {
            const enemy = new AI(this, spawn.x, spawn.y);
            
            // Add collision with the map
            this.physics.add.collider(enemy, this.layer);
            
            // Store reference to the enemy
            this.enemies.push(enemy);
            
            console.log(`Created enemy ${index + 1} at position (${spawn.x}, ${spawn.y})`);
        });
        
        // If no enemies were created but we have patrol paths, create at least one enemy
        // (This is useful for testing when no spawn points are available)
        if (this.enemies.length === 0 && patrolTiles.length > 0) {
            // Place the enemy at the first patrol tile
            const firstPatrol = patrolTiles[0];
            const enemy = new AI(
                this,
                firstPatrol.pixelX + 8, // Center of tile
                firstPatrol.pixelY + 8  // Center of tile
            );
            
            // Add collision with the map
            this.physics.add.collider(enemy, this.layer);
            
            // Store reference to the enemy
            this.enemies.push(enemy);
            
            console.log('No enemy spawn points found. Created fallback enemy at first patrol point.');
        }
        
        console.log(`Total enemies spawned: ${this.enemies.length}`);
        
        // Now identify and assign distinct patrol paths to each enemy
        this.assignPatrolPathsToEnemies();
    }

    // New method to assign patrol paths to enemies
    assignPatrolPathsToEnemies() {
        // First, collect all patrol points
        const patrolPoints = [];
        this.layer.forEachTile(tile => {
            if (tile.index === 34) {
                patrolPoints.push({
                    x: tile.pixelX + tile.width / 2,
                    y: tile.pixelY + tile.height / 2,
                    tileX: tile.x,
                    tileY: tile.y
                });
            }
        });
        
        if (patrolPoints.length === 0) {
            console.log('No patrol points found. Enemies will use wander behavior.');
            return;
        }
        
        // Identify distinct patrol paths
        const patrolPaths = this.identifyDistinctPatrolPaths(patrolPoints);
        console.log(`Identified ${patrolPaths.length} distinct patrol paths`);
        
        // If there's only one path, assign it to all enemies
        if (patrolPaths.length === 1) {
            this.enemies.forEach(enemy => {
                enemy.assignPatrolPath(patrolPaths[0]);
            });
            return;
        }
        
        // If there are multiple paths, assign each enemy to its closest path
        this.enemies.forEach((enemy, index) => {
            // Find the closest patrol path for this enemy
            let closestPathIndex = 0;
            let shortestDistance = Infinity;
            
            patrolPaths.forEach((path, pathIndex) => {
                // Check distance to each point in the path
                path.forEach(point => {
                    const distance = Phaser.Math.Distance.Between(
                        enemy.x, enemy.y,
                        point.x, point.y
                    );
                    
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        closestPathIndex = pathIndex;
                    }
                });
            });
            
            // Assign the closest path to this enemy
            enemy.assignPatrolPath(patrolPaths[closestPathIndex]);
            console.log(`Enemy ${index} assigned to patrol path ${closestPathIndex} with ${patrolPaths[closestPathIndex].length} points`);
        });
    }

    // Helper method to identify distinct patrol paths
    identifyDistinctPatrolPaths(allPoints) {
        if (allPoints.length === 0) return [];
        
        // Create a copy of all points to work with
        const points = [...allPoints];
        const paths = [];
        const maxPathDistance = 48; // Maximum distance between points to be considered part of the same path
        
        // Process until all points have been assigned to paths
        while (points.length > 0) {
            // Start a new path with the first available point
            const currentPath = [points.shift()];
            let addedPoint = true;
            
            // Keep adding nearby points to the current path
            while (addedPoint) {
                addedPoint = false;
                
                // Check each remaining point to see if it's close to any point in the current path
                for (let i = 0; i < points.length; i++) {
                    let isClose = false;
                    
                    // Check distance to each point in the current path
                    for (const pathPoint of currentPath) {
                        const distance = Phaser.Math.Distance.Between(
                            points[i].x, points[i].y,
                            pathPoint.x, pathPoint.y
                        );
                        
                        if (distance <= maxPathDistance) {
                            isClose = true;
                            break;
                        }
                    }
                    
                    // If this point is close to the current path, add it
                    if (isClose) {
                        currentPath.push(points.splice(i, 1)[0]);
                        addedPoint = true;
                        break;
                    }
                }
            }
            
            // If we found a valid path (at least 2 points), add it
            if (currentPath.length >= 2) {
                // Order the path points for smoother patrolling
                const sortedPath = this.createConnectedPath(currentPath);
                paths.push(sortedPath);
            } else if (currentPath.length === 1) {
                // For single points, we'll create a small circular path around it
                const center = currentPath[0];
                const radius = 32; // Small radius for circular patrol
                const circularPath = [];
                
                // Create 4 points around the center to form a small square
                circularPath.push({
                    x: center.x - radius,
                    y: center.y - radius
                });
                circularPath.push({
                    x: center.x + radius,
                    y: center.y - radius
                });
                circularPath.push({
                    x: center.x + radius,
                    y: center.y + radius
                });
                circularPath.push({
                    x: center.x - radius,
                    y: center.y + radius
                });
                
                paths.push(circularPath);
            }
        }
        
        return paths;
    }

    // Helper method to create a connected path
    createConnectedPath(points) {
        if (points.length <= 1) return points;
        
        const path = [points[0]];
        const remaining = points.slice(1);
        
        while (remaining.length > 0) {
            const lastPoint = path[path.length - 1];
            let closestIndex = 0;
            let closestDistance = Infinity;
            
            for (let i = 0; i < remaining.length; i++) {
                const distance = Phaser.Math.Distance.Between(
                    lastPoint.x, lastPoint.y,
                    remaining[i].x, remaining[i].y
                );
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }
            
            path.push(remaining.splice(closestIndex, 1)[0]);
        }
        
        return path;
    }

    // Update all enemies in the scene
    updateEnemies(time, delta) {
        // Current time for AI footstep coordination
        const currentTime = this.time.now;
        
        // Find alerted enemies and most recent player sighting
        let alertedEnemies = this.enemies.filter(enemy => 
            enemy.alertState === enemy.alertStates.ALERT);
        
        // Track the single most recent player position sighting for coordination
        let latestPlayerSighting = null;
        let latestSightingTime = 0;
        
        this.enemies.forEach(enemy => {
            if (enemy.playerMemory && enemy.playerMemory.lastKnownPosition && 
                enemy.playerMemory.lastSeenTime > latestSightingTime) {
                latestPlayerSighting = new Phaser.Math.Vector2(
                    enemy.playerMemory.lastKnownPosition.x,
                    enemy.playerMemory.lastKnownPosition.y
                );
                latestSightingTime = enemy.playerMemory.lastSeenTime;
            }
        });
        
        // Check if any enemy is requesting backup but none are providing it
        const anyRequestingBackup = this.enemies.some(e => e.requestingBackup);
        const anyRespondingToBackup = this.enemies.some(e => e.respondingToBackup);
        
        // Force response if someone is requesting backup but no one is responding
        if (anyRequestingBackup && !anyRespondingToBackup && latestPlayerSighting) {
            // Find eligible enemies to respond (not the ones already in alert)
            const eligibleResponders = this.enemies.filter(e => 
                !e.requestingBackup && 
                e.alertState !== e.alertStates.ALERT);
            
            // Pick at least one or two responders if available
            const responderCount = Math.min(2, eligibleResponders.length);
            
            for (let i = 0; i < responderCount; i++) {
                if (eligibleResponders[i]) {
                    eligibleResponders[i].respondToBackup(latestPlayerSighting);
                }
            }
        }
        
        // Update each enemy
        this.enemies.forEach(enemy => {
            // Basic enemy update
            enemy.update(time, delta, this.player);
            
            // Share latest intelligence with enemies responding to backup
            if (enemy.respondingToBackup && latestPlayerSighting && 
                enemy.alertState === enemy.alertStates.SEARCHING) {
                
                // Only update position if it's fresher than what the enemy already has
                const enemyLastSeenTime = enemy.playerMemory.lastSeenTime || 0;
                
                if (latestSightingTime > enemyLastSeenTime) {
                    // Update the enemy's target location with the latest sighting
                    enemy.playerMemory.lastKnownPosition = new Phaser.Math.Vector2(
                        latestPlayerSighting.x, 
                        latestPlayerSighting.y
                    );
                    enemy.playerMemory.lastSeenTime = latestSightingTime;
                    
                    // Force regeneration of search points with small probability
                    // This helps enemies converge on the player's actual location
                    if (Phaser.Math.Between(1, 100) <= 5) { // 5% chance per update
                        enemy.generateSearchPoints(enemy.playerMemory.lastKnownPosition);
                    }
                }
            }
            
            // Check for player capture
            if (!this.gameOver) {
                const distance = Phaser.Math.Distance.Between(
                    enemy.x, enemy.y,
                    this.player.x, this.player.y
                );
                
                if (distance <= this.captureDistance) {
                    this.onPlayerCaptured();
                }
                
                // Handle AI footsteps
                if (enemy.isMoving && !this.sound.mute) {
                    enemy.footstepTimer += delta;
                    
                    // Only allow an AI footstep if enough time has passed since the last one
                    const timeSinceLastAIFootstep = currentTime - this.lastAIFootstepTime;
                    const canPlayAIFootstep = timeSinceLastAIFootstep > this.minAIFootstepInterval;
                    
                    if (enemy.footstepTimer >= enemy.footstepDelay && canPlayAIFootstep) {
                        // Calculate distance-based volume (quieter as distance increases)
                        const maxHearingDistance = 250; // Maximum distance at which footsteps are audible
                        const distanceFactor = 1 - Math.min(1, distance / maxHearingDistance);
                        const volume = 0.25 * distanceFactor;
                        
                        // Only play footstep if it's close enough to be heard
                        if (distanceFactor > 0.1) {
                            enemy.footstepSound.setVolume(volume);
                            enemy.footstepSound.play();
                            this.lastAIFootstepTime = currentTime;
                        }
                        
                        enemy.footstepTimer = 0;
                    }
                }
            }
        });
    }

    // Handle player capture event
    onPlayerCaptured() {
        this.gameOver = true;
        
        // Show capture message
        this.showCaptureScreen();
        this.player.body.setVelocity(0);
    }

    // Display the capture screen when caught by an enemy
    showCaptureScreen() {
        const { width, height } = this.cameras.main;
        const centerX = this.cameras.main.worldView.x + width / 2;
        const centerY = this.cameras.main.worldView.y + height / 2;
        const baseWidth = 800;
        const scaleFactor = width / baseWidth;
        
        // Create background
        const overlay = this.add.rectangle(
            centerX, 
            centerY, 
            width, 
            height, 
            0x000000, 
            0.7
        );
        
        // Capture message
        const captureText = this.add.text(centerX, centerY - 100 * scaleFactor, 'You\'ve Been Captured!', {
            fontFamily: 'Arial Black',
            fontSize: `${48 * scaleFactor}px`,
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6 * scaleFactor
        }).setOrigin(0.5);
        
        const buttonStyle = {
            fontFamily: 'Arial Black',
            fontSize: `${24 * scaleFactor}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4 * scaleFactor,
            backgroundColor: '#4a4a4a',
            padding: {
                left: 16 * scaleFactor,
                right: 16 * scaleFactor,
                top: 8 * scaleFactor,
                bottom: 8 * scaleFactor
            }
        };
        
        // Retry button
        const retryButton = this.add.text(centerX, centerY, 'Retry Level', buttonStyle).setOrigin(0.5);
        
        retryButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => retryButton.setStyle({ color: '#f39c12' }))
            .on('pointerout', () => retryButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => {
                this.cleanupAndChangeScene('Game', { levelKey: this.currentLevel });
            });
        
        // Level select button
        const levelSelectButton = this.add.text(
            centerX, 
            centerY + 60 * scaleFactor, 
            'Level Select', 
            buttonStyle
        ).setOrigin(0.5);
        
        levelSelectButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => levelSelectButton.setStyle({ color: '#f39c12' }))
            .on('pointerout', () => levelSelectButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => {
                this.cleanupAndChangeScene('LevelSelect');
            });
        
        // Main menu button
        const mainMenuButton = this.add.text(
            centerX, 
            centerY + 120 * scaleFactor, 
            'Main Menu', 
            buttonStyle
        ).setOrigin(0.5);
        
        mainMenuButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => mainMenuButton.setStyle({ color: '#f39c12' }))
            .on('pointerout', () => mainMenuButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => {
                this.cleanupAndChangeScene('MainMenu');
            });
    }

    onTimeExpired() {
        if (!this.gameWon && !this.gameOver) {
            this.gameOver = true;
            this.showLoseScreen();
            this.player.body.setVelocity(0);
        }
    }

    updateDarkness() {
        // Define visibility radii
        const frontRadius = 12 * 16;
        const sideRadius = 3 * 16;
        const behindRadius = 3 * 16;
        const defaultRadius = 8 * 16;

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
            // Draw collision tiles
            this.map.renderDebug(this.debugGraphics, {
                tileColor: null,
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200),
                faceColor: new Phaser.Display.Color(40, 39, 37, 255)
            });
            
            // Visualize patrol paths
            this.visualizePatrolPaths();
            
            // Draw player position debug info
            this.debugGraphics.lineStyle(2, 0x00ffff, 1);
            this.debugGraphics.strokeCircle(this.player.x, this.player.y, 16);
            
            // Draw a line showing player facing direction
            if (this.player.facingAngle !== undefined) {
                const dirLength = 32;
                const dirX = this.player.x + Math.cos(this.player.facingAngle) * dirLength;
                const dirY = this.player.y + Math.sin(this.player.facingAngle) * dirLength;
                
                this.debugGraphics.lineStyle(2, 0x00ffff, 1);
                this.debugGraphics.beginPath();
                this.debugGraphics.moveTo(this.player.x, this.player.y);
                this.debugGraphics.lineTo(dirX, dirY);
                this.debugGraphics.strokePath();
            }
            
            // Draw enemy detection ranges
            this.enemies.forEach(enemy => {
                // Draw capture range
                this.debugGraphics.lineStyle(1, 0xff0000, 0.5);
                this.debugGraphics.strokeCircle(enemy.x, enemy.y, this.captureDistance);
            });
        }
        
        if (this.helpText.visible) {
            this.updateHelpText();
        }
    }

    // Win screen
    showWinScreen() {
        const { width, height } = this.cameras.main;
        const centerX = this.cameras.main.worldView.x + width / 2;
        const centerY = this.cameras.main.worldView.y + height / 2;
        
        // Create background overlay
        const overlay = this.add.rectangle(
            centerX, 
            centerY, 
            width, 
            height, 
            0x000000, 
            0.7
        );
        
        // Create win message with responsive text
        this.ui.createText(
            centerX, 
            centerY - (this.ui.isMobile ? 70 : 100), 
            'Level Complete!', 
            {
                fontFamily: 'Arial Black',
                fontSize: '48px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Get current level number
        let currentLevelNum;
        if (this.currentLevel === 'map') {
            currentLevelNum = 1;
        } else {
            currentLevelNum = parseInt(this.currentLevel.replace('level', '')) || 1;
        }
        
        // Check if next level exists
        const nextLevelNum = currentLevelNum + 1;
        const nextLevelKey = `level${nextLevelNum}`;
        const nextLevelExists = this.cache.tilemap.exists(nextLevelKey);
        
        // Create button style for all buttons
        const buttonStyle = {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            backgroundColor: '#4a4a4a',
            align: 'center'
        };
        
        // Calculate vertical spacing based on device
        const buttonSpacing = this.ui.isMobile ? (this.ui.isLandscape ? 60 : 50) : 60;
        
        // Next level button (if available)
        if (nextLevelExists) {
            this.ui.createButton(
                centerX,
                centerY,
                'Next Level',
                buttonStyle,
                () => {
                    this.cleanupAndChangeScene('Game', { levelKey: nextLevelKey });
                }
            );
        }
        
        // Level select button
        this.ui.createButton(
            centerX,
            centerY + (nextLevelExists ? buttonSpacing : 0),
            'Level Select',
            buttonStyle,
            () => {
                this.cleanupAndChangeScene('LevelSelect');
            }
        );
        
        // Main menu button
        this.ui.createButton(
            centerX,
            centerY + (nextLevelExists ? buttonSpacing * 2 : buttonSpacing),
            'Main Menu',
            buttonStyle,
            () => {
                this.cleanupAndChangeScene('MainMenu');
            }
        );
    }

    // Lose screen
    showLoseScreen() {
        const { width, height } = this.cameras.main;
        const centerX = this.cameras.main.worldView.x + width / 2;
        const centerY = this.cameras.main.worldView.y + height / 2;
        
        // Create background overlay
        const overlay = this.add.rectangle(
            centerX, 
            centerY, 
            width, 
            height, 
            0x000000, 
            0.7
        );
        
        // Create lose message with responsive text
        this.ui.createText(
            centerX, 
            centerY - (this.ui.isMobile ? 70 : 100), 
            'Time\'s Up!', 
            {
                fontFamily: 'Arial Black',
                fontSize: '48px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Create button style for all buttons
        const buttonStyle = {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            backgroundColor: '#4a4a4a',
            align: 'center'
        };
        
        // Calculate vertical spacing based on device
        const buttonSpacing = this.ui.isMobile ? (this.ui.isLandscape ? 60 : 50) : 60;
        
        // Retry button
        this.ui.createButton(
            centerX,
            centerY,
            'Retry Level',
            buttonStyle,
            () => {
                this.cleanupAndChangeScene('Game', { levelKey: this.currentLevel });
            }
        );
        
        // Level select button
        this.ui.createButton(
            centerX,
            centerY + buttonSpacing,
            'Level Select',
            buttonStyle,
            () => {
                this.cleanupAndChangeScene('LevelSelect');
            }
        );
        
        // Main menu button
        this.ui.createButton(
            centerX,
            centerY + buttonSpacing * 2,
            'Main Menu',
            buttonStyle,
            () => {
                this.cleanupAndChangeScene('MainMenu');
            }
        );
    }
}