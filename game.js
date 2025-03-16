// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 设置画布大小
canvas.width = 800;
canvas.height = 600;

// 六边形参数
const hexagonSize = 30; // 六边形边长
const hexagonSpacing = 5; // 六边形之间的间距

// 计算六边形的高度和宽度
const hexHeight = hexagonSize * Math.sqrt(3);
const hexWidth = hexagonSize * 2;

// 游戏参数
const gridRadius = 2 || 3; // 蜂巢网格的半径（层数）
const hexColors = ['#D4AF37']; // 六边形的颜色（金色）

// 绘制单个六边形
function drawHexagon(x, y, size, fillColor = '#D4AF37') {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const xPos = x + size * Math.cos(angle);
        const yPos = y + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(xPos, yPos);
        } else {
            ctx.lineTo(xPos, yPos);
        }
    }
    ctx.closePath();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = fillColor;
    ctx.fill();
}

// 绘制蜂巢状六边形网格
function drawHexagonPattern() {
    // 画布中心坐标
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 创建蜂巢网格
    const grid = [];
    
    // 添加中心六边形
    grid.push({q: 0, r: 0});
    
    // 添加周围的层
    for (let layer = 1; layer <= gridRadius; layer++) {
        // 遍历每一层的所有六边形位置
        for (let q = -layer; q <= layer; q++) {
            // 计算r的范围
            const r1 = Math.max(-layer, -q - layer);
            const r2 = Math.min(layer, -q + layer);
            
            // 添加该行上的所有六边形
            for (let r = r1; r <= r2; r++) {
                grid.push({q, r});
            }
        }
    }
    
    // 绘制所有六边形
    for (const hex of grid) {
        // 将六边形坐标转换为画布坐标
        // 使用轴向坐标系转换为像素坐标
        const x = centerX + (hexWidth * 0.75 + hexagonSpacing) * hex.q;
        const y = centerY + (hexHeight / 2 + hexagonSpacing) * (2 * hex.r + hex.q);
        
        // 使用更鲜明的金色
        drawHexagon(x, y, hexagonSize, '#D4AF37');
    }

    return;
    // 绘制底部的数字六边形
    const bottomHexX = centerX;
    const bottomHexY = centerY + (gridRadius + 2) * (hexHeight + hexagonSpacing);
    
    // 绘制渐变色六边形
    const gradient = ctx.createLinearGradient(
        bottomHexX - hexagonSize, 
        bottomHexY - hexagonSize, 
        bottomHexX + hexagonSize, 
        bottomHexY + hexagonSize
    );
    gradient.addColorStop(0, '#8A2BE2'); // 紫色
    gradient.addColorStop(1, '#00BFFF'); // 蓝色
    
    drawHexagon(bottomHexX, bottomHexY, hexagonSize, gradient);
    
    // 在六边形中绘制数字
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#006400'; // 深绿色
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('6', bottomHexX, bottomHexY);
}

// 游戏状态
let score = 0;
let coinsCollected = 0;
let draggableHexagons = []; // 存储可拖拽的六边形
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let hexGroup = []; // 存储作为一个整体的六边形组

