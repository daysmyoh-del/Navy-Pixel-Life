import { CONSTANTS } from '../Constants.js';

export class BaseViewState {
    constructor(game) {
        this.game = game;
        this.branch = null;
        this.baseData = null;
        this.rankIndex = 0;
        this.xp = 0;
    }

    enter(params) {
        this.branch = params.branch;
        this.baseData = params.base;
        // In a real game, load player save data here
    }

    exit() {

    }

    update(deltaTime) {
        const input = this.game.inputManager;

        if (input.isKeyDown('KeyD')) { // Deploy
            this.game.stateManager.switchState('GAME', { branch: this.branch });
        }

        // Mock ranking up
        if (input.isKeyDown('KeyR')) {
            // Check if we can rank up? For now just cheat to test
            // this.rankIndex = Math.min(this.rankIndex + 1, CONSTANTS.RANKS.length - 1);
        }

        // Cycle Weapon
        if (input.isKeyDown('KeyL')) {
            // Logic to cycle unlocked weapons
            // For now just hardcode cycle
            console.log('Cycling weapon...');
        }
    }

    draw(ctx) {
        // Draw a nice background for the base?
        // Maybe reuse the tile assets to draw a "Ground"

        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';

        ctx.font = '30px Arial';
        ctx.fillText(this.baseData.name, this.game.canvas.width / 2, 80);

        ctx.font = '24px Arial';
        ctx.fillText(`Rank: ${CONSTANTS.RANKS[this.rankIndex].title}`, this.game.canvas.width / 2, 140);
        ctx.fillText(`Branch: ${this.branch}`, this.game.canvas.width / 2, 180);

        // Options
        ctx.textAlign = 'left';
        ctx.fillText(`[D] DEPLOY to Mission`, 100, 300);
        // ctx.fillText(`[M] Missions (Rank Up)`, 100, 350);
        // ctx.fillText(`[S] Shop / Armory`, 100, 400);
        ctx.fillText(`Current Weapon: RIFLE (Hardcoded for prototype)`, 100, 350);

        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Living at the base... waiting for orders.', this.game.canvas.width / 2, 550);
    }
}
