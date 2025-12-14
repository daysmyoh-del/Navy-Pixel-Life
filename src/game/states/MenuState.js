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

        // Simple selection via keys for now
        if (input.isKeyDown('Digit1')) {
            this.game.stateManager.switchState('BASE_SELECT', { branch: CONSTANTS.BRANCHES.ARMY });
        } else if (input.isKeyDown('Digit2')) {
            this.game.stateManager.switchState('BASE_SELECT', { branch: CONSTANTS.BRANCHES.NAVY });
        } else if (input.isKeyDown('Digit3')) {
            this.game.stateManager.switchState('BASE_SELECT', { branch: CONSTANTS.BRANCHES.AIR_FORCE });
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MILITARY WAR SIMULATOR', this.game.canvas.width / 2, 150);

        ctx.font = '20px Arial';
        ctx.fillText('Select Branch to Deploy:', this.game.canvas.width / 2, 250);
        ctx.fillText('1. ARMY (Ground Combat)', this.game.canvas.width / 2, 300);
        ctx.fillText('2. NAVY (Ship Battles)', this.game.canvas.width / 2, 350);
        ctx.fillText('3. AIR FORCE (Aerial Bombing)', this.game.canvas.width / 2, 400);
    }
}
