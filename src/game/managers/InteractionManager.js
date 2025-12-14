export class InteractionManager {
    constructor(game) {
        this.game = game;
        this.zones = [];
        this.currentZone = null;
    }

    addZone(name, x, y, width, height, onInteract, message) {
        this.zones.push({ name, x, y, width, height, onInteract, message });
    }

    update(player) {
        this.currentZone = null;
        for (const zone of this.zones) {
            // Simple AABB collision
            if (player.x > zone.x && player.x < zone.x + zone.width &&
                player.y > zone.y && player.y < zone.y + zone.height) {
                this.currentZone = zone;
                break;
            }
        }
    }

    handleInput(input) {
        if (this.currentZone && input.isKeyDown('KeyE')) { // 'E' to interact
            this.currentZone.onInteract();
        }
    }

    draw(ctx) {
        // Draw zones (debug or floor highlights)
        // Draw interaction prompt
        if (this.currentZone) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            ctx.fillRect(this.currentZone.x, this.currentZone.y, this.currentZone.width, this.currentZone.height);

            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`[E] ${this.currentZone.message}`, this.currentZone.x + this.currentZone.width / 2, this.currentZone.y - 10);
            ctx.restore();
        }
    }
}
