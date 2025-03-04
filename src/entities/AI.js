import Phaser from 'phaser';

export class AI extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 1);
        
        // Add this sprite to the scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up basic properties
        this.speed = 70; // Base speed
        this.visionRadius = 10 * 16; // Default vision range (10 tiles)
        this.visionAngle = Math.PI / 2; // 90 degrees field of view
        this.facingAngle = 0;
        this.sightLine = null;
        this.graphics = scene.add.graphics();

        // Footstep sound handling
        this.footstepTimer = 0;
        this.footstepDelay = 300; // Longer delay for AI footsteps (less frequent)
        this.footstepSound = scene.sound.add('footstep', {
            volume: 0.2,
            loop: false
        });
        this.isMoving = false; // Track movement state for footstep coordination
        
        // Alert state system
        this.alertStates = {
            PATROL: 'patrol',      // Normal patrol behavior
            SUSPICIOUS: 'suspicious', // Heard something or briefly saw player
            SEARCHING: 'searching',   // Actively searching an area
            ALERT: 'alert',        // Player spotted, actively chasing
            RETURNING: 'returning'  // Returning to patrol after losing player
        };
        
        // Initialize state as patrolling
        this.alertState = this.alertStates.PATROL;
        this.alertLevel = 0; // 0 to 100 representing suspicion level
        this.alertCooldown = 0; // Cooldown timer for reducing alert level
        this.alertIncreaseRate = 40; // How quickly alert level increases when player seen
        this.alertDecreaseRate = 5;  // How quickly alert level decreases when player lost
        
        // Memory system
        this.playerMemory = {
            lastKnownPosition: null,
            lastSeenTime: 0, 
            investigationPoints: [], // List of points to check when searching
            currentInvestigationPoint: 0,
            memoryDuration: 10000, // How long in ms to remember player position
            investigationRadius: 48 // Radius to search around last known position
        };
        
        // Alert indicator
        this.alertIndicator = scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '16px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        this.alertIndicator.setOrigin(0.5, 0.5);
        this.alertIndicator.setVisible(false);
        
        // Patrol variables
        this.patrolPath = [];
        this.currentPatrolPointIndex = 0;
        this.patrolDirection = 1; // 1 for forward, -1 for backward
        this.patrolSpeed = 60; // Reduced patrol speed for more natural patrolling
        
        // Variables for smooth turning
        this.turnSpeed = 0.05; // How quickly to change direction (in radians per frame)
        this.targetAngle = 0; // The angle we're trying to face
        this.movementLerpFactor = 0.2; // For smoother acceleration/deceleration
        this.currentVelocity = new Phaser.Math.Vector2(0, 0);
        
        // Path progress tracking for fluid movement
        this.pathProgress = 0; // 0 to 1 progress between current and next point
        this.pathSegmentLength = 0; // Length of current path segment
        this.lookAheadDistance = 16; // Distance to look ahead for turns
        
        // Timing variables for state changes
        this.stateTimer = 0;
        this.timeInState = 0;
        this.waitTimer = 0;
        this.waitDuration = 0;
        this.isWaiting = false;
        
        // Wander variables
        this.wanderDirection = new Phaser.Math.Vector2(0, 0);
        this.wanderTimer = 0;
        this.wanderChangeTime = 2000;
        
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
            this.alertState = this.alertStates.PATROL;
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
        
        // Calculate initial path segment length
        this.updatePathSegmentLength();
        
        console.log(`Created patrol path with ${this.patrolPath.length} points`);
        
        // Debug log the first few points
        if (this.patrolPath.length > 0) {
            console.log('First patrol point:', this.patrolPath[0]);
        }
    }
    
    // Calculate the length of the current path segment
    updatePathSegmentLength() {
        if (this.patrolPath.length < 2) return;
        
        const currentPoint = this.patrolPath[this.currentPatrolPointIndex];
        const nextIndex = this.getNextPatrolPointIndex();
        const nextPoint = this.patrolPath[nextIndex];
        
        this.pathSegmentLength = Phaser.Math.Distance.Between(
            currentPoint.x, currentPoint.y,
            nextPoint.x, nextPoint.y
        );
    }
    
    // Get the index of the next patrol point
    getNextPatrolPointIndex() {
        if (this.patrolPath.length <= 1) return 0;
        
        // Calculate next index based on current direction
        let nextIndex = this.currentPatrolPointIndex + this.patrolDirection;
        
        // First determine if this is a closed loop path (rectangle/square)
        const isClosedLoop = this.isClosedLoopPath();
        
        // Handle wrapping around the path
        if (nextIndex >= this.patrolPath.length) {
            // For closed loop paths (like rectangles), loop back to the start
            if (isClosedLoop) {
                nextIndex = 0;
            } else {
                // For open paths, we'll reverse direction at the end
                nextIndex = this.patrolPath.length - 2;
                if (nextIndex < 0) nextIndex = 0; // Safety check
            }
        } else if (nextIndex < 0) {
            // For closed loop paths, loop to the end
            if (isClosedLoop) {
                nextIndex = this.patrolPath.length - 1;
            } else {
                // For open paths, we'll reverse direction at the start
                nextIndex = 1;
                if (nextIndex >= this.patrolPath.length) nextIndex = this.patrolPath.length - 1; // Safety check
            }
        }
        
        return nextIndex;
    }
    
    // Check if the path forms a closed loop (e.g., rectangle or square)
    isClosedLoopPath() {
        if (this.patrolPath.length <= 2) return false;
        
        // Check distance between first and last points
        const firstPoint = this.patrolPath[0];
        const lastPoint = this.patrolPath[this.patrolPath.length - 1];
        
        const distance = Phaser.Math.Distance.Between(
            firstPoint.x, firstPoint.y,
            lastPoint.x, lastPoint.y
        );
        
        // If the first and last points are close enough, it's a closed loop
        return distance <= 32; // Within 2 tiles
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
            for (let x = minX; x <= maxX; x += 2) { // Skip every other tile for smoother movement
                const tile = findTileAt(x, minY);
                if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            }
            
            // Right edge (top to bottom)
            for (let y = minY + 2; y <= maxY; y += 2) { // Skip every other tile
                const tile = findTileAt(maxX, y);
                if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            }
            
            // Bottom edge (right to left)
            for (let x = maxX - 2; x >= minX; x -= 2) { // Skip every other tile
                const tile = findTileAt(x, maxY);
                if (tile) perimeterPoints.push({ x: tile.x, y: tile.y });
            }
            
            // Left edge (bottom to top)
            for (let y = maxY - 2; y > minY; y -= 2) { // Skip every other tile
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
        // Reset velocity for this frame
        this.body.setVelocity(0);
        
        // Update timers
        this.timeInState += delta;
        if (this.isWaiting) {
            this.waitTimer += delta;
            if (this.waitTimer >= this.waitDuration) {
                this.isWaiting = false;
                this.waitTimer = 0;
            }
        }
        
        // Position alert indicator above AI
        this.alertIndicator.setPosition(this.x, this.y - 30);
        
        // Process alert state system
        this.updateAlertState(time, delta, player);
        
        // Update memory system
        this.updateMemory(time, delta, player);
        
        // Process alert level cooldown
        if (this.alertCooldown > 0) {
            this.alertCooldown -= delta;
            if (this.alertCooldown <= 0) {
                this.alertCooldown = 0;
                // Decrease alert level over time if not seeing player
                if (!this.canSeePlayer(player) && this.alertLevel > 0) {
                    this.alertLevel = Math.max(0, this.alertLevel - (this.alertDecreaseRate * delta / 1000));
                    
                    // Transition to lower alert states based on alert level
                    this.updateAlertStateBasedOnLevel();
                }
            }
        }
        
        // State machine for AI behavior
        switch (this.alertState) {
            case this.alertStates.PATROL:
                if (this.patrolPath.length > 0) {
                    this.followPatrolPathContinuous(delta);
                } else {
                    this.wander(time, delta);
                }
                break;
                
            case this.alertStates.SUSPICIOUS:
                // Look towards the suspicious position or continue patrol with caution
                if (this.playerMemory.lastKnownPosition) {
                    this.lookTowardsPosition(this.playerMemory.lastKnownPosition);
                    
                    // After brief pause, resume patrol or become more alert
                    if (this.timeInState > 3000) {
                        if (this.alertLevel > 50) {
                            // Transition to searching if suspicion is high
                            this.setAlertState(this.alertStates.SEARCHING);
                            this.generateSearchPoints(this.playerMemory.lastKnownPosition);
                        } else {
                            // Return to patrol if just briefly suspicious
                            this.setAlertState(this.alertStates.PATROL);
                        }
                    }
                } else {
                    // If no last known position, return to patrol
                    this.setAlertState(this.alertStates.PATROL);
                }
                break;
                
            case this.alertStates.SEARCHING:
                // Search around the last known player position
                if (this.playerMemory.investigationPoints.length > 0) {
                    this.searchArea();
                } else if (this.timeInState > 8000) {
                    // Give up searching after a while
                    this.setAlertState(this.alertStates.RETURNING);
                }
                break;
                
            case this.alertStates.ALERT:
                // Actively chase the player
                if (this.playerMemory.lastKnownPosition) {
                    this.chasePlayer(this.playerMemory.lastKnownPosition);
                }
                break;
                
            case this.alertStates.RETURNING:
                // Return to patrol path
                if (this.patrolPath.length > 0) {
                    // Find the nearest patrol point
                    const closestIndex = this.findClosestPathPointIndex();
                    const target = this.patrolPath[closestIndex];
                    
                    const distToPath = Phaser.Math.Distance.Between(
                        this.x, this.y, target.x, target.y
                    );
                    
                    if (distToPath < 16) {
                        // Reached patrol path, resume normal patrol
                        this.currentPatrolPointIndex = closestIndex;
                        this.updatePathSegmentLength();
                        this.pathProgress = 0;
                        this.setAlertState(this.alertStates.PATROL);
                    } else {
                        // Move towards the patrol path
                        this.moveToPosition(target, this.patrolSpeed * 0.8);
                    }
                } else {
                    // No patrol path, just go back to wandering
                    this.setAlertState(this.alertStates.PATROL);
                }
                break;
        }
        
        // Update animations based on movement
        this.updateAnimation(delta);
        
        // Update vision cone
        this.updateVisionCone();
    }
    
    // Update alert state based on player visibility and alert level
    updateAlertState(time, delta, player) {
        const canSeePlayerNow = this.canSeePlayer(player);
        
        // If player is visible, increase alert level and take appropriate action
        if (canSeePlayerNow) {
            // Update last known position
            this.playerMemory.lastKnownPosition = new Phaser.Math.Vector2(player.x, player.y);
            this.playerMemory.lastSeenTime = time;
            
            // Increase alert level
            this.alertLevel = Math.min(100, this.alertLevel + (this.alertIncreaseRate * delta / 1000));
            this.alertCooldown = 500; // Small cooldown before alert level starts decreasing
            
            // Update alert state based on alert level
            if (this.alertLevel >= 80) {
                if (this.alertState !== this.alertStates.ALERT) {
                    this.setAlertState(this.alertStates.ALERT);
                }
            } else if (this.alertLevel >= 40) {
                if (this.alertState !== this.alertStates.SUSPICIOUS && 
                    this.alertState !== this.alertStates.ALERT) {
                    this.setAlertState(this.alertStates.SUSPICIOUS);
                }
            }
        } else if (this.alertState === this.alertStates.ALERT) {
            // Lost sight of player while in alert mode
            // Calculate time since last saw player
            const timeSinceLastSeen = time - this.playerMemory.lastSeenTime;
            
            // If it's been a while since we saw the player, transition to searching
            if (timeSinceLastSeen > 1000) {
                this.setAlertState(this.alertStates.SEARCHING);
                // Generate search points around last known position
                this.generateSearchPoints(this.playerMemory.lastKnownPosition);
            }
        }
        
        // Update alert indicator
        this.updateAlertIndicator();
    }
    
    // Update the AI state based on current alert level
    updateAlertStateBasedOnLevel() {
        if (this.alertLevel < 10) {
            // Almost no alert, return to patrol
            if (this.alertState !== this.alertStates.PATROL) {
                this.setAlertState(this.alertStates.PATROL);
            }
        } else if (this.alertLevel < 40) {
            // Low alert, but still suspicious or returning to patrol
            if (this.alertState === this.alertStates.ALERT || 
                this.alertState === this.alertStates.SEARCHING) {
                this.setAlertState(this.alertStates.RETURNING);
            }
        }
    }
    
    // Set a new alert state and reset state timer
    setAlertState(newState) {
        // Don't change if already in this state
        if (this.alertState === newState) return;
        
        const oldState = this.alertState;
        this.alertState = newState;
        this.timeInState = 0;
        
        // Log state change for debugging
        console.log(`AI state change: ${oldState} -> ${newState}`);
        
        // Handle state entry actions
        switch (newState) {
            case this.alertStates.PATROL:
                // Clear all investigation points and alert indicators when returning to patrol
                this.playerMemory.investigationPoints = [];
                this.alertLevel = 0; // Reset alert level
                // Update the alert indicator immediately
                this.updateAlertIndicator();
                break;
                
            case this.alertStates.SUSPICIOUS:
                // Brief pause when becoming suspicious
                this.isWaiting = true;
                this.waitTimer = 0;
                this.waitDuration = 1000;
                break;
                
            case this.alertStates.SEARCHING:
                // Generate search points if not already done
                if (this.playerMemory.investigationPoints.length === 0 && 
                    this.playerMemory.lastKnownPosition) {
                    this.generateSearchPoints(this.playerMemory.lastKnownPosition);
                }
                this.isWaiting = false; // Ensure we're not stuck waiting
                break;
                
            case this.alertStates.RETURNING:
                // Clear investigation points
                this.playerMemory.investigationPoints = [];
                break;
        }
    }
    
    // Update memory and last known player information
    updateMemory(time, delta, player) {
        // Check if memory of player position should expire
        if (this.playerMemory.lastKnownPosition) {
            const timeSinceLastSeen = time - this.playerMemory.lastSeenTime;
            
            // Forget player's position after memory duration
            if (timeSinceLastSeen > this.playerMemory.memoryDuration) {
                this.playerMemory.lastKnownPosition = null;
                
                // If we were searching, return to patrol
                if (this.alertState === this.alertStates.SEARCHING || 
                    this.alertState === this.alertStates.ALERT) {
                    this.setAlertState(this.alertStates.RETURNING);
                }
            }
        }
    }
    
    // Generate points to search around the last known player position
    // Improved search point generation to ensure AI actually has points to check
    generateSearchPoints(position) {
        if (!position) return;
        
        const points = [];
        const radius = this.playerMemory.investigationRadius;
        const numPoints = 5; // Number of search points to generate
        
        // Add the center point (last known position)
        points.push(new Phaser.Math.Vector2(position.x, position.y));
        
        // Generate points in a circular pattern around the center
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const distance = Phaser.Math.Between(radius/2, radius);
            
            const x = position.x + Math.cos(angle) * distance;
            const y = position.y + Math.sin(angle) * distance;
            
            // Make sure the point is within the map bounds
            const newPoint = new Phaser.Math.Vector2(
                Phaser.Math.Clamp(x, 16, this.scene.map.widthInPixels - 16),
                Phaser.Math.Clamp(y, 16, this.scene.map.heightInPixels - 16)
            );
            
            // Check if the point is accessible (not in a wall)
            const tile = this.scene.layer.getTileAtWorldXY(newPoint.x, newPoint.y);
            if (!tile || !tile.collides) {
                points.push(newPoint);
            }
        }
        
        // If we couldn't generate any valid points (unlikely), use a fallback
        if (points.length <= 1) {
            // Add some points in cardinal directions at smaller distances
            const fallbackDistances = [32, 48, 64];
            const fallbackAngles = [0, Math.PI/2, Math.PI, Math.PI*3/2];
            
            for (const distance of fallbackDistances) {
                for (const angle of fallbackAngles) {
                    const x = position.x + Math.cos(angle) * distance;
                    const y = position.y + Math.sin(angle) * distance;
                    
                    // Make sure the point is within bounds
                    const point = new Phaser.Math.Vector2(
                        Phaser.Math.Clamp(x, 16, this.scene.map.widthInPixels - 16),
                        Phaser.Math.Clamp(y, 16, this.scene.map.heightInPixels - 16)
                    );
                    
                    // Only add if it's not in a wall
                    const tile = this.scene.layer.getTileAtWorldXY(point.x, point.y);
                    if (!tile || !tile.collides) {
                        points.push(point);
                    }
                }
            }
        }
        
        // Ensure there's at least one point besides the origin
        if (points.length <= 1) {
            console.log("Warning: Could not generate valid search points");
        }
        
        // Randomize the order of points except for the first one (last known position)
        if (points.length > 2) {
            const firstPoint = points.shift(); // Remove first point
            Phaser.Utils.Array.Shuffle(points); // Shuffle remaining points
            points.unshift(firstPoint); // Put first point back
        }
        
        console.log(`Generated ${points.length} search points`);
        
        // Set the investigation points
        this.playerMemory.investigationPoints = points;
        this.playerMemory.currentInvestigationPoint = 0;
    }
    
    // Search the area around the last known player position
    searchArea() {
        if (this.playerMemory.investigationPoints.length === 0) return;
        
        // Get the current investigation point
        const currentPoint = this.playerMemory.investigationPoints[this.playerMemory.currentInvestigationPoint];
        
        // Move to the current investigation point
        const distToPoint = Phaser.Math.Distance.Between(
            this.x, this.y,
            currentPoint.x, currentPoint.y
        );
        
        if (distToPoint < 16) {
            // Reached the point, wait a moment and look around
            if (!this.isWaiting) {
                this.isWaiting = true;
                this.waitTimer = 0;
                this.waitDuration = 1000;
                
                this.rotationStart = this.facingAngle;
                this.rotationTarget = this.facingAngle + Math.PI * 2;
                this.rotationProgress = 0;
                
                // Stop movement completely when we reach the point
                this.body.setVelocity(0, 0);
            } else if (this.waitTimer >= this.waitDuration) {
                // Move to the next investigation point
                this.playerMemory.currentInvestigationPoint++;
                
                // If we've checked all points, return to patrol
                if (this.playerMemory.currentInvestigationPoint >= this.playerMemory.investigationPoints.length) {
                    this.playerMemory.investigationPoints = [];
                    this.setAlertState(this.alertStates.RETURNING);
                }
                
                this.isWaiting = false;
            } else {
                // While waiting, update rotation to look around
                this.rotationProgress = this.waitTimer / this.waitDuration;
                this.facingAngle = this.rotationStart + (this.rotationProgress * Math.PI * 2);
                
                // Ensure we're not moving while looking around
                this.body.setVelocity(0, 0);
            }
        } else {
            // Not at the point yet - move directly towards the investigation point
            const direction = new Phaser.Math.Vector2(
                currentPoint.x - this.x,
                currentPoint.y - this.y
            );
            
            if (direction.length() > 0) {
                direction.normalize();
                
                // Use a direct velocity assignment with sufficient speed
                const searchSpeed = this.speed * 0.9; // Slightly faster to ensure movement
                this.body.velocity.x = direction.x * searchSpeed;
                this.body.velocity.y = direction.y * searchSpeed;
                
                // Update facing angle more aggressively for more responsive turning
                this.facingAngle = direction.angle();
            }
        }
    }
    
    // Just turn to face a position without moving
    lookTowardsPosition(position) {
        if (!position) return;
        
        const direction = new Phaser.Math.Vector2(
            position.x - this.x,
            position.y - this.y
        );
        
        if (direction.length() > 0) {
            const targetAngle = direction.angle();
            
            // Smoothly rotate to face target
            this.facingAngle = Phaser.Math.Angle.RotateTo(
                this.facingAngle,
                targetAngle,
                this.turnSpeed * 16
            );
        }
    }
    
    // Update the alert indicator above the AI
    updateAlertIndicator() {
        let indicatorText = '';
        let color = '#ffffff';
        
        // Only show indicator for non-patrol states or when alert level is significant
        if (this.alertState !== this.alertStates.PATROL && this.alertLevel > 10) {
            if (this.alertLevel > 75) {
                indicatorText = '!';
                color = '#ff0000';
            } else if (this.alertLevel > 40) {
                indicatorText = '?!';
                color = '#ff7700';
            } else if (this.alertLevel > 10) {
                indicatorText = '?';
                color = '#ffff00';
            }
        }
        
        // Only show indicator if there's text to display
        if (indicatorText) {
            this.alertIndicator.setText(indicatorText);
            this.alertIndicator.setVisible(true);
        } else {
            this.alertIndicator.setVisible(false);
        }
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
        this.moveToPosition(targetPos, this.speed * 1.2); // Move faster when chasing
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
    
    // New method for continuous patrol movement
    followPatrolPathContinuous(delta) {
        if (this.patrolPath.length <= 1) {
            this.alertState = this.alertStates.PATROL;
            this.wander(0, delta);
            return;
        }
        
        // Get current and next patrol points
        const currentIndex = this.currentPatrolPointIndex;
        const nextIndex = this.getNextPatrolPointIndex();
        
        const currentPoint = this.patrolPath[currentIndex];
        const nextPoint = this.patrolPath[nextIndex];
        
        // Calculate direction to move
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        
        // Update the AI's position along the path based on progress
        this.pathProgress += (this.patrolSpeed * delta) / (1000 * this.pathSegmentLength);
        
        // Check if we've reached the next point
        if (this.pathProgress >= 1) {
            // Move to next point
            this.currentPatrolPointIndex = nextIndex;
            this.pathProgress = 0;
            this.updatePathSegmentLength();
            
            // Check if we're at an endpoint of the path
            const isEndPoint = this.currentPatrolPointIndex === 0 || 
                              this.currentPatrolPointIndex === this.patrolPath.length - 1;
            
            // For paths with more than 2 points that are NOT rectangles/squares,
            // reverse direction at endpoints
            if (this.patrolPath.length > 2 && isEndPoint) {
                // Check if this is a rectangle/square path by checking if the first and
                // last points of the path are connected (making a loop)
                const firstPoint = this.patrolPath[0];
                const lastPoint = this.patrolPath[this.patrolPath.length - 1];
                const distance = Phaser.Math.Distance.Between(
                    firstPoint.x, firstPoint.y,
                    lastPoint.x, lastPoint.y
                );
                
                // If the first and last points are far apart, it's not a loop
                // so we should reverse direction
                if (distance > 32) { // More than 2 tiles apart
                    this.patrolDirection *= -1;
                } else if (this.currentPatrolPointIndex === this.patrolPath.length - 1) {
                    // We're at the end of a loop, so go back to index 0 instead of reversing
                    this.currentPatrolPointIndex = 0;
                    this.updatePathSegmentLength();
                }
            }
        }
        
        // Look ahead to the next point for smoother turns
        const lookAheadProgress = Math.min(this.pathProgress + this.lookAheadDistance / this.pathSegmentLength, 1);
        const targetX = currentPoint.x + dx * lookAheadProgress;
        const targetY = currentPoint.y + dy * lookAheadProgress;
        
        // Calculate direction to the interpolated position
        const direction = new Phaser.Math.Vector2(
            targetX - this.x, 
            targetY - this.y
        );
        
        // If we're close to the target, slow down slightly for smoother movement
        let speedMultiplier = 1;
        if (direction.length() < 10) {
            speedMultiplier = 0.5 + (direction.length() / 20); // 0.5 to 1.0 based on distance
        }
        
        if (direction.length() > 2) {
            direction.normalize();
            
            // Update facing angle smoothly
            const targetAngle = direction.angle();
            this.facingAngle = Phaser.Math.Angle.RotateTo(
                this.facingAngle,
                targetAngle,
                this.turnSpeed * delta / 16
            );
            
            // Set velocity directly toward the target with smooth acceleration
            const targetVelocity = new Phaser.Math.Vector2(
                direction.x * this.patrolSpeed * speedMultiplier,
                direction.y * this.patrolSpeed * speedMultiplier
            );
            
            // Smoothly interpolate current velocity toward target velocity
            this.currentVelocity.x = Phaser.Math.Linear(
                this.currentVelocity.x, 
                targetVelocity.x, 
                this.movementLerpFactor
            );
            
            this.currentVelocity.y = Phaser.Math.Linear(
                this.currentVelocity.y, 
                targetVelocity.y, 
                this.movementLerpFactor
            );
            
            // Apply velocity
            this.body.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
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
    
    updateAnimation(delta) {
        const velocity = this.body.velocity;
        
        // Update movement state flag
        this.isMoving = Math.abs(velocity.x) > 10 || Math.abs(velocity.y) > 10;
        
        // Update animations based on movement direction
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
        this.drawPatrolPath();
        
        // Draw vision cone with color based on alert state
        let visionColor = 0xffff00; // Default yellow
        
        // Change cone color based on alert state
        switch (this.alertState) {
            case this.alertStates.SUSPICIOUS:
                visionColor = 0xffaa00; // Orange for suspicious
                break;
            case this.alertStates.SEARCHING:
                visionColor = 0xff7700; // Darker orange for searching
                break;
            case this.alertStates.ALERT:
                visionColor = 0xff0000; // Red for alert
                break;
        }
        
        this.graphics.fillStyle(visionColor, 0.2);
        
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
        
        // Draw investigation points if searching
        if (this.alertState === this.alertStates.SEARCHING && 
            this.playerMemory.investigationPoints.length > 0) {
            
            this.graphics.lineStyle(1, 0xffaa00, 0.8);
            
            // Draw all investigation points
            for (let i = 0; i < this.playerMemory.investigationPoints.length; i++) {
                const point = this.playerMemory.investigationPoints[i];
                const isCurrent = i === this.playerMemory.currentInvestigationPoint;
                
                // Draw circle for each point, bigger circle for current target
                this.graphics.strokeCircle(point.x, point.y, isCurrent ? 12 : 6);
                
                // Draw line to the current investigation point
                if (isCurrent) {
                    this.graphics.beginPath();
                    this.graphics.moveTo(this.x, this.y);
                    this.graphics.lineTo(point.x, point.y);
                    this.graphics.strokePath();
                }
            }
        }
        
        // Draw last known player position if in alert/searching state
        if ((this.alertState === this.alertStates.SEARCHING || 
             this.alertState === this.alertStates.ALERT || 
             this.alertState === this.alertStates.SUSPICIOUS) && 
            this.playerMemory.lastKnownPosition) {
            
            const pos = this.playerMemory.lastKnownPosition;
            this.graphics.lineStyle(2, 0xff0000, 0.8);
            this.graphics.strokeCircle(pos.x, pos.y, 15);
            this.graphics.fillStyle(0xff0000, 0.5);
            this.graphics.fillCircle(pos.x, pos.y, 5);
        }
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
            
            // Get current and next points
            const currentPoint = this.patrolPath[this.currentPatrolPointIndex];
            const nextIndex = this.getNextPatrolPointIndex();
            const nextPoint = this.patrolPath[nextIndex];
            
            // Draw current path segment with a different color
            this.graphics.lineStyle(3, 0x00ffff, 0.7);
            this.graphics.beginPath();
            this.graphics.moveTo(currentPoint.x, currentPoint.y);
            this.graphics.lineTo(nextPoint.x, nextPoint.y);
            this.graphics.strokePath();
            
            // Draw interpolated target (where AI is heading)
            if (this.alertState === this.alertStates.PATROL) {
                const dx = nextPoint.x - currentPoint.x;
                const dy = nextPoint.y - currentPoint.y;
                const targetX = currentPoint.x + dx * this.pathProgress;
                const targetY = currentPoint.y + dy * this.pathProgress;
                
                this.graphics.fillStyle(0x00ffff, 0.7);
                this.graphics.fillCircle(targetX, targetY, 4);
            }
            
            // Add a highlight for the AI's current state
            let stateColor;
            switch (this.alertState) {
                case this.alertStates.PATROL:
                    stateColor = 0x00ff00; // Green for patrol
                    break;
                case this.alertStates.SUSPICIOUS:
                    stateColor = 0xffff00; // Yellow for suspicious
                    break;
                case this.alertStates.SEARCHING:
                    stateColor = 0xff7700; // Orange for searching
                    break;
                case this.alertStates.ALERT:
                    stateColor = 0xff0000; // Red for alert
                    break;
                case this.alertStates.RETURNING:
                    stateColor = 0x0000ff; // Blue for returning to patrol
                    break;
                default:
                    stateColor = 0xffffff; // White for unknown
                    break;
            }
            
            // Draw a state indicator above the AI
            this.graphics.fillStyle(stateColor, 0.8);
            this.graphics.fillCircle(this.x, this.y - 20, 4);
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
        if (this.alertIndicator) {
            this.alertIndicator.destroy();
        }
        if (this.footstepSound) {
            this.footstepSound.stop();
        }
        super.destroy(fromScene);
    }
}