// 生成随机数字的六边形
function generateRandomHexagons() {
    // 清空现有的可拖拽六边形
    draggableHexagons = [];
    hexGroup = [];
    
    // 随机决定生成1个或2个六边形
    const count = Math.floor(Math.random() * 2) + 1;
    
    // 红框区域的位置（底部中央）
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const bottomY = centerY + (gridRadius + 2) * (hexHeight + hexagonSpacing);
    
    // 生成指定数量的六边形
    for (let i = 0; i < count; i++) {
        // 随机生成1-6的数字
        const number = Math.floor(Math.random() * 6) + 1;
        
        // 计算位置 - 如果是两个六边形，则按照蜂巢网格的排列方式排列
        let x, y;
        if (count === 1) {
            x = centerX;
            y = bottomY;
        } else {
            // 两个六边形按照蜂巢网格的排列方式排列
            // 使用q,r坐标系统来确定位置
            const q = i === 0 ? -0.5 : 0.5;
            const r = i === 0 ? 0 : 0;
            
            // 转换为像素坐标
            x = centerX + (hexWidth * 0.75 + hexagonSpacing) * q;
            y = bottomY + (hexHeight / 2 + hexagonSpacing) * (2 * r + q);
        }
        
        // 创建渐变色
        const gradient = ctx.createLinearGradient(
            x - hexagonSize, 
            y - hexagonSize, 
            x + hexagonSize, 
            y + hexagonSize
        );
        gradient.addColorStop(0, '#8A2BE2'); // 紫色
        gradient.addColorStop(1, '#00BFFF'); // 蓝色
        
        // 添加到可拖拽六边形数组
        const hex = {
            x: x,
            y: y,
            originalX: x, // 保存原始位置，用于整体移动
            originalY: y,
            number: number,
            color: gradient,
            isPlaced: false
        };
        
        draggableHexagons.push(hex);
        hexGroup.push(hex);
    }
}

// 绘制红框
function drawRedFrame() {
    return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2; // 同样添加centerY的定义
    const bottomY = centerY + (gridRadius + 2) * (hexHeight + hexagonSpacing);
    
    // 计算红框大小
    const frameWidth = hexGroup.length === 1 ? hexWidth + 20 : hexWidth * 2 + hexagonSpacing + 20;
    const frameHeight = hexHeight + 20;
    
    // 绘制红框
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.strokeRect(
        centerX - frameWidth/2,
        bottomY - frameHeight/2,
        frameWidth,
        frameHeight
    );
}

// 绘制可拖拽的六边形
function drawDraggableHexagons() {
    // 先绘制已放置的六边形
    for (const key in placedHexagons) {
        const hex = placedHexagons[key];
        if (hex.isPlaced) {
            // 绘制六边形
            drawHexagon(hex.x, hex.y, hexagonSize, hex.color);
            
            // 绘制数字
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#006400'; // 深绿色
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(hex.number.toString(), hex.x, hex.y);
        }
    }
    
    // 再绘制未放置的六边形
    for (const hex of draggableHexagons) {
        if (!hex.isPlaced) {
            // 绘制六边形
            drawHexagon(hex.x, hex.y, hexagonSize, hex.color);
            
            // 绘制数字
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#006400'; // 深绿色
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(hex.number.toString(), hex.x, hex.y);
        }
    }
    
    // 如果不在拖拽状态，绘制红框
    if (!isDragging && hexGroup.length > 0 && !hexGroup[0].isPlaced) {
        drawRedFrame();
    }
}

// 检查点击是否在六边形组内
function isPointInHexGroup(x, y) {
    for (const hex of hexGroup) {
        if (!hex.isPlaced && isPointInHexagon(x, y, hex.x, hex.y, hexagonSize)) {
            return true;
        }
    }
    return false;
}

// 存储已放置的六边形的网格位置
let placedHexagons = {}; // 格式: "q,r": hex

// 检查六边形组是否可以放置在网格中
function canPlaceHexGroupAt(gridPositions) {
    // 检查所有位置是否都有效
    if (!gridPositions.every(pos => pos !== null)) {
        return false;
    }
    
    // 检查位置是否已被占用
    for (const pos of gridPositions) {
        const key = `${pos.q},${pos.r}`;
        if (placedHexagons[key]) {
            return false; // 位置已被占用
        }
    }
    
    return true;
}

