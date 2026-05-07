// ==================== DOM工具函数 ====================
import { CONFIG } from '../config.js';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';

/**
 * 获取当前设备上输入框的实际CSS尺寸
 * 通过创建临时元素并读取计算样式来获取精确尺寸
 * @returns {Object} 包含width和height的对象
 */
export function getInputElementDimensions() {
    const tempInput = document.createElement('input');
    tempInput.className = 'grid-cell-input';
    document.body.appendChild(tempInput);

    const computedStyle = window.getComputedStyle(tempInput);
    const dimensions = {
        width: parseFloat(computedStyle.width),
        height: parseFloat(computedStyle.height)
    };

    document.body.removeChild(tempInput);
    return dimensions;
}

/**
 * 获取当前屏幕尺寸类型并更新state.isMobile
 * @returns {string} 屏幕尺寸类型：'mobile', 'tablet', 'desktop'
 */
export function getScreenSizeType() {
    const width = window.innerWidth;
    if (width <= CONFIG.SCREEN_SIZES.MOBILE_MAX) {
        state.isMobile = true;
        return 'mobile';
    }
    if (width <= CONFIG.SCREEN_SIZES.TABLET_MAX) {
        state.isMobile = true;
        return 'tablet';
    }
    state.isMobile = false;
    return 'desktop';
}

/**
 * 计算文本的渲染宽度（用于输入框宽度自适应）
 * @param {string} text - 待测量的文本
 * @param {string} font - CSS字体字符串
 * @returns {number} 文本宽度（像素）
 */
export function getTextWidth(text, font) {
    const span = document.createElement('span');
    span.style.font = font || getComputedStyle(document.body).font;
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'nowrap';
    span.textContent = text;
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
    return width;
}

/**
 * 根据输入内容自动调整输入框宽度
 * 同时同步同列所有输入框的宽度，保持列对齐
 * @param {HTMLInputElement} input - 输入框元素
 */
export function adjustInputWidth(input) {
    if (!input) return;

    // 记录原始CSS宽度作为下限，防止缩小到比默认宽度还小
    if (!input.dataset.minWidth) {
        input.dataset.minWidth = window.getComputedStyle(input).width;
    }
    const originalMinWidth = Math.max(40, parseFloat(input.dataset.minWidth) || 40);

    if (input.value) {
        const font = getComputedStyle(input).font;
        const textWidth = getTextWidth(input.value, font);
        const maxWidth = 200;
        const paddingWidth = 16;
        const newWidth = Math.min(Math.max(textWidth + paddingWidth, originalMinWidth), maxWidth);
        input.style.width = newWidth + 'px';
    } else {
        input.style.width = originalMinWidth + 'px';
    }

    // 同步同列输入框宽度：取该列所有输入的最大宽度
    const col = parseInt(input.dataset.x);
    if (!isNaN(col)) {
        const cols = state.matrixData ? state.matrixData.cols : 0;
        if (cols > 0) {
            syncColumnWidths(cols);
        }
    }
}

function syncColumnWidths(cols) {
    // 计算每列的最大宽度
    const colMaxWidths = [];
    for (let c = 0; c < cols; c++) {
        let maxW = 0;
        state.gridInputs.forEach(inp => {
            if (parseInt(inp.dataset.x) === c) {
                const w = parseFloat(inp.style.width) || 40;
                maxW = Math.max(maxW, w);
            }
        });
        colMaxWidths.push(maxW);
    }

    // 同步同列所有输入框到最大宽度
    state.gridInputs.forEach(inp => {
        const c = parseInt(inp.dataset.x);
        if (!isNaN(c) && colMaxWidths[c]) {
            inp.style.width = colMaxWidths[c] + 'px';
        }
    });

    // 更新网格列模板
    elements.windowDiv.style.gridTemplateColumns = colMaxWidths.map(w => w + 'px').join(' ');
}
