export class TextureGenerator {
    constructor() {
        this.cache = {};
    }

    createNoiseTexture(width, height, colorBase, variance) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Fill Base
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, width, height);

        // Add Noise
        const idata = ctx.getImageData(0, 0, width, height);
        const buffer = new Uint32Array(idata.data.buffer);
        const len = buffer.length;

        for (let i = 0; i < len; i++) {
            if (Math.random() < 0.5) {
                // Determine noise color modification
                const r = (Math.random() - 0.5) * variance;

                // Read current pixel (simple approach, just draw rects is easier for style, 
                // but pixel manip is faster. Let's stick to simple canvas ops for "Cartoon" look)
            }
        }

        // Simpler approach for "Cartoon": Draw random blobs
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.1).toFixed(2)})`;
            if (Math.random() < 0.5) ctx.fillStyle = `rgba(0,0,0,${(Math.random() * 0.1).toFixed(2)})`;

            const x = Math.random() * width;
            const y = Math.random() * height;
            const rad = Math.random() * 5 + 2;

            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    generateGrass() { return this.createNoiseTexture(64, 64, '#4caf50', 20); }
    generateWater() { return this.createNoiseTexture(64, 64, '#2196f3', 20); }
    generateDirt() { return this.createNoiseTexture(64, 64, '#795548', 20); }
    generateSand() { return this.createNoiseTexture(64, 64, '#fdd835', 20); }
    generateDarkWater() { return this.createNoiseTexture(64, 64, '#1565c0', 30); }
    generateMud() { return this.createNoiseTexture(64, 64, '#5d4037', 30); }
}