// 鼠标释放事件处理
function handleMouseUp(e) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 获取六边形组的网格位置
        const gridPositions = getGridPositionsForHexGroup(mouseX - dragOffsetX, mouseY - dragOffsetY);
        
        // 检查是否可以放置
        if (gridPositions.length > 0 && canPlaceHexGroupAt(gridPositions)) {
            // 放置六边形组到网格位置
            for (let i = 0; i < hexGroup.length; i++) {
                const hex = hexGroup[i];
                const gridPos = gridPositions[i];
                
                if (gridPos) {
                    // 确保有有效的网格位置才进行吸附
                    hex.x = gridPos.x;
                    hex.y = gridPos.y;
                    hex.isPlaced = true;
                    
                    // 记录放置的网格坐标，用于游戏逻辑
                    hex.gridQ = gridPos.q;
                    hex.gridR = gridPos.r;
                    
                    // 将六边形添加到已放置的六边形字典中
                    placedHexagons[`${gridPos.q},${gridPos.r}`] = hex;
                }
            }
            
            // 检查并合并相同数字的六边形
            checkAndMergeHexagons();
            
            // 检查游戏是否结束
            if (!checkGameOver()) {
                // 游戏未结束，生成新的六边形
                generateRandomHexagons();
            }
        } else {
            // 如果不能放置，将六边形组恢复到原始位置
            for (const hex of hexGroup) {
                hex.x = hex.originalX;
                hex.y = hex.originalY;
            }
        }
        
        // 重置拖拽状态
        isDragging = false;
        
        // 重新绘制UI
        drawUI();
    }
}

// 检查并合并相同数字的六边形
function checkAndMergeHexagons() {
    let mergeHappened = true;
    
    // 循环检查合并，直到没有新的合并发生
    while (mergeHappened) {
        mergeHappened = false;
        
        // 存储需要合并的六边形组
        let mergeGroups = [];
        
        // 创建一个已访问的六边形集合
        let visited = new Set();
        
        // 遍历所有已放置的六边形
        for (const key in placedHexagons) {
            // 如果已经访问过，则跳过
            if (visited.has(key)) continue;
            
            const hex = placedHexagons[key];
            const number = hex.number;
            
            // 使用广度优先搜索找到所有相连的相同数字六边形
            let queue = [key];
            let group = [key];
            visited.add(key);
            
            while (queue.length > 0) {
                const currentKey = queue.shift();
                const currentHex = placedHexagons[currentKey];
                
                // 获取相邻的六边形
                const neighbors = getNeighbors(currentHex.gridQ, currentHex.gridR);
                
                // 检查相邻的六边形
                for (const neighbor of neighbors) {
                    const neighborKey = `${neighbor.q},${neighbor.r}`;
                    const neighborHex = placedHexagons[neighborKey];
                    
                    // 如果找到相邻且数字相同的六边形，且未访问过
                    if (neighborHex && neighborHex.number === number && !visited.has(neighborKey)) {
                        queue.push(neighborKey);
                        group.push(neighborKey);
                        visited.add(neighborKey);
                    }
                }
            }
            
            // 如果找到3个或更多相同数字的相连六边形，添加到合并组
            if (group.length >= 3) {
                mergeGroups.push(group);
            }
        }
        
        // 合并每个组中的六边形
        for (const group of mergeGroups) {
            if (group.length >= 3) {
                // 选择最后一个六边形作为合并结果
                const lastKey = group[group.length - 1];
                const lastHex = placedHexagons[lastKey];
                
                // 记录合并前的位置信息
                const mergedQ = lastHex.gridQ;
                const mergedR = lastHex.gridR;
                
                // 增加最后一个六边形的数字
                lastHex.number += 1;
                
                // 更新分数
                score += lastHex.number * group.length; // 根据合并的数量增加分数
                
                // 移除其他六边形
                for (let i = 0; i < group.length - 1; i++) {
                    delete placedHexagons[group[i]];
                }
                
                console.log(`合并了${group.length}个数字${lastHex.number-1}，形成了数字${lastHex.number}`);
                
                // 标记发生了合并，需要再次检查
                mergeHappened = true;
            }
        }
    }
}

