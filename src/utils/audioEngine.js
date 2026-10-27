/**
 * Ambient Audio & Chimes Engine using Web Audio API
 * Generates procedural soothing nature sounds and crystalline gratitude chimes
 */

class SpiritualAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.activeNodes = [];
    this.timerIds = [];
    this.volume = 0.4;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  stopAll() {
    this.timerIds.forEach(id => clearInterval(id));
    this.timerIds = [];

    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // ignore already stopped
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentTrack = null;
  }

  // Play serene organic wooden tasbeeh bead click (100% non-musical spiritual dhikr sound)
  playGratitudeChime() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Tactile Wooden Bead Impact Transient (Organic resonant wood knock, zero musical notes)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.05); // 50ms burst
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.007));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Resonant bandpass filter modeling solid olive wood contact
    const woodFilter = this.ctx.createBiquadFilter();
    woodFilter.type = 'bandpass';
    woodFilter.frequency.setValueAtTime(720 + (Math.random() * 30 - 15), now);
    woodFilter.Q.setValueAtTime(4.2, now);

    const woodGain = this.ctx.createGain();
    woodGain.gain.setValueAtTime(0.28, now);
    woodGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    noiseSource.connect(woodFilter);
    woodFilter.connect(woodGain);
    woodGain.connect(this.masterGain);
    noiseSource.start(now);

    // 2. Physical mass knock (tactile micro-body of the bead, decaying in 35ms)
    const oscBody = this.ctx.createOscillator();
    const gainBody = this.ctx.createGain();
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(135, now);
    oscBody.frequency.exponentialRampToValueAtTime(50, now + 0.035);

    gainBody.gain.setValueAtTime(0.22, now);
    gainBody.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    oscBody.connect(gainBody);
    gainBody.connect(this.masterGain);
    oscBody.start(now);
    oscBody.stop(now + 0.055);

    // 3. Gentle breath of serenity (very soft, quiet air whisper of relief and peace)
    const airSize = Math.floor(this.ctx.sampleRate * 0.22);
    const airBuffer = this.ctx.createBuffer(1, airSize, this.ctx.sampleRate);
    const airData = airBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < airSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      airData[i] = lastOut;
    }

    const airSource = this.ctx.createBufferSource();
    airSource.buffer = airBuffer;

    const airFilter = this.ctx.createBiquadFilter();
    airFilter.type = 'lowpass';
    airFilter.frequency.setValueAtTime(360, now);

    const airGain = this.ctx.createGain();
    airGain.gain.setValueAtTime(0, now);
    airGain.gain.linearRampToValueAtTime(0.06, now + 0.03);
    airGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    airSource.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(this.masterGain);
    airSource.start(now);
  }

  // Start selected ambient soundscape
  playTrack(trackId) {
    this.init();
    if (!this.ctx) return;

    this.stopAll();
    this.currentTrack = trackId;
    this.isPlaying = true;

    switch (trackId) {
      case 'rain':
        this._startRain();
        break;
      case 'breeze':
        this._startBreeze();
        break;
      case 'drone':
        this._startSpiritualDrone();
        break;
      case 'birds':
        this._startMorningBirds();
        break;
      default:
        this.isPlaying = false;
        break;
    }
  }

  // Procedural Light Rain soundscape
  _startRain() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    // Pink noise generation
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, rainGain);

    // Random soft droplets
    const dropInterval = setInterval(() => {
      if (!this.isPlaying || this.currentTrack !== 'rain') return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();

      const freq = 1200 + Math.random() * 1800;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.08);

      dropGain.gain.setValueAtTime(0.04, now);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(dropGain);
      dropGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    }, 180);

    this.timerIds.push(dropInterval);
  }

  // Procedural Gentle Breeze / Wind
  _startBreeze() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(320, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // LFO for slow wind modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8 second wave
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);
    lfo.connect(bandpass.frequency);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    noise.connect(bandpass);
    bandpass.connect(windGain);
    windGain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, bandpass, lfo, lfoGain, windGain);
  }

  // Procedural Serene Spiritual 432Hz Harmonic Drone
  _startSpiritualDrone() {
    const freqs = [108, 216, 324, 432]; // warm 432Hz harmonic series
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const subVol = 0.08 / (idx + 1);
      gain.gain.setValueAtTime(subVol, this.ctx.currentTime);

      // Gentle vibrato / tremolo
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      lfo.connect(gain.gain);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      lfo.start();
      this.activeNodes.push(osc, gain, lfo, lfoGain);
    });
  }

  // Procedural Morning Birds Chirps & Quiet Dawn
  _startMorningBirds() {
    // Underlying gentle air
    this._startBreeze();

    const birdInterval = setInterval(() => {
      if (!this.isPlaying || this.currentTrack !== 'birds') return;
      if (Math.random() > 0.45) {
        this._playBirdChirp();
      }
    }, 1200);

    this.timerIds.push(birdInterval);
  }

  _playBirdChirp() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const baseFreq = 2200 + Math.random() * 1200;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.12);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export const audioEngine = new SpiritualAudioEngine();
