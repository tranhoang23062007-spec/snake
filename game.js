/**
 * ĐIỀU KHIỂN VÒNG LẶP CHÍNH VÀ TRẠNG THÁI GAME
 */
const Game = {
    state: 'READY', // Các trạng thái: 'READY' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'WIN'
    timerId: null,
    currentSpeed: CONFIG.INITIAL_SPEED,
    foodsEaten: 0,
    wins: 0,        // Số trận thắng
    losses: 0,      // Số trận thua

    // Lấy độ dài tối đa (tổng số ô trên bản đồ)
    getMaxLength() {
        return CONFIG.GRID_COUNT * CONFIG.GRID_COUNT;
    },

    // Khởi tạo lần đầu khi tải trang
    init() {
        Renderer.init();
        Snake.init();
        ItemManager.init();
        Renderer.updateStats(Snake.getLength(), this.currentSpeed);
        Renderer.updateMatchStats(this.wins, this.losses);
        Renderer.setPauseButtonEnabled(false);
        Renderer.highlightDirectionKey(Snake.direction, false);
        Renderer.drawAll();
    },

    // Bắt đầu hoặc Chơi lại ván mới
    start() {
        if (this.timerId) {
            clearInterval(this.timerId);
        }

        // Khởi tạo bộ phát âm thanh khi người chơi bấm bắt đầu
        SoundManager.init();

        this.state = 'PLAYING';
        this.currentSpeed = CONFIG.INITIAL_SPEED;
        this.foodsEaten = 0;

        Snake.init();
        ItemManager.init();
        SnakeAI.reset();

        Renderer.hideOverlay();
        Renderer.hidePauseOverlay();
        Renderer.setPauseButtonEnabled(true);
        Renderer.updateStats(Snake.getLength(), this.currentSpeed);
        Renderer.highlightDirectionKey(Snake.direction, true);
        SoundManager.playKeyClick();
        Renderer.drawAll();

        this.startLoop();
    },

    // Tạm dừng trận đấu
    pause() {
        if (this.state !== 'PLAYING') return;

        this.state = 'PAUSED';
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        Renderer.showPauseOverlay();
    },

    // Chơi tiếp khi đang tạm dừng
    resume() {
        if (this.state !== 'PAUSED') return;

        this.state = 'PLAYING';
        Renderer.hidePauseOverlay();
        this.startLoop();
    },

    // Đầu hàng: tính 1 trận thua và chuyển sang màn hình kết thúc
    surrender() {
        if (this.state !== 'PAUSED' && this.state !== 'PLAYING') return;

        Renderer.hidePauseOverlay();
        this.gameOver('You surrendered the match!');
    },

    // Thoát ra sảnh: tính 1 trận thua và đưa bàn chơi về màn hình sảnh chờ ban đầu
    exitToLobby() {
        if (this.state !== 'PAUSED' && this.state !== 'PLAYING') return;

        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        // Tăng số trận thua thêm 1
        this.losses++;
        Renderer.updateMatchStats(this.wins, this.losses);

        // Đặt lại trạng thái về sảnh chờ (READY)
        this.state = 'READY';
        this.currentSpeed = CONFIG.INITIAL_SPEED;
        this.foodsEaten = 0;

        Snake.init();
        ItemManager.init();
        SnakeAI.reset();

        Renderer.hidePauseOverlay();
        Renderer.setPauseButtonEnabled(false);
        Renderer.updateStats(Snake.getLength(), this.currentSpeed);
        Renderer.highlightDirectionKey(Snake.direction, false);
        Renderer.drawAll();

        Renderer.showOverlay(
            'READY?',
            'Eat red apples to grow, avoid the bomb!',
            'Start Game'
        );
    },

    // Thiết lập vòng lặp chính theo tốc độ hiện tại
    startLoop() {
        if (this.timerId) {
            clearInterval(this.timerId);
        }
        this.timerId = setInterval(() => {
            this.update();
        }, this.currentSpeed);
    },

    // Xử lý logic mỗi nhịp (tick)
    update() {
        if (this.state !== 'PLAYING') return;

        // 1. Tính toán hướng đi tiếp theo, nháy đèn phím mũi tên và phát tiếng phím cơ nếu rắn đổi hướng
        const prevDir = { ...Snake.direction };
        const nextDir = SnakeAI.getNextDirection();
        const isTurn = (nextDir.x !== prevDir.x || nextDir.y !== prevDir.y);

        Snake.setDirection(nextDir);
        Renderer.highlightDirectionKey(nextDir, isTurn);
        if (isTurn) {
            SoundManager.playKeyClick();
        }

        // 2. Tính tọa độ đầu rắn ở bước tiếp theo
        const nextHead = Snake.getNextHeadPosition();

        // 3. Kiểm tra va chạm tường
        if (this.isWallCollision(nextHead)) {
            this.gameOver('You hit the wall!');
            return;
        }

        // 4. Kiểm tra tự cắn vào thân (bỏ qua đốt đuôi cuối nếu không ăn táo)
        const willEatFood = (
            ItemManager.food !== null &&
            nextHead.x === ItemManager.food.x &&
            nextHead.y === ItemManager.food.y
        );

        if (Snake.isOnSnake(nextHead, !willEatFood)) {
            this.gameOver('You ran into yourself!');
            return;
        }

        // 5. Cho rắn tiến lên 1 ô
        Snake.addHead(nextHead);

        // 6. Xử lý ăn thức ăn hoặc ăn phải bom
        if (willEatFood) {
            // Phát tiếng nhai táo giòn
            SoundManager.playCrunch();

            this.foodsEaten++;
            SnakeAI.onEatFood();

            // KIỂM TRA THẮNG: Rắn đã phủ kín toàn bộ bản đồ (Current Length = Max)
            if (Snake.getLength() >= this.getMaxLength()) {
                ItemManager.food = null;
                ItemManager.bomb = null;
                Renderer.updateStats(Snake.getLength(), this.currentSpeed);
                Renderer.drawAll();
                this.gameWin();
                return;
            }

            ItemManager.spawnFood();
            this.checkSpeedUp();
        } else {
            // Không ăn táo: rút đốt đuôi để giữ nguyên độ dài khi di chuyển
            Snake.removeTail();

            // Kiểm tra xem ô vừa bước vào có phải là quả Bom không
            const hitBomb = (
                ItemManager.bomb !== null &&
                nextHead.x === ItemManager.bomb.x &&
                nextHead.y === ItemManager.bomb.y
            );

            if (hitBomb) {
                // Phát tiếng bom nổ
                SoundManager.playExplosion();

                // Trừ đi 1 đốt do trúng bom
                Snake.removeTail();

                // KIỂM TRA THUA: Ăn quá nhiều bom khiến độ dài về 0 (Current Length = 0)
                if (Snake.getLength() === 0) {
                    Renderer.updateStats(0, this.currentSpeed);
                    Renderer.drawAll();
                    this.gameOver('You ate too many bombs! Your length reached 0.');
                    return;
                }

                // Nếu vẫn còn đốt thì sinh bom mới ở vị trí khác
                ItemManager.spawnBomb();
            }
        }

        // 7. Cập nhật thông số độ dài và vẽ lại màn hình
        Renderer.updateStats(Snake.getLength(), this.currentSpeed);
        Renderer.drawAll();
    },

    // Kiểm tra tọa độ có vượt ra ngoài biên lưới hay không
    isWallCollision(pos) {
        return (
            pos.x < 0 ||
            pos.x >= CONFIG.GRID_COUNT ||
            pos.y < 0 ||
            pos.y >= CONFIG.GRID_COUNT
        );
    },

    // Tăng tốc nhẹ sau mỗi vài lần ăn mồi
    checkSpeedUp() {
        if (this.foodsEaten % CONFIG.FOODS_PER_SPEEDUP === 0) {
            const newSpeed = Math.max(CONFIG.MIN_SPEED, this.currentSpeed - CONFIG.SPEED_DECREMENT);
            if (newSpeed !== this.currentSpeed) {
                this.currentSpeed = newSpeed;
                this.startLoop();
            }
        }
    },

    // Kết thúc khi THUA (LOST)
    gameOver(reason) {
        this.state = 'GAMEOVER';
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        this.losses++;
        Renderer.updateMatchStats(this.wins, this.losses);
        Renderer.setPauseButtonEnabled(false);

        const finalLength = Snake.getLength();
        Renderer.showOverlay(
            'YOU LOST',
            `${reason} Final length: ${finalLength}.`,
            'Play Again'
        );
    },

    // Kết thúc khi THẮNG (WIN - rắn phủ kín bản đồ)
    gameWin() {
        this.state = 'WIN';
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        this.wins++;
        Renderer.updateMatchStats(this.wins, this.losses);
        Renderer.setPauseButtonEnabled(false);

        const maxLength = this.getMaxLength();
        Renderer.showOverlay(
            'YOU WIN!',
            `Amazing! You covered the entire map! Max length: ${maxLength}.`,
            'Play Again'
        );
    }
};