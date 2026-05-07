// ==================== 维度选择模块 ====================
// 网格创建、高亮交互、维度确认、窗口尺寸调整
import { CONFIG } from '../config.js';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { getInputElementDimensions, getScreenSizeType } from '../utils/dom-utils.js';
import { showWarning } from '../ui/popup.js';
import { removeNonHighlightedCells, convertHighlightedCellsToInputs } from './input-elements.js';

/**
 * 清除所有网格单元的高亮状态
 */
export function clearAllHighlights() {
    state.gridCells.forEach(cell => {
        cell.classList.remove('highlighted');
    });
}

/**
 * 获取网格单元的坐标
 * @param {HTMLElement} cell - 网格单元元素
 * @returns {{x: number, y: number}} 行列坐标
 */
export function getCellCoordinates(cell) {
    return {
        x: parseInt(cell.dataset.x),
        y: parseInt(cell.dataset.y)
    };
}

/**
 * 根据高亮单元计算矩阵维度
 * 取最大x和y坐标 + 1作为行数和列数
 * @param {HTMLElement[]} highlightedCells - 高亮的网格单元数组
 * @returns {{rows: number, cols: number}}
 */
export function calculateMatrixDimensions(highlightedCells) {
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
 * 高亮指定范围内的所有网格单元（从(0,0)到(targetX, targetY)的矩形区域）
 * @param {number} targetX - 目标列索引
 * @param {number} targetY - 目标行索引
 */
export function highlightCellsInRange(targetX, targetY) {
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

/**
 * 更新高亮显示：先清除再高亮
 * @param {number} targetX - 目标列
 * @param {number} targetY - 目标行
 */
export function updateHighlightedCells(targetX, targetY) {
    clearAllHighlights();
    highlightCellsInRange(targetX, targetY);
}

/**
 * 创建初始网格（10×10）
 * 使用DocumentFragment批量添加，减少回流
 */
export function createGrid() {
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
 * 更新坐标显示文本
 * @param {string} dimensionText - 维度文本，如 "3×4"
 */
export function updateCoordinatesDisplay(dimensionText) {
    elements.coordinatesDiv.textContent = `矩阵维度: ${dimensionText}`;
}

/**
 * 根据矩阵维度调整窗口大小
 * 在移动端和平板端会限制最大宽度
 * @param {{rows: number, cols: number}} dimensions - 矩阵维度
 */
export function resizeWindow(dimensions) {
    console.log('调整窗口大小以适应矩阵resizeWindow');
    const { width: inputWidth, height: inputHeight } = getInputElementDimensions();
    const gap = 0;

    let newWidth = dimensions.cols * (inputWidth + gap);
    let newHeight = dimensions.rows * (inputHeight + gap);

    // 根据屏幕类型限制最大宽度
    const screenType = getScreenSizeType();
    let maxWidth;

    switch (screenType) {
        case 'mobile':
            maxWidth = window.innerWidth - 20;
            break;
        case 'tablet':
            maxWidth = window.innerWidth - 30;
            break;
        default:
            maxWidth = window.innerWidth - 40;
    }

    if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = (newHeight * maxWidth) / newWidth;
    }

    elements.windowDiv.classList.add('dynamic');
    elements.windowDiv.style.width = `${newWidth}px`;
    elements.windowDiv.style.height = `${newHeight}px`;

    elements.windowDiv.style.gridTemplateColumns = `repeat(${dimensions.cols}, ${inputWidth}px)`;
    elements.windowDiv.style.gridTemplateRows = `repeat(${dimensions.rows}, ${inputHeight}px)`;
}

/**
 * 处理网格鼠标按下事件（事件委托）
 * @param {MouseEvent} e - 鼠标事件
 */
export function handleMouseDown(e) {
    if (e.target.classList.contains('grid-cell')) {
        updateGrid(e.target);
    }
}

/**
 * 处理鼠标离开网格事件：恢复显示上次选择的维度
 */
export function handleMouseLeave() {
    elements.coordinatesDiv.textContent = `矩阵维度: ${state.lastSelectedDimension}`;
}

/**
 * 根据鼠标位置更新网格高亮和坐标显示
 * @param {HTMLElement} cell - 当前悬停的网格单元
 */
export function updateGrid(cell) {
    const { x, y } = getCellCoordinates(cell);
    const dimensionText = `${y + 1}×${x + 1}`;

    updateCoordinatesDisplay(dimensionText);
    state.lastSelectedDimension = dimensionText;

    updateHighlightedCells(x, y);
}

/**
 * 启用网格交互（绑定鼠标事件）
 */
export function enableGridInteraction() {
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);
}

/**
 * 恢复原始网格（清除所有输入框，回到10×10网格）
 */
export function restoreOriginalGrid() {
    elements.windowDiv.innerHTML = '';

    elements.windowDiv.classList.remove('dynamic');
    elements.windowDiv.style.width = '400px';
    elements.windowDiv.style.height = '400px';
    elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
    elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';
    elements.windowDiv.style.display = 'grid';

    createGrid();

    state.gridInputs = [];

    updateCoordinatesDisplay('0×0');
    state.lastSelectedDimension = '0×0';
}

/**
 * 确认维度选择：将高亮区域转换为输入框矩阵
 * @returns {boolean} 是否成功（有高亮区域即成功）
 */
export function handleDimensionSelection() {
    const highlightedCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell.highlighted'));
    if (highlightedCells.length === 0) {
        showWarning('请先选择矩阵维度（点击并拖动网格）');
        state.previousStates.pop();
        return false;
    }
    const matrixDimensions = calculateMatrixDimensions(highlightedCells);
    // 移除未高亮的网格单元，并转换为输入框
    removeNonHighlightedCells();
    convertHighlightedCellsToInputs(highlightedCells);
    resizeWindow(matrixDimensions);
    updateCoordinatesDisplay(`${matrixDimensions.rows}×${matrixDimensions.cols}`);
    // 初始化矩阵数据（空字符串占位）
    state.matrixData = {
        rows: matrixDimensions.rows,
        cols: matrixDimensions.cols,
        elements: Array.from({ length: matrixDimensions.rows }, () =>
            Array.from({ length: matrixDimensions.cols }, () => '')
        )
    };
    return true;
}
