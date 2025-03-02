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
        this.state = 'patrol'; // 'patrol', 'chase', or 'returnToPath'
        this.playerSpotted = false;
        this.lastKnownPlayerPos = null;
        this.timeWithoutPlayerSight = 0;
        this.timeUntilReturnToPath = 3000; // Wait 3 seconds before returning to path
        
        // Patrol variables
        this.patrolPath = [];
        this.currentPatrolPointIndex = 0;
        this.patrolDirection = 1; // 1 for forward, -1 for backward
        this.patrolSpeed = 80; // Increased patrol speed for more natural movement
        this.waitAtPatrolPoint = false;
        this.waitTimer = 0;
        this.waitDuration = 500; // Reduced wait time at patrol points (500ms)
        
        // Set a tint color to distinguish from player (slightly reddish)
        this.setTint(0xff9999);
        
        // Find patrol path
        this.findPatrolPath();
    }
    
    // Find patrol path based on tile index 34
    findPatrolPath() {
        // Get all patrol path tiles
        const patrolTiles = [];
        this.scene.layer.forEachTile(tile => {
            if (tile.index === 34) {
                patrolTiles.push({
                    x: tile.pixelX + tile.width / 2, 
                    y: tile.pixelY + tile.height / 2,
                    tileX: tile.x,
                    tileY: tile.y
                });
            }
        });
        
        if (patrolTiles.length === 0) {
            console.log('No patrol path tiles found. Using wander behavior.');
            this.state = 'wander';
            this.wanderDirection = new Phaser.Math.Vector2(0, 0);
            this.wanderTimer = 0;
            this.wanderChangeTime = 2000;
            return;
        }
        
        // Check if the patrol path forms a rectangle/square (common case)
        const pathIsRectangle = this.isRectanglePath(patrolTiles);
        
        if (pathIsRectangle) {
            console.log('Detected rectangular patrol path');
            // If it's a rectangle, extract only the perimeter points
            this.patrolPath = this.createRectanglePerimeterPath(patrolTiles);
        } else {
            // Sort the patrol tiles into a connected path
            this.patrolPath = this.createConnectedPath(patrolTiles);
        }
        
        // Validate the patrol path - make sure each point has valid coordinates
        this.patrolPath = this.patrolPath.filter(point => 
            point !== null && 
            point !== undefined && 
            point.x !== undefined && 
            point.y !== undefined
        );
        
        // Find nearest patrol point to start from
        this.currentPatrolPointIndex = this.findClosestPathPointIndex();
        
        console.log(`Created patrol path with ${this.patrolPath.length} points`);
        
        // Debug log the first few points
        if (this.patrolPath.length > 0) {
            console.log('First patrol point:', this.patrolPath[0]);
        }
    }
    
    // Check if path tiles form a rectangle
    isRectanglePath(tiles) {
        if (tiles.length < 4) return false;
        
        // Get unique X and Y coordinates
        const uniqueXs = new Set(tiles.map(t => t.tileX));
        const uniqueYs = new Set(tiles.map(t => t.tileY));
        
        // A rectangle path should have exactly 2 or more unique Xs and 2 or more unique Ys
        return uniqueXs.size >= 2 && uniqueYs.size >= 2;
    }
    
    // Create a path that follows only the perimeter of a rectangle
    createRectanglePerimeterPath(tiles) {
        // Get the bounds of the rectangle
        const xValues = tiles.map(t => t.tileX);
        const yValues = tiles.map(t => t.tileY);
        
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        
        // Create a path that follows the perimeter clockwise
        const perimeterPoints = [];
        
        // Helper to find a tile at specific coordinates
        const findTileAt = (x, y) => {
            return tiles.find(t => t.tileX === x && t.tileY === y);
        };
        
        // For very large rectangles, we'll use corner points and midpoints
        // to create a smoother path with fewer points
        if ((maxX - minX > 10) || (maxY - minY > 10)) {
            // Just use the four corners and midpoints for large rectangles
            
            // Top-left corner
            let tile = findTileAt(minX, minY);
            if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            
            // Top-middle
            tile = findTileAt(Math.floor((minX + maxX) / 2), minY);
            if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            
            // Top-right corner
            tile = findTileAt(maxX, minY);
            if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            
            // Right-middle
            tile = findTileAt(maxX, Math.floor((minY + maxY) / 2));
            if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            
            // Bottom-right corner
            tile = findTileAt(maxX, maxY);
            if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            
            // Bottom-middle
            tile = findTileAt(Math.floor((minX + maxX) / 2), maxY);
            if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            
            // Bottom-left corner
            tile = findTileAt(minX, maxY);
            if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            
            // Left-middle
            tile = findTileAt(minX, Math.floor((minY + maxY) / 2));
            if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
        } else {
            // For smaller rectangles, use more detailed perimeter
            
            // Top edge (left to right)
            for (let x = minX; x <= maxX; x += 1) {
                const tile = findTileAt(x, minY);
                if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            }
            
            // Right edge (top to bottom)
            for (let y = minY + 1; y <= maxY; y += 1) {
                const tile = findTileAt(maxX, y);
                if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            }
            
            // Bottom edge (right to left)
            for (let x = maxX - 1; x >= minX; x -= 1) {
                const tile = findTileAt(x, maxY);
                if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            }
            
            // Left edge (bottom to top)
            for (let y = maxY - 1; y > minY; y -= 1) {
                const tile = findTileAt(minX, y);
                if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            }
        }
        
        // For very small paths with few points, create a balanced path
        if (perimeterPoints.length < 4) {
            // Fill in any missing corner
            const corners = [
                { x: minX, y: minY }, // Top-left
                { x: maxX, y: minY }, // Top-right
                { x: maxX, y: maxY }, // Bottom-right
                { x: minX, y: maxY }  // Bottom-left
            ];
            
            for (const corner of corners) {
                const tile = findTileAt(corner.x, corner.y);
                if (tile && !perimeterPoints.some(p => p.x === tile.x && p.y === tile.y)) {
                    perimeterPoints.push({ x: tile.x, y: tile.y });
                }
            }
        }
        
        return perimeterPoints;
    }
    
    // Create a connected path based on proximity
    createConnectedPath(tiles) {
        if (tiles.length === 0) return [];
        
        // Convert tiles to simpler points for path creation
        const simplifiedTiles = tiles.map(tile => ({
            x: tile.x,
            y: tile.y,
            tileX: tile.tileX,
            tileY: tile.tileY
        }));
        
        const path = [simplifiedTiles[0]];
        const remainingTiles = simplifiedTiles.slice(1);
        
        // Build path by finding the closest next point
        while (remainingTiles.length > 0) {
            const lastPoint = path[path.length - 1];
            
            // Find index of closest remaining tile
            let closestIndex = 0;
            let closestDistance = Infinity;
            
            for (let i = 0; i < remainingTiles.length; i++) {
                const distance = Phaser.Math.Distance.Between(
                    lastPoint.x, lastPoint.y,
                    remainingTiles[i].x, remainingTiles[i].y
                );
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }
            
            // Add the closest point to the path
            path.push(remainingTiles[closestIndex]);
            
            // Remove it from remaining tiles
            remainingTiles.splice(closestIndex, 1);
        }
        
        // Optional: Reduce the number of points for a smoother path if there are many points
        // This helps avoid jerky movement on dense paths
        if (path.length > 8) {
            // Only keep every Nth point for smoother movement
            const smoothPath = [];
            for (let i = 0; i < path.length; i += 2) {
                smoothPath.push(path[i]);
            }
            // Make sure the path is closed by adding the first point at the end if needed
            if (smoothPath[0] !== smoothPath[smoothPath.length - 1]) {
                smoothPath.push(path[0]);
            }
            return smoothPath;
        }
        
        return path;
    }
    
    // Find the closest patrol point index to the AI's current position
    findClosestPathPointIndex() {
        if (this.patrolPath.length === 0) return 0;
        
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        for (let i = 0; i < this.patrolPath.length; i++) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.patrolPath[i].x, this.patrolPath[i].y
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }
        
        return closestIndex;
    }
    
    update(time, delta, player) {
        // Reset velocity
        this.body.setVelocity(0);
        
        const playerPos = new Phaser.Math.Vector2(player.x, player.y);
        const aiPos = new Phaser.Math.Vector2(this.x, this.y);
        
        // Check if player is in vision cone
        const wasPlayerSpotted = this.playerSpotted;
        this.playerSpotted = this.canSeePlayer(player);
        
        // State transitions based on player visibility
        if (this.playerSpotted) {
            this.state = 'chase';
            this.lastKnownPlayerPos = playerPos.clone();
            this.timeWithoutPlayerSight = 0;
        } else if (wasPlayerSpotted && !this.playerSpotted) {
            // Player just went out of sight
            this.timeWithoutPlayerSight = 0;
            this.state = 'returnToPath';
        } else if (this.state === 'returnToPath') {
            // Update time since player was last seen
            this.timeWithoutPlayerSight += delta;
            
            // Check if we should return to patrol path
            if (this.timeWithoutPlayerSight >= this.timeUntilReturnToPath) {
                if (this.patrolPath.length > 0) {
                    this.state = 'patrol';
                    this.currentPatrolPointIndex = this.findClosestPathPointIndex();
                } else {
                    this.state = 'wander';
                }
            }
        }
        
        // State machine for AI behavior
        switch (this.state) {
            case 'chase':
                this.chasePlayer(this.lastKnownPlayerPos);
                break;
            case 'returnToPath':
                if (this.lastKnownPlayerPos) {
                    this.moveToPosition(this.lastKnownPlayerPos, this.speed * 0.8);
                }
                break;
            case 'patrol':
                this.followPatrolPath(delta);
                break;
            case 'wander':
                this.wander(time, delta);
                break;
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
        this.moveToPosition(targetPos, this.speed);
    }
    
    moveToPosition(targetPos, speed) {
        const aiPos = new Phaser.Math.Vector2(this.x, this.y);
        const direction = new Phaser.Math.Vector2(targetPos.x - aiPos.x, targetPos.y - aiPos.y);
        
        if (direction.length() > 5) { // Only move if not already at target position
            direction.normalize();
            
            // Update facing angle
            this.facingAngle = direction.angle();
            
            // Move towards the target
            this.body.setVelocity(direction.x * speed, direction.y * speed);
        }
    }
    
    followPatrolPath(delta) {
        if (this.patrolPath.length === 0) {
            this.state = 'wander';
            return;
        }
        
        // Get current patrol target
        const currentTarget = this.patrolPath[this.currentPatrolPointIndex];
        
        // Check if we're waiting at this patrol point
        if (this.waitAtPatrolPoint) {
            this.waitTimer += delta;
            if (this.waitTimer >= this.waitDuration) {
                this.waitAtPatrolPoint = false;
                this.waitTimer = 0;
                
                // Move to next patrol point
                this.updatePatrolIndex();
            }
            return;
        }
        
        // Move to current patrol point
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            currentTarget.x, currentTarget.y
        );
        
        // Only wait at points if the path is long enough
        const shouldWaitAtPoints = this.patrolPath.length > 4;
        
        if (distance < 8) { // Increased threshold for reaching a point
            if (shouldWaitAtPoints) {
                // Reached patrol point, wait briefly (only on longer paths)
                this.waitAtPatrolPoint = true;
                this.waitTimer = 0;
            } else {
                // For short paths, immediately move to next point
                this.updatePatrolIndex();
            }
        } else {
            // Move towards patrol point with the patrol speed
            this.moveToPosition(currentTarget, this.patrolSpeed);
        }
    }
    
    updatePatrolIndex() {
        if (this.patrolPath.length <= 1) return;
        
        // Move to next point based on patrol direction
        this.currentPatrolPointIndex += this.patrolDirection;
        
        // Check bounds and reverse direction if needed
        if (this.currentPatrolPointIndex >= this.patrolPath.length) {
            this.currentPatrolPointIndex = this.patrolPath.length - 2;
            this.patrolDirection = -1;
        } else if (this.currentPatrolPointIndex < 0) {
            this.currentPatrolPointIndex = 1;
            this.patrolDirection = 1;
        }
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
            this.wanderDirection.x * this.speed * 0.7,
            this.wanderDirection.y * this.speed * 0.7
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
        
        // Always draw patrol path regardless of debug mode
        // This ensures it's visible when needed
        this.drawPatrolPath();
        
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
    
    // Separate method to draw patrol path for clarity
    drawPatrolPath() {
        // Only draw if there's a path to draw
        if (this.patrolPath.length <= 0) return;
        
        // Draw patrol path
        this.graphics.lineStyle(2, 0x00ff00, 0.5);
        this.graphics.beginPath();
        
        // Start at the first point
        if (this.patrolPath[0] && this.patrolPath[0].x !== undefined) {
            this.graphics.moveTo(this.patrolPath[0].x, this.patrolPath[0].y);
            
            // Draw lines to each subsequent point
            for (let i = 1; i < this.patrolPath.length; i++) {
                if (this.patrolPath[i] && this.patrolPath[i].x !== undefined) {
                    this.graphics.lineTo(this.patrolPath[i].x, this.patrolPath[i].y);
                }
            }
            
            // Connect back to the start to complete the loop
            this.graphics.lineTo(this.patrolPath[0].x, this.patrolPath[0].y);
            
            this.graphics.strokePath();
            
            // Highlight current target point with a larger circle
            if (this.currentPatrolPointIndex < this.patrolPath.length) {
                const currentTarget = this.patrolPath[this.currentPatrolPointIndex];
                
                // Add a highlight for the current target point
                this.graphics.fillStyle(0x00ff00, 0.7);
                this.graphics.fillCircle(currentTarget.x, currentTarget.y, 6);
                
                // Add a highlight for the AI's current state
                let stateColor;
                switch (this.state) {
                    case 'chase': stateColor = 0xff0000; break; // Red for chase
                    case 'patrol': stateColor = 0x00ff00; break; // Green for patrol
                    case 'returnToPath': stateColor = 0xffff00; break; // Yellow for return
                    case 'wander': stateColor = 0x0000ff; break; // Blue for wander
                    default: stateColor = 0xffffff; break; // White for unknown
                }
                
                // Draw a state indicator above the AI
                this.graphics.fillStyle(stateColor, 0.8);
                this.graphics.fillCircle(this.x, this.y - 20, 4);
            }
        }
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