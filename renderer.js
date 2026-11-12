/**
 * BỘ VẼ GIAO DIỆN (RENDERER)
 * Đảm nhiệm toàn bộ việc vẽ lên thẻ <canvas>, cập nhật thông số và làm sáng phím mũi tên
 */
const Renderer = {
    canvas: null,
    ctx: null,
    lengthEl: null,
    speedEl: null,
    winsEl: null,
    lossesEl: null,
    overlayEl: null,
    overlayTitleEl: null,
    overlayMsgEl: null,
    restartBtnEl: null,
    pauseOverlayEl: null,
    pauseBtnEl: null,

    // Các phím mũi tên ảo ở góc dưới bên phải
    keyElements: {},
    pressTimeout: null,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_SIZE;
        this.canvas.height = CONFIG.CANVAS_SIZE;

        this.lengthEl = document.getElementById('snake-length');
        this.speedEl = document.getElementById('speed-level');
        this.winsEl = document.getElementById('wins-count');
        this.lossesEl = document.getElementById('losses-count');
        this.overlayEl = document.getElementById('game-overlay');
        this.overlayTitleEl = document.getElementById('overlay-title');
        this.overlayMsgEl = document.getElementById('overlay-message');
        this.restartBtnEl = document.getElementById('restart-btn');
        this.pauseOverlayEl = document.getElementById('pause-overlay');
        this.pauseBtnEl = document.getElementById('pause-btn');

        this.keyElements = {
            up: document.getElementById('key-up'),
            down: document.getElementById('key-down'),
            left: document.getElementById('key-left'),
            right: document.getElementById('key-right')
        };
    },

    // Cập nhật bộ đếm số trận Thắng và Thua ở góc trên bên phải
    updateMatchStats(wins, losses) {
        if (this.winsEl) this.winsEl.textContent = wins;
        if (this.lossesEl) this.lossesEl.textContent = losses;
    },

    // Bật hoặc tắt nút Pause trên thanh tiêu đề
    setPauseButtonEnabled(enabled) {
        if (this.pauseBtnEl) {
            this.pauseBtnEl.disabled = !enabled;
        }
    },

    // Hiển thị hoặc ẩn màn hình Pause Menu
    showPauseOverlay() {
        if (this.pauseOverlayEl) {
            this.pauseOverlayEl.classList.remove('hidden');
        }
    },

    hidePauseOverlay() {
        if (this.pauseOverlayEl) {
            this.pauseOverlayEl.classList.add('hidden');
        }
    },

    // Làm sáng phím mũi tên tương ứng với hướng rẽ của rắn
    highlightDirectionKey(dir, isTurn = false) {
        let activeKey = null;
        if (dir.y === -1) activeKey = this.keyElements.up;
        else if (dir.y === 1) activeKey = this.keyElements.down;
        else if (dir.x === -1) activeKey = this.keyElements.left;
        else if (dir.x === 1) activeKey = this.keyElements.right;

        // Tắt sáng tất cả các phím khác
        Object.values(this.keyElements).forEach(el => {
            if (el && el !== activeKey) {
                el.classList.remove('active', 'pressed');
            }
        });

        if (!activeKey) return;

        // Giữ sáng phím theo hướng hiện tại
        activeKey.classList.add('active');

        // Nếu rắn vừa bẻ lái sang hướng mới, tạo hiệu ứng lún nút và bùng sáng như bấm phím thật
        if (isTurn) {
            activeKey.classList.add('pressed');
            if (this.pressTimeout) clearTimeout(this.pressTimeout);
            this.pressTimeout = setTimeout(() => {
                activeKey.classList.remove('pressed');
            }, 110);
        }
    },

    // Vẽ toàn bộ khung hình game
    drawAll() {
        this.drawBackground();
        this.drawFood();
        this.drawBomb();
        this.drawSnake();
    },

    // 1. Vẽ nền tối và đường lưới
    drawBackground() {
        const ctx = this.ctx;
        ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

        ctx.strokeStyle = CONFIG.COLORS.GRID_LINE;
        ctx.lineWidth = 1;

        for (let i = 0; i <= CONFIG.GRID_COUNT; i++) {
            const pos = i * CONFIG.TILE_SIZE;
            // Kẻ dọc
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, CONFIG.CANVAS_SIZE);
            ctx.stroke();

            // Kẻ ngang
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(CONFIG.CANVAS_SIZE, pos);
            ctx.stroke();
        }
    },

    // 2. Vẽ thức ăn (quả táo đỏ tròn)
    drawFood() {
        if (!ItemManager.food) return;

        const ctx = this.ctx;
        const tile = CONFIG.TILE_SIZE;
        const centerX = ItemManager.food.x * tile + tile / 2;
        const centerY = ItemManager.food.y * tile + tile / 2;
        const radius = tile * 0.4;

        ctx.save();
        ctx.fillStyle = CONFIG.COLORS.FOOD;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Điểm sáng nhỏ trên thức ăn
        ctx.fillStyle = CONFIG.COLORS.FOOD_HIGHLIGHT;
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // 3. Vẽ quả bom duy nhất (vỏ đen, viền cam, chấm đỏ ở giữa)
    drawBomb() {
        if (!ItemManager.bomb) return;

        const ctx = this.ctx;
        const tile = CONFIG.TILE_SIZE;
        const centerX = ItemManager.bomb.x * tile + tile / 2;
        const centerY = ItemManager.bomb.y * tile + tile / 2;
        const radius = tile * 0.42;

        ctx.save();

        // Thân bom màu đen đậm
        ctx.fillStyle = CONFIG.COLORS.BOMB_BODY;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Viền tròn màu cam quanh quả bom
        ctx.strokeStyle = CONFIG.COLORS.BOMB_RING;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Chấm đỏ ở tâm quả bom
        ctx.fillStyle = CONFIG.COLORS.BOMB_CORE;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.38, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // 4. Vẽ con rắn
    drawSnake() {
        const ctx = this.ctx;
        const tile = CONFIG.TILE_SIZE;

        Snake.body.forEach((segment, index) => {
            const x = segment.x * tile;
            const y = segment.y * tile;
            const isHead = (index === 0);

            ctx.fillStyle = isHead ? CONFIG.COLORS.SNAKE_HEAD : CONFIG.COLORS.SNAKE_BODY;

            // Vẽ từng đốt rắn có khoảng hở nhẹ 1px
            ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);

            // Vẽ mắt cho đầu rắn
            if (isHead) {
                ctx.fillStyle = CONFIG.COLORS.SNAKE_EYE;
                const eyeSize = Math.max(2, tile * 0.15);
                const centerX = x + tile / 2;
                const centerY = y + tile / 2;
                const offsetForward = tile * 0.2;
                const offsetSide = tile * 0.22;

                const dir = Snake.direction;
                const eye1X = centerX + dir.x * offsetForward - dir.y * offsetSide - eyeSize / 2;
                const eye1Y = centerY + dir.y * offsetForward + dir.x * offsetSide - eyeSize / 2;
                const eye2X = centerX + dir.x * offsetForward + dir.y * offsetSide - eyeSize / 2;
                const eye2Y = centerY + dir.y * offsetForward - dir.x * offsetSide - eyeSize / 2;

                ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
                ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
            }
        });
    },

    // Cập nhật số liệu Độ dài và Tốc độ trên thanh trạng thái
    updateStats(length, currentSpeed) {
        this.lengthEl.textContent = length;
        const speedPercent = Math.round((CONFIG.INITIAL_SPEED / currentSpeed) * 100);
        this.speedEl.textContent = speedPercent + '%';
    },

    // Hiển thị hoặc ẩn màn hình thông báo (Start / Game Over)
    showOverlay(title, message, buttonText) {
        this.overlayTitleEl.textContent = title;
        this.overlayMsgEl.textContent = message;
        this.restartBtnEl.textContent = buttonText;
        this.overlayEl.classList.remove('hidden');
    },

    hideOverlay() {
        this.overlayEl.classList.add('hidden');
    }
};