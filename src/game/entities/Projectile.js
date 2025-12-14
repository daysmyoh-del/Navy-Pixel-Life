export class Projectile {
    constructor(game, x, y, angle, speed, team, weaponConfig) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.team = team;

        // Config defaults
        this.damage = weaponConfig?.damage || 1;
        this.radius = weaponConfig?.explosive ? 8 : 3;
        this.color = weaponConfig?.color || 'yellow';
        this.explosive = weaponConfig?.explosive || false;
        this.blastRadius = weaponConfig?.radius || 50;

        this.markedForDeletion = false;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Bounds check
        if (this.x < 0 || this.x > this.game.canvas.width ||
            this.y < 0 || this.y > this.game.canvas.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}
