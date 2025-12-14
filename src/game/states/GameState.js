import { Ship } from '../entities/Ship.js';
import { Sailor } from '../entities/Sailor.js';
import { Camera } from '../managers/Camera.js';
import { SoundManager } from '../managers/SoundManager.js';
import { JobSystem } from '../managers/JobSystem.js';

export class GameState {
    constructor(game) {
        this.game = game;
        this.camera = new Camera(game.canvas.width, game.canvas.height);
        this.soundManager = new SoundManager();
        this.jobSystem = new JobSystem(game);

        this.ship = null;
        this.player = null;
        this.oceanOffset = { x: 0, y: 0 };
    }

    enter(params) {
        // Initialize Navy Sim
        this.ship = new Ship(this.game, 0, 0);

        // Create Player Sailor
        this.player = new Sailor(this.game, 0, 0, true); // Center of ship
        this.ship.addCrew(this.player);

        // Add AI Crew
        for (let i = 0; i < 5; i++) {
            const crew = new Sailor(this.game, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200, false);
            this.ship.addCrew(crew);
        }

        // Camera tracks the SHIP, not the sailor directly (or track sailor world pos?)
        // If we track the ship, the ship stays center and world moves.
        // If we track the sailor, the camera zooms into the deck.
        // Let's track the Ship primarily for "sailing" feel.
        this.camera.follow({ x: 0, y: 0 }); // Placeholder, we update manually
    }

    exit() {
        this.ship = null;
    }

    update(deltaTime) {
        // Ship Logic (Auto-sail if not player controlled)
        // For now, let's make the ship move slowly forward always
        this.ship.speed = 1.0;

        this.ship.update(deltaTime);

        // Update Camera to follow Ship Position
        this.camera.x = this.ship.worldX;
        this.camera.y = this.ship.worldY;

        // Logic for auto-zoom?
        // If in combat (or general quarters), zoom in. Else zoom out.
        // Simple toggle for now: Distance based or just default out
        this.camera.setZoom(0.6); // Wide view of ship

        this.jobSystem.update(deltaTime);
    }

    draw(ctx) {
        ctx.save();

        // Apply Zoom (Scale from center of screen)
        ctx.translate(this.game.canvas.width / 2, this.game.canvas.height / 2);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.game.canvas.width / 2, -this.game.canvas.height / 2);

        // Translate Camera
        // Since we are zooming, the translation needs to account for the scale, 
        // OR we just translate normally and the scale handles the "view" size?
        // Typically: Scale, THEN Translate relative to world
        // But Camera.x IS center logic now? 

        // Let's use standard: Translate World to 0,0 relative to Camera Top-Left
        // Camera (0,0) is top left of view.

        // Adjust for "Center Follow":
        const camX = this.camera.x - (this.game.canvas.width / 2) / this.camera.zoom;
        const camY = this.camera.y - (this.game.canvas.height / 2) / this.camera.zoom;

        ctx.translate(-camX, -camY);

        // 1. Ocean Background
        ctx.fillStyle = '#247';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        // Parallax waves?
        this.drawWaves(ctx);

        // Placeholder for projectiles and particles (not defined in original code, but in instruction)
        // Assuming these would be defined elsewhere or are future additions.
        // For now, they will cause errors if not defined.
        // this.projectiles.forEach(p => p.draw(ctx));
        // this.particles.forEach(p => p.draw(ctx));

        // 2. Draw Ship (which draws crew)
        this.ship.draw(ctx, this.camera);

        ctx.restore();

        // HUD (Fixed on screen)
        this.jobSystem.draw(ctx);

        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('NAVY LIFE SIMULATOR', 20, 30);
        ctx.fillText('Use WASD to Move Sailor', 20, 60);
        ctx.fillText(`Ship Speed: ${this.ship.speed}`, 20, 90);
    }

    drawWaves(ctx) {
        // Simple scrolling lines based on World Pos
        const gridSize = 100;
        const offsetX = -(this.camera.x % gridSize);
        const offsetY = -(this.camera.y % gridSize);

        ctx.strokeStyle = '#358';
        ctx.lineWidth = 2;

        for (let x = offsetX; x < this.game.canvas.width; x += gridSize) {
            for (let y = offsetY; y < this.game.canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, y + 10);
                ctx.lineTo(x + 50, y);
                ctx.stroke();
            }
        }
    }
}
