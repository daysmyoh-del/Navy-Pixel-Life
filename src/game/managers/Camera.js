export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.followTarget = null;
    }

    follow(target) {
        this.followTarget = target;
    }

    setZoom(z) {
        this.targetZoom = z;
    }

    update(deltaTime) {
        // Smooth Zoom
        this.zoom += (this.targetZoom - this.zoom) * 0.05;

        if (this.followTarget) {
            // Lerp to target
            const targetX = this.followTarget.x - this.width / 2;
            const targetY = this.followTarget.y - this.height / 2;

            this.x += (targetX - this.x) * 0.1;
            this.y += (targetY - this.y) * 0.1;
        }
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
    }
}
