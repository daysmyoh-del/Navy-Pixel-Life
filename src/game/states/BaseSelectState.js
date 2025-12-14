import { CONSTANTS } from '../Constants.js';

export class BaseSelectState {
    constructor(game) {
        this.game = game;
        this.branch = null;
        this.selectedBase = 0;
        this.bases = [
            { name: 'Fort Alpha', description: 'Standard training ground.' },
            { name: 'Outpost Bravo', description: 'Forward operating base.' },
            { name: 'Camp Charlie', description: 'Strategic command center.' }
        ];
    }

    enter(params) {
        this.branch = params.branch;
        this.selectedBase = 0;
        // Customize base names based on branch if desired
        if (this.branch === CONSTANTS.BRANCHES.NAVY) {
            this.bases = [
                { name: 'Naval Port Alpha', description: 'Main fleet harbour.' },
                { name: 'Seaside Bravo', description: 'Coastal defense point.' },
                { name: 'Deepwater Charlie', description: 'Submarine dock.' }
            ];
        } else if (this.branch === CONSTANTS.BRANCHES.AIR_FORCE) {
            this.bases = [
                { name: 'Airfield Alpha', description: 'Main runway.' },
                { name: 'Hangar Bravo', description: 'Bomber wing HQ.' },
                { name: 'Strip Charlie', description: 'Secret testing facility.' }
            ];
        } else {
            this.bases = [
                { name: 'Fort Alpha', description: 'Standard training ground.' },
                { name: 'Outpost Bravo', description: 'Forward operating base.' },
                { name: 'Camp Charlie', description: 'Strategic command center.' }
            ];
        }
    }

    exit() {

    }

    update(deltaTime) {
        const input = this.game.inputManager;

        if (input.isKeyDown('Digit1')) this.selectedBase = 0;
        if (input.isKeyDown('Digit2')) this.selectedBase = 1;
        if (input.isKeyDown('Digit3')) this.selectedBase = 2;

        if (input.isKeyDown('Enter') || input.isKeyDown('Space')) {
            this.game.stateManager.switchState('BASE_VIEW', {
                branch: this.branch,
                base: this.bases[this.selectedBase]
            });
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';

        ctx.font = '30px Arial';
        ctx.fillText(`${this.branch} - Select Base`, this.game.canvas.width / 2, 100);

        this.bases.forEach((base, index) => {
            const y = 250 + (index * 80);

            if (index === this.selectedBase) {
                ctx.fillStyle = '#FFFF00'; // Highlight
                ctx.fillText(`> ${base.name} <`, this.game.canvas.width / 2, y);
            } else {
                ctx.fillStyle = '#AAAAAA';
                ctx.fillText(base.name, this.game.canvas.width / 2, y);
            }

            ctx.font = '16px Arial';
            ctx.fillStyle = '#DDDDDD';
            ctx.fillText(base.description, this.game.canvas.width / 2, y + 25);
            ctx.font = '30px Arial'; // Reset
        });

        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Press NUMBER to Select, ENTER to Confirm', this.game.canvas.width / 2, 550);
    }
}
