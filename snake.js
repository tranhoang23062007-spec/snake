/**
 * QUẢN LÝ LOGIC CỦA RẮN
 * Bao gồm khởi tạo, di chuyển, đổi hướng, dài ra và ngắn lại
 */
const Snake = {
    body: [],                   // Mảng chứa tọa độ các đốt [{x, y}, ...]
    direction: { x: 1, y: 0 },  // Hướng di chuyển thực tế ở nhịp hiện tại
    nextDirection: { x: 1, y: 0 }, // Hướng người chơi vừa bấm phím

    // Khởi tạo lại rắn ở giữa bản đồ
    init() {
        const startX = Math.floor(CONFIG.GRID_COUNT / 2);
        const startY = Math.floor(CONFIG.GRID_COUNT / 2);

        this.body = [];
        for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
            this.body.push({ x: startX - i, y: startY });
        }

        // Mặc định ban đầu bò sang phải
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
    },

    // Lấy tọa độ đầu rắn hiện tại
    getHead() {
        return this.body[0];
    },

    // Lấy độ dài hiện tại của rắn
    getLength() {
        return this.body.length;
    },

    // Đổi hướng di chuyển (chặn quay đầu 180 độ ngay lập tức)
    setDirection(newDir) {
        const isOppositeX = (newDir.x + this.direction.x === 0);
        const isOppositeY = (newDir.y + this.direction.y === 0);

        // Nếu hướng mới không ngược hoàn toàn với hướng đang đi thì mới nhận
        if (!isOppositeX || !isOppositeY) {
            this.nextDirection = newDir;
        }
    },

    // Tính toán vị trí đầu mới ở bước tiếp theo
    getNextHeadPosition() {
        this.direction = { ...this.nextDirection };
        const head = this.getHead();
        return {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
    },

    // Thêm đốt đầu mới khi rắn tiến lên 1 ô
    addHead(newHeadPos) {
        this.body.unshift(newHeadPos);
    },

    // Xóa đốt đuôi cuối cùng (dùng khi di chuyển bình thường hoặc bị trừ đốt)
    removeTail() {
        this.body.pop();
    },

    // Kiểm tra một tọa độ (x, y) có nằm trên thân rắn hay không
    isOnSnake(pos, ignoreTail = false) {
        const checkLength = ignoreTail ? this.body.length - 1 : this.body.length;
        for (let i = 0; i < checkLength; i++) {
            if (this.body[i].x === pos.x && this.body[i].y === pos.y) {
                return true;
            }
        }
        return false;
    }
};