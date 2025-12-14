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
        this.player = new Sailor(this.game, 0, 0, true);
        this.ship.addCrew(this.player);

        // Find safe spawn (Deck tile)
        const spawnTile = this.findSafeSpawn();
        if (spawnTile) {
            this.player.localX = spawnTile.x;
            this.player.localY = spawnTile.y;
            this.player.targetX = spawnTile.x;
            this.player.targetY = spawnTile.y;
        }

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

        this.jobSystem.update(deltaTime);

        // Update Camera to follow PLAYER
        // Convert Player Local -> World
        // We know Player Local and Ship World.
        // WorldX = Ship.WorldX + (Rotated LocalX)
        // For simplicity (since rotation is usually 0 unless turning):
        const rad = this.ship.worldRotation;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const px = this.ship.worldX + (this.player.localX * cos - this.player.localY * sin);
        const py = this.ship.worldY + (this.player.localX * sin + this.player.localY * cos);

        // Smooth camera
        this.camera.x += (px - this.camera.x) * 0.1;
        this.camera.y += (py - this.camera.y) * 0.1;

        // Dynamic Zoom (closer for player focus)
        this.camera.setZoom(0.8); // Fixed zoom for walking feeling
    }

    findSafeSpawn() {
        // Find a DECK tile in the map
        const map = this.ship.deckMap;
        const rows = map.length;
        const cols = map[0].length;
        const offX = -(cols * this.ship.tileSize) / 2;
        const offY = -(rows * this.ship.tileSize) / 2;

        for (let r = 40; r < 60; r++) { // Spwn mid-ship
            for (let c = 5; c < 20; c++) {
                if (map[r] && map[r][c] === 1) { // 1 = Deck (Old ID) or CONSTANTS check?
                    // We used consts in generation but raw IDs might be simpler if imported.
                    // Let's assume 1 is Deck. 
                    // Actually better: check if it's NOT empty/wall
                    return {
                        x: offX + c * 64 + 32,
                        y: offY + r * 64 + 32
                    };
                }
            }
        }
        return { x: 0, y: 0 };
    }

    draw(ctx) {
        ctx.save();

        // 1. Clear & Ocean Background (Screen Space)
        ctx.fillStyle = '#204051'; // Deep Sea Blue
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        // 2. Camera Transform
        // We want the Ship (camera.x, camera.y) to be at Screen Center
        const cx = this.game.canvas.width / 2;
        const cy = this.game.canvas.height / 2;

        ctx.translate(cx, cy);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        // 3. Draw World (Ocean Details)
        this.drawOcean(ctx);

        // 4. Draw Ship
        // Ship is at ship.worldX, ship.worldY
        // We are now in World Space, so we just draw the ship at its coords.
        // NOTE: Ship.draw used to take camera and do its own translation. 
        // We should simplify Ship.draw to just draw at x,y.
        // But for compatibility with existing Ship.draw, let's see.
        // Existing Ship.draw takes (ctx, camera) and does: 
        //    ctx.translate(this.worldX - camera.x ...) which means it expects camera offset to NOT be applied?
        // This conflicts if we already translated.
        // FIX: Let's revert the camera transform for the Ship call, OR change Ship.draw. 
        // Changing Ship.draw is cleaner but risky if I miss something.
        // Let's use the transform here and fix Ship.draw in a moment.

        // Actually, let's do this: 
        // If Ship.draw expects to handle the camera, we should NOT translate here for the ship.
        // BUT we need to translate for the Ocean/Islands.

        // Draw Islands
        // this.worldManager.draw(ctx, ...)?

        // Let's fix Ship.draw. It's better long term.
        // But to be safe and quick:
        // Render Ocean with transform.
        // Restore context.
        // Render Ship with its own logic (it works, just valid parameters needed).

        // Ocean Items (Creatures)
        this.drawSeaCreatures(ctx);

        // 4. Draw Ship (draws in World Space now)
        this.ship.draw(ctx, this.camera);

        ctx.restore();

        // HUD (Fixed on screen)
        this.jobSystem.draw(ctx);

        ctx.fillStyle = 'white';
        ctx.font = '20px monospace';
        ctx.fillText('NAVY LIFE SIMULATOR', 20, 30);
        ctx.fillText(`SPEED: ${(this.ship.speed * 10).toFixed(0)} KNOTS`, 20, 60);
    }

    drawOcean(ctx) {
        // Pixel Waves
        const worldL = this.camera.x - this.game.canvas.width; // Approx
        const worldT = this.camera.y - this.game.canvas.height;
        const worldR = this.camera.x + this.game.canvas.width;
        const worldB = this.camera.y + this.game.canvas.height;

        ctx.fillStyle = '#2b5970'; // Lighter wave
        const time = Date.now() / 1000;

        // Draw simplified waves (rectangles)
        // Grid based
        const gridSize = 100;
        const startX = Math.floor(worldL / gridSize) * gridSize;
        const startY = Math.floor(worldT / gridSize) * gridSize;

        for (let x = startX; x < worldR; x += gridSize) {
            for (let y = startY; y < worldB; y += gridSize) {
                // Procedural Wave
                if ((Math.sin(x / 500 + time) * Math.cos(y / 300 + time)) > 0.5) {
                    ctx.fillRect(x + 10, y + 10, 80, 5); // Wave crest
                    ctx.fillRect(x + 20, y + 20, 40, 5);
                }
            }
        }
    }

    drawSeaCreatures(ctx) {
        // Random ambiance
        // Should be persistent entities but cheap procedural works for "glimpses"
        // Let's spawn a fake whale occasionally based on time/pos
        const time = Date.now() / 5000;
        const wx = this.ship.worldX + Math.sin(time) * 400;
        const wy = this.ship.worldY + Math.cos(time) * 300;

        ctx.fillStyle = '#1a3340'; // Shadowy shape

        // Shark/Whale shape
        ctx.beginPath();
        ctx.ellipse(wx, wy, 40, 15, time, 0, Math.PI * 2);
        ctx.fill();

        // Fin
        ctx.beginPath();
        ctx.moveTo(wx, wy - 10);
        ctx.lineTo(wx + 10, wy - 30);
        ctx.lineTo(wx + 20, wy - 10);
        ctx.fill();
    }
}
