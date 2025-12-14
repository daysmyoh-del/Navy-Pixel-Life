import { MenuState } from '../states/MenuState.js';

import { GameState } from '../states/GameState.js';
import { BaseSelectState } from '../states/BaseSelectState.js';
import { BaseViewState } from '../states/BaseViewState.js';

export class StateManager {
    constructor(game) {
        this.game = game;
        this.currentState = null;
        this.states = {
            'MENU': new MenuState(game),
            'GAME': new GameState(game),
            'BASE_SELECT': new BaseSelectState(game),
            'BASE_VIEW': new BaseViewState(game)
        };
    }

    switchState(stateName, params = {}) {
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = this.states[stateName];
        this.currentState.enter(params);
    }

    update(deltaTime) {
        if (this.currentState) this.currentState.update(deltaTime);
    }

    draw(ctx) {
        if (this.currentState) this.currentState.draw(ctx);
    }
}
