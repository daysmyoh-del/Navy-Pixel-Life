export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration, volume = 0.1) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, volume = 0.1) {
        if (!this.enabled) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();

        // Lowpass filter for explosion/thud
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playSiren() {
        // Modulated siren
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();

        osc.type = 'sawtooth';
        osc.frequency.value = 400; // base freq

        lfo.type = 'sine';
        lfo.frequency.value = 0.5; // slow modulation
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 200; // range

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.value = 0.05;

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        lfo.start();

        // Stop after 5 seconds
        setTimeout(() => {
            osc.stop();
            lfo.stop();
        }, 5000);
    }

    playCannon() {
        this.playNoise(0.5, 0.3); // Boom
        this.playTone(100, 'square', 0.2, 0.1); // Thud
    }

    playTalk() {
        // Random blip
        const freq = 200 + Math.random() * 300;
        this.playTone(freq, 'triangle', 0.1, 0.05);
    }
}
