import Phaser from 'phaser';

export class AI extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 1);
        
        // Add this sprite to the scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up basic properties
        this.speed = 70; // Slightly slower than player's speed of 100
        this.visionRadius = 10 * 16; // Vision range (10 tiles)
        this.visionAngle = Math.PI / 2; // 90 degrees field of view
        this.facingAngle = 0;
        this.sightLine = null;
        this.graphics = scene.add.graphics();
        
        // State variables
        this.state = 'wander'; // 'wander' or 'chase'
        this.playerSpotted = false;
        this.lastKnownPlayerPos = null;
        this.wanderTimer = 0;
        this.wanderDirection = new Phaser.Math.Vector2(0, 0);
        this.wanderChangeTime = 2000; // Time in ms to maintain wandering direction
        
        // Set a tint color to distinguish from player (slightly reddish)
        this.setTint(0xff9999);
    }
    
    update(time, delta, player) {
        // Reset velocity
        this.body.setVelocity(0);
        
        const playerPos = new Phaser.Math.Vector2(player.x, player.y);
        const aiPos = new Phaser.Math.Vector2(this.x, this.y);
        
        // Check if player is in vision cone
        this.playerSpotted = this.canSeePlayer(player);
        
        // Update AI state based on whether player is spotted
        if (this.playerSpotted) {
            this.state = 'chase';
            this.lastKnownPlayerPos = playerPos.clone();
        } else if (this.state === 'chase' && this.lastKnownPlayerPos) {
            // If we're in chase mode but lost sight, head to last known position
            const distToLastKnown = aiPos.distance(this.lastKnownPlayerPos);
            
            if (distToLastKnown < 16) { // Within 1 tile
                this.state = 'wander'; // Resume wandering if reached last known position
                this.lastKnownPlayerPos = null;
            }
        }
        
        // State machine for AI behavior
        if (this.state === 'chase' && this.lastKnownPlayerPos) {
            // Chase the player
            this.chasePlayer(this.lastKnownPlayerPos);
        } else {
            // Wander behavior
            this.wander(time, delta);
        }
        
        // Update animations based on movement
        this.updateAnimation();
        
        // Update vision cone
        this.updateVisionCone();
    }
    
    canSeePlayer(player) {
        const playerPos = new Phaser.Math.Vector2(player.x, player.y);
        const aiPos = new Phaser.Math.Vector2(this.x, this.y);
        
        // Check if player is within vision radius
        const distToPlayer = aiPos.distance(playerPos);
        if (distToPlayer > this.visionRadius) {
            return false;
        }
        
        // Check if player is within vision angle
        const toPlayer = playerPos.clone().subtract(aiPos);
        const angleToPlayer = toPlayer.angle();
        
        // Check if angle is within the vision cone
        const angleDiff = Phaser.Math.Angle.Wrap(angleToPlayer - this.facingAngle);
        if (Math.abs(angleDiff) > this.visionAngle / 2) {
            return false;
        }
        
        // Check for line of sight (obstacles)
        const ray = new Phaser.Geom.Line(this.x, this.y, player.x, player.y);
        
        // Get all tiles along the ray path
        const tiles = this.scene.layer.getTilesWithinShape(ray);
        
        // Check if any solid tiles block the ray
        for (const tile of tiles) {
            if (tile.collides) {
                return false;
            }
        }
        
        return true;
    }
    
    chasePlayer(targetPos) {
        const aiPos = new Phaser.Math.Vector2(this.x, this.y);
        const direction = new Phaser.Math.Vector2(targetPos.x - aiPos.x, targetPos.y - aiPos.y).normalize();
        
        // Update facing angle
        this.facingAngle = direction.angle();
        
        // Move towards the player
        this.body.setVelocity(direction.x * this.speed, direction.y * this.speed);
    }
    
    wander(time, delta) {
        // Update wander timer
        this.wanderTimer += delta;
        
        // Change direction periodically
        if (this.wanderTimer >= this.wanderChangeTime) {
            // Pick a random direction
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.wanderDirection.x = Math.cos(angle);
            this.wanderDirection.y = Math.sin(angle);
            
            this.facingAngle = angle;
            this.wanderTimer = 0;
            this.wanderChangeTime = Phaser.Math.Between(1500, 3000);
        }
        
        // Apply wandering movement
        this.body.setVelocity(
            this.wanderDirection.x * this.speed,
            this.wanderDirection.y * this.speed
        );
        
        // Handle collisions by changing direction
        if (this.body.blocked.up || this.body.blocked.down || 
            this.body.blocked.left || this.body.blocked.right) {
            // Reflect direction when hitting a wall
            if (this.body.blocked.up || this.body.blocked.down) {
                this.wanderDirection.y *= -1;
            }
            if (this.body.blocked.left || this.body.blocked.right) {
                this.wanderDirection.x *= -1;
            }
            this.facingAngle = this.wanderDirection.angle();
            this.wanderTimer = 0;
        }
    }
    
    updateAnimation() {
        const velocity = this.body.velocity;
        
        if (velocity.x < -10) {
            this.anims.play('left', true);
        } else if (velocity.x > 10) {
            this.anims.play('right', true);
        } else if (velocity.y < -10) {
            this.anims.play('up', true);
        } else if (velocity.y > 10) {
            this.anims.play('down', true);
        } else {
            this.anims.stop();
        }
    }
    
    updateVisionCone() {
        this.graphics.clear();
        
        // Draw vision cone with yellow color and transparency
        this.graphics.fillStyle(0xffff00, 0.2);
        
        // Starting position
        const startX = this.x;
        const startY = this.y;
        
        // Number of rays to cast for the cone
        const rayCount = 20;
        
        // Calculate points on the arc
        const points = [{ x: startX, y: startY }];
        
        for (let i = 0; i <= rayCount; i++) {
            const angle = this.facingAngle - (this.visionAngle / 2) + (this.visionAngle * (i / rayCount));
            
            // Cast a ray to find a collision or max distance
            const rayLength = this.castRay(startX, startY, angle);
            
            // Add the endpoint to our cone
            const endX = startX + Math.cos(angle) * rayLength;
            const endY = startY + Math.sin(angle) * rayLength;
            
            points.push({ x: endX, y: endY });
        }
        
        // Fill the polygon
        this.graphics.beginPath();
        this.graphics.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.graphics.lineTo(points[i].x, points[i].y);
        }
        
        this.graphics.closePath();
        this.graphics.fillPath();
    }
    
    castRay(startX, startY, angle) {
        // Start and end points for maximum possible ray length
        const endX = startX + Math.cos(angle) * this.visionRadius;
        const endY = startY + Math.sin(angle) * this.visionRadius;
        
        // Create a line representing the ray
        const ray = new Phaser.Geom.Line(startX, startY, endX, endY);
        
        // Get the tiles that intersect with this ray
        const tiles = this.scene.layer.getTilesWithinShape(ray);
        
        // Find the closest colliding tile
        let closestTile = null;
        let closestDistance = this.visionRadius;
        
        for (const tile of tiles) {
            if (tile.collides) {
                // Calculate distance to this tile
                const tileCenter = new Phaser.Math.Vector2(
                    tile.getCenterX(),
                    tile.getCenterY()
                );
                const distance = Phaser.Math.Distance.Between(startX, startY, tileCenter.x, tileCenter.y);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTile = tile;
                }
            }
        }
        
        return closestDistance;
    }
    
    destroy(fromScene) {
        if (this.graphics) {
            this.graphics.destroy();
        }
        super.destroy(fromScene);
    }
}