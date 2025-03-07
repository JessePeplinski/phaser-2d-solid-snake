import { Scene } from 'phaser';
import { ResponsiveUI } from '../utils/ResponsiveUI';
import { gameProgress } from './GameProgress';
import { AI } from '../entities/AI';

// Add this Minimap class at the top of your Game.js file, 
// just before the Game class definition

class Minimap {
    // Update the Minimap class constructor to position the alertText better
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
        
        // Create 'alerting' text - positioned below the minimap
        // This will now also show level and time information
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

        // Add these properties to the Minimap constructor in src/scenes/Game.js
        // Just after creating other graphics objects:

        // Create jamming overlay (simple semi-transparent overlay)
        this.jammingOverlay = scene.add.rectangle(
            this.config.width / 2, 
            this.config.height / 2,
            this.config.width,
            this.config.height,
            0x000000,
            0.7  // Semi-transparent black overlay
        );
        this.jammingOverlay.setVisible(false);
        this.container.add(this.jammingOverlay);

        // Signal lost text
        this.jammingText = scene.add.text(
            this.config.width / 2, 
            this.config.height / 2, 
            'SIGNAL LOST', 
            {
                fontFamily: 'Arial Black',
                fontSize: '18px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }
        );
        this.jammingText.setOrigin(0.5);
        this.jammingText.setVisible(false);
        this.container.add(this.jammingText);

        // Jamming state tracking
        this.isJammed = false;

        // Sound effect for jamming alert
        this.jammingSound = scene.sound.add('alarm', {
            volume: 0.2,
            loop: true
        });
        
        // Draw the map layout once
        this.drawMapLayout();
    }

    // Add these methods to the Minimap class in src/scenes/Game.js

