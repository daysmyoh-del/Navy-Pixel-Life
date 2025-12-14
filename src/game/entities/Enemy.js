export class Enemy {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // 'soldier', 'tank', 'boat', 'plane'
        this.radius = 20;
        this.markedForDeletion = false;
        this.speed = 0.1;
        this.health = 3;
        this.angle = 0;

        // Determine asset based on type or use generic for now
        this.image = this.game.assetManager.getImage('SOLDIER');
        // Logic to pick correct image if we had enemy versions
    }

    update(deltaTime, player) {
        if (!player) return;

        // Simple chase logic
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.angle = Math.atan2(dy, dx);

        const dist = Math.hypot(dx, dy);

        if (dist > 50) { // Don't get too close
            this.x += Math.cos(this.angle) * this.speed * deltaTime;
            this.y += Math.sin(this.angle) * this.speed * deltaTime;
        }
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

        if (this.image) {
            // Draw red tint for enemy?
            ctx.drawImage(this.image, -this.image.width / 4, -this.image.height / 4, this.image.width / 2, this.image.height / 2);
        } else {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            // Add explosion effect here?
        }
    }
}
