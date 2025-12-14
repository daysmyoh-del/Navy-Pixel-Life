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
        this.maxHealth = 10;
        this.weaponCooldown = 0;

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
            // AI Logic (Wander or Station)
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
            this.localX += (dx / len) * this.speed * deltaTime;
            this.localY += (dy / len) * this.speed * deltaTime;

            // Set rotation
            this.angle = Math.atan2(dy, dx);
        } else {
            // Look at mouse if idle?
            // Need mouse local pos. Hard to get efficiently without passing it down.
            // Ignore for now.
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

                    alert('Interact: ' + station.type);
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