    // Start jamming the minimap
    startJamming() {
        if (!this.isJammed) {
            this.isJammed = true;
            
            // Show the overlay and text
            this.jammingOverlay.setVisible(true);
            this.jammingText.setVisible(true);
            
            // Add a simple pulsing effect to the text
            this.scene.tweens.add({
                targets: this.jammingText,
                alpha: 0.5,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Play alert sound if sound is enabled
            if (!this.scene.sound.mute) {
                this.jammingSound.play();
            }
        }
    }

    // Stop jamming the minimap with improved transitions
    stopJamming() {
        if (this.isJammed) {
            this.isJammed = false;
            
            // Hide the overlay and text
            this.jammingOverlay.setVisible(false);
            this.jammingText.setVisible(false);
            
            // Stop the pulsing animation
            this.scene.tweens.killTweensOf(this.jammingText);
            this.jammingText.setAlpha(1); // Reset alpha
            
            // Stop the alert sound
            this.jammingSound.stop();
        }
    }

    // Draw the jamming static effect
    drawJammingEffect(delta) {
        // Clear previous static pattern
        this.jammingOverlay.clear();
        
        if (!this.isJammed) return;
        
        // Gradually increase jamming intensity until max
        if (this.jammingIntensity < this.jammingMaxIntensity) {
            this.jammingIntensity += this.jammingIncrement * (delta / 1000);
            if (this.jammingIntensity > this.jammingMaxIntensity) {
                this.jammingIntensity = this.jammingMaxIntensity;
            }
        }
        
        // Update static timer to create animation
        this.staticTimer += delta;
        
        // Update static background with TV static look
        this.staticBackground.setAlpha(this.jammingIntensity * 0.2);
        
        // Draw more varied static elements for better TV static effect
        
        // 1. Static base noise (grainy background)
        const grainyAlpha = this.jammingIntensity * 0.4;
        this.jammingOverlay.fillStyle(0x888888, grainyAlpha);
        
        // Random grainy static pixels
        const pixelSize = 2;
        const pixelCount = Math.floor(150 * this.jammingIntensity);
        const seed = this.staticTimer / 50; // Faster change for more dynamic look
        
        for (let i = 0; i < pixelCount; i++) {
            // Use pseudo-random but deterministic positions based on time
            const x = Math.floor(Math.abs(Math.sin(seed + i * 0.34) * this.config.width));
            const y = Math.floor(Math.abs(Math.cos(seed + i * 0.41) * this.config.height));
            
            // Vary the pixel color slightly for more realistic static
            const grayShade = Math.floor(Math.sin(seed + i) * 40) + 220; // Range from 180-255
            const pixelColor = (grayShade << 16) | (grayShade << 8) | grayShade;
            
            this.jammingOverlay.fillStyle(pixelColor, 0.7 * this.jammingIntensity);
            this.jammingOverlay.fillRect(x, y, pixelSize, pixelSize);
        }
        
        // 2. Horizontal scan lines (crucial for TV static look)
        const scanLineHeight = 1;
        const scanLineSpacing = 3;
        const scanLineAlpha = 0.3 * this.jammingIntensity;
        
        this.jammingOverlay.fillStyle(0x000000, scanLineAlpha);
        for (let y = 0; y < this.config.height; y += scanLineSpacing) {
            // Occasional thicker lines for distortion effect
            const height = (Math.sin(seed + y * 0.1) > 0.8) ? 2 : 1;
            this.jammingOverlay.fillRect(0, y, this.config.width, height);
        }
        
        // 3. Random horizontal glitch lines (shifting)
        const horizontalGlitchCount = Math.floor(5 * this.jammingIntensity);
        if (Math.sin(this.staticTimer / 200) > 0.7) { // Only show sometimes
            this.jammingOverlay.fillStyle(0xffffff, 0.6 * this.jammingIntensity);
            for (let i = 0; i < horizontalGlitchCount; i++) {
                const y = Math.floor(Math.abs(Math.sin(seed + i * 12.5) * this.config.height));
                const height = Math.floor(Math.abs(Math.sin(seed + i * 5.5) * 3)) + 1;
                const width = Math.floor(Math.abs(Math.sin(seed + i * 3.7) * this.config.width * 0.8)) + this.config.width * 0.2;
                const x = Math.floor(Math.abs(Math.sin(seed + i * 7.3) * (this.config.width - width)));
                
                this.jammingOverlay.fillRect(x, y, width, height);
            }
        }
        
        // 4. Vertical color bands that move (for color TV static effect)
        if (Math.sin(this.staticTimer / 150) > 0) { // Show rhythmically
            const bandCount = 3;
            const bandWidth = Math.floor(this.config.width / bandCount);
            
            for (let i = 0; i < bandCount; i++) {
                // Create color cycling by using time
                const colorOffset = (this.staticTimer / 100 + i * 0.33) % 1;
                const r = Math.floor(127 + 127 * Math.sin(colorOffset * Math.PI * 2));
                const g = Math.floor(127 + 127 * Math.sin((colorOffset + 0.33) * Math.PI * 2));
                const b = Math.floor(127 + 127 * Math.sin((colorOffset + 0.66) * Math.PI * 2));
                
                const bandColor = (r << 16) | (g << 8) | b;
                const bandAlpha = 0.1 * this.jammingIntensity;
                const bandX = (i * bandWidth + this.staticTimer / 20) % this.config.width;
                
                this.jammingOverlay.fillStyle(bandColor, bandAlpha);
                this.jammingOverlay.fillRect(bandX, 0, bandWidth / 2, this.config.height);
            }
        }
        
        // 5. Red tinted overlay for danger indication
        this.jammingOverlay.fillStyle(this.jammingColor, 0.2 * this.jammingIntensity);
        this.jammingOverlay.fillRect(0, 0, this.config.width, this.config.height);
        
        // Show signal lost text when intensity is high enough
        if (this.jammingIntensity > 0.6 && this.jammingText.alpha < 1) {
            this.scene.tweens.add({
                targets: this.jammingText,
                alpha: this.jammingIntensity,
                duration: 300,
                ease: 'Power2'
            });
        }
        
        // Flicker the jamming text for distress effect
        if (this.jammingText.alpha > 0) {
            // Combine multiple sine waves for more chaotic flickering
            const flicker = 0.7 + 
                0.15 * Math.sin(this.staticTimer / 100) + 
                0.15 * Math.sin(this.staticTimer / 33);
            
            this.jammingText.setAlpha(this.jammingIntensity * flicker);
            
            // Occasionally shift text position for glitch effect
            if (Math.random() > 0.95) {
                const offsetX = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                const offsetY = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                
                this.jammingText.setPosition(
                    this.config.width / 2 + offsetX,
                    this.config.height / 2 + offsetY
                );
            } else {
                // Reset to center most of the time
                this.jammingText.setPosition(this.config.width / 2, this.config.height / 2);
            }
        }
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
    
    // Fixed update method that preserves level and time information during jamming
    update(player, enemies = [], levelInfo = {}) {
        // Clear the entity graphics for redrawing
        this.entitiesGraphics.clear();
        
        // Calculate world to minimap scale
        const mapWidth = this.scene.map.widthInPixels;
        const mapHeight = this.scene.map.heightInPixels;
        const scaleX = this.config.width / mapWidth;
        const scaleY = this.config.height / mapHeight;
        
        // Check if any enemy is in alert or warning state
        const anyEnemyAlerted = enemies.some(enemy => 
            enemy.alertState === enemy.alertStates.ALERT || 
            enemy.alertState === enemy.alertStates.SEARCHING
        );
        
        // Toggle jamming based on enemy alert state
        if (anyEnemyAlerted && !this.isJammed) {
            this.startJamming();
        } else if (!anyEnemyAlerted && this.isJammed) {
            this.stopJamming();
        }
        
        // Construct the base display text with level and time info
        let displayText = '';
        
        // Add level and time information if provided (always show this)
        if (levelInfo.level !== undefined && levelInfo.timeRemaining !== undefined) {
            displayText = `Level ${levelInfo.level} - Time: ${levelInfo.timeRemaining}`;
        }
        
        // If jammed, don't draw entities - they're hidden by the overlay
        if (this.isJammed) {
            // Add alert status to displayText instead of replacing it
            if (displayText) {
                displayText += ' - HIGH ALERT';
            } else {
                displayText = 'HIGH ALERT';
            }
            
            // Set text color to red for alert state
            this.alertText.setStyle({ color: '#ff0000' });
            
            // Update the text display with combined information
            this.alertText.setText(displayText);
            return;
        }
        
        // Only draw entities if they should be visible in the current flash state
        if (this.flashVisible) {
            // Draw player position
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
        
        // Add alert status if alert level is high enough
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
            
            // Add alert status to the display text
            if (displayText && alertMessage) {
                displayText += ` - ${alertMessage}`;
            } else if (alertMessage) {
                displayText = alertMessage;
            }
            
            // Set text color based on alert state
            this.alertText.setStyle({ color: textColor });
        }
        
        // Update the text display
        this.alertText.setText(displayText);
    }
    
    resize(width, height) {
        // Reposition minimap when window is resized
        this.container.setPosition(width - this.config.width - 20, 20);
    }
    
    // Destroy the minimap and clean up all resources
    destroy() {
        // Clean up the flash timer
        if (this.flashTimer) {
            this.flashTimer.remove();
            this.flashTimer = null;
        }
        
        // Stop any active tweens
        if (this.isJammed) {
            this.scene.tweens.killTweensOf(this.jammingText);
        }
        
        // Stop jamming sound if playing
        if (this.jammingSound) {
            this.jammingSound.stop();
        }
        
        // Destroy the container (which includes all our graphics objects)
        this.container.destroy();
    }
}

// Add this HealthBar class at the top of your Game.js file,
// just after the Minimap class definition or before the Game class

class HealthBar {
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Default configuration
        this.config = {
            x: 20,
            y: 20,
            width: 200,
            height: 20,
            borderThickness: 2,
            backgroundColor: 0x000000,
            borderColor: 0xffffff,
            segments: 12,            // Number of segments in the health bar
            segmentSpacing: 1,       // Spacing between segments
            segmentColors: {
                high: 0x00ff00,      // Green for high health (70-100%)
                med: 0xffff00,       // Yellow for medium health (40-70%)
                low: 0xff0000        // Red for low health (0-40%)
            },
            labelText: 'LIFE',       // MGS2 style label
            labelStyle: {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: 'bold'
            },
            initialHealth: 100,      // Initial health value
            animationSpeed: 200,     // Speed of health change animation (ms)
            flashDuration: 100       // Duration of damage flash (ms)
        };
        
        // Apply any custom options
        Object.assign(this.config, options);
        
        this.health = this.config.initialHealth;
        this.targetHealth = this.health;
        this.isAnimating = false;
        this.damageFlash = false;
        this.flashTimer = null;
        
        // Create the container for all health bar elements
        this.container = scene.add.container(this.config.x, this.config.y);
        this.container.setScrollFactor(0); // Fix to camera
        this.container.setDepth(100);      // Ensure it appears above other elements
        
        // Create the label text
        this.label = scene.add.text(0, 0, this.config.labelText, this.config.labelStyle);
        this.label.setOrigin(0, 0.5);
        
        // Create background and border
        this.background = scene.add.rectangle(
            this.label.width + 10, 
            0, 
            this.config.width, 
            this.config.height, 
            this.config.backgroundColor
        );
        this.background.setOrigin(0, 0.5);
        
        this.border = scene.add.rectangle(
            this.label.width + 10, 
            0, 
            this.config.width, 
            this.config.height
        );
        this.border.setStrokeStyle(this.config.borderThickness, this.config.borderColor);
        this.border.setOrigin(0, 0.5);
        
        // Create segments container
        this.segmentsContainer = scene.add.container(this.label.width + 10, 0);
        
        // Create the segments
        this.segments = [];
        const segmentWidth = (this.config.width - (this.config.segments - 1) * this.config.segmentSpacing) / this.config.segments;
        
        for (let i = 0; i < this.config.segments; i++) {
            const segment = scene.add.rectangle(
                i * (segmentWidth + this.config.segmentSpacing),
                0,
                segmentWidth,
                this.config.height - this.config.borderThickness * 2,
                this.getSegmentColor(100)
            );
            segment.setOrigin(0, 0.5);
            this.segments.push(segment);
            this.segmentsContainer.add(segment);
        }
        
        // Add everything to the container
        this.container.add([this.label, this.background, this.border, this.segmentsContainer]);
        
        // Initial render
        this.render();
    }
    
    // Get color based on percentage
    getSegmentColor(percentage) {
        if (percentage > 70) {
            return this.config.segmentColors.high;
        } else if (percentage > 30) {
            return this.config.segmentColors.med;
        } else {
            return this.config.segmentColors.low;
        }
    }
    
    // Render the health bar
    render() {
        const healthPercentage = this.health;
        const activeSegments = Math.ceil((this.config.segments * healthPercentage) / 100);
        
        // Update segment visibility and color
        for (let i = 0; i < this.config.segments; i++) {
            if (i < activeSegments) {
                this.segments[i].setVisible(true);
                
                // Set color based on health level
                if (!this.damageFlash) {
                    this.segments[i].fillColor = this.getSegmentColor(healthPercentage);
                } else {
                    // Flash white when taking damage
                    this.segments[i].fillColor = 0xffffff;
                }
            } else {
                this.segments[i].setVisible(false);
            }
        }
    }
    
    // Set health value with optional animation
    setHealth(value, animate = true) {
        // Clamp value between 0 and 100
        const newHealth = Phaser.Math.Clamp(value, 0, 100);
        
        if (newHealth < this.health) {
            // Start damage flash effect
            this.startDamageFlash();
        }
        
        if (animate && Math.abs(this.health - newHealth) > 1) {
            // Set target and start animation
            this.targetHealth = newHealth;
            
            if (!this.isAnimating) {
                this.isAnimating = true;
                this.animateHealth();
            }
        } else {
            // Set immediately
            this.health = newHealth;
            this.render();
        }
    }
    
    // Animate health change
    animateHealth() {
        if (Math.abs(this.health - this.targetHealth) <= 1) {
            this.health = this.targetHealth;
            this.isAnimating = false;
            this.render();
            return;
        }
        
        // Move health towards target
        if (this.health > this.targetHealth) {
            this.health -= 1;
        } else {
            this.health += 1;
        }
        
        this.render();
        
        // Continue animation in next frame
        this.scene.time.delayedCall(
            10, 
            this.animateHealth, 
            [], 
            this
        );
    }
    
    // Start damage flash effect
    startDamageFlash() {
        if (this.flashTimer) {
            this.scene.time.removeEvent(this.flashTimer);
        }
        
        this.damageFlash = true;
        this.render();
        
        this.flashTimer = this.scene.time.delayedCall(
            this.config.flashDuration,
            () => {
                this.damageFlash = false;
                this.render();
            },
            [],
            this
        );
    }
    
    // Position the health bar (useful for responsive UI)
    setPosition(x, y) {
        this.container.setPosition(x, y);
    }
    
    // Resize the health bar (useful for responsive UI)
    resize(width, height) {
        const safeZone = this.scene.ui.getSafeZone();
        this.setPosition(safeZone.left + 20, safeZone.top + 20);
    }
    
    // Destroy the health bar
    destroy() {
        if (this.flashTimer) {
            this.scene.time.removeEvent(this.flashTimer);
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
        
        // Add health bar property
        this.healthBar = null;
        this.playerHealth = 100;
    
        // Add WASD keys
        this.keyW = null;
        this.keyA = null;
        this.keyS = null;
        this.keyD = null;
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
        
        // Set up WASD keys
        this.keyW = this.input.keyboard.addKey('W');
        this.keyA = this.input.keyboard.addKey('A');
        this.keyS = this.input.keyboard.addKey('S');
        this.keyD = this.input.keyboard.addKey('D');
        
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

    // Updated setupGameUI method for src/scenes/Game.js
    setupGameUI(levelNumber) {
        const { width, height } = this.cameras.main;
        const safeZone = this.ui.getSafeZone();
        
        // Clear existing UI elements if they exist
        if (this.timerText) this.timerText.destroy();
        if (this.helpText) this.helpText.destroy();
        if (this.menuButton) this.menuButton.destroy();
        if (this.healthBar) this.healthBar.destroy();
        
        // Create minimap in top right corner with appropriate size based on orientation
        if (this.minimap) this.minimap.destroy();
        
        // Create the health bar
        this.healthBar = new HealthBar(this, {
            x: safeZone.left + 20,
            y: safeZone.top + 20,
            width: this.ui.isLandscape ? 180 : 140,
            height: this.ui.isLandscape ? 18 : 15,
            labelText: 'LIFE',
            labelStyle: {
                fontFamily: 'Arial',
                fontSize: this.ui.isLandscape ? '14px' : '12px',
                color: '#ffffff',
                fontWeight: 'bold'
            }
        });
        
        if (this.ui.isLandscape) {
            // Landscape layout
            this.minimap = new Minimap(this, {
                x: width - safeZone.right - 180,
                y: safeZone.top + 20,
                width: 160,
                height: 120
            });
            
            // Move menu button to top left - no timer text needed as it's in the minimap
            this.menuButton = this.ui.createButton(
                safeZone.left + 80, 
                safeZone.top + 50, // Move below health bar
                'Main Menu', 
                {
                    fontSize: '14px',
                    fill: '#ffffff',
                    backgroundColor: '#4a4a4a',
                    padding: { left: 8, right: 8, top: 4, bottom: 4 }
                },
                () => this.cleanupAndChangeScene('MainMenu')
            ).setScrollFactor(0).setOrigin(0.5, 0);
            
            // Create help text at the bottom left
            this.helpText = this.ui.createText(
                safeZone.left + 16, 
                safeZone.top + 110, // Move below health bar and menu button
                this.getHelpMessage(), 
                { fontSize: '14px', fill: '#ffffff' }
            ).setScrollFactor(0).setVisible(false);
        } else {
            // Portrait layout - more compact UI
            this.minimap = new Minimap(this, {
                x: width - safeZone.right - 120,
                y: safeZone.top + 20,
                width: 110,
                height: 80
            });
            
            // Move menu button to top left - no timer text needed as it's in the minimap
            this.menuButton = this.ui.createButton(
                safeZone.left + 60, 
                safeZone.top + 50, // Move below health bar
                'Menu', 
                {
                    fontSize: '12px',
                    fill: '#ffffff',
                    backgroundColor: '#4a4a4a',
                    padding: { left: 6, right: 6, top: 3, bottom: 3 }
                },
                () => this.cleanupAndChangeScene('MainMenu')
            ).setScrollFactor(0).setOrigin(0.5, 0);
            
            // Create help text
            this.helpText = this.ui.createText(
                safeZone.left + 16, 
                safeZone.top + 90, // Move below health bar and menu button
                this.getHelpMessage(), 
                { fontSize: '12px', fill: '#ffffff' }
            ).setScrollFactor(0).setVisible(false);
        }
        
        // Set timerText to null since we're no longer using a separate timer element
        this.timerText = null;
        
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
        this.input.keyboard.on('keydown-X', toggleDarknessListener);
        this.keyListeners.push({ event: 'keydown-X', handler: toggleDarknessListener });

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
        
        // Destroy the health bar
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        
        // Start the new scene
        this.scene.start(sceneName, data);
    }
    
    // Update virtual joystick creation to be orientation-aware
    createVirtualJoystick() {
        // Use actual camera dimensions instead of game config
        const { width, height } = this.cameras.main;
        const safeZone = this.ui.getSafeZone();
        
        // Adjust radius based on device and orientation
        const radius = this.ui.isMobile ? 
            (this.ui.isLandscape ? 60 : 50) : // Larger on mobile landscape, smaller on portrait
            50;
            
        // Position differently based on orientation
        let x, y;
        
        if (this.ui.isLandscape) {
            // Position in right side but not too close to edge in landscape
            x = width * 0.85;  // 85% across instead of at the edge
            y = height - safeZone.bottom - radius - 30;
        } else {
            // Position in right side but not too close to edge in portrait
            x = width * 0.82;  // 82% across in portrait (slightly more centered)
            y = height - safeZone.bottom - radius - 30;
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
        return `Use the arrow keys or WASD on desktop or virtual joystick on mobile to move.
Mouse wheel to zoom in/out (Current zoom: ${this.currentZoom.toFixed(1)}x)
Press "C" to toggle debug visuals: ${this.showDebug ? 'on' : 'off'}
Press "X" to toggle darkness: ${this.darknessEnabled ? 'on' : 'off'}
Press "Z" to reset zoom
Enemies: ${this.enemies.length}
AI Behavior: Enemies follow patrol paths (tile 34) and chase when they spot you!`;
    }

    update(time, delta) {
        // Stop update loop if the game is over
        if (this.gameOver) {
            return;
        }

        // Get current level number and remaining time for minimap display
        let levelNumber;
        let remainingSeconds = 0;
        
        if (this.currentLevel === 'map') {
            levelNumber = 1;
        } else {
            levelNumber = parseInt(this.currentLevel.replace('level', '')) || 1;
        }
        
        if (this.timerEvent) {
            remainingSeconds = Math.ceil((this.timerEvent.delay - this.timerEvent.elapsed) / 1000);
        }
        
        // Update the minimap with level and time info
        if (this.minimap) {
            this.minimap.update(this.player, this.enemies, {
                level: levelNumber,
                timeRemaining: remainingSeconds
            });
        }

        // Update health bar based on enemy proximity
        this.updatePlayerHealth(time, delta);

        // Call this in the update method:
        if (this.showDebug) {
            this.visualizePatrolPaths();
        }

        // Reset player velocity
        this.player.body.setVelocity(0);

        let velocityX = 0;
        let velocityY = 0;

        // Keyboard input - Check arrow keys and WASD
        if ((this.cursors && this.cursors.left && this.cursors.left.isDown) || 
            (this.keyA && this.keyA.isDown)) {
            velocityX = -100;
        } else if ((this.cursors && this.cursors.right && this.cursors.right.isDown) || 
                  (this.keyD && this.keyD.isDown)) {
            velocityX = 100;
        }

        // Check vertical movement (up/down or W/S)
        if ((this.cursors && this.cursors.up && this.cursors.up.isDown) || 
            (this.keyW && this.keyW.isDown)) {
            velocityY = -100;
        } else if ((this.cursors && this.cursors.down && this.cursors.down.isDown) || 
                  (this.keyS && this.keyS.isDown)) {
            velocityY = 100;
        }

        // Virtual joystick input
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
        // Set health to zero with animation
        this.playerHealth = 0;
        this.healthBar.setHealth(0, true);
        
        // Show capture message after a short delay for the health animation
        this.time.delayedCall(400, () => {
            this.gameOver = true;
            this.showCaptureScreen();
            this.player.body.setVelocity(0);
        });
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
        
        // Add death status text
        const healthStatus = this.add.text(centerX, centerY - 160 * scaleFactor, 'LIFE: 0%', {
            fontFamily: 'Arial Black',
            fontSize: `${28 * scaleFactor}px`,
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4 * scaleFactor
        }).setOrigin(0.5);
        
        // Create animation for health status
        this.tweens.add({
            targets: healthStatus,
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Power2'
        });
        
        // Capture message
        const captureText = this.add.text(centerX, centerY - 100 * scaleFactor, 'You\'ve Been Captured!', {
            fontFamily: 'Arial Black',
            fontSize: `${48 * scaleFactor}px`,
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6 * scaleFactor
        }).setOrigin(0.5);
        
        // Add animation to the capture text
        this.tweens.add({
            targets: captureText,
            alpha: { from: 0, to: 1 },
            y: { from: centerY - 120 * scaleFactor, to: centerY - 100 * scaleFactor },
            duration: 500,
            delay: 300,
            ease: 'Power2'
        });
        
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
        
        // Retry button - with delayed appearance
        const retryButton = this.add.text(centerX, centerY, 'Retry Level', buttonStyle)
            .setOrigin(0.5)
            .setAlpha(0);
        
        this.tweens.add({
            targets: retryButton,
            alpha: 1,
            duration: 300,
            delay: 800,
            ease: 'Power2'
        });
        
        retryButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => retryButton.setStyle({ color: '#f39c12' }))
            .on('pointerout', () => retryButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => {
                this.cleanupAndChangeScene('Game', { levelKey: this.currentLevel });
            });
        
        // Level select button - with delayed appearance
        const levelSelectButton = this.add.text(
            centerX, 
            centerY + 60 * scaleFactor, 
            'Level Select', 
            buttonStyle
        )
        .setOrigin(0.5)
        .setAlpha(0);
        
        this.tweens.add({
            targets: levelSelectButton,
            alpha: 1,
            duration: 300,
            delay: 900,
            ease: 'Power2'
        });
        
        levelSelectButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => levelSelectButton.setStyle({ color: '#f39c12' }))
            .on('pointerout', () => levelSelectButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => {
                this.cleanupAndChangeScene('LevelSelect');
            });
        
        // Main menu button - with delayed appearance
        const mainMenuButton = this.add.text(
            centerX, 
            centerY + 120 * scaleFactor, 
            'Main Menu', 
            buttonStyle
        )
        .setOrigin(0.5)
        .setAlpha(0);
        
        this.tweens.add({
            targets: mainMenuButton,
            alpha: 1,
            duration: 300,
            delay: 1000,
            ease: 'Power2'
        });
        
        mainMenuButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => mainMenuButton.setStyle({ color: '#f39c12' }))
            .on('pointerout', () => mainMenuButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => {
                this.cleanupAndChangeScene('MainMenu');
            });
    }

    onTimeExpired() {
        if (!this.gameWon && !this.gameOver) {
            // Reduce health to zero with animation
            this.playerHealth = 0;
            this.healthBar.setHealth(0, true);
            
            // Show lose screen after a short delay for the health animation
            this.time.delayedCall(400, () => {
                this.gameOver = true;
                this.showLoseScreen();
                this.player.body.setVelocity(0);
            });
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

    // Method to update player health based on enemy proximity
    updatePlayerHealth(time, delta) {
        // Skip if game is already over
        if (this.gameOver || this.gameWon) return;
        
        // We'll keep the health bar at 100% until player is captured
        if (this.playerHealth < 100) {
            this.playerHealth = 100;
            this.healthBar.setHealth(100);
        }
        
        // No damage calculation needed anymore
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
        
        // Add health status text
        const healthStatus = this.ui.createText(
            centerX, 
            centerY - (this.ui.isMobile ? 120 : 150), 
            'LIFE: 0%', 
            {
                fontFamily: 'Arial Black',
                fontSize: '28px',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Animate health status appearance
        this.tweens.add({
            targets: healthStatus,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        // Create lose message with responsive text
        const loseText = this.ui.createText(
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
        ).setOrigin(0.5).setAlpha(0);
        
        // Animate lose text appearance
        this.tweens.add({
            targets: loseText,
            alpha: 1,
            duration: 400,
            delay: 300,
            ease: 'Power2'
        });
        
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
        
        // Retry button with animation
        const retryButton = this.ui.createButton(
            centerX,
            centerY,
            'Retry Level',
            buttonStyle,
            () => {
                this.cleanupAndChangeScene('Game', { levelKey: this.currentLevel });
            }
        ).setAlpha(0);
        
        // Animate buttons sequentially
        this.tweens.add({
            targets: retryButton,
            alpha: 1,
            duration: 300,
            delay: 700,
            ease: 'Power2'
        });
        
        // Level select button
        const levelSelectButton = this.ui.createButton(
            centerX,
            centerY + buttonSpacing,
            'Level Select',
            buttonStyle,
            () => {
                this.cleanupAndChangeScene('LevelSelect');
            }
        ).setAlpha(0);
        
        this.tweens.add({
            targets: levelSelectButton,
            alpha: 1,
            duration: 300,
            delay: 800,
            ease: 'Power2'
        });
        
        // Main menu button
        const mainMenuButton = this.ui.createButton(
            centerX,
            centerY + buttonSpacing * 2,
            'Main Menu',
            buttonStyle,
            () => {
                this.cleanupAndChangeScene('MainMenu');
            }
        ).setAlpha(0);
        
        this.tweens.add({
            targets: mainMenuButton,
            alpha: 1,
            duration: 300,
            delay: 900,
            ease: 'Power2'
        });
    }
}