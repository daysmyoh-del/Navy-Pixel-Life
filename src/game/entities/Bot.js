import { Unit } from './Unit.js';
import { CONSTANTS } from '../Constants.js';

export class Bot extends Unit {
    constructor(game, x, y, team, type) {
        super(game, x, y, team); // 'red' or 'blue'
        this.type = type;
        this.speed = 0.08;
        this.target = null;
        this.squad = null; // Assigned by SquadManager
        this.reactionTimer = 0;
        this.suppressionTimer = 0;

        // Setup visuals based on type
        // Use AssetManager in Draw to pick correct sprite
        this.image = this.game.assetManager.getImage('SOLDIER');

        // Default enemy weapon
        this.weaponKey = 'SMG';
        this.maxHealth = 5;
        this.health = 5;
    }

    update(deltaTime, player, allEntities) {
        super.update(deltaTime);

        this.reactionTimer -= deltaTime;
        if (this.reactionTimer <= 0) {
            // Retarget
            this.pickTarget(player, allEntities);
            this.reactionTimer = 500 + Math.random() * 500;
        }

        if (this.target && !this.target.markedForDeletion) {
            // Move towards target
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.hypot(dx, dy);

            this.angle = Math.atan2(dy, dx);

            // Move if too far, stop if in range
            const weaponRange = CONSTANTS.WEAPONS[this.weaponKey].range * 0.8;

            if (dist > weaponRange) {
                this.x += Math.cos(this.angle) * this.speed * deltaTime;
                this.y += Math.sin(this.angle) * this.speed * deltaTime;
            } else {
                // Shoot if waiting line of sight
                this.fireWeapon();
            }
        } else if (this.squad && this.squad.target) {
            // Suppression / Squad Assist
            const target = this.squad.target;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            this.angle = Math.atan2(dy, dx);

            // Move closer slowly
            this.x += Math.cos(this.angle) * (this.speed * 0.5) * deltaTime;
            this.y += Math.sin(this.angle) * (this.speed * 0.5) * deltaTime;

            // Fire randomly?
            if (Math.random() < 0.01) this.fireWeapon();
        }
    }

    pickTarget(player, allEntities) {
        // Find nearest unit of OPPOSITE team
        let nearest = null;
        let minDist = Infinity;

        // If I am enemy (red), attack player or blue bots
        // If I am ally (blue), attack red bots

        const enemyTeam = this.team === 'red' ? 'blue' : 'red';

        // Check Player first if I am red
        if (this.team === 'red' && player && !player.markedForDeletion) {
            const d = Math.hypot(player.x - this.x, player.y - this.y);
            if (d < minDist) {
                minDist = d;
                nearest = player;
            }
        }

        // Check other entities
        for (const e of allEntities) {
            if (e instanceof Bot && e.team === enemyTeam && !e.markedForDeletion) {
                const d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < minDist) {
                    minDist = d;
                    nearest = e;
                }
            }
        }

        this.target = nearest;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw body
        if (this.image) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(this.image, -20, -20, 40, 40);
            ctx.restore();
        }

        // Draw Team Indicator
        ctx.beginPath();
        ctx.fillStyle = this.team === 'blue' ? 'cyan' : 'red';
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        super.draw(ctx);
    }
}
