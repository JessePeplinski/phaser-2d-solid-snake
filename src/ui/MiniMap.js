export class Minimap {
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
            // Update to use tile properties
            if (tile.index === this.scene.tileProps.exit) { // Exit/goal
                this.mapGraphics.fillStyle(this.config.exitColor, 0.7);
                this.mapGraphics.fillRect(x, y, width, height);
            } else if (tile.index === this.scene.tileProps.playerSpawn) { // Spawn point
                this.mapGraphics.fillStyle(this.config.spawnColor, 0.7);
                this.mapGraphics.fillRect(x, y, width, height);
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