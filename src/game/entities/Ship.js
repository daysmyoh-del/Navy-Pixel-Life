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
        this.deckMap = this.generateDeck();

        // Entities ON the ship (Local coordinates relative to ship center)
        this.crew = [];
        this.stations = []; // {x, y, type, occupiedBy}

        // Parse the map to find stations
        this.parseStations();

        this.particles = [];
        this.smokeTimer = 0;
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
            occupiedBy: null
        });
    }

    generateDeck() {
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

        // Place some cannons
        map[3][0] = 3; map[3][cols - 1] = 3;
        map[6][0] = 3; map[6][cols - 1] = 3;
        map[9][0] = 3; map[9][cols - 1] = 3;

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
        // Transform Context to World Position of Ship
        ctx.save();

        // Translate to Ship World Pos relative to Camera
        const screenX = this.worldX - camera.x;
        const screenY = this.worldY - camera.y;

        ctx.translate(screenX, screenY);
        ctx.rotate(this.worldRotation);

        // Draw Deck (Local Coords)
        // Center the ship visually
        const offsetX = -(this.deckMap[0].length * this.tileSize) / 2;
        const offsetY = -(this.deckMap.length * this.tileSize) / 2;

        this.deckMap.forEach((row, r) => {
            row.forEach((tile, c) => {
                const tx = offsetX + c * this.tileSize;
                const ty = offsetY + r * this.tileSize;

                if (tile === 0) return; // Empty (Water visible below)

                if (tile === 1) {
                    ctx.fillStyle = '#654'; // Wood Deck
                    ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
                    ctx.strokeStyle = '#543';
                    ctx.strokeRect(tx, ty, this.tileSize, this.tileSize);
                } else if (tile === 2) {
                    ctx.fillStyle = '#333'; // Railing / Wall
                    ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
                } else if (tile === 3) {
                    ctx.fillStyle = '#654';
                    ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
                    // Cannon
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(tx + 32, ty + 32, 20, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillRect(tx + 10, ty + 20, 44, 24); // Barrel (facing side?)
                }
            });
        });

        // Draw Stations Interactions
        this.stations.forEach(s => {
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
