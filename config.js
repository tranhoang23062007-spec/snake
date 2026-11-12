/**
 * CẤU HÌNH THÔNG SỐ GAME
 */
const CONFIG = {
    // Kích thước khung vẽ lớn (600x600px) nhưng giữ nguyên lưới 20x20 ô
    CANVAS_SIZE: 600,
    GRID_COUNT: 20,

    // Thông số rắn và tốc độ
    INITIAL_SNAKE_LENGTH: 3,
    INITIAL_SPEED: 140,
    MIN_SPEED: 60,
    SPEED_DECREMENT: 8,
    FOODS_PER_SPEEDUP: 3,

    // Bảng màu giao diện
    COLORS: {
        BACKGROUND: '#0d1322',
        GRID_LINE: '#1e293b',
        SNAKE_HEAD: '#4ade80',
        SNAKE_BODY: '#22c55e',
        SNAKE_EYE: '#052e16',
        FOOD: '#ef4444',
        FOOD_HIGHLIGHT: '#fca5a5',
        BOMB_BODY: '#0f172a',
        BOMB_RING: '#f97316',
        BOMB_CORE: '#ef4444'
    }
};

// Tự động tính kích thước 1 ô vuông trên lưới (600 / 20 = 30px mỗi ô)
CONFIG.TILE_SIZE = CONFIG.CANVAS_SIZE / CONFIG.GRID_COUNT;