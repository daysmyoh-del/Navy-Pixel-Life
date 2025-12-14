import { CONSTANTS } from '../Constants.js';

export class MenuState {
    constructor(game) {
        this.game = game;
    }

    enter() {
        console.log('Entered Menu State');
    }

    exit() {
        console.log('Exited Menu State');
    }

    update(deltaTime) {
        const input = this.game.inputManager;

        if (input.isKeyDown('Enter') || input.isKeyDown('Space')) {
            this.game.stateManager.switchState('GAME', { branch: CONSTANTS.BRANCHES.NAVY });
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        ctx.fillStyle = 'white';
        ctx.fillStyle = 'white';
        // Retro Font style?
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NAVY PIXEL LIFE', this.game.canvas.width / 2, 200);

        ctx.font = '24px monospace';
        if (Math.floor(Date.now() / 500) % 2 === 0) { // Blink effect
            ctx.fillText('PRESS ENTER TO START', this.game.canvas.width / 2, 350);
        }

        ctx.font = '16px monospace';
        ctx.fillText('WASD to Move | E to Interact | Click to Shoot', this.game.canvas.width / 2, 450);
    }
}