// 获取六边形的相邻位置
function getNeighbors(q, r) {
    // 六边形的六个相邻方向
    const directions = [
        {q: 1, r: 0},   // 右
        {q: 0, r: 1},   // 右下
        {q: -1, r: 1},  // 左下
        {q: -1, r: 0},  // 左
        {q: 0, r: -1},  // 左上
        {q: 1, r: -1}   // 右上
    ];
    
    // 计算所有相邻位置
    return directions.map(dir => ({
        q: q + dir.q,
        r: r + dir.r
    }));
}

// 触摸事件处理（移动设备支持）
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    handleMouseUp(mouseEvent);
}

// 检查点击是否在六边形内
function isPointInHexagon(x, y, hexX, hexY, size) {
    // 简化的检测：使用距离检测
    const distance = Math.sqrt(Math.pow(x - hexX, 2) + Math.pow(y - hexY, 2));
    return distance <= size;
}

// 鼠标按下事件处理
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 检查是否点击在六边形组上
    if (isPointInHexGroup(mouseX, mouseY)) {
        isDragging = true;
        
        // 计算鼠标与六边形组第一个六边形的偏移
        dragOffsetX = mouseX - hexGroup[0].x;
        dragOffsetY = mouseY - hexGroup[0].y;
    }
}

// 鼠标移动事件处理
function handleMouseMove(e) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 移动整个六边形组
        for (const hex of hexGroup) {
            hex.x = hex.originalX + (mouseX - dragOffsetX - hexGroup[0].originalX);
            hex.y = hex.originalY + (mouseY - dragOffsetY - hexGroup[0].originalY);
        }
        
        // 重新绘制UI
        drawUI();
    }
}

// 绘制游戏UI函数
function drawUI() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置背景色为淡黄色
    canvas.style.backgroundColor = '#FFF8DC';
    
    // 绘制顶部分数栏
    ctx.fillStyle = 'rgba(210, 180, 140, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    // 绘制分数文本
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#8B0000'; // 深红色
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('运势: ' + score, 20, 25);
    
    // 绘制六边形网格
    drawHexagonPattern();
    
    // 绘制可拖拽的六边形
    drawDraggableHexagons();
}

// 初始化游戏
function initGame() {
    // 重置已放置的六边形
    placedHexagons = {};
    
    // 设置画布大小为全屏
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 生成随机六边形
    generateRandomHexagons();
    
    // 绘制UI和游戏元素
    drawUI();
    
    // 添加窗口大小变化的监听器
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawUI();
    });
    
    // 添加鼠标事件监听器
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    // 添加触摸事件监听器（移动设备支持）
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
}

// 使用DOMContentLoaded事件确保DOM完全加载后再执行
// document.addEventListener('DOMContentLoaded', function() {
//     // 启动游戏
//     initGame();
// });

// 保留原有的window.onload作为备用
window.onload = function() {
    // 如果DOMContentLoaded已经触发过，这里不会重复执行initGame
    if (typeof initGame === 'function') {
        initGame();
    }
};

// 获取六边形组的网格位置
function getGridPositionsForHexGroup(x, y) {
    if (hexGroup.length === 0) return [];
    
    // 计算拖拽的中心点与第一个六边形的偏移
    const offsetX = x - hexGroup[0].x;
    const offsetY = y - hexGroup[0].y;
    
    // 获取每个六边形的网格位置
    const gridPositions = [];
    
    // 先获取第一个六边形的网格位置
    const firstHex = hexGroup[0];
    const firstHexX = firstHex.x + offsetX;
    const firstHexY = firstHex.y + offsetY;
    const firstGridPos = getGridPositionForHex(firstHexX, firstHexY);
    
    if (!firstGridPos) {
        console.log("第一个六边形没有找到有效网格位置");
        return [];
    }
    
    gridPositions.push(firstGridPos);
    
    // 如果有两个六边形，需要计算第二个六边形的相对位置
    if (hexGroup.length > 1) {
        // 计算第二个六边形相对于第一个的偏移（使用q,r坐标）
        const secondHex = hexGroup[1];
        const relativeQ = 1; // 假设第二个六边形在第一个的右侧
        const relativeR = 0; // 同一行
        
        // 计算第二个六边形的网格坐标
        const secondQ = firstGridPos.q + relativeQ;
        const secondR = firstGridPos.r + relativeR;
        
        // 检查这个位置是否在网格范围内
        if (Math.abs(secondQ) <= gridRadius && Math.abs(secondR) <= gridRadius && Math.abs(secondQ + secondR) <= gridRadius) {
            // 计算像素坐标
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const secondX = centerX + (hexWidth * 0.75 + hexagonSpacing) * secondQ;
            const secondY = centerY + (hexHeight / 2 + hexagonSpacing) * (2 * secondR + secondQ);
            
            const secondGridPos = { q: secondQ, r: secondR, x: secondX, y: secondY };
            gridPositions.push(secondGridPos);
        } else {
            console.log("第二个六边形超出网格范围");
            return []; // 如果第二个六边形超出范围，返回空数组
        }
    }
    
    return gridPositions;
}

