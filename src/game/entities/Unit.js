import { CONSTANTS } from '../Constants.js';

export class Unit {
    constructor(game, x, y, team) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.team = team; // 'blue' (player/ally) or 'red' (enemy)
        this.angle = 0;
        this.speed = 0.1;
        this.health = 5;
        this.maxHealth = 5;
        this.markedForDeletion = false;

        this.weaponKey = 'PISTOL';
        this.shootCooldown = 0;

        // Physics
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.9;
    }

    update(deltaTime) {
        if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;

        // Apply velocity if any (inertia)
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vx *= this.friction;
        this.vy *= this.friction;
    }

    draw(ctx) {
        // Overlay health bar
        const hpPct = this.health / this.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 20, this.y - 30, 40, 5);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x - 20, this.y - 30, 40 * hpPct, 5);
    }

    fireWeapon() {
        if (this.shootCooldown > 0) return;

        const weapon = CONSTANTS.WEAPONS[this.weaponKey];
        if (!weapon) return;

        this.shootCooldown = weapon.rate;

        // Handle multishot (shotgun)
        const count = weapon.count || 1;

        for (let i = 0; i < count; i++) {
            // Calculate spread
            const spread = (Math.random() - 0.5) * (weapon.spread || 0);
            const finalAngle = this.angle + spread;

            // Access GameState to spawn projectile
            const state = this.game.stateManager.currentState;
            if (state && state.spawnProjectile) {
                state.spawnProjectile(
                    this.x, this.y,
                    finalAngle,
                    weapon.speed,
                    this.team,
                    weapon
                );
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.markedForDeletion = true;
            // Spawn death particles?
        }
    }
}
