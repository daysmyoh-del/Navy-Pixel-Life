import { CONSTANTS } from '../Constants.js';

export class World {
    constructor(game, type) {
        this.game = game;
        this.type = type; // 'ground', 'sea', 'air', 'base_interior'
        this.tileSize = CONSTANTS.TILE_SIZE;
        this.textures = {};

        // Islands (Ports)
        this.islands = [];
        this.islandTimer = 0;
    }

    init(textureGen) {
        // Pre-generate some textures
        if (this.type === 'sea') {
            this.textures.main = textureGen.generateWater();
            this.textures.base = textureGen.generateDarkWater();
        } else if (this.type === 'air') {
            this.textures.main = textureGen.generateDirt();
            this.textures.base = textureGen.generateGrass();
        } else if (this.type === 'base_interior') {
            const ts = this.tileSize;
            this.textures.floor = textureGen.createNoiseTexture(ts, ts, '#555', 5);
            this.textures.wall = textureGen.createNoiseTexture(ts, ts, '#333', 10);
            this.textures.wood = textureGen.createNoiseTexture(ts, ts, '#6da', 10);
        } else {
            this.textures.main = textureGen.generateGrass();
            this.textures.road = textureGen.generateDirt();
            this.textures.base = textureGen.generateMud();
        }
    }

    draw(ctx, camera) {
        if (this.type === 'base_interior') {
            this.drawBaseInterior(ctx, camera);
            return;
        }

        // Calculate visible columns and rows
        const startCol = Math.floor(camera.x / this.tileSize);
        const endCol = startCol + (camera.width / this.tileSize) + 1;
        const startRow = Math.floor(camera.y / this.tileSize);
        const endRow = startRow + (camera.height / this.tileSize) + 1;

        // Offset for modulo
        const offsetX = -camera.x + startCol * this.tileSize;
        const offsetY = -camera.y + startRow * this.tileSize;

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                let img = this.textures.main;

                // Base Area logic 
                if (Math.abs(c) < 5 && Math.abs(r) < 5) {
                    img = this.textures.base;
                }

                const x = (c * this.tileSize) - camera.x;
                const y = (r * this.tileSize) - camera.y;

                ctx.drawImage(img, x, y);
            }
        }

        // Draw Islands (World Objects)
        this.islands.forEach(island => {
            const ix = island.x - camera.x;
            const iy = island.y - camera.y;

            // Draw Island Sprite (Procedural: Yellow/Green circle)
            ctx.fillStyle = '#fdd835'; // Sand
            ctx.beginPath();
            ctx.arc(ix, iy, 150, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4caf50'; // Trees layer
            ctx.beginPath();
            ctx.arc(ix, iy, 100, 0, Math.PI * 2);
            ctx.fill();

            // Port Label
            ctx.fillStyle = 'white';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText("PORT " + island.id, ix, iy - 160);
        });
    }

    update(deltaTime, playerShip) {
        // Procedurally spawn islands in front of ship?
        // Or just random scatter.
        // Let's keep a few alive.
        if (this.islands.length < 2) {
            // Spawn far away
            const angle = Math.random() * Math.PI * 2;
            const dist = 2000 + Math.random() * 2000;
            this.islands.push({
                id: Math.floor(Math.random() * 900) + 100,
                x: playerShip.worldX + Math.cos(angle) * dist,
                y: playerShip.worldY + Math.sin(angle) * dist
            });
        }

        // Check for Docking
        if (playerShip) {
            let nearIsland = null;
            this.islands.forEach(isl => {
                const dist = Math.hypot(isl.x - playerShip.worldX, isl.y - playerShip.worldY);
                if (dist < 300) nearIsland = isl;
            });

            if (nearIsland) {
                // Show Dock Prompt?
                // Handled in GameState or here?
                // For simplicity, auto-refuel logic or prompt
                playerShip.nearPort = true;
            } else {
                playerShip.nearPort = false;
            }
        }

        drawBaseInterior(ctx, camera) {
            const baseX = 0 - camera.x;
            const baseY = 0 - camera.y;

            ctx.fillStyle = '#2e2';
            ctx.fillRect(baseX - 1000, baseY - 1000, 4000, 4000);

            ctx.fillStyle = '#444';
            ctx.fillRect(baseX, baseY, 800, 600);

            ctx.strokeStyle = '#111';
            ctx.lineWidth = 10;
            ctx.strokeRect(baseX, baseY, 800, 600);

            this.drawRoom(ctx, baseX + 50, baseY + 50, 200, 150, 'Barracks', '#556');
            this.drawRoom(ctx, baseX + 300, baseY + 50, 200, 150, 'Mess Hall', '#654');
            this.drawRoom(ctx, baseX + 550, baseY + 50, 200, 150, 'Armory', '#333');
            this.drawRoom(ctx, baseX + 50, baseY + 300, 200, 200, 'Gym', '#455');

            this.drawRoom(ctx, baseX + 400, baseY + 400, 300, 150, 'DEPLOYMENT ZONE', '#222');
        }

        drawRoom(ctx, x, y, w, h, label, color) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);

            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + h / 2);
        }
    }
