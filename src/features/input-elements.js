// ==================== 输入元素模块 ====================
// 管理输入元素状态：网格↔输入框转换、输入事件、初等变换UI隐藏
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { adjustInputWidth } from '../utils/dom-utils.js';
import { showSuccess } from '../ui/popup.js';
import { handleMouseDown, handleMouseLeave, createGrid, updateCoordinatesDisplay } from './select-dimension.js';
import { unbindRowColumnIndexEvents } from './elementary-transformation.js';

/**
 * 移除未被高亮的网格单元（只保留选中区域的格子）
 */
export function removeNonHighlightedCells() {
    const allCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell'));
    const nonHighlightedCells = allCells.filter(cell => !cell.classList.contains('highlighted'));

    nonHighlightedCells.forEach(cell => {
        cell.remove();
    });

    state.gridCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell'));
}

/**
 * 将高亮的网格单元转换为输入框
 * @param {HTMLElement[]} highlightedCells - 高亮的网格单元数组
 */
export function convertHighlightedCellsToInputs(highlightedCells) {
    highlightedCells.forEach(cell => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'grid-cell-input';
        input.dataset.x = cell.dataset.x;
        input.dataset.y = cell.dataset.y;
        input.dataset.index = cell.dataset.index;
        input.placeholder = '0';
        cell.parentNode.replaceChild(input, cell);

        state.gridInputs = state.gridInputs || [];
        state.gridInputs.push(input);
    });
}

/**
 * 清除所有选中的矩阵元素高亮
 */
export function clearSelectedMatrixElements() {
    const selectedElements = elements.windowDiv.querySelectorAll('.selected-matrix-element');
    selectedElements.forEach(element => {
        element.classList.remove('selected-matrix-element');
    });

    state.selectedMatrixElements = [];
}

/**
 * 处理桌面端输入框内容变化：自适应宽度
 * @param {Event} event - 输入事件
 */
export function handleInputChange(event) {
    adjustInputWidth(event.target);
    console.log('桌面端输入框宽度调整');
}

/**
 * 处理移动端输入框内容变化
 * 移动端键盘弹出会触发viewport变化，延迟处理以确保正确获取尺寸
 * @param {Event} event - 输入事件
 */
export function handleInputChangeMobile(event) {
    const input = event.target;

    if (window.visualViewport) {
        const currentInput = input;

        const handleViewportChange = () => {
            if (window.visualViewport.height > window.innerHeight * 0.8) {
                adjustInputWidth(currentInput);
                window.visualViewport.removeEventListener('resize', handleViewportChange);
            }
        };

        window.visualViewport.addEventListener('resize', handleViewportChange);

        // 5秒后自动清理监听器防止泄漏
        setTimeout(() => {
            window.visualViewport.removeEventListener('resize', handleViewportChange);
        }, 5000);

    } else {
        // 不支持visualViewport的降级方案：延迟检查焦点状态
        setTimeout(() => {
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && activeEl.tagName === 'INPUT';

            if (!isInputFocused) {
                adjustInputWidth(input);
            } else {
                setTimeout(() => {
                    const activeEl2 = document.activeElement;
                    const isInputFocused2 = activeEl2 && activeEl2.tagName === 'INPUT';

                    if (!isInputFocused2) {
                        adjustInputWidth(input);
                        showSuccess('移动端时间差输入框宽度调整');
                    }
                }, 100);
            }
        }, 100);
    }
}

/**
 * 启用输入交互：恢复所有输入框，根据设备类型绑定对应事件
 */
export function enableInputInteraction() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    inputs.forEach(input => {
        input.disabled = false;
        input.style.backgroundColor = 'white';
        input.style.cursor = 'text';

        // 根据设备类型选择不同的事件处理函数
        if (state.isMobile) {
            input.removeEventListener('input', handleInputChange);
            input.removeEventListener('input', handleInputChangeMobile);
            input.addEventListener('input', handleInputChangeMobile);
        } else {
            input.removeEventListener('input', handleInputChange);
            input.removeEventListener('input', handleInputChangeMobile);
            input.addEventListener('input', handleInputChange);
        }
        adjustInputWidth(input);
    });
}

/**
 * 禁用网格交互（移除鼠标事件）
 */
export function disableGridInteraction() {
    elements.windowDiv.removeEventListener('mousedown', handleMouseDown);
    elements.windowDiv.removeEventListener('mouseleave', handleMouseLeave);
}

/**
 * 隐藏初等变换UI（操作按钮、行列索引事件、预览区域）
 */
export function hideElementaryTransformationUI() {
    elements.operatorButtons.classList.add('hidden');
    unbindRowColumnIndexEvents();
    if (elements.previewArrowSection) {
        elements.previewArrowSection.style.display = 'none';
    }
    if (elements.previewTableWrapper) {
        elements.previewTableWrapper.style.display = 'none';
    }
}

/**
 * 恢复输入元素状态的网格
 * 根据state.matrixData重建输入框并填充值
 */
export function restoreGridForInputElements() {
    // 先计算并设置输入元素状态下的窗口大小
    if (state.matrixData) {
        const { rows, cols } = state.matrixData;
        const tempInput = document.createElement('input');
        tempInput.className = 'grid-cell-input';
        document.body.appendChild(tempInput);
        const computedStyle = window.getComputedStyle(tempInput);
        const inputWidth = parseFloat(computedStyle.width);
        const inputHeight = parseFloat(computedStyle.height);
        document.body.removeChild(tempInput);
        const gap = 0;

        elements.windowDiv.classList.add('dynamic');
        elements.windowDiv.style.width = `${cols * (inputWidth + gap)}px`;
        elements.windowDiv.style.height = `${rows * (inputHeight + gap)}px`;
        elements.windowDiv.style.gridTemplateColumns = `repeat(${cols}, ${inputWidth}px)`;
        elements.windowDiv.style.gridTemplateRows = `repeat(${rows}, ${inputHeight}px)`;
    } else {
        // 无数据时恢复到初始网格大小
        elements.windowDiv.classList.remove('dynamic');
        elements.windowDiv.style.width = '400px';
        elements.windowDiv.style.height = '400px';
        elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
        elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';
    }

    elements.windowDiv.innerHTML = '';

    state.gridInputs = [];
    state.gridCells = [];

    // 重建输入框并填充值
    if (state.matrixData) {
        const { rows, cols, elements: matrixElements } = state.matrixData;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'grid-cell-input';

                input.dataset.x = col;
                input.dataset.y = row;

                input.value = matrixElements[row][col] || '';

                elements.windowDiv.appendChild(input);
                state.gridInputs.push(input);
            }
        }

        state.gridInputs.forEach(input => {
            input.removeEventListener('input', handleInputChange);
            input.addEventListener('input', handleInputChange);

            adjustInputWidth(input);
        });

        updateCoordinatesDisplay(`${rows}×${cols}`);
    } else {
        // 无数据时恢复初始网格
        createGrid();
        updateCoordinatesDisplay('0×0');
        showSuccess('已恢复到初始网格');
    }
}
