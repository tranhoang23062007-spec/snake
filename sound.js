/**
 * BỘ TẠO HIỆU ỨNG ÂM THANH (WEB AUDIO API SYNTHESIZER)
 * Tạo trực tiếp tiếng phím cơ, tiếng nhai táo và tiếng nổ bom không cần file âm thanh ngoài
 */
const SoundManager = {
    ctx: null,
    noiseBuffer: null,

    // Khởi tạo hoặc đánh thức AudioContext khi người chơi bắt đầu game
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.createNoiseBuffer();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Tạo sẵn bộ đệm nhiễu trắng (White Noise) để tái sử dụng cho tiếng nổ, tiếng nhai và tiếng phím
    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 1.0; // 1 giây
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    },

    /**
     * 1. TIẾNG BẤM PHÍM CƠ (MECHANICAL KEYBOARD CLICK / THOCK)
     * Kết hợp âm "tách" ở tần số cao của lá đồng (switch) và âm "bụp" trầm khi keycap chạm đáy
     */
    playKeyClick() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Dao động cao độ ngẫu nhiên nhẹ (±6%) để mỗi phím nghe tự nhiên như gõ thật
        const pitchVar = 0.94 + Math.random() * 0.12;

        // Phần 1: Tiếng "Click" đanh gọn của khấc phím cơ (Bandpass Noise)
        const clickNoise = this.ctx.createBufferSource();
        clickNoise.buffer = this.noiseBuffer;

        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(2800 * pitchVar, now);
        bandpass.Q.setValueAtTime(3.5, now);

        const clickGain = this.ctx.createGain();
        clickGain.gain.setValueAtTime(0.35, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

        clickNoise.connect(bandpass);
        bandpass.connect(clickGain);
        clickGain.connect(this.ctx.destination);

        clickNoise.start(now);
        clickNoise.stop(now + 0.018);

        // Phần 2: Tiếng "Thock" trầm ấm khi phím lún chạm đáy (Bottom-out)
        const thockOsc = this.ctx.createOscillator();
        const thockGain = this.ctx.createGain();

        thockOsc.type = 'triangle';
        thockOsc.frequency.setValueAtTime(250 * pitchVar, now);
        thockOsc.frequency.exponentialRampToValueAtTime(65 * pitchVar, now + 0.038);

        thockGain.gain.setValueAtTime(0.28, now);
        thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        thockOsc.connect(thockGain);
        thockGain.connect(this.ctx.destination);

        thockOsc.start(now);
        thockOsc.stop(now + 0.042);
    },

    /**
     * 2. TIẾNG NHAI TÁO GIÒN (APPLE CRUNCH / CHEWING)
     * Mô phỏng 2 nhịp cắn giòn "rộp - rộp" liên tiếp
     */
    playCrunch() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Tạo 2 nhịp nhai liên tiếp cách nhau 85ms
        const biteOffsets = [0, 0.085];

        biteOffsets.forEach((offset, idx) => {
            const startTime = now + offset;
            const duration = 0.065;

            // Lớp âm giòn xốp (Filtered Noise)
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(idx === 0 ? 1350 : 1150, startTime);
            filter.frequency.exponentialRampToValueAtTime(680, startTime + duration);
            filter.Q.setValueAtTime(1.8, startTime);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.01, startTime);
            noiseGain.gain.linearRampToValueAtTime(0.42, startTime + 0.01);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noise.start(startTime);
            noise.stop(startTime + duration);

            // Lớp âm bật giòn của vỏ táo
            const popOsc = this.ctx.createOscillator();
            const popGain = this.ctx.createGain();

            popOsc.type = 'sine';
            popOsc.frequency.setValueAtTime(340, startTime);
            popOsc.frequency.exponentialRampToValueAtTime(140, startTime + 0.045);

            popGain.gain.setValueAtTime(0.22, startTime);
            popGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.048);

            popOsc.connect(popGain);
            popGain.connect(this.ctx.destination);

            popOsc.start(startTime);
            popOsc.stop(startTime + 0.05);
        });
    },

    /**
     * 3. TIẾNG NỔ BOM (BOMB EXPLOSION)
     * Kết hợp sóng xung kích siêu trầm (Sub-bass) và tiếng nổ rền vang (Lowpass Noise)
     */
    playExplosion() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Phần 1: Sóng xung kích trầm (Sub-bass impact)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();

        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(140, now);
        subOsc.frequency.exponentialRampToValueAtTime(24, now + 0.45);

        subGain.gain.setValueAtTime(0.5, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);

        subOsc.start(now);
        subOsc.stop(now + 0.5);

        // Phần 2: Tiếng nổ rền và mảnh vỡ (Sweeping Lowpass Noise)
        const blastNoise = this.ctx.createBufferSource();
        blastNoise.buffer = this.noiseBuffer;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(1800, now);
        lowpass.frequency.exponentialRampToValueAtTime(90, now + 0.55);

        const blastGain = this.ctx.createGain();
        blastGain.gain.setValueAtTime(0.65, now);
        blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

        blastNoise.connect(lowpass);
        lowpass.connect(blastGain);
        blastGain.connect(this.ctx.destination);

        blastNoise.start(now);
        blastNoise.stop(now + 0.6);
    }
};