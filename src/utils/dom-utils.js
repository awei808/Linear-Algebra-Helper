import { CONFIG } from '../config.js';
import { state } from '../state/state.js';

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

        // 更新网格列模板
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
