export class HealthBar {
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