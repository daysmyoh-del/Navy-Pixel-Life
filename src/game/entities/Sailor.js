import { CONSTANTS } from '../Constants.js';

export class Sailor {
    constructor(game, localX, localY, isPlayer = false) {
        this.game = game;
        this.localX = localX; // Relative to Ship Center (0,0)
        this.localY = localY;
        this.isPlayer = isPlayer;
        this.ship = null; // Assigned when added to ship

        this.speed = 0.15;
        this.angle = 0; // Local rotation

        // Progression
        this.xp = 0;
        this.rank = CONSTANTS.RANKS.RECRUIT;
        this.rankTitle = 'Recruit';

        // Combat
        this.health = 10;
        this.hp = 100;
        this.maxHealth = 10;
        this.weaponCooldown = 0;

        // AI State
        this.aiState = 'IDLE'; // IDLE, MOVE, WORK, SOCIAL
        this.aiTimer = 0;
        this.targetX = localX;
        this.targetY = localY;
        this.moving = false;

        // Visual
        this.color = isPlayer ? '#aaf' : '#eee';

        // Speech
        this.speechText = null;
        this.speechTimer = 0;
    }

    speak(text) {
        this.speechText = text;
        this.speechTimer = 2.0; // 2 seconds
        // Play sound if SoundManager available
        if (this.game.stateManager.currentState.soundManager) {
            this.game.stateManager.currentState.soundManager.playTalk();
        }
    }

    update(deltaTime) {
        if (this.isPlayer) {
            this.handleInput(deltaTime);
        } else {
            // AI Logic (Human-Like)
            this.updateAI(deltaTime);
        }

        // Physics / Movement
        if (this.moving) {
            const dx = this.targetX - this.localX;
            const dy = this.targetY - this.localY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) { // If distance is greater than a small threshold
                this.localX += (dx / dist) * this.speed * deltaTime;
                this.localY += (dy / dist) * this.speed * deltaTime;
                this.angle = Math.atan2(dy, dx);
            } else {
                this.moving = false;
                if (!this.isPlayer && this.aiState === 'MOVE') {
                    this.aiState = 'IDLE';
                    this.aiTimer = 1000 + Math.random() * 2000; // Wait a bit before next action
                }
            }
        }

        // Clamp to ship bounds? (Simple bounding circle for now or collision with map)
        // For prototype, just clamp approx
        if (this.localX < -250) this.localX = -250;
        if (this.localX > 250) this.localX = 250;
        if (this.localY < -500) this.localY = -500;
        if (this.localY > 500) this.localY = 500;

        if (this.speechTimer > 0) {
            this.speechTimer -= deltaTime * 0.001;
            if (this.speechTimer <= 0) this.speechText = null;
        }

