/*
本文件存储维度选择状态相关的函数，包括函数执行完成后进入维度选择状态的函数
*/

// ==================== 底层工具函数 ====================
/**
 * 清除所有高亮
 */
function clearAllHighlights() {
    state.gridCells.forEach(cell => {
        cell.classList.remove('highlighted');
    });
}

/**
 * 获取单元格坐标
 */
function getCellCoordinates(cell) {
    return {
        x: parseInt(cell.dataset.x),
        y: parseInt(cell.dataset.y)
    };
}

/**
 * 计算矩阵的实际维度
 */
function calculateMatrixDimensions(highlightedCells) {
    let maxX = 0;
    let maxY = 0;
    highlightedCells.forEach(cell => {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    });

    return {
        rows: maxY + 1,
        cols: maxX + 1
    };
}

/**
 * 高亮指定范围内的单元格
 */
function highlightCellsInRange(targetX, targetY) {
    // 确保目标坐标在网格范围内
    const maxX = Math.min(targetX, CONFIG.GRID_SIZE - 1);
    const maxY = Math.min(targetY, CONFIG.GRID_SIZE - 1);
    for (let x = 0; x <= targetX; x++) {
        for (let y = 0; y <= targetY; y++) {
            const cellIndex = y * CONFIG.GRID_SIZE + x;
            if (state.gridCells[cellIndex]) {
                state.gridCells[cellIndex].classList.add('highlighted');
            }
        }
    }
}

// ==================== 中层操作函数 ====================
/**
 * 更新高亮单元格
 */
function updateHighlightedCells(targetX, targetY) {
    // 清除所有高亮
    clearAllHighlights();

    // 高亮从(0,0)到当前网格的所有格子
    highlightCellsInRange(targetX, targetY);
}

/**
 * 创建网格
 */
function createGrid() {
    state.gridCells = [];
    const fragment = document.createDocumentFragment();
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            fragment.appendChild(cell);
            state.gridCells.push(cell);
        }
    }

    elements.windowDiv.appendChild(fragment);
}

/**
 * 更新坐标显示
 */
function updateCoordinatesDisplay(dimensionText) {
    elements.coordinatesDiv.textContent = `矩阵维度: ${dimensionText}`;
}

/**
* 调整窗口大小以适应矩阵
 */
function resizeWindow(dimensions) {
    console.log('调整窗口大小以适应矩阵resizeWindow');
    // 动态获取输入框的实际尺寸
    const { width: inputWidth, height: inputHeight } = getInputElementDimensions();
    const gap = 0;

    // 计算基本尺寸
    let newWidth = dimensions.cols * (inputWidth + gap);
    let newHeight = dimensions.rows * (inputHeight + gap);

    // 获取屏幕尺寸类型，根据不同屏幕设置不同的最大宽度
    const screenType = getScreenSizeType();
    let maxWidth;

    switch (screenType) {
        case 'mobile':
            maxWidth = window.innerWidth - 20; // 小屏幕留较小边距
            break;
        case 'tablet':
            maxWidth = window.innerWidth - 30;
            break;
        default: // desktop
            maxWidth = window.innerWidth - 40;
    }

    // 添加边界检查，确保窗口不会超过屏幕宽度
    if (newWidth > maxWidth) {
        newWidth = maxWidth;
        // 按比例调整高度
        newHeight = (newHeight * maxWidth) / newWidth;
    }


    // 更新窗口样式
    elements.windowDiv.classList.add('dynamic');
    elements.windowDiv.style.width = `${newWidth}px`;
    elements.windowDiv.style.height = `${newHeight}px`;

    // 更新网格布局
    elements.windowDiv.style.gridTemplateColumns = `repeat(${dimensions.cols}, ${inputWidth}px)`;
    elements.windowDiv.style.gridTemplateRows = `repeat(${dimensions.rows}, ${inputHeight}px)`;
}

// ==================== 事件处理函数 ====================
/**
 * 处理鼠标按下事件
 */
function handleMouseDown(e) {
    if (e.target.classList.contains('grid-cell')) {
        updateGrid(e.target);
    }
}

/**
 * 处理鼠标离开网格区域
 */
function handleMouseLeave() {
    elements.coordinatesDiv.textContent = `矩阵维度: ${state.lastSelectedDimension}`;
}

/**
 * 更新网格状态
 */
function updateGrid(cell) {
    const { x, y } = getCellCoordinates(cell);
    const dimensionText = `${y + 1}×${x + 1}`;

    // 更新显示
    updateCoordinatesDisplay(dimensionText);
    state.lastSelectedDimension = dimensionText;

    // 更新高亮状态
    updateHighlightedCells(x, y);
}


// ==================== 高级流程函数 ====================
/**
 * 启用网格交互（用于撤销功能）
 */
function enableGridInteraction() {
    // 重新添加事件监听器
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);
}

/**
 * 恢复原始网格
 */
function restoreOriginalGrid() {
    // 清空窗口内容
    elements.windowDiv.innerHTML = '';

    // 重置窗口样式
    elements.windowDiv.classList.remove('dynamic');
    elements.windowDiv.style.width = '400px';
    elements.windowDiv.style.height = '400px';
    elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
    elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';
    elements.windowDiv.style.display = 'grid'; // 恢复网格布局

    // 重新创建网格
    createGrid();

    // 清空输入框状态
    state.gridInputs = [];

    // 重置坐标显示
    updateCoordinatesDisplay('0×0');
    state.lastSelectedDimension = '0×0';
}

/**
 * 处理矩阵维度选择
 */
function handleDimensionSelection() {
    // 获取所有高亮的单元格
    const highlightedCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell.highlighted'));
    if (highlightedCells.length === 0) {
        // 使用新版弹窗函数
        showWarning('请先选择矩阵维度（点击并拖动网格）');
        state.previousStates.pop(); // 移除无效的状态保存
        return false; // 返回处理失败
    }
    // 计算矩阵的实际维度
    const matrixDimensions = calculateMatrixDimensions(highlightedCells);
    // 删除非高亮的网格
    removeNonHighlightedCells();
    // 将高亮单元格转换为输入框
    convertHighlightedCellsToInputs(highlightedCells);
    // 调整窗口大小以适应新的矩阵
    resizeWindow(matrixDimensions);
    // 更新坐标显示为实际矩阵维度
    updateCoordinatesDisplay(`${matrixDimensions.rows}×${matrixDimensions.cols}`);
    // 初始化矩阵数据
    state.matrixData = {
        rows: matrixDimensions.rows,
        cols: matrixDimensions.cols,
        elements: Array.from({ length: matrixDimensions.rows }, () =>
            Array.from({ length: matrixDimensions.cols }, () => '')
        )
    };
    return true; // 返回处理成功
}