export class Squad {
    constructor(game, team, type) {
        this.game = game;
        this.team = team;
        this.members = [];
        this.target = null; // Entity or Point
        this.state = 'IDLE'; // IDLE, ATTACK, DEFEND, PATROL
        this.type = type; // 'infantry', 'air', 'mixed'
    }

    addMember(bot) {
        this.members.push(bot);
        bot.squad = this;
    }

    update(deltaTime) {
        // Clean up dead
        this.members = this.members.filter(m => !m.markedForDeletion);
        if (this.members.length === 0) return; // Squad wiped

        // Logic
        if (!this.target || this.target.markedForDeletion) {
            this.findTarget();
        }

        if (this.target) {
            // Issue orders needed?
            // "Suppression State": if distance > X, shoot in general direction
        }
    }

    findTarget() {
        // Find nearest enemy Unit
        const state = this.game.stateManager.currentState;
        if (!state) return;

        // Find closest enemy to Squad Leader (first member)
        const leader = this.members[0];
        let minDist = Infinity;
        let best = null;

        // Filter by opposing team
        // Assuming Player is targetable too
        const targets = [...state.entities, state.player].filter(e => e && e.team !== this.team && !e.markedForDeletion);

        for (const t of targets) {
            const dist = Math.hypot(t.x - leader.x, t.y - leader.y);
            if (dist < minDist) {
                minDist = dist;
                best = t;
            }
        }

        if (best) {
            this.target = best;
            this.orderAttack(best);
        }
    }

    orderAttack(target) {
        this.state = 'ATTACK';
        // Tell all bots to engage
        this.members.forEach(m => {
            m.target = target;
            // Add randomness to prevent stacking
        });
    }
}
