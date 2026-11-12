/**
 * XỬ LÝ SỰ KIỆN KHỞI ĐỘNG VÀ MENU TẠM DỪNG
 */
const Input = {
    init() {
        // Lắng nghe phím Space (Bắt đầu/Chơi lại) và phím Escape (Tạm dừng/Chơi tiếp)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                e.preventDefault();
                if (Game.state === 'PLAYING') {
                    Game.pause();
                } else if (Game.state === 'PAUSED') {
                    Game.resume();
                }
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                if (Game.state === 'READY' || Game.state === 'GAMEOVER' || Game.state === 'WIN') {
                    Game.start();
                }
            }
        });

        // Nút "Start Game / Play Again"
        const restartBtn = document.getElementById('restart-btn');
        restartBtn.addEventListener('click', () => {
            Game.start();
        });

        // Nút "Pause" trên thanh tiêu đề
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.addEventListener('click', () => {
            if (Game.state === 'PLAYING') {
                Game.pause();
            } else if (Game.state === 'PAUSED') {
                Game.resume();
            }
            pauseBtn.blur();
        });

        // Nút "Resume" (Chơi tiếp) trong menu tạm dừng
        const resumeBtn = document.getElementById('resume-btn');
        resumeBtn.addEventListener('click', () => {
            Game.resume();
        });

        // Nút "Surrender" (Đầu hàng -> +1 Loss)
        const surrenderBtn = document.getElementById('surrender-btn');
        surrenderBtn.addEventListener('click', () => {
            Game.surrender();
        });

        // Nút "Exit to Lobby" (Thoát ra sảnh -> +1 Loss)
        const lobbyBtn = document.getElementById('lobby-btn');
        lobbyBtn.addEventListener('click', () => {
            Game.exitToLobby();
        });
    }
};

// Khởi chạy toàn bộ game sau khi trang HTML đã tải xong
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
    Input.init();
});