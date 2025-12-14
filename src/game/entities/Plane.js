import { Unit } from './Unit.js';

export class Plane extends Unit {
    constructor(game, x, y, team) {
        super(game, x, y, team);
        this.baseSpeed = 3.0;
        this.boostSpeed = 5.0;
        this.turnSpeed = 3.0;
        this.weaponKey = 'MG_AIR';
        this.health = 10; // Fragile
        this.maxHealth = 10;
        this.altitude = 50; // Visual logic for shadow offset
        this.isPlayerControlled = false;

        this.currentSpeed = this.baseSpeed;
    }

    update(deltaTime) {
        // Always move forward
        this.vx = Math.cos(this.angle) * this.currentSpeed;
        this.vy = Math.sin(this.angle) * this.currentSpeed;

        this.x += this.vx; // Speed is high, direct add (or use deltaTime if normalized)
        this.y += this.vy;

        if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;

        // Bounds wrapping for planes? or bounce?
        // Let's bounce to stay in fight
        if (this.x < 0 || this.x > this.game.canvas.width) {
            this.angle = Math.PI - this.angle;
            this.x = Math.max(0, Math.min(this.x, this.game.canvas.width));
        }
        if (this.y < 0 || this.y > this.game.canvas.height) {
            this.angle = -this.angle;
            this.y = Math.max(0, Math.min(this.y, this.game.canvas.height));
        }

        if (this.isPlayerControlled) {
            const input = this.game.inputManager;
            if (input.isKeyDown('KeyA')) this.steer(-1, deltaTime);
            if (input.isKeyDown('KeyD')) this.steer(1, deltaTime);
            if (input.isKeyDown('KeyW')) this.setBoost(true);
            else this.setBoost(false);
            if (input.isMouseDown(0)) this.fireWeapon();
        }
    }

    steer(dir, deltaTime) {
        this.angle += dir * this.turnSpeed * (deltaTime / 1000);
    }

    setBoost(active) {
        this.currentSpeed = active ? this.boostSpeed : this.baseSpeed;
    }

    draw(ctx) {
        // Draw Shadow first (offset)
        ctx.save();
        ctx.translate(this.x + 20, this.y + 20); // Shadow offset
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.drawShape(ctx);
        ctx.restore();

        // Draw Plane
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.fillStyle = this.team === 'blue' ? '#ccc' : '#533';
        this.drawShape(ctx);
        ctx.restore();

        super.draw(ctx);
    }

    drawShape(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, -20); // Nose
        ctx.lineTo(5, -5);
        ctx.lineTo(25, 5); // Wing R
        ctx.lineTo(25, 15);
        ctx.lineTo(5, 10);
        ctx.lineTo(2, 25); // Tail
        ctx.lineTo(-2, 25);
        ctx.lineTo(-5, 10);
        ctx.lineTo(-25, 15); // Wing L
        ctx.lineTo(-25, 5);
        ctx.lineTo(-5, -5);
        ctx.closePath();
        ctx.fill();
    }
}
