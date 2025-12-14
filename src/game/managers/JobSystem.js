export class JobSystem {
    constructor(game) {
        this.game = game;
        this.currentJob = null;
        this.jobTimer = 0;
        this.score = 0;
        this.jobs = [
            { id: 'SWAB', text: 'Swab the Main Deck', duration: 3000, targetType: 'DECK' },
            { id: 'LOAD_CANNON', text: 'Load Starboard Cannon', duration: 2000, targetType: 'CANNON' },
            { id: 'INSPECT_HELM', text: 'Inspect the Helm', duration: 1000, targetType: 'HELM' }
        ];
    }

    update(deltaTime) {
        // Assign new job if none
        if (!this.currentJob && Math.random() < 0.005) {
            this.assignJob();
        }

        // Timeout check?
        // For now, jobs last until done.
    }

    assignJob() {
        const template = this.jobs[Math.floor(Math.random() * this.jobs.length)];
        this.currentJob = { ...template, progress: 0 };
        this.game.stateManager.currentState.player.speak("New Orders: " + this.currentJob.text);
    }

    completeJob() {
        if (!this.currentJob) return;
        this.score += 50;
        this.game.stateManager.currentState.player.gainXp(50);
        this.game.stateManager.currentState.player.speak("Job Done! (+50 XP)");
        this.currentJob = null;
    }

    // Check interaction for job completion
    checkInteraction(type, entity) {
        if (!this.currentJob) return false;

        if (this.currentJob.targetType === type) {
            this.completeJob();
            return true;
        }
        return false;
    }

    draw(ctx) {
        // Draw HUD for Job
        if (this.currentJob) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(10, 10, 300, 50);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(10, 10, 300, 50);

            ctx.fillStyle = '#ffeb3b';
            ctx.font = '16px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`ORDERS: ${this.currentJob.text}`, 20, 40);
        }

        // Score
        ctx.fillStyle = 'white';
        ctx.font = '16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`SCORE: ${this.score}`, this.game.canvas.width - 20, 30);
    }
}
