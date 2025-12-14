import { CONSTANTS } from './Constants.js';
import { InputManager } from './managers/InputManager.js';
import { AssetManager } from './managers/AssetManager.js';
import { StateManager } from './managers/StateManager.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false; // Pixel Art Look

        this.inputManager = new InputManager();
        this.assetManager = new AssetManager();
        this.stateManager = new StateManager(this);

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.ctx.imageSmoothingEnabled = false; // Re-apply on resize
            if (this.stateManager.currentState && this.stateManager.currentState.camera) {
                // Assuming there might be a camera resize method or similar to call here
                // The original instruction snippet was incomplete, so this block is left open
                // or can be completed based on further context.
                // For now, we'll just ensure it's syntactically correct.
                // Example: this.stateManager.currentState.camera.resize(this.canvas.width, this.canvas.height);
            }
            // The original `this.resize()` method is now partially inlined here.
            // If `this.resize()` had other logic, it would need to be moved or called.
            // Given the instruction, the `resize` method below might become redundant
            // or need to be called explicitly from within this new listener.
            // For now, the `resize()` method is kept as it was not explicitly removed.
        });

        this.lastTime = 0;
    }

    async init() {
        console.log('Loading assets...');
        // Load assets based on constants, mapping keys to values
        const assetMap = {};
        for (const [key, value] of Object.entries(CONSTANTS.ASSETS)) {
            assetMap[key] = value;
        }

        try {
            await this.assetManager.loadImages(assetMap);
            console.log('Assets loaded!');
        } catch (e) {
            console.error('Failed to load assets', e);
        }

        // Force Start to Navy Game
        this.stateManager.switchState('GAME', { branch: CONSTANTS.BRANCHES.NAVY });
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(deltaTime) {
        this.stateManager.update(deltaTime);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Notify state or camera? 
        // We'll access canvas dimensions directly in states
    }

    draw() {
        // Fallback info
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.stateManager.currentState) {
            this.stateManager.draw(this.ctx);
        } else {
            // Debug text if no state
            this.ctx.fillStyle = 'red';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Loading...', 50, 50);
        }
    }
}
