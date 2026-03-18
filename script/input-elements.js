/*
本文件存储输入元素状态的相关函数，包括函数执行完成后进入输入元素状态的函数
*/

// ==================== 底层工具函数 ====================
/**
 * 计算文本在特定字体下的像素宽度
 */
function getTextWidth(text, font) {
    // 创建一个临时span元素来测量文本宽度
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.font = font;
    span.style.whiteSpace = 'pre';
    span.textContent = text;

    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);

    return width;
}

/**
 * 根据输入内容调整输入框宽度
 */
function adjustInputWidth(input) {
    const value = input.value.toString();

    // 获取输入框的字体样式
    const computedStyle = window.getComputedStyle(input);
    const font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;

    // 计算基础宽度（原始CSS设定的宽度）
    const baseWidth = 60; // CSS中设定的默认宽度

    // 计算padding和border的总宽度
    const paddingWidth = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    const borderWidth = parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);

    // 每5个字符扩大50像素（约等于5个字符的宽度）
    const charBasedWidth = baseWidth + Math.floor(value.length / 5) * 50;

    // 设置最小和最大宽度
    const minWidth = baseWidth;
    const maxWidth = 300; // 最大宽度限制

    // 计算最终宽度
    let newWidth = Math.max(minWidth, Math.min(maxWidth, charBasedWidth));

    // 设置新宽度
    input.style.width = newWidth + 'px';

    // 同步调整同列的所有输入框宽度
    const inputCol = parseInt(input.dataset.x);
    const allInputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    const columnInputs = allInputs.filter(inp => parseInt(inp.dataset.x) === inputCol);

    // 找到同列中最宽的输入框宽度
    let maxWidthInColumn = newWidth;
    columnInputs.forEach(colInput => {
        const colValue = colInput.value.toString();
        const colCharBasedWidth = baseWidth + Math.floor(colValue.length / 5) * 50;
        maxWidthInColumn = Math.max(maxWidthInColumn, colCharBasedWidth);
    });

    // 将同列所有输入框设置为最大宽度
    columnInputs.forEach(colInput => {
        const colCharBasedWidth = baseWidth + Math.floor(colInput.value.toString().length / 5) * 50;
        const colFinalWidth = Math.max(minWidth, Math.min(maxWidth, maxWidthInColumn));
        colInput.style.width = colFinalWidth + 'px';
    });

    // 重新调整整个网格的列宽
    if (state.matrixData) {
        const { cols } = state.matrixData;
        const gridColumnSizes = [];
        for (let i = 0; i < cols; i++) {
            const colInputs = allInputs.filter(inp => parseInt(inp.dataset.x) === i);
            if (colInputs.length > 0) {
                // 取该列第一个输入框的宽度作为该列的宽度
                const widthOfFirstInCol = parseFloat(colInputs[0].style.width) || baseWidth;
                gridColumnSizes.push(widthOfFirstInCol + 'px');
            } else {
                gridColumnSizes.push(baseWidth + 'px');
            }
        }
        elements.windowDiv.style.gridTemplateColumns = gridColumnSizes.join(' ');

        // 重新计算整个窗口的宽度
        const totalWidth = gridColumnSizes.reduce((sum, size) => sum + parseFloat(size), 0);
        elements.windowDiv.style.width = totalWidth + 'px';
    }
}

/**
 * 删除非高亮的单元格
 */
function removeNonHighlightedCells() {
    const allCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell'));
    const nonHighlightedCells = allCells.filter(cell => !cell.classList.contains('highlighted'));

    nonHighlightedCells.forEach(cell => {
        cell.remove();
    });

    // 更新网格单元格数组
    state.gridCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell'));
}
// ==================== 中层操作函数 ====================
/**
 * 将高亮单元格转换为输入框
 */
function convertHighlightedCellsToInputs(highlightedCells) {
    highlightedCells.forEach(cell => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'grid-cell-input';
        input.dataset.x = cell.dataset.x;
        input.dataset.y = cell.dataset.y;
        input.dataset.index = cell.dataset.index;
        input.placeholder = '0';
        // 替换原单元格
        cell.parentNode.replaceChild(input, cell);

        // 添加到状态管理
        state.gridInputs = state.gridInputs || [];
        state.gridInputs.push(input);
    });
}

/**
 * 清除所有选中的矩阵元素
 */
function clearSelectedMatrixElements() {
    // 清除样式
    const selectedElements = elements.windowDiv.querySelectorAll('.selected-matrix-element');
    selectedElements.forEach(element => {
        element.classList.remove('selected-matrix-element');
    });

    // 清空选中数组
    state.selectedMatrixElements = [];
}

// ==================== 事件处理函数 ====================
/**
 * 处理输入框内容变化
 */
function handleInputChange(event) {
    adjustInputWidth(event.target);
}

// ==================== 高级流程函数 ====================
/**
 * 启用输入框交互
*/
function enableInputInteraction() {
    // 启用所有输入框
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    inputs.forEach(input => {
        input.disabled = false;
        input.style.backgroundColor = 'white';
        input.style.cursor = 'text';

        // 为每个输入框添加输入事件监听器
        input.removeEventListener('input', handleInputChange); // 避免重复添加
        input.addEventListener('input', handleInputChange);

        // 初始化时也调整宽度
        adjustInputWidth(input);
    });
}

/**
 * 禁用网格交互
 * 注：本函数既用于跳转输入元素状态，也用于跳转初等变换状态
 */
function disableGridInteraction() {
    // 移除鼠标事件监听器
    elements.windowDiv.removeEventListener('mousedown', handleMouseDown);
    elements.windowDiv.removeEventListener('mouseleave', handleMouseLeave);
}

/**
 * 隐藏初等变换UI（核心：清理初等变换操作框）
 */
function hideElementaryTransformationUI() {
    // 移除初等变换相关的DOM元素（根据实际DOM结构调整选择器）
    const transformUI = document.querySelector('.operator-buttons');
    transformUI.classList.add('hidden');
    // 移除行列索引事件监听器
    unbindRowColumnIndexEvents();
}