// 获取六边形在网格中的位置
function getGridPositionForHex(x, y) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 大幅增加检测范围，确保能够检测到网格位置
    const detectionRadius = hexagonSize * 5;
    
    // 记录最近的网格位置
    let closestPos = null;
    let minDistance = Infinity;
    
    // 遍历所有可能的网格位置
    for (let q = -gridRadius; q <= gridRadius; q++) {
        for (let r = -gridRadius; r <= gridRadius; r++) {
            if (Math.abs(q + r) <= gridRadius) {
                // 计算该网格位置的像素坐标
                const hexX = centerX + (hexWidth * 0.75 + hexagonSpacing) * q;
                const hexY = centerY + (hexHeight / 2 + hexagonSpacing) * (2 * r + q);
                
                // 计算距离
                const distance = Math.sqrt(Math.pow(x - hexX, 2) + Math.pow(y - hexY, 2));
                
                // 更新最近的位置
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPos = { q, r, x: hexX, y: hexY, distance };
                }
            }
        }
    }
    
    // 如果找到了足够近的位置，返回它
    if (closestPos && closestPos.distance <= detectionRadius) {
        console.log("找到网格位置:", closestPos.q, closestPos.r, "距离:", closestPos.distance);
        return closestPos;
    }
    
    // 如果没有足够近的位置，但有最近的位置，也返回它（强制吸附）
    if (closestPos) {
        console.log("强制吸附到最近网格位置:", closestPos.q, closestPos.r, "距离:", closestPos.distance);
        return closestPos;
    }
    
    console.log("未找到网格位置，坐标:", x, y);
    return null;
}

// 检查游戏是否结束（所有格子都被占用）
function checkGameOver() {
    // 计算网格中的总格子数
    const totalCells = 1 + 3 * gridRadius * (gridRadius + 1);
    
    // 计算已占用的格子数
    const occupiedCells = Object.keys(placedHexagons).length;
    
    // 如果所有格子都被占用，游戏结束
    if (occupiedCells >= totalCells) {
        // 显示游戏结束信息
        showGameOverMessage();
        return true;
    }
    
    return false;
}

// 显示游戏结束信息
function showGameOverMessage() {
    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制游戏结束文本
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 50);
    
    // 显示最终分数
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`最终运势: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    // 显示重新开始按钮
    ctx.fillStyle = '#4CAF50';
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + 100;
    
    // 绘制按钮
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // 绘制按钮文本
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('重新开始', canvas.width / 2, buttonY + buttonHeight / 2);
    
    // 添加点击事件监听器
    canvas.addEventListener('click', handleRestartClick);
}

// 处理重新开始按钮点击
function handleRestartClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 按钮位置
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + 100;
    
    // 检查点击是否在按钮上
    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
        // 移除事件监听器
        canvas.removeEventListener('click', handleRestartClick);
        
        // 重新开始游戏
        initGame();
    }
}