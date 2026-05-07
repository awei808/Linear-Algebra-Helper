// ==================== DOM工具函数 ====================
import { CONFIG } from '../config.js';
import { state } from '../state/state.js';

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
    if (!input || !input.value) return;

    const font = getComputedStyle(input).font;
    const textWidth = getTextWidth(input.value, font);
    const minWidth = 40;
    const maxWidth = 200;
    const paddingWidth = 16;
    const newWidth = Math.min(Math.max(textWidth + paddingWidth, minWidth), maxWidth);

    input.style.width = newWidth + 'px';

    // 同步同列输入框宽度
    const col = parseInt(input.dataset.x);
    if (!isNaN(col)) {
        const cols = state.matrixData ? state.matrixData.cols : 0;
        state.gridInputs.forEach(otherInput => {
            if (parseInt(otherInput.dataset.x) === col) {
                otherInput.style.width = newWidth + 'px';
            }
        });

        // 更新网格列模板以匹配新宽度
        if (cols > 0) {
            const gap = 0;
            const colWidths = [];
            for (let c = 0; c < cols; c++) {
                const sameColInput = state.gridInputs.find(inp => parseInt(inp.dataset.x) === c);
                colWidths.push(sameColInput ? sameColInput.style.width || '40px' : '40px');
            }
            const elements = document.getElementById('window');
            if (elements) {
                elements.style.gridTemplateColumns = colWidths.join(' ');
            }
        }
    }
}
