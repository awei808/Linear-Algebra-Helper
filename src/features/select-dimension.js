import { CONFIG } from '../config.js';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { getInputElementDimensions, getScreenSizeType } from '../utils/dom-utils.js';
import { showWarning } from '../ui/popup.js';
import { removeNonHighlightedCells, convertHighlightedCellsToInputs } from './input-elements.js';

export function clearAllHighlights() {
    state.gridCells.forEach(cell => {
        cell.classList.remove('highlighted');
    });
}

export function getCellCoordinates(cell) {
    return {
        x: parseInt(cell.dataset.x),
        y: parseInt(cell.dataset.y)
    };
}

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

export function updateHighlightedCells(targetX, targetY) {
    clearAllHighlights();
    highlightCellsInRange(targetX, targetY);
}

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

export function updateCoordinatesDisplay(dimensionText) {
    elements.coordinatesDiv.textContent = `矩阵维度: ${dimensionText}`;
}

export function resizeWindow(dimensions) {
    console.log('调整窗口大小以适应矩阵resizeWindow');
    const { width: inputWidth, height: inputHeight } = getInputElementDimensions();
    const gap = 0;

    let newWidth = dimensions.cols * (inputWidth + gap);
    let newHeight = dimensions.rows * (inputHeight + gap);

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

export function handleMouseDown(e) {
    if (e.target.classList.contains('grid-cell')) {
        updateGrid(e.target);
    }
}

export function handleMouseLeave() {
    elements.coordinatesDiv.textContent = `矩阵维度: ${state.lastSelectedDimension}`;
}

export function updateGrid(cell) {
    const { x, y } = getCellCoordinates(cell);
    const dimensionText = `${y + 1}×${x + 1}`;

    updateCoordinatesDisplay(dimensionText);
    state.lastSelectedDimension = dimensionText;

    updateHighlightedCells(x, y);
}

export function enableGridInteraction() {
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);
}

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

export function handleDimensionSelection() {
    const highlightedCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell.highlighted'));
    if (highlightedCells.length === 0) {
        showWarning('请先选择矩阵维度（点击并拖动网格）');
        state.previousStates.pop();
        return false;
    }
    const matrixDimensions = calculateMatrixDimensions(highlightedCells);
    removeNonHighlightedCells();
    convertHighlightedCellsToInputs(highlightedCells);
    resizeWindow(matrixDimensions);
    updateCoordinatesDisplay(`${matrixDimensions.rows}×${matrixDimensions.cols}`);
    state.matrixData = {
        rows: matrixDimensions.rows,
        cols: matrixDimensions.cols,
        elements: Array.from({ length: matrixDimensions.rows }, () =>
            Array.from({ length: matrixDimensions.cols }, () => '')
        )
    };
    return true;
}
