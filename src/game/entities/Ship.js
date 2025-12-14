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
            const patternCvs = this.game.textureGenerator.generateSteel();
            this.woodPattern = ctx.createPattern(patternCvs, 'repeat'); // Reuse var name, but it's steel now

            const metalCvs = this.game.textureGenerator.generateMetal();
            this.metalPattern = ctx.createPattern(metalCvs, 'repeat');

            this.itemPatterns = {
                ladder: this.game.textureGenerator.generateLadder(),
                bed: this.game.textureGenerator.generateBed(),
                table: this.game.textureGenerator.generateTable(),
                target: this.game.textureGenerator.generateTarget(),
                vls: this.game.textureGenerator.generateVLS(),
                helipad: this.game.textureGenerator.generateHelipad(),
                radar: this.game.textureGenerator.generateRadar()
            };
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
        // Stations Init (cleared logic inside gen)
        this.stations = []; // Clear old stations
        this.zones = [
            {
                name: "The Bridge",
                deckIndex: 0,
                x: -100, y: -800, width: 200, height: 200,
                requiredRank: 3
            }
        ];

        // Regenerate to fill stations
        this.decks = [
            this.generateMainDeck(),
            this.generateLowerDeck()
        ];
        this.deckMap = this.decks[0];
        this.tileSize = 64; // Ensure size
        this.currentDeckIndex = 0;
    }

    // Helper to add stations during generation
    addStation(c, r, type, deck) {
        // Find offset
        const offsetX = -(24 * this.tileSize) / 2;
        const offsetY = -(80 * this.tileSize) / 2;

        this.stations.push({
            x: offsetX + c * this.tileSize,
            y: offsetY + r * this.tileSize,
            width: this.tileSize,
            height: this.tileSize,
            type: type,
            deckIndex: deck
        });
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

    // Modern Destroyer (Arleigh Burke-ish)
    // Size: 24 wide x 80 long (Massive)
    generateMainDeck() {
        const cols = 24;
        const rows = 80;
        let map = [];

        // Reset stations if regenerating? (assume init only)
        // We push stations manually below.

        for (let r = 0; r < rows; r++) {
            let row = [];
            for (let c = 0; c < cols; c++) {
                // Hull Shape (Long and narrow)
                // Center is c=12
                const distFromCenter = Math.abs(c - 11.5);
                const widthAtRow = this.getHullWidth(r, rows);

                if (distFromCenter < widthAtRow) {
                    // Valid Deck
                    // Edge check for railings (Wall)
                    if (distFromCenter > widthAtRow - 1.5) row.push(CONSTANTS.TILES.WALL);
                    else row.push(CONSTANTS.TILES.DECK);
                } else {
                    row.push(CONSTANTS.TILES.EMPTY);
                }
            }
            map.push(row);
        }

        // Features
        // Bow (Front): VLS Array
        for (let r = 5; r < 15; r += 2) {
            for (let c = 10; c < 14; c += 2) {
                if (map[r][c] === CONSTANTS.TILES.DECK) map[r][c] = CONSTANTS.TILES.VLS;
            }
        }

        // Main Gun (Forward)
        map[3][11] = CONSTANTS.TILES.CANNON_MOUNT; // Turret

        // Superstructure (Midship: r=20 to r=50)
        for (let r = 25; r < 45; r++) {
            for (let c = 8; c < 16; c++) {
                if (c === 8 || c === 15 || r === 25 || r === 44) map[r][c] = CONSTANTS.TILES.WALL;
            }
        }
        // Bridge Windows
        map[25][11] = CONSTANTS.TILES.HELM; // Only visible inside though? No, Main Deck Bridge is Superstructure top
        // Let's put Helm inside a "Control Room" area or just outside for visibility.
        // Let's put it at r=24 (Balcony)

        // Helipad (Stern)
        for (let r = 65; r < 75; r++) {
            for (let c = 8; c < 16; c++) {
                map[r][c] = CONSTANTS.TILES.HELIPAD;
            }
        }

        // Ladder (Midship)
        map[40][12] = CONSTANTS.TILES.LADDER;

        // Stations
        // Clear old ones first if needed (constructor does this once)
        // Add Stations logic for new map:
        this.addStation(11, 3, 'TURRET', 0); // Main Gun
        this.addStation(12, 40, 'LADDER_DOWN', 0);
        this.addStation(11, 24, 'HELM', 0); // Bridge Command

        return map;
    }

    getHullWidth(r, totalRows) {
        // Tapered bow, straight body, square stern
        if (r < 15) return (r / 15) * 10; // 0 to 10 width
        if (r > totalRows - 10) return 9; // Slightly narrower stern
        return 10; // Full width (20 total)
    }

    generateLowerDeck() {
        const cols = 24;
        const rows = 80;
        let map = [];

        for (let r = 0; r < rows; r++) {
            let row = [];
            for (let c = 0; c < cols; c++) {
                const distFromCenter = Math.abs(c - 11.5);
                const widthAtRow = this.getHullWidth(r, rows);

                if (distFromCenter < widthAtRow) {
                    if (distFromCenter > widthAtRow - 1.5) row.push(CONSTANTS.TILES.WALL);
                    else row.push(CONSTANTS.TILES.DECK);
                } else {
                    row.push(CONSTANTS.TILES.EMPTY);
                }
            }
            map.push(row);
        }

        // Subdivision (Rooms)
        // CIC (Combat Info Center) - Forward
        this.createRoom(map, 9, 20, 6, 10, CONSTANTS.TILES.RADAR);

        // Mess Hall - Mid
        this.createRoom(map, 9, 35, 6, 8, CONSTANTS.TILES.TABLE);

        // Berthing - Rear
        this.createRoom(map, 8, 50, 8, 15, CONSTANTS.TILES.BED);

        // Engine - Deep Rear
        this.createRoom(map, 9, 70, 6, 6, CONSTANTS.TILES.WALL); // Engine blocks

        // Ladder
        map[40][12] = CONSTANTS.TILES.LADDER;
        this.addStation(12, 40, 'LADDER_UP', 1);

        // Stations for rooms
        // CIC
        this.addStation(11, 25, 'RADAR_CONSOLE', 1);

        return map;
    }

    createRoom(map, x, y, w, h, furniture) {
        // Walls
        for (let r = y; r < y + h; r++) {
            for (let c = x; c < x + w; c++) {
                if (r === y || r === y + h - 1 || c === x || c === x + w - 1) {
                    map[r][c] = CONSTANTS.TILES.WALL;
                } else {
                    // Furniture placement
                    if (furniture && (r + c) % 2 === 0) map[r][c] = furniture;
                    else map[r][c] = CONSTANTS.TILES.DECK;
                }
            }
        }
        // Door
        map[y + h - 1][x + Math.floor(w / 2)] = CONSTANTS.TILES.DECK;
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

                if (tile === CONSTANTS.TILES.EMPTY) return;

                // Draw Floor based on Tile
                if (tile === CONSTANTS.TILES.DECK) {
                    ctx.fillStyle = this.woodPattern; // This is now steel
                    ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
                }

                if (tile === CONSTANTS.TILES.WALL) {
                    ctx.fillStyle = '#37474f';
                    ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
                    ctx.fillStyle = '#263238'; // Top bevel
                    ctx.fillRect(tx, ty, this.tileSize, 8);
                }

                if (tile === CONSTANTS.TILES.HELIPAD) {
                    if (this.itemPatterns.helipad) ctx.drawImage(this.itemPatterns.helipad, tx, ty);
                }
                if (tile === CONSTANTS.TILES.VLS) {
                    if (this.itemPatterns.vls) ctx.drawImage(this.itemPatterns.vls, tx, ty);
                }
                if (tile === CONSTANTS.TILES.RADAR) {
                    if (this.itemPatterns.radar) ctx.drawImage(this.itemPatterns.radar, tx, ty);
                }

                if (tile === CONSTANTS.TILES.CANNON_MOUNT) {
                    // Detailed Turret
                    ctx.fillStyle = '#607d8b'; // Turret housing
                    ctx.beginPath();
                    ctx.arc(tx + 32, ty + 32, 24, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    // Barrel
                    ctx.fillStyle = '#455a64';
                    ctx.fillRect(tx + 28, ty - 10, 8, 40);
                }

                // Keep old ones too
                if (tile === CONSTANTS.TILES.LADDER) {
                    if (this.itemPatterns.ladder) ctx.drawImage(this.itemPatterns.ladder, tx, ty);
                }
                if (tile === CONSTANTS.TILES.BED) {
                    if (this.itemPatterns.bed) ctx.drawImage(this.itemPatterns.bed, tx, ty);
                }
                if (tile === CONSTANTS.TILES.TABLE) {
                    if (this.itemPatterns.table) ctx.drawImage(this.itemPatterns.table, tx, ty);
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
