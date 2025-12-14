import { Unit } from './Unit.js';
import { CONSTANTS } from '../Constants.js';

export class Player extends Unit {
    constructor(game, x, y, image) {
        super(game, x, y, 'blue');
        this.image = image;
        this.speed = 0.2;
        this.maxHealth = 20;
        this.health = 20;
        this.weaponKey = 'RIFLE'; // Default start
    }

    update(deltaTime) {
        super.update(deltaTime);
        const input = this.game.inputManager;

        // Movement Physics based on branch?
        // For simplicity, direct control for now, but use friction from Unit if we wanted sliding

        let dx = 0;
        let dy = 0;

        if (input.isKeyDown('KeyW')) dy -= 1;
        if (input.isKeyDown('KeyS')) dy += 1;
        if (input.isKeyDown('KeyA')) dx -= 1;
        if (input.isKeyDown('KeyD')) dx += 1;

        // Normalize
        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;

            this.x += dx * this.speed * deltaTime;
            this.y += dy * this.speed * deltaTime;
        }

        // Check bounds
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > this.game.canvas.width) this.x = this.game.canvas.width;
        if (this.y > this.game.canvas.height) this.y = this.game.canvas.height;

        // Aim at mouse
        const paramsDX = input.mouse.x - this.x;
        const paramsDY = input.mouse.y - this.y;
        this.angle = Math.atan2(paramsDY, paramsDX);

        // Shooting
        if (input.isMouseDown(0)) {
            this.fireWeapon();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.image) {
            // Asset Clipping
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(this.image, -25, -25, 50, 50); // Resize slightly to fit circle
        } else {
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Draw HUD-like health bar above head?
        super.draw(ctx);
    }
}