        // Cooldowns
        if (this.weaponCooldown > 0) this.weaponCooldown -= deltaTime;
    }

    updateAI(deltaTime) {
        if (!this.ship) return;

        this.aiTimer -= deltaTime;
        if (this.aiTimer > 0) return;

        // Decide new state
        if (this.aiState === 'IDLE') {
            const roll = Math.random();
            if (roll < 0.6) {
                // Move somewhere
                this.aiState = 'MOVE';
                // Pick random spot on deck
                // Approx Ship Bounds (local)
                const nextX = (Math.random() - 0.5) * 300;
                const nextY = (Math.random() - 0.5) * 600;

                // Check Zone Access
                const zone = this.ship.getZoneAt(nextX, nextY, this.ship.currentDeckIndex); // AI on current deck assumed for now?
                // AI theoretically exists on a specific deck. 
                // We don't track AI deck index in Sailor yet, assumes all on Active Deck for viz.
                // Let's assume AI has rank 5 (Officer) so they can go anywhere, OR check.
                // Simple: AI ignores zones for now, OR we give them ranks.

                this.targetX = nextX;
                this.targetY = nextY;
                this.moving = true;
            } else if (roll < 0.8) {
                // Work / Social
                this.speak(Math.random() < 0.5 ? "Checking gauges..." : "Hull looks good.");
                this.aiTimer = 3000;
            }
        }
    }

    gainXp(amount) {
        if (!this.isPlayer) return;
        this.xp += amount;
        // Check Promotion
        const nextLevelXp = CONSTANTS.XP_LEVELS[this.rank + 1];
        if (nextLevelXp && this.xp >= nextLevelXp) {
            this.promote();
        }
    }

    promote() {
        this.rank = Math.min(this.rank + 1, CONSTANTS.RANKS.CAPTAIN);
        this.rankTitle = CONSTANTS.RANK_TITLES[this.rank];
        this.speak(`Promoted to ${this.rankTitle}!`);
        // Maybe visual flash?
    }

    handleInput(deltaTime) {
        const input = this.game.inputManager;
        let dx = 0;
        let dy = 0;

        if (input.isKeyDown('KeyW')) dy -= 1;
        if (input.isKeyDown('KeyS')) dy += 1;
        if (input.isKeyDown('KeyA')) dx -= 1;
        if (input.isKeyDown('KeyD')) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            const moveAmountX = (dx / len) * this.speed * deltaTime;
            const moveAmountY = (dy / len) * this.speed * deltaTime;

            const nextX = this.localX + moveAmountX;
            const nextY = this.localY + moveAmountY;

            // Access Control
            if (this.ship) {
                const zone = this.ship.getZoneAt(nextX, nextY, this.ship.currentDeckIndex);
                if (zone && this.rank < zone.requiredRank) {
                    // Blocked
                    this.speak(`Locked! ${zone.name} requires Rank ${zone.requiredRank}`);
                    this.moving = false; // Stop movement if blocked
                    return; // Prevent move
                }
            }

            this.targetX = nextX;
            this.targetY = nextY;
            this.moving = true;
            this.angle = Math.atan2(dy, dx);
        } else {
            this.moving = false;
            // Look at mouse if idle?
            // Need mouse local pos. Hard to get efficiently without passing it down.
            // Ignore for now.
        }

        // Active Job Marker (Visual)
        if (this.isPlayer && this.game.stateManager.currentState.jobSystem && this.game.stateManager.currentState.jobSystem.currentJob) {
            // Maybe a small arrow pointing to objective?
            // For now, handled in JobSystem.draw mostly.
        }

        // Combat: Click to shoot
        if (this.game.inputManager.isMouseDown() && this.weaponCooldown <= 0) {
            this.shootHandgun();
        }

        // Interact?
        if (input.isKeyDown('KeyE')) {
            // Check interaction with Ship stations based on local pos
            if (this.ship) {
                // Check stations
                const station = this.ship.stations.find(s => {
                    return Math.abs(s.x - this.localX) < 40 && Math.abs(s.y - this.localY) < 40;
                });

                if (station && !station.occupiedBy) {
                    // Access Control
                    if (station.type === 'HELM' && this.rank < CONSTANTS.RANKS.OFFICER) {
                        this.speak("Locked! Need Officer Rank.");
                        return;
                    }

                    // Ladder Check
                    if (station.type === 'LADDER_DOWN') {
                        this.ship.switchDeck(this, 1);
                        return;
                    }
                    if (station.type === 'LADDER_UP') {
                        this.ship.switchDeck(this, 0);
                        return;
                    }

                    // Job Check
                    if (this.game.stateManager.currentState.jobSystem) {
                        const jobDone = this.game.stateManager.currentState.jobSystem.checkInteraction(station.type, station);
                        if (jobDone) return; // Don't do other stuff if job just completed
                    }

                    // Simulate firing for XP (Prototype)
                    if (station.type === 'CANNON') {
                        this.gainXp(20);
                        this.speak("Fired Cannon! (+20 XP)");
                        if (this.game.stateManager.currentState.soundManager) {
                            this.game.stateManager.currentState.soundManager.playCannon();
                        }
                    }
                }
            }
        }
    }

    shootHandgun() {
        this.weaponCooldown = CONSTANTS.WEAPONS.HANDGUN.rate;
        // Spawn Bullet
        // We need to spawn relative to SHIP WORLD POS because basic Projectile logic is world-based.
        // OR we make 'LocalProjectile' on the ship?
        // Let's spawn WORLD projectiles for simplicity, but calculate world pos from local.

        if (this.ship) {
            // Transform local to world
            // Ship Rotation
            const sRot = this.ship.worldRotation;
            const cos = Math.cos(sRot);
            const sin = Math.sin(sRot);

            // Rotated local pos
            const rx = this.localX * cos - this.localY * sin;
            const ry = this.localX * sin + this.localY * cos;

            const worldX = this.ship.worldX + rx;
            const worldY = this.ship.worldY + ry;

            const shootAngle = this.angle + sRot; // Player angle + Ship angle

            const config = CONSTANTS.WEAPONS.HANDGUN;

            this.game.stateManager.currentState.spawnProjectile(
                worldX, worldY, shootAngle, config.speed, 'blue', config
            );

            // Sound
            if (this.game.stateManager.currentState.soundManager) {
                this.game.stateManager.currentState.soundManager.playTone(600, 'sawtooth', 0.1, 0.1);
            }
        }
    }

    draw(ctx) {
        // Drawn in Ship's coordinate space
        ctx.save();
        ctx.translate(this.localX, this.localY);
        ctx.rotate(this.angle); // Local rotation (facing direction relative to deck)

        // Simple Sailor Circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // Arms/Hands (to show direction)
        ctx.fillStyle = '#fdb'; // Skin
        ctx.beginPath();
        ctx.arc(10, 5, 5, 0, Math.PI * 2); // R Hand
        ctx.arc(10, -5, 5, 0, Math.PI * 2); // L Hand
        ctx.fill();

        // Hat
        ctx.fillStyle = 'white';
        ctx.fillRect(-5, -10, 10, 20);

        // Speech Bubble
        if (this.speechText) {
            ctx.save();
            ctx.rotate(-this.angle); // Undo rotation so text is upright
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            ctx.rect(10, -30, 80, 20);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(this.speechText, 15, -16);
            ctx.restore();
        }

        ctx.restore();
    }
}
