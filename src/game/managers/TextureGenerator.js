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

    generateWoodPlank() {
        // Detailed Wood texture
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');

        ctx.fillStyle = '#8d6e63'; // Base brown
        ctx.fillRect(0, 0, 64, 64);

        // Plank lines
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 64; i += 16) {
            ctx.moveTo(0, i);
            ctx.lineTo(64, i);
        }
        ctx.stroke();

        // Nail holes
        ctx.fillStyle = '#3e2723';
        for (let i = 0; i < 64; i += 16) {
            ctx.fillRect(2, i + 6, 2, 2);
            ctx.fillRect(60, i + 6, 2, 2);
        }

        return cvs;
    }

    generateMetal() {
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');

        ctx.fillStyle = '#607d8b'; // Metal Grey
        ctx.fillRect(0, 0, 64, 64);

        // Rivets
        ctx.fillStyle = '#455a64';
        for (let x = 4; x < 64; x += 14) {
            for (let y = 4; y < 64; y += 14) {
                ctx.fillRect(x, y, 3, 3);
            }
        }
        // Shine
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(64, 64);
        ctx.stroke();

        return cvs;
    }

    generateLadder() {
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');
        // Transparent BG

        ctx.fillStyle = '#3e2723';
        // Side rails
        ctx.fillRect(10, 0, 5, 64);
        ctx.fillRect(49, 0, 5, 64);

        // Rungs
        ctx.fillStyle = '#5d4037';
        for (let y = 10; y < 64; y += 10) {
            ctx.fillRect(10, y, 44, 4);
        }
        return cvs;
    }

    generateSteel() {
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');

        ctx.fillStyle = '#455a64'; // Dark Blue-Grey (Non-skid)
        ctx.fillRect(0, 0, 64, 64);

        // Noise
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = Math.random() < 0.5 ? '#37474f' : '#546e7a';
            ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
        }
        return cvs;
    }

    generateVLS() {
        // Missile Silo Hatch
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');

        ctx.fillStyle = '#37474f';
        ctx.fillRect(0, 0, 64, 64);

        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 60, 60);

        // Grid
        ctx.fillStyle = '#b0bec5'; // Hatch
        ctx.fillRect(10, 10, 20, 20);
        ctx.fillRect(34, 10, 20, 20);
        ctx.fillRect(10, 34, 20, 20);
        ctx.fillRect(34, 34, 20, 20);

        return cvs;
    }

    generateHelipad() {
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');

        ctx.fillStyle = '#455a64';
        ctx.fillRect(0, 0, 64, 64);

        // White Marking
        ctx.fillStyle = 'white';
        ctx.fillRect(20, 10, 10, 44); // Left leg
        ctx.fillRect(34, 10, 10, 44); // Right leg
        ctx.fillRect(20, 28, 24, 8);  // Cross bar

        return cvs;
    }

    generateRadar() {
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');

        ctx.fillStyle = '#000';
        ctx.fillRect(10, 10, 44, 44); // Screen

        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(32, 32, 2, 0, Math.PI * 2);
        ctx.fill();

        // Sweep
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(32, 32); ctx.lineTo(48, 16);
        ctx.stroke();

        return cvs;
    }

    generateBed() {
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');

        ctx.fillStyle = '#90caf9'; // Blue sheets
        ctx.fillRect(10, 10, 44, 50);
        ctx.fillStyle = 'white'; // Pillow
        ctx.fillRect(12, 12, 40, 10);
        return cvs;
    }

    generateTable() {
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');

        ctx.fillStyle = '#795548'; // Wood table
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();
        return cvs;
    }

    generateTarget() {
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const ctx = cvs.getContext('2d');

        // Stand
        ctx.fillStyle = '#333';
        ctx.fillRect(28, 40, 8, 24);

        // Circle Red/White
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(32, 25, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(32, 25, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(32, 25, 5, 0, Math.PI * 2);
        ctx.fill();

        return cvs;
    }
}
