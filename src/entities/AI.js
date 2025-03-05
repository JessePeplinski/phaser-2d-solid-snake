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

        this.alertSound = scene.sound.add('alert', {
            volume: 0.5,
            loop: false
        });
                
        this.alarmSound = scene.sound.add('alarm', {
            volume: 0.3,
            loop: true
        });
        this.alertSoundsPlayed = false;
        
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
        
        // Patrol variables - we no longer auto-find patrol paths in constructor
        this.patrolPath = [];
        this.currentPatrolPointIndex = 0;
        this.patrolDirection = 1; // 1 for forward, -1 for backward
        this.patrolSpeed = 60; // Reduced patrol speed for more natural patrolling
        this.hasAssignedPath = false; // Track if a path has been assigned
        
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

        // Alert coordination
        this.requestingBackup = false;
        this.respondingToBackup = false;
        this.backupRequestTime = 0;
        this.backupResponseTime = 0;
        
        // Text display for dialogue
        this.dialogueText = scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            backgroundColor: '#00000080',
            padding: {
                left: 6,
                right: 6,
                top: 3,
                bottom: 3
            }
        });
        this.dialogueText.setOrigin(0.5, 1);
        this.dialogueText.setVisible(false);
        
        // Dialogue timing
        this.dialogueDisplayTime = 0;
        this.dialogueDisplayDuration = 3000; // 3 seconds

        this.previousAlertState = null; // Track previous alert state
        this.justReturnedToPatrol = false; // Flag to track patrol return for dialogue
        this.showedReturningDialogue = false; // Track if we already showed returning dialogue
        
        // Dialogue phrases
        this.backupRequestPhrases = [
            "I need assistance—now!",
            "They're pushing hard; send reinforcements!",
            "I can't hold them off on my own!",
            "Back me up before it's too late!",
            "They've breached my position—requesting support!",
            "Multiple hostiles detected! I need backup!",
            "Cover me! I'm taking heavy fire!",
            "I'm pinned down! Get over here!",
            "We have a situation. All units converge!",
            "Reinforcements needed—over!"
        ];
        
        this.backupResponsePhrases = [
            "We're on our way—sit tight!",
            "Reinforcements inbound; hold your position!",
            "Copy that; moving to support!",
            "Don't worry, we've got your six!",
            "Moving in! Keep them busy until we arrive!",
            "Hang in there—backup is here!",
            "We've got eyes on the target; going in!",
            "We're with you. Let's turn the tide!",
            "Stay alert, we're taking over from here!",
            "Time to wrap this up!"
        ];

        this.returningPhrases = [
            "Guess it was nothing...",
            "Must have been the wind.",
            "Just my imagination.",
            "False alarm.",
            "All clear here.",
            "Probably just a rat.",
            "Sensors must be malfunctioning.",
            "Nothing to report.",
            "Area secure.",
            "Hmm... thought I saw something.",
            "Back to regular patrol.",
            "No sign of intruders.",
            "System glitch maybe?",
            "Perimeter still secure.",
            "Just shadows playing tricks.",
            "Need to get my vision checked.",
            "Getting jumpy these days.",
            "This place gets to you after a while.",
            "Resume standard patrol pattern.",
            "Security level nominal again."
        ];
    }

    // Add a new method to display dialogue
    displayDialogue(text) {
        this.dialogueText.setText(text);
        this.dialogueText.setVisible(true);
        this.dialogueDisplayTime = this.scene.time.now;
    }

    // Add a new method to request backup
    requestBackup(playerPosition) {
        if (!this.requestingBackup) {
            this.requestingBackup = true;
            this.backupRequestTime = this.scene.time.now;
            
            // Display random backup request phrase
            const phrase = Phaser.Utils.Array.GetRandom(this.backupRequestPhrases);
            this.displayDialogue(phrase);
            
            // Create a fresh copy of the position
            const positionCopy = new Phaser.Math.Vector2(playerPosition.x, playerPosition.y);
            
            // Broadcast to other enemies with a slight delay to prevent overlapping paths
            let broadcastDelay = 0;
            
            this.scene.enemies.forEach(enemy => {
                if (enemy !== this && !enemy.respondingToBackup && 
                    enemy.alertState !== this.alertStates.ALERT) {
                    
                    // Add a small staggered delay between each enemy response
                    broadcastDelay += 200;
                    
                    this.scene.time.delayedCall(broadcastDelay, () => {
                        // Only respond if still not in alert or already responding
                        if (!enemy.respondingToBackup && enemy.alertState !== enemy.alertStates.ALERT) {
                            enemy.respondToBackup(positionCopy);
                        }
                    });
                }
            });
            
            console.log(`Requested backup at position (${playerPosition.x}, ${playerPosition.y})`);
        }
    }

    // Add a new method to respond to backup requests
    respondToBackup(playerPosition) {
        if (!this.respondingToBackup && this.alertState !== this.alertStates.ALERT) {
            this.respondingToBackup = true;
            this.backupResponseTime = this.scene.time.now;
            
            // Create a copy of the position to avoid reference issues
            this.playerMemory.lastKnownPosition = new Phaser.Math.Vector2(playerPosition.x, playerPosition.y);
            this.playerMemory.lastSeenTime = this.scene.time.now; // Update the last seen time to make it fresh
            
            // Set alert level high enough to ensure aggressive searching
            this.alertLevel = 70; // Higher alert level to ensure aggressive behavior
            
            // Force state change and clear any waiting flags
            this.isWaiting = false;
            this.waitTimer = 0;
            this.setAlertState(this.alertStates.SEARCHING);
            
            // Clear existing investigation points to ensure new ones are generated
            this.playerMemory.investigationPoints = [];
            
            // Generate search points around reported position
            this.generateSearchPoints(this.playerMemory.lastKnownPosition);
            
            // Increase speed to get to the location faster
            this.speed = this.speed * 1.2; // Temporarily increase speed
            
            // Display random backup response phrase
            const phrase = Phaser.Utils.Array.GetRandom(this.backupResponsePhrases);
            this.displayDialogue(phrase);
            
            // Log for debugging
            console.log(`AI responding to backup at position (${playerPosition.x}, ${playerPosition.y})`);
        }
    }

    
    // New method to assign a specific patrol path to this AI
    assignPatrolPath(pathPoints) {
        if (!pathPoints || pathPoints.length === 0) {
            console.log('Attempted to assign empty patrol path to AI');
            return;
        }
        
        this.patrolPath = pathPoints;
        this.hasAssignedPath = true;
        
        // Find nearest patrol point to start from
        this.currentPatrolPointIndex = this.findClosestPathPointIndex();
        
        // Calculate initial path segment length
        this.updatePathSegmentLength();
        
        console.log(`AI assigned patrol path with ${this.patrolPath.length} points`);
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
                this.patrolDirection = -1;
            }
        } else if (nextIndex < 0) {
            // For closed loop paths, loop to the end
            if (isClosedLoop) {
                nextIndex = this.patrolPath.length - 1;
            } else {
                // For open paths, we'll reverse direction at the start
                nextIndex = 1;
                if (nextIndex >= this.patrolPath.length) nextIndex = this.patrolPath.length - 1; // Safety check
                this.patrolDirection = 1;
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

        // Update dialogue text position
        this.dialogueText.setPosition(this.x, this.y - 45);
        
        // Hide dialogue after duration expires
        if (this.dialogueText.visible && 
            time - this.dialogueDisplayTime > this.dialogueDisplayDuration) {
            this.dialogueText.setVisible(false);
        }
        
        // Reset backup request after some time if no longer in high alert
        if (this.requestingBackup && 
            this.alertState !== this.alertStates.ALERT && 
            time - this.backupRequestTime > 10000) {
            this.requestingBackup = false;
        }
        
        // Reset backup response after some time
        if (this.respondingToBackup && 
            time - this.backupResponseTime > 15000) {
            this.respondingToBackup = false;
        }
        
        // Position alert indicator above AI
        this.alertIndicator.setPosition(this.x, this.y - 30);
        
        // Process alert state system
        this.updateAlertState(time, delta, player);
        
        // Make sure to update the alert indicator every frame
        this.updateAlertIndicator();
        
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

        if (this.respondingToBackup && this.playerMemory.lastKnownPosition && 
            this.alertState !== this.alertStates.ALERT) {
            
            // If we're responding to backup, prioritize investigation regardless of current state
            this.searchArea();
        } else {
            switch (this.alertState) {
                case this.alertStates.PATROL:
                    if (this.hasAssignedPath && this.patrolPath.length > 0) {
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
                    if (this.hasAssignedPath && this.patrolPath.length > 0) {
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
                // Generate fresh search points around last known position
                if (this.playerMemory.lastKnownPosition) {
                    this.generateSearchPoints(this.playerMemory.lastKnownPosition);
                }
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
        this.previousAlertState = oldState; // Track previous state
        this.alertState = newState;
        this.timeInState = 0;
        
        console.log(`AI state change: ${oldState} -> ${newState}`);
        
        // Request backup when entering alert state for the first time
        if (newState === this.alertStates.ALERT && 
            oldState !== this.alertStates.ALERT && 
            !this.requestingBackup && 
            this.playerMemory.lastKnownPosition) {
            
            // Request backup immediately for faster response
            this.requestBackup(this.playerMemory.lastKnownPosition);
        }
        
        // Handle alert sounds
        if (newState === this.alertStates.ALERT && !this.alertSoundsPlayed) {
            // Play alert sound effect when entering alert state
            if (!this.scene.sound.mute) {
                this.alertSound.play();
                this.scene.time.delayedCall(500, () => {
                    if (this.alertState === this.alertStates.ALERT && !this.scene.sound.mute) {
                        this.alarmSound.play();
                    }
                });
            }
            this.alertSoundsPlayed = true;
        } else if (newState === this.alertStates.PATROL) {
            // Stop alert sounds when returning to patrol
            this.alarmSound.stop();
            this.alertSoundsPlayed = false;
            
            // Reset backup flags and speed when returning to patrol
            this.requestingBackup = false;
            this.respondingToBackup = false;
            this.speed = 70; // Reset to default speed
        }
        
        // Reset the returning dialogue flag when entering any alert state
        if (newState !== this.alertStates.RETURNING && 
            newState !== this.alertStates.PATROL) {
            this.showedReturningDialogue = false;
        }
    
        // Handle state entry actions
        switch (newState) {
            case this.alertStates.PATROL:
                // Clear all investigation points and alert indicators when returning to patrol
                this.playerMemory.investigationPoints = [];
                this.alertLevel = 0; // Reset alert level
                // Force alert indicator to be hidden
                this.alertIndicator.setVisible(false);
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
                // Stop the alarm sound when returning to patrol
                this.alarmSound.stop();
                // Clear investigation points
                this.playerMemory.investigationPoints = [];
                
                // Show "Guess it was nothing" as soon as we start returning
                // But only if we're coming from a high alert state
                if ((oldState === this.alertStates.ALERT || 
                    oldState === this.alertStates.SEARCHING || 
                    oldState === this.alertStates.SUSPICIOUS) && 
                   !this.showedReturningDialogue) {
                   
                   // Choose a random phrase from our collection
                   const randomPhrase = Phaser.Utils.Array.GetRandom(this.returningPhrases);
                   
                   // Show returning dialogue
                   this.displayDialogue(randomPhrase);
                   console.log(`Displaying returning dialogue: "${randomPhrase}"`);
                   this.showedReturningDialogue = true;
               }
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
    generateSearchPoints(position) {
        if (!position) return;
        
        // Clear existing points
        this.playerMemory.investigationPoints = [];
        this.playerMemory.currentInvestigationPoint = 0;
        
        // Start with the original position as the first search point
        this.playerMemory.investigationPoints.push(
            new Phaser.Math.Vector2(position.x, position.y)
        );
        
        // Define search parameters
        const searchRadius = this.respondingToBackup ? 96 : 64;
        const numPoints = this.respondingToBackup ? 6 : 4;
        
        // Generate points in a circle around the last known position
        for (let i = 0; i < numPoints; i++) {
            // Calculate angle for this point (evenly distributed)
            const angle = (i / numPoints) * Math.PI * 2;
            
            // Calculate position with some randomness in distance
            const distance = Phaser.Math.Between(searchRadius * 0.5, searchRadius);
            let x = position.x + Math.cos(angle) * distance;
            let y = position.y + Math.sin(angle) * distance;
            
            // Ensure the point is within the map
            x = Phaser.Math.Clamp(x, 16, this.scene.map.widthInPixels - 16);
            y = Phaser.Math.Clamp(y, 16, this.scene.map.heightInPixels - 16);
            
            // Check if the point is in a walkable area (not in a wall)
            const tile = this.scene.layer.getTileAtWorldXY(x, y);
            if (!tile || !tile.collides) {
                this.playerMemory.investigationPoints.push(
                    new Phaser.Math.Vector2(x, y)
                );
            }
        }
        
        // If we didn't generate any points, add some fallback points
        if (this.playerMemory.investigationPoints.length <= 1) {
            // Try cardinal directions at smaller distances
            const fallbackDistances = [32, 48];
            const fallbackAngles = [0, Math.PI/2, Math.PI, Math.PI*3/2];
            
            for (const distance of fallbackDistances) {
                for (const angle of fallbackAngles) {
                    const x = Phaser.Math.Clamp(
                        position.x + Math.cos(angle) * distance,
                        16, this.scene.map.widthInPixels - 16
                    );
                    const y = Phaser.Math.Clamp(
                        position.y + Math.sin(angle) * distance,
                        16, this.scene.map.heightInPixels - 16
                    );
                    
                    const tile = this.scene.layer.getTileAtWorldXY(x, y);
                    if (!tile || !tile.collides) {
                        this.playerMemory.investigationPoints.push(
                            new Phaser.Math.Vector2(x, y)
                        );
                    }
                }
            }
        }
        
        console.log(`Generated ${this.playerMemory.investigationPoints.length} search points`);
    }
    
    // Search the area around the last known player position
    searchArea() {
        // Exit if no points to investigate
        if (this.playerMemory.investigationPoints.length === 0) {
            // Transition out of searching state if no points
            this.setAlertState(this.alertStates.RETURNING);
            return;
        }
        
        // Get the current investigation point
        const currentPoint = this.playerMemory.investigationPoints[this.playerMemory.currentInvestigationPoint];
        
        // Calculate distance to the current point
        const distToPoint = Phaser.Math.Distance.Between(
            this.x, this.y,
            currentPoint.x, currentPoint.y
        );
        
        // Debug visualization - show current target point
        if (this.scene.showDebug) {
            this.graphics.lineStyle(3, 0xff00ff, 1);
            this.graphics.strokeCircle(currentPoint.x, currentPoint.y, 16);
            this.graphics.lineStyle(2, 0xff00ff, 0.8);
            this.graphics.beginPath();
            this.graphics.moveTo(this.x, this.y);
            this.graphics.lineTo(currentPoint.x, currentPoint.y);
            this.graphics.strokePath();
        }
        
        // Behavior when we've reached a point
        if (distToPoint < 16) {
            // Two states: initial arrival (start waiting) or finished waiting (move to next point)
            if (!this.isWaiting) {
                // Just arrived - start waiting
                this.isWaiting = true;
                this.waitTimer = 0;
                this.waitDuration = this.respondingToBackup ? 400 : 800;
                
                // Stop movement
                this.body.setVelocity(0, 0);
                
                // Set up rotation to look around
                this.rotationStart = this.facingAngle;
            } else {
                // Already waiting - update rotation during wait
                this.waitTimer += this.scene.game.loop.delta;
                
                // Look around while waiting
                const rotationSpeed = this.respondingToBackup ? 3 : 1.5;
                this.facingAngle = this.rotationStart + (this.waitTimer / this.waitDuration) * Math.PI * rotationSpeed;
                
                // Stop movement while looking
                this.body.setVelocity(0, 0);
                
                // Move to next point when wait time is up
                if (this.waitTimer >= this.waitDuration) {
                    // Finished with this point - move to next
                    this.playerMemory.currentInvestigationPoint++;
                    this.isWaiting = false;
                    
                    // If we've checked all points
                    if (this.playerMemory.currentInvestigationPoint >= this.playerMemory.investigationPoints.length) {
                        if (this.respondingToBackup) {
                            // Generate new search points in a different area
                            const originalPos = this.playerMemory.lastKnownPosition;
                            if (originalPos) {
                                const searchOffset = Phaser.Math.Between(60, 180);
                                const searchAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                                
                                const newSearchCenter = new Phaser.Math.Vector2(
                                    originalPos.x + Math.cos(searchAngle) * searchOffset,
                                    originalPos.y + Math.sin(searchAngle) * searchOffset
                                );
                                
                                this.generateSearchPoints(newSearchCenter);
                            } else {
                                // No position to expand search from
                                this.playerMemory.investigationPoints = [];
                                this.setAlertState(this.alertStates.RETURNING);
                            }
                        } else {
                            // Regular search complete - return to patrol
                            this.playerMemory.investigationPoints = [];
                            this.setAlertState(this.alertStates.RETURNING);
                        }
                    }
                }
            }
        } else {
            // Not at the point yet - move towards it
            this.isWaiting = false; // Reset waiting state if we somehow moved away
            
            // Calculate direction to target
            const directionX = currentPoint.x - this.x;
            const directionY = currentPoint.y - this.y;
            const length = Math.sqrt(directionX * directionX + directionY * directionY);
            
            if (length > 0) {
                // Normalize direction
                const normalizedX = directionX / length;
                const normalizedY = directionY / length;
                
                // Set movement speed based on state
                const searchSpeed = this.respondingToBackup ? this.speed * 1.1 : this.speed * 0.9;
                
                // Apply velocity directly
                this.body.setVelocity(
                    normalizedX * searchSpeed,
                    normalizedY * searchSpeed
                );
                
                // Update facing angle to match movement direction
                this.facingAngle = Math.atan2(normalizedY, normalizedX);
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
        
        // Only show indicator for non-patrol and non-returning states or when alert level is significant
        if ((this.alertState !== this.alertStates.PATROL && 
             this.alertState !== this.alertStates.RETURNING) && 
            this.alertLevel > 10) {
            
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
        
        // Handle indicator visibility
        if (indicatorText && indicatorText.length > 0) {
            this.alertIndicator.setText(indicatorText);
            this.alertIndicator.setStyle({ color: color });
            this.alertIndicator.setVisible(true);
        } else {
            // Force indicator to be hidden when no text
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
        if (!this.hasAssignedPath || this.patrolPath.length <= 1) {
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
            if (this.patrolPath.length > 2 && isEndPoint && !this.isClosedLoopPath()) {
                this.patrolDirection *= -1;
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
        
        // Only draw patrol path if in debug mode
        if (this.scene.showDebug) {
            this.drawPatrolPath();
        }
        
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
        
        // Only show debug visualizations if in debug mode
        if (this.scene.showDebug) {
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
    }
        
    // Separate method to draw patrol path for clarity
    drawPatrolPath() {
        // Only draw if there's a path to draw
        if (!this.hasAssignedPath || this.patrolPath.length <= 0) return;
        
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
            
            // Connect back to the start for closed loops
            if (this.isClosedLoopPath()) {
                this.graphics.lineTo(this.patrolPath[0].x, this.patrolPath[0].y);
            }
            
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
        if (this.dialogueText) {
            this.dialogueText.destroy();
        }
        if (this.footstepSound) {
            this.footstepSound.stop();
        }
        if (this.alertSound) {
            this.alertSound.stop();
        }
        if (this.alarmSound) {
            this.alarmSound.stop();
        }
        super.destroy(fromScene);
    }
}