export const CONSTANTS = {
    TILE_SIZE: 64, // Used for world grid
    RANKS: [
        { title: 'Private', xp: 0, unlocks: ['RIFLE', 'PISTOL'] },
        { title: 'Sergeant', xp: 100, unlocks: ['SMG', 'SHOTGUN'] },
        { title: 'Captain', xp: 300, unlocks: ['SNIPER', 'ROCKET'] },
        { title: 'Major', xp: 600, unlocks: ['AIRSTRIKE_CALL'] },
        { title: 'General', xp: 1000, unlocks: ['NUKE'] },
        { title: 'Five Star Official', xp: 2000, unlocks: ['GOLDEN_GUN'] }
    ],
    BRANCHES: {
        ARMY: 'Army',
        NAVY: 'Navy',
        AIR_FORCE: 'Air Force'
    },
    RANKS: {
        RECRUIT: 0,
        SEAMAN: 1,
        PETTY_OFFICER: 2,
        OFFICER: 3,
        CAPTAIN: 4
    },
    XP_LEVELS: [0, 100, 300, 600, 1000], // XP needed for each rank
    WEAPONS: {
        HANDGUN: { name: 'Pistol', damage: 2, rate: 500, speed: 5.0, range: 300, color: 'yellow' },
        RIFLE: { name: 'Rifle', damage: 1, rate: 100, speed: 1.0, range: 500, color: 'yellow' }, // Old soldier weapon
        SMG: { name: 'SMG', damage: 0.5, rate: 120, speed: 0.5, spread: 0.3, range: 250, color: 'white' },
        SHOTGUN: { name: 'Shotgun', damage: 1, rate: 1000, speed: 0.5, spread: 0.5, count: 5, range: 200, color: 'red' },
        SNIPER: { name: 'Sniper Rifle', damage: 5, rate: 2000, speed: 1.2, spread: 0.0, range: 1000, color: 'cyan' },
        ROCKET: { name: 'Bazooka', damage: 10, rate: 2500, speed: 0.3, spread: 0.05, explosive: true, radius: 100, color: 'darkred' },
        // Navy Specific
        CANNON: { name: 'Naval Cannon', damage: 50, rate: 2000, speed: 2.5, range: 800, color: 'black' },
        MG_SHIP: { name: 'Ship MG', damage: 2, rate: 60, speed: 5.0, spread: 0.1, color: 'yellow' },
        // Air Force Specific
        BOMB: { name: 'Bomb', damage: 20, rate: 500, speed: 0, inheritVelocity: true, explosive: true, color: 'black' },
        MG_AIR: { name: 'Aircraft MG', damage: 1, rate: 80, speed: 1.0, spread: 0.1, color: 'yellow' }
    },
    ASSETS: {
        ASSETS: {
            // No assets to load, using procedural generation
        }
    };
