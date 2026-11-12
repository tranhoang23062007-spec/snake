/**
 * TRÍ TUỆ NHÂN TẠO TỰ ĐỘNG CHƠI (SNAKE AI)
 */
const SnakeAI = {
    stepsWithoutFood: 0,

    // Các hướng di chuyển chuẩn
    DIRS: [
        { x: 0, y: -1 }, // Lên
        { x: 0, y: 1 },  // Xuống
        { x: -1, y: 0 }, // Trái
        { x: 1, y: 0 }   // Phải
    ],

    reset() {
        this.stepsWithoutFood = 0;
    },

    onEatFood() {
        this.stepsWithoutFood = 0;
    },

    // Hàm chính quyết định hướng đi tiếp theo của AI ở mỗi bước
    getNextDirection() {
        this.stepsWithoutFood++;

        const currentBody = this.cloneBody(Snake.body);
        const currentDir = Snake.direction;
        const food = ItemManager.food;
        const bomb = ItemManager.bomb;

        // Lấy danh sách các hướng rẽ hợp lệ (không quay đầu 180 độ)
        const candidateDirs = this.DIRS.filter(d => {
            return !(d.x + currentDir.x === 0 && d.y + currentDir.y === 0);
        });

        // Lọc các bước đi hợp lệ ngay trước mắt (không đâm tường, không tự cắn mình)
        const validMoves = [];
        for (const dir of candidateDirs) {
            const nextPos = {
                x: currentBody[0].x + dir.x,
                y: currentBody[0].y + dir.y
            };

            if (this.isOutOfBounds(nextPos)) continue;

            const willEat = (food && nextPos.x === food.x && nextPos.y === food.y);
            const hitBomb = (bomb && nextPos.x === bomb.x && nextPos.y === bomb.y);

            // Kiểm tra va chạm thân
            if (this.isPosOnBody(nextPos, currentBody, !willEat)) continue;

            // Nếu chỉ còn 1 đốt thì tuyệt đối không được bước vào bom
            if (hitBomb && currentBody.length <= 1) continue;

            validMoves.push({
                dir,
                nextPos,
                willEat,
                hitBomb
            });
        }

        // Nếu không còn bước nào hợp lệ, giữ nguyên hướng cũ
        if (validMoves.length === 0) {
            return currentDir;
        }

        // Tách riêng các bước KHÔNG dẫm vào bom và bước dẫm vào bom
        const nonBombMoves = validMoves.filter(m => !m.hitBomb);

        // =========================================================================
        // BƯỚC 1: TÌM ĐƯỜNG AN TOÀN TỚI TÁO (BFS + GIẢ LẬP RẮN ẢO KIỂM TRA ĐUÔI)
        // =========================================================================
        if (food && nonBombMoves.length > 0) {
            let bestSafeFoodMove = null;
            let bestPathLen = Infinity;
            let bestCompactScore = -Infinity;

            for (const move of nonBombMoves) {
                const simBody1 = this.simulateStep(currentBody, move.nextPos, food, bomb);

                // Nếu bước này ăn luôn quả táo cuối cùng trên bản đồ -> đi ngay để Win!
                if (move.willEat && simBody1.length >= CONFIG.GRID_COUNT * CONFIG.GRID_COUNT) {
                    return move.dir;
                }

                let totalDist = Infinity;
                let finalVirtualBody = null;

                if (move.willEat) {
                    totalDist = 1;
                    finalVirtualBody = simBody1;
                } else {
                    const pathToFood = this.bfsPath(move.nextPos, food, simBody1, bomb, false);
                    if (pathToFood) {
                        totalDist = 1 + pathToFood.length;
                        finalVirtualBody = this.simulatePath(simBody1, pathToFood, food, bomb);
                    }
                }

                // Kiểm tra ở trạng thái sau khi ăn Táo, rắn ảo có còn nhìn thấy đuôi của nó không
                if (finalVirtualBody && this.canReachTail(finalVirtualBody, bomb) >= 0) {
                    const compactScore = this.getCompactnessScore(move.nextPos, currentBody);

                    if (
                        totalDist < bestPathLen ||
                        (totalDist === bestPathLen && compactScore > bestCompactScore)
                    ) {
                        bestPathLen = totalDist;
                        bestCompactScore = compactScore;
                        bestSafeFoodMove = move.dir;
                    }
                }
            }

            if (bestSafeFoodMove) {
                return bestSafeFoodMove;
            }
        }

        // =========================================================================
        // BƯỚC 2: PHÁ BOM CHIẾN THUẬT (NẾU BỊ KẸT LẶP QUÁ LÂU HOẶC BOM CHẶN ĐƯỜNG)
        // =========================================================================
        const stallThreshold = CONFIG.GRID_COUNT * CONFIG.GRID_COUNT * 1.2;
        if (bomb && this.stepsWithoutFood > stallThreshold && currentBody.length > 4) {
            const bombMove = this.findSafeMoveToBomb(nonBombMoves, validMoves, currentBody, food, bomb);
            if (bombMove) {
                this.stepsWithoutFood = 0;
                return bombMove;
            }
        }

        // =========================================================================
        // BƯỚC 3: CHẾ ĐỘ BÁM ĐUÔI (TAIL-CHASING) ĐỂ MỞ KHÔNG GIAN AN TOÀN
        // =========================================================================
        let bestTailMove = null;
        let maxTailDist = -1;
        let bestTailCompact = -Infinity;

        for (const move of nonBombMoves) {
            const simBody = this.simulateStep(currentBody, move.nextPos, food, bomb);
            const distToTail = this.canReachTail(simBody, bomb);

            if (distToTail >= 0) {
                const compactScore = this.getCompactnessScore(move.nextPos, currentBody);
                if (
                    distToTail > maxTailDist ||
                    (distToTail === maxTailDist && compactScore > bestTailCompact)
                ) {
                    maxTailDist = distToTail;
                    bestTailCompact = compactScore;
                    bestTailMove = move.dir;
                }
            }
        }

        if (bestTailMove) {
            return bestTailMove;
        }

        // =========================================================================
        // BƯỚC 4: CỨU NGUY KHẨN CẤP (CHẤP NHẬN ĂN BOM NẾU NHỜ ĐÓ SỐNG SÓT)
        // =========================================================================
        for (const move of validMoves) {
            const simBody = this.simulateStep(currentBody, move.nextPos, food, bomb);
            if (simBody.length > 0 && this.canReachTail(simBody, null) >= 0) {
                return move.dir;
            }
        }

        // =========================================================================
        // BƯỚC 5: FLOOD-FILL (CHỌN HƯỚNG CÓ NHIỀU Ô TRỐNG NHẤT ĐỂ CẦM CỰ)
        // =========================================================================
        const pool = nonBombMoves.length > 0 ? nonBombMoves : validMoves;
        let bestFallbackDir = pool[0].dir;
        let maxFreeSpace = -1;

        for (const move of pool) {
            const simBody = this.simulateStep(currentBody, move.nextPos, food, bomb);
            const freeSpace = this.countReachableSpace(move.nextPos, simBody, bomb);
            if (freeSpace > maxFreeSpace) {
                maxFreeSpace = freeSpace;
                bestFallbackDir = move.dir;
            }
        }

        return bestFallbackDir;
    },

    // Tìm đường an toàn chủ động ăn Bom để giải cứu khi bị kẹt vòng lặp
    findSafeMoveToBomb(nonBombMoves, allValidMoves, currentBody, food, bomb) {
        const directBombMove = allValidMoves.find(m => m.hitBomb);
        if (directBombMove) {
            const simAfterBomb = this.simulateStep(currentBody, directBombMove.nextPos, food, bomb);
            if (simAfterBomb.length >= 2 && this.canReachTail(simAfterBomb, null) >= 0) {
                return directBombMove.dir;
            }
        }

        let bestDir = null;
        let minDist = Infinity;

        for (const move of nonBombMoves) {
            const simBody = this.simulateStep(currentBody, move.nextPos, food, bomb);
            if (this.canReachTail(simBody, bomb) >= 0) {
                const dist = Math.abs(move.nextPos.x - bomb.x) + Math.abs(move.nextPos.y - bomb.y);
                if (dist < minDist) {
                    minDist = dist;
                    bestDir = move.dir;
                }
            }
        }
        return bestDir;
    },

    // Thuật toán BFS tìm đường ngắn nhất từ `start` tới `target`
    bfsPath(start, target, body, bomb, ignoreTail = true) {
        if (start.x === target.x && start.y === target.y) return [];

        const N = CONFIG.GRID_COUNT;
        const visited = new Uint8Array(N * N);
        const parentX = new Int8Array(N * N);
        const parentY = new Int8Array(N * N);

        const limit = ignoreTail ? body.length - 1 : body.length;
        for (let i = 0; i < limit; i++) {
            visited[body[i].y * N + body[i].x] = 1;
        }

        if (bomb && !(bomb.x === target.x && bomb.y === target.y)) {
            visited[bomb.y * N + bomb.x] = 1;
        }

        visited[target.y * N + target.x] = 0;
        visited[start.y * N + start.x] = 1;

        const queue = [start];
        let headIdx = 0;

        while (headIdx < queue.length) {
            const curr = queue[headIdx++];

            if (curr.x === target.x && curr.y === target.y) {
                const path = [];
                let cx = target.x;
                let cy = target.y;
                while (!(cx === start.x && cy === start.y)) {
                    path.push({ x: cx, y: cy });
                    const idx = cy * N + cx;
                    const px = parentX[idx];
                    const py = parentY[idx];
                    cx = px;
                    cy = py;
                }
                path.reverse();
                return path;
            }

            for (const d of this.DIRS) {
                const nx = curr.x + d.x;
                const ny = curr.y + d.y;
                if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;

                const nIdx = ny * N + nx;
                if (visited[nIdx]) continue;

                visited[nIdx] = 1;
                parentX[nIdx] = curr.x;
                parentY[nIdx] = curr.y;
                queue.push({ x: nx, y: ny });
            }
        }

        return null;
    },

    // Kiểm tra đầu rắn có thể tìm thấy đường về đuôi rắn hay không
    canReachTail(body, bomb) {
        if (body.length <= 1) return -1;
        const head = body[0];
        const tail = body[body.length - 1];
        const path = this.bfsPath(head, tail, body, bomb, true);
        return path ? path.length : -1;
    },

    // Đếm số ô trống liên thông từ vị trí `start` (Flood Fill)
    countReachableSpace(start, body, bomb) {
        const N = CONFIG.GRID_COUNT;
        const blocked = new Uint8Array(N * N);

        for (let i = 0; i < body.length - 1; i++) {
            blocked[body[i].y * N + body[i].x] = 1;
        }
        if (bomb) {
            blocked[bomb.y * N + bomb.x] = 1;
        }

        const queue = [start];
        blocked[start.y * N + start.x] = 1;
        let count = 0;

        while (queue.length > 0) {
            const curr = queue.pop();
            count++;

            for (const d of this.DIRS) {
                const nx = curr.x + d.x;
                const ny = curr.y + d.y;
                if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;

                const idx = ny * N + nx;
                if (!blocked[idx]) {
                    blocked[idx] = 1;
                    queue.push({ x: nx, y: ny });
                }
            }
        }
        return count;
    },

    // Tính điểm đi sát tường hoặc sát thân rắn
    getCompactnessScore(pos, body) {
        let score = 0;
        for (const d of this.DIRS) {
            const nx = pos.x + d.x;
            const ny = pos.y + d.y;
            if (this.isOutOfBounds({ x: nx, y: ny }) || this.isPosOnBody({ x: nx, y: ny }, body, true)) {
                score++;
            }
        }
        return score;
    },

    // Giả lập rắn bước 1 bước
    simulateStep(body, nextPos, food, bomb) {
        const newBody = [{ x: nextPos.x, y: nextPos.y }];
        for (let i = 0; i < body.length; i++) {
            newBody.push({ x: body[i].x, y: body[i].y });
        }

        const ateFood = (food && nextPos.x === food.x && nextPos.y === food.y);
        if (!ateFood) {
            newBody.pop();
            const hitBomb = (bomb && nextPos.x === bomb.x && nextPos.y === bomb.y);
            if (hitBomb) {
                newBody.pop();
            }
        }
        return newBody;
    },

    // Giả lập rắn đi hết một chuỗi các bước `path`
    simulatePath(body, path, food, bomb) {
        let simBody = this.cloneBody(body);
        for (const stepPos of path) {
            simBody = this.simulateStep(simBody, stepPos, food, bomb);
        }
        return simBody;
    },

    cloneBody(body) {
        return body.map(seg => ({ x: seg.x, y: seg.y }));
    },

    isOutOfBounds(pos) {
        return pos.x < 0 || pos.x >= CONFIG.GRID_COUNT || pos.y < 0 || pos.y >= CONFIG.GRID_COUNT;
    },

    isPosOnBody(pos, body, ignoreTail = false) {
        const limit = ignoreTail ? body.length - 1 : body.length;
        for (let i = 0; i < limit; i++) {
            if (body[i].x === pos.x && body[i].y === pos.y) return true;
        }
        return false;
    }
};