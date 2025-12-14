import { CONSTANTS } from '../Constants.js';

export class Ship {
    constructor(game, x, y) {
        this.game = game;
        // World Position (The ship in the ocean)
        this.worldX = x;
        this.worldY = y;
        this.worldRotation = 0;
        this.speed = 0;
        this.rudderAngle = 0;

        // Ship Configuration
        this.width = 400;
        this.height = 800; // Large ship

        // The "Level" / Deck
        // Simple grid for now: 0 = gap, 1 = deck, 2 = wall, 3 = cannon
        this.tileSize = 64;
        this.currentDeckIndex = 0; // 0 = Main, 1 = Lower
        this.decks = [
            this.generateMainDeck(),
            this.generateLowerDeck()
        ];
        this.deckMap = this.decks[0]; // Active deck

        // Entities ON the ship (Local coordinates relative to ship center)
        this.crew = [];
        this.stations = []; // {x, y, type, occupiedBy}

        // Parse the map to find stations
        this.parseStations();

        this.particles = [];
        this.smokeTimer = 0;

        // Textures
        const texGen = new (game.assetManager.constructor ? game.assetManager.constructor : Object)(); // Hack if generic, but usually TextureGenerator is separate
        // Actually, we can just instantiate TextureGenerator if we import it, or pass it in.
        // Assuming Game has one or we create one temp.
        // Let's rely on cached patterns if possible, or create them here.
        this.woodPattern = null;
        this.metalPattern = null;
    }

    // Helper to init patterns
    initPatterns(ctx) {
        if (!this.woodPattern) {
            // We need a TextureGenerator instance. 
            // In a pro engine, this is central. Here we cheat slightly for specific patterns.
            const woodCvs = this.createTextureCanvas(64, 64, '#8d6e63', (c) => {
                c.strokeStyle = '#4e342e'; c.lineWidth = 2;
                for (let i = 0; i < 64; i += 16) { c.moveTo(0, i); c.lineTo(64, i); }
                c.stroke();
                c.fillStyle = '#3e2723';
                for (let i = 0; i < 64; i += 16) { c.fillRect(4, i + 7, 2, 2); c.fillRect(58, i + 7, 2, 2); }
            });
            this.woodPattern = ctx.createPattern(woodCvs, 'repeat');

            const metalCvs = this.createTextureCanvas(64, 64, '#607d8b', (c) => {
                c.fillStyle = '#455a64';
                for (let x = 4; x < 64; x += 16) for (let y = 4; y < 64; y += 16) c.fillRect(x, y, 4, 4);
            });
            this.metalPattern = ctx.createPattern(metalCvs, 'repeat');
        }
    }

    createTextureCanvas(w, h, base, drawFn) {
        const cvs = document.createElement('canvas');
        cvs.width = w; cvs.height = h;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
        drawFn(ctx);
        return cvs;
    }

    parseStations() {
        const offsetX = -(this.deckMap[0].length * this.tileSize) / 2;
        const offsetY = -(this.deckMap.length * this.tileSize) / 2;

        this.deckMap.forEach((row, r) => {
            row.forEach((tile, c) => {
                if (tile === 3) {
                    // Cannon
                    this.stations.push({
                        x: offsetX + c * this.tileSize,
                        y: offsetY + r * this.tileSize,
                        width: this.tileSize,
                        height: this.tileSize,
                        type: 'CANNON',
                        occupiedBy: null
                    });
                }
            });
        });

        // Add Helm Manually (Stern)
        this.stations.push({
            x: 0,
            y: (this.deckMap.length / 2 - 2) * this.tileSize, // Near back
            width: this.tileSize,
            height: this.tileSize,
            type: 'HELM',
            occupiedBy: null,
            deckIndex: 0
        });

        // Add Ladders (Deck Switching)
        this.stations.push({
            x: 0,
            y: -100, // Near front?
            width: this.tileSize,
            height: this.tileSize,
            type: 'LADDER_DOWN',
            deckIndex: 0
        });

        this.stations.push({
            x: 0,
            y: -100,
            width: this.tileSize,
            height: this.tileSize,
            type: 'LADDER_UP',
            deckIndex: 1
        });

        // Restricted Zones
        this.zones = [
            {
                name: "The Bridge",
                deckIndex: 0,
                x: -150, y: -200, width: 300, height: 200, // Area around Helm
                requiredRank: 3 // Officer+
            },
            {
                name: "Captain's Quarters",
                deckIndex: 1,
                x: -150, y: 300, width: 300, height: 200, // Back of Lower Deck
                requiredRank: 4 // Captain
            }
        ];
    }

    getZoneAt(x, y, deckIndex) {
        return this.zones.find(z => {
            return z.deckIndex === deckIndex &&
                x >= z.x && x <= z.x + z.width &&
                y >= z.y && y <= z.y + z.height;
        });
    }

    switchDeck(sailor, newDeckIndex) {
        if (newDeckIndex < 0 || newDeckIndex >= this.decks.length) return;

        this.currentDeckIndex = newDeckIndex;
        this.deckMap = this.decks[newDeckIndex];

        // Visual feedback?
        sailor.speak(newDeckIndex === 0 ? "Main Deck" : "Lower Deck");
    }

    generateMainDeck() {
        const cols = 8;
        const rows = 16;
        let map = [];
        for (let r = 0; r < rows; r++) {
            let row = [];
            for (let c = 0; c < cols; c++) {
                // Hull shape
                if (r === 0 || r === rows - 1) {
                    // Prow/Stern
                    row.push((c > 2 && c < 5) ? 1 : 0);
                } else {
                    // Main deck
                    if (c === 0 || c === cols - 1) row.push(2); // Railing
                    else row.push(1); // Deck
                }
            }
            map.push(row);
        }

        // Place some cannons and Ladder
        map[3][0] = 3; map[3][cols - 1] = 3;
        map[6][0] = 3; map[6][cols - 1] = 3;
        map[9][0] = 3; map[9][cols - 1] = 3;

        map[5][4] = CONSTANTS.TILES.LADDER; // Visual only, interaction is station

        return map;
    }

    generateLowerDeck() {
        const cols = 8;
        const rows = 16;
        let map = [];
        for (let r = 0; r < rows; r++) {
            let row = [];
            for (let c = 0; c < cols; c++) {
                // Hull shape (Slightly narrower?)
                if (r === 0 || r === rows - 1) {
                    row.push(0);
                } else if (c === 0 || c === cols - 1) {
                    row.push(2); // Walls (Metal)
                } else {
                    row.push(1); // Floor
                }
            }
            map.push(row);
        }

        // Rooms
        // Mess Hall (Tables)
        map[3][3] = CONSTANTS.TILES.TABLE; map[3][4] = CONSTANTS.TILES.TABLE;

        // Berthing (Beds)
        map[7][1] = CONSTANTS.TILES.BED; map[7][6] = CONSTANTS.TILES.BED;
        map[9][1] = CONSTANTS.TILES.BED; map[9][6] = CONSTANTS.TILES.BED;

        // Ladder
        map[5][4] = CONSTANTS.TILES.LADDER;

        return map;
    }

    addCrew(crewMember) {
        this.crew.push(crewMember);
        crewMember.ship = this;
    }

    update(deltaTime) {
        // 1. Move Ship in World
        this.worldRotation += this.rudderAngle * deltaTime * 0.001;
        this.worldX += Math.cos(this.worldRotation - Math.PI / 2) * this.speed * deltaTime;
        this.worldY += Math.sin(this.worldRotation - Math.PI / 2) * this.speed * deltaTime;

        // 2. Update Crew (They move locally)
        this.crew.forEach(c => c.update(deltaTime));

        // 3. Smoke Effects
        this.smokeTimer += deltaTime;
        if (this.smokeTimer > 100) {
            // Add smoke at funnels (approx local coords)
            this.particles.push({ x: 0, y: -200, life: 1.0, size: 20 });
            this.smokeTimer = 0;
        }

        this.particles.forEach(p => {
            p.life -= deltaTime * 0.001;
            p.size += 0.5;
            p.x += (Math.random() - 0.5) * 2; // drift
            p.y += 2; // move "back" relative to ship speed (visual hack)
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Random Chatter
        if (Math.random() < 0.005) {
            const speaker = this.crew[Math.floor(Math.random() * this.crew.length)];
            if (speaker) {
                const phrases = ['Aye Aye!', 'Steady course!', 'Look sharp!', 'Engine steady.', 'Starboard clear!'];
                speaker.speak(phrases[Math.floor(Math.random() * phrases.length)]);
            }
        }

        // Boarding Party (Random Pirate Spawn)
        if (Math.random() < 0.001) { // Rare
            const pirate = new (this.crew[0].constructor)(this.game, 0, -200, false); // Hack to get Sailor class
            pirate.color = '#e44'; // Red pirate
            pirate.rankTitle = 'Pirate';
            // Mark as enemy?
            // Need 'team' property on Sailor?
            // For now, Player shoots everything, AI ignores. 
            // We'll just visualize them for now.
            pirate.speak("BOARDING ACTION!");
            this.addCrew(pirate);
        }
    }

    draw(ctx, camera) {
        // Draw Ship relative to Camera
        // Context is ALREADY transformed to World Space by GameState.
        // So we just need to translate to the Ship's World Position.

        ctx.save();
        ctx.translate(this.worldX, this.worldY);
        ctx.rotate(this.worldRotation);

        // Draw Deck (Local Coords)
        // Center the ship visually
        const offsetX = -(this.deckMap[0].length * this.tileSize) / 2;
        const offsetY = -(this.deckMap.length * this.tileSize) / 2;

        // Init Patterns once
        this.initPatterns(ctx);

        this.deckMap.forEach((row, r) => {
            row.forEach((tile, c) => {
                const tx = offsetX + c * this.tileSize;
                const ty = offsetY + r * this.tileSize;

                if (tile === 0) return; // Empty (Water visible below)

                if (tile === 1 || tile === 3) { // Deck or Cannon base
                    ctx.fillStyle = this.woodPattern || '#8d6e63';
                    ctx.fillRect(tx, ty, this.tileSize, this.tileSize);

                    // Shadow for depth
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    ctx.fillRect(tx, ty, this.tileSize, 2);
                }

                if (tile === 2) {
                    // Wall / Railing
                    ctx.fillStyle = this.metalPattern || '#546e7a';
                    ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
                    ctx.fillStyle = 'rgba(0,0,0,0.3)'; // Top bevel
                    ctx.fillRect(tx, ty, this.tileSize, 8);
                }

                if (tile === 3) {
                    // Detailed Cannon
                    const cx = tx + 32;
                    const cy = ty + 32;

                    // Base Wheels
                    ctx.fillStyle = '#3e2723';
                    ctx.fillRect(cx - 20, cy - 10, 40, 20);

                    // Barrel (Black Metal)
                    ctx.fillStyle = '#212121';
                    ctx.save();
                    // Face slightly starboard/port?
                    // Just simple cylinder for top down
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, 15, 25, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Fuse point
                    ctx.fillStyle = '#ff5722';
                    ctx.beginPath();
                    ctx.arc(cx, cy + 10, 3, 0, Math.PI * 2);
                    ctx.fillRect(tx + 10, ty + 20, 44, 24); // Barrel (facing side?)
                    ctx.restore();
                }

                // New Tiles
                if (tile === CONSTANTS.TILES.LADDER) {
                    ctx.fillStyle = '#5d4037';
                    ctx.fillRect(tx + 10, ty, 5, 64); ctx.fillRect(tx + 50, ty, 5, 64);
                    for (let i = 0; i < 64; i += 10) ctx.fillRect(tx + 10, ty + i, 40, 4);
                }
                if (tile === CONSTANTS.TILES.BED) {
                    ctx.fillStyle = '#90caf9'; ctx.fillRect(tx + 5, ty + 5, 54, 54); // Bed
                    ctx.fillStyle = 'white'; ctx.fillRect(tx + 5, ty + 5, 54, 15); // Pillow
                }
                if (tile === CONSTANTS.TILES.TABLE) {
                    ctx.fillStyle = '#795548';
                    ctx.beginPath(); ctx.arc(tx + 32, ty + 32, 28, 0, Math.PI * 2); ctx.fill();
                }
            });
        });

        // Debug Draw Zones (Optional, maybe semi-transparent red if locked?)
        if (this.game.stateManager.currentState.player) {
            const pRank = this.game.stateManager.currentState.player.rank;
            this.zones.forEach(z => {
                if (z.deckIndex !== this.currentDeckIndex) return;

                // If locked for player
                if (pRank < z.requiredRank) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 4;
                    ctx.fillRect(z.x, z.y, z.width, z.height);
                    ctx.strokeRect(z.x, z.y, z.width, z.height);

                    ctx.fillStyle = 'red';
                    ctx.font = '16px monospace';
                    ctx.fillText("RESTRICTED", z.x + z.width / 2, z.y + z.height / 2);
                }
            });
        }

        // Draw Stations Interactions (Only for Current Deck)
        this.stations.forEach(s => {
            // Need to track which deck station is on
            if (s.deckIndex !== undefined && s.deckIndex !== this.currentDeckIndex) return;
            // Calculate World Pos of Station
            // Actually we are in Ship Space (rotated), so just draw local rect

            if (s.occupiedBy === null && this.game.stateManager.currentState.player) {
                // Show "E" if player near?
                // Optimization: Distance check to player local pos
                // Let Sailor handle the UI prompt
            }
        });

        // Draw Crew
        // Crew coordinates are LOCAL to ship center
        this.crew.forEach(c => c.draw(ctx));

        // Draw Smoke (Upper layer)
        this.particles.forEach(p => {
            ctx.fillStyle = `rgba(50, 50, 50, ${p.life * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}
