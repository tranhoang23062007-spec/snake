/**
 * QUẢN LÝ THỨC ĂN VÀ BOM
 * Cả thức ăn và bom đều xuất hiện ngẫu nhiên 1 quả duy nhất và không tự biến mất
 */
const ItemManager = {
    food: null, // Tọa độ thức ăn { x, y } hoặc null
    bomb: null, // Tọa độ bom { x, y } hoặc null

    // Khởi tạo thức ăn và bom khi bắt đầu ván mới
    init() {
        this.food = null;
        this.bomb = null;
        this.spawnFood();
        this.spawnBomb();
    },

    // Tìm một ô trống ngẫu nhiên trên lưới
    getRandomFreeCell(excludePos = null) {
        const freeCells = [];

        for (let x = 0; x < CONFIG.GRID_COUNT; x++) {
            for (let y = 0; y < CONFIG.GRID_COUNT; y++) {
                const pos = { x, y };

                // Không đặt lên thân rắn
                if (Snake.isOnSnake(pos)) continue;

                // Không đặt trùng vị trí thức ăn hiện tại
                if (this.food && this.food.x === x && this.food.y === y) continue;

                // Không đặt trùng vị trí bom hiện tại
                if (this.bomb && this.bomb.x === x && this.bomb.y === y) continue;

                // Không đặt trùng lại đúng ô vừa bị ăn
                if (excludePos && excludePos.x === x && excludePos.y === y) continue;

                freeCells.push(pos);
            }
        }

        // Nếu không còn ô trống nào
        if (freeCells.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * freeCells.length);
        return freeCells[randomIndex];
    },

    // Sinh thức ăn mới ở vị trí ngẫu nhiên
    spawnFood() {
        const nextCell = this.getRandomFreeCell(this.food);

        if (nextCell) {
            this.food = nextCell;
        } else if (this.bomb && !Snake.isOnSnake(this.bomb)) {
            // Khi bản đồ chỉ còn đúng 1 ô cuối cùng đang chứa bom:
            // Xóa bom và đặt quả táo cuối cùng vào đó để người chơi có thể đạt độ dài tối đa
            this.food = { x: this.bomb.x, y: this.bomb.y };
            this.bomb = null;
        } else {
            this.food = null;
        }
    },

    // Sinh 1 quả bom duy nhất ở vị trí ngẫu nhiên
    spawnBomb() {
        this.bomb = this.getRandomFreeCell(this.bomb);
    }
};