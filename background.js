/**
 * HỆ THỐNG CẢNH NỀN ĐỘNG TOÀN MÀN HÌNH (SKY & GALAXY ANIMATED BACKGROUND)
 * Tự động chuyển đổi mượt mà giữa 4 bầu trời/thiên hà sau mỗi 90 giây (1.5 phút)
 */
const Background = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,

    // Thời gian mỗi cảnh: 90,000ms (1.5 phút) và thời gian chuyển cảnh: 3,000ms
    SCENE_DURATION: 90000,
    TRANSITION_DURATION: 3000,

    currentScene: 0,
    nextScene: 1,
    lastSwitchTime: 0,
    isTransitioning: false,
    transitionStart: 0,

    stars: [],
    shootingStars: [],
    clouds: [],
    fireflies: [],

    SCENES: [
        {
            name: 'Deep Spiral Galaxy',
            topColor: '#030712',
            midColor: '#0f172a',
            bottomColor: '#1e1b4b',
            nebulaColor1: 'rgba(139, 92, 246, 0.16)',
            nebulaColor2: 'rgba(56, 189, 248, 0.14)'
        },
        {
            name: 'Aurora Borealis Sky',
            topColor: '#020617',
            midColor: '#06283d',
            bottomColor: '#0f3d3e',
            nebulaColor1: 'rgba(52, 211, 153, 0.18)',
            nebulaColor2: 'rgba(45, 212, 191, 0.12)'
        },
        {
            name: 'Twilight Sky & Fireflies',
            topColor: '#0f172a',
            midColor: '#311042',
            bottomColor: '#5b2146',
            nebulaColor1: 'rgba(244, 114, 182, 0.14)',
            nebulaColor2: 'rgba(251, 146, 60, 0.14)'
        },
        {
            name: 'Supernova Nebula',
            topColor: '#090514',
            midColor: '#1e1136',
            bottomColor: '#172554',
            nebulaColor1: 'rgba(236, 72, 153, 0.16)',
            nebulaColor2: 'rgba(99, 102, 241, 0.18)'
        }
    ],

    init() {
        this.canvas = document.getElementById('bg-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initEntities();
        this.lastSwitchTime = performance.now();

        requestAnimationFrame((ts) => this.animate(ts));
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.initEntities();
    },

    initEntities() {
        // Tạo 180 ngôi sao lấp lánh
        this.stars = [];
        for (let i = 0; i < 180; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 1.8 + 0.4,
                alpha: Math.random(),
                twinkleSpeed: Math.random() * 0.025 + 0.005,
                driftX: (Math.random() - 0.5) * 0.15,
                driftY: (Math.random() - 0.5) * 0.15,
                hue: Math.random() > 0.7 ? 200 + Math.random() * 80 : 0
            });
        }

        // Tạo các dải mây/tinh vân trôi nhẹ
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.min(this.width, this.height) * (0.28 + Math.random() * 0.22),
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.2,
                isPrimary: i % 2 === 0
            });
        }

        // Tạo các hạt đom đóm / bụi vũ trụ bay lên
        this.fireflies = [];
        for (let i = 0; i < 35; i++) {
            this.fireflies.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vy: -(Math.random() * 0.6 + 0.2),
                vx: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2.5 + 1,
                phase: Math.random() * Math.PI * 2
            });
        }

        this.shootingStars = [];
    },

    // Spawn sao băng ngẫu nhiên
    maybeSpawnShootingStar() {
        if (this.shootingStars.length < 2 && Math.random() < 0.012) {
            this.shootingStars.push({
                x: Math.random() * this.width * 0.8 + this.width * 0.1,
                y: Math.random() * this.height * 0.4,
                vx: -(Math.random() * 7 + 6),
                vy: Math.random() * 4 + 3,
                length: Math.random() * 90 + 60,
                life: 1.0
            });
        }
    },

    // Vẽ một cảnh theo cấu hình màu
    renderSceneLayer(scene, timestamp, alpha = 1) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = alpha;

        // 1. Nền Gradient bầu trời
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, scene.topColor);
        grad.addColorStop(0.55, scene.midColor);
        grad.addColorStop(1, scene.bottomColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Vẽ các đám mây tinh vân (Nebula)
        for (const c of this.clouds) {
            const radial = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, c.radius);
            radial.addColorStop(0, c.isPrimary ? scene.nebulaColor1 : scene.nebulaColor2);
            radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = radial;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Vẽ dải cực quang uốn lượn (nổi bật ở cảnh Aurora & Galaxy)
        this.drawAuroraWaves(timestamp, scene);

        ctx.restore();
    },

    // Vẽ sóng ánh sáng cực quang / dải ngân hà
    drawAuroraWaves(timestamp, scene) {
        const ctx = this.ctx;
        const time = timestamp * 0.0007;

        for (let band = 0; band < 2; band++) {
            ctx.beginPath();
            const baseY = this.height * (0.28 + band * 0.18);
            ctx.moveTo(0, this.height);

            for (let x = 0; x <= this.width; x += 40) {
                const waveY =
                    baseY +
                    Math.sin(x * 0.003 + time + band * 2) * 55 +
                    Math.cos(x * 0.007 - time * 1.3) * 30;
                ctx.lineTo(x, waveY);
            }

            ctx.lineTo(this.width, this.height);
            ctx.closePath();

            const auroraGrad = ctx.createLinearGradient(0, baseY - 80, 0, this.height);
            auroraGrad.addColorStop(0, band === 0 ? scene.nebulaColor1 : scene.nebulaColor2);
            auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = auroraGrad;
            ctx.fill();
        }
    },

    // Vẽ sao lấp lánh, đom đóm và sao băng
    renderForegroundParticles(timestamp) {
        const ctx = this.ctx;

        // Cập nhật vị trí mây tinh vân
        for (const c of this.clouds) {
            c.x += c.vx;
            c.y += c.vy;
            if (c.x < -c.radius) c.x = this.width + c.radius;
            if (c.x > this.width + c.radius) c.x = -c.radius;
            if (c.y < -c.radius) c.y = this.height + c.radius;
            if (c.y > this.height + c.radius) c.y = -c.radius;
        }

        // Vẽ các ngôi sao
        for (const s of this.stars) {
            s.x += s.driftX;
            s.y += s.driftY;
            if (s.x < 0) s.x = this.width;
            if (s.x > this.width) s.x = 0;
            if (s.y < 0) s.y = this.height;
            if (s.y > this.height) s.y = 0;

            s.alpha += s.twinkleSpeed;
            if (s.alpha > 1 || s.alpha < 0.2) s.twinkleSpeed *= -1;

            ctx.fillStyle = s.hue
                ? `hsla(${s.hue}, 80%, 85%, ${Math.max(0.15, Math.min(1, s.alpha))})`
                : `rgba(255, 255, 255, ${Math.max(0.15, Math.min(1, s.alpha))})`;

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Vẽ hạt ánh sáng / đom đóm bay lơ lửng
        for (const f of this.fireflies) {
            f.x += f.vx + Math.sin(timestamp * 0.002 + f.phase) * 0.25;
            f.y += f.vy;
            if (f.y < -10) {
                f.y = this.height + 10;
                f.x = Math.random() * this.width;
            }

            const glow = 0.4 + 0.4 * Math.sin(timestamp * 0.004 + f.phase);
            ctx.fillStyle = `rgba(167, 243, 208, ${glow})`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Vẽ sao băng
        this.maybeSpawnShootingStar();
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const st = this.shootingStars[i];
            st.x += st.vx;
            st.y += st.vy;
            st.life -= 0.018;

            if (st.life <= 0) {
                this.shootingStars.splice(i, 1);
                continue;
            }

            const tailX = st.x - st.vx * (st.length / 10);
            const tailY = st.y - st.vy * (st.length / 10);

            const lineGrad = ctx.createLinearGradient(st.x, st.y, tailX, tailY);
            lineGrad.addColorStop(0, `rgba(255, 255, 255, ${st.life})`);
            lineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(st.x, st.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
        }
    },

    animate(timestamp) {
        // Kiểm tra đến lúc chuyển cảnh (sau mỗi 90 giây)
        if (!this.isTransitioning && timestamp - this.lastSwitchTime >= this.SCENE_DURATION) {
            this.isTransitioning = true;
            this.transitionStart = timestamp;
            this.nextScene = (this.currentScene + 1) % this.SCENES.length;
        }

        if (this.isTransitioning) {
            const progress = Math.min(1, (timestamp - this.transitionStart) / this.TRANSITION_DURATION);
            this.renderSceneLayer(this.SCENES[this.currentScene], timestamp, 1);
            this.renderSceneLayer(this.SCENES[this.nextScene], timestamp, progress);

            if (progress >= 1) {
                this.currentScene = this.nextScene;
                this.isTransitioning = false;
                this.lastSwitchTime = timestamp;
            }
        } else {
            this.renderSceneLayer(this.SCENES[this.currentScene], timestamp, 1);
        }

        this.renderForegroundParticles(timestamp);

        requestAnimationFrame((ts) => this.animate(ts));
    }
};

window.addEventListener('DOMContentLoaded', () => {
    Background.init();
});