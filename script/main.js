// ==================== 应用核心逻辑 ====================
// 注意：配置项已移至 config.js，状态机已移至 state.js
// DOM元素引用
// 网格内的dom元素不在elements中，其他dom都在这里，动态添加的dom也会进入elements
const elements = {
    // 主要界面元素
    windowDiv: document.getElementById('window'),
    coordinatesDiv: document.getElementById('coordinates'),
    undoButton: document.getElementById('undoButton'),
    nextButton: document.getElementById('nextButton'),
    inputMatrixDiv: document.getElementById('InputMatrix'),
    buttonInputMatrix: document.getElementById('ButtonInputMartix'),
    tipDiv: document.getElementById('tip'),
    header: document.querySelector('header'),

    // 更多菜单相关
    moreButton: document.getElementById('moreButton'),
    moreDropdown: document.getElementById('moreDropdown'),
    exportMatrixButton: document.getElementById('exportMatrixButton'),
    ButtonForceSimplify: document.getElementById('ButtonForceSimplify'),
    ButtonForceFactorize: document.getElementById('ButtonForceFactorize'),

    // 矩阵数据显示
    matrixDataDisplay: document.getElementById('matrixDataDisplay'),

    // 初等变换界面
    operatorButtons: document.querySelector('.operator-buttons'),
    transformTarget: document.getElementById('transform-target'),
    transformCoefficient: document.getElementById('transform-coefficient'),
    transformParam: document.getElementById('transform-param'),
    buttonChange: document.getElementById('button-change'),
    buttonAdd: document.getElementById('button-add'),
    buttonSub: document.getElementById('button-sub'),
    buttonMul: document.getElementById('button-mul'),
    buttonTranslate: document.getElementById('button-translate'),

    // 调试相关
    buttonTest: document.getElementById('ButtonTest'),

    //导入矩阵
    buttonQuickInput: document.getElementById('ButtonQuickInput'),

    // 弹窗相关
    popupBox: document.getElementById('popupBox'),
    popupCentreContainer: document.getElementById('popupCentreContainer'),

    //杂项

};

// ==================== 初始化函数 ====================
/**
 * 初始化应用
 */
function init() {
    createGrid();
    setupEventListeners();

    // 确保初始状态为INIT
    state.currentState = CONFIG.STATES.INIT;
    updateUIForCurrentState();
}
// 初始化应用, 添加窗口大小变化监听
document.addEventListener('DOMContentLoaded', () => {
    init();
    // 窗口大小变化时重新计算
    window.addEventListener('resize', () => {
        if (state.currentState === CONFIG.STATES.INPUT_ELEMENTS && state.matrixData) {
            restoreGridForInputElements();
        }
    });
});

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


/**
 * 处理矩阵元素输入，函数未被使用
 */
/*function handleElementInput() {
    // 验证所有输入框是否已填写
    const allFilled = fillEmptyInputsAndValidate();

    if (!allFilled) {
    showWarning('请填写所有矩阵元素');
    state.previousStates.pop();
return;
    }

    // 收集矩阵数据
    collectMatrixData();
    // 切换到数据校验状态
    state.currentState = CONFIG.STATES.DATA_VALIDATION;
    // 执行数据校验
    validateMatrixData();
}*/

/**
 * 处理数据校验
 */
function handleDataValidation() {

    if (state.currentState !== CONFIG.STATES.INPUT_ELEMENTS) {
        return false;
    }

    // 1. 收集矩阵数据（确保数据已收集）
    collectMatrixData();

    // 2. 执行数据校验（去除空数据校验，改为自动补零）
    const validationResult = validateMatrixData();
    if (!validationResult.isValid) {
        // 校验失败：提示错误并终止流程
        showError(validationResult.message);
        return false; // 返回处理失败
    }
    // 4. 更新坐标显示和全局UI
    updateCoordinatesDisplay(`${state.matrixData.rows}×${state.matrixData.cols}`);
    return true; // 返回处理成功
}



/**
 * 重置到初始状态
 */
function resetToInitialState() {
    // 清空窗口内容
    elements.windowDiv.innerHTML = '';

    // 移除行列索引事件监听器
    unbindRowColumnIndexEvents();

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

// Next() 和 Undo() 函数已移至 state.js

/**
 * 切换输入矩阵区域的显示/隐藏；支持快速录入功能
 */
function startMatrixInput() {
    // 如果快速录入输入框存在且不为空，则优先处理快速录入
    if (elements.quickInput && elements.quickInput.value.trim() !== '') {
        handleQuickInputMatrix();
        return;
    }

    // 如果当前是初始状态，切换到维度选择状态
    if (state.currentState === CONFIG.STATES.INIT) {
        // 保存当前状态到历史
        state.previousStates.push({
            state: state.currentState,
            matrixData: state.matrixData ? JSON.parse(JSON.stringify(state.matrixData)) : null
        });

        // 切换到维度选择状态
        state.currentState = CONFIG.STATES.SELECT_DIMENSION;
        updateUIForCurrentState();
        elements.inputMatrixDiv.classList.toggle('visible');
        return;
    }

    // 否则执行原有的toggleInputMatrix功能
    elements.inputMatrixDiv.classList.toggle('visible');
}



/**
 * 切换更多下拉菜单的显示/隐藏
 */
function toggleMoreDropdown(event) {
    event.stopPropagation(); // 阻止事件冒泡
    const moreDropdown = document.getElementById('moreDropdown');
    if (moreDropdown) {
        moreDropdown.classList.toggle('show');
    }
}

/**
 * 导出矩阵为二维数组
 */
function exportMatrixToArray() {
    // 检查是否有矩阵数据
    if (!state.matrixData || !state.matrixData.elements) {
        showError('没有可导出的矩阵数据');
        return;
    }

    const { rows, cols, elements: matrixElements } = state.matrixData;

    // 将矩阵元素转换为二维数组字符串
    const matrixArray = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(matrixElements[i][j] || '0');
        }
        matrixArray.push(`[${row.join(', ')}]`);
    }

    const matrixString = `[${matrixArray.join(', ')}]`;

    // 复制到剪贴板
    navigator.clipboard.writeText(matrixString).then(() => {
        // 显示成功消息
        showSuccess('矩阵数据已复制到剪贴板！');

        // 显示矩阵数据
        if (elements.matrixDataDisplay) {
            elements.matrixDataDisplay.textContent = `矩阵数据: ${matrixString}`;
            elements.matrixDataDisplay.style.display = 'block';
        }

        // 关闭下拉菜单
        if (elements.moreDropdown) {
            elements.moreDropdown.classList.remove('show');
        }

    }).catch(err => {
        console.error('复制失败:', err);
        showError('复制失败，请手动复制以下内容: ' + matrixString);

        // 即使复制失败也显示数据
        if (elements.matrixDataDisplay) {
            elements.matrixDataDisplay.textContent = `矩阵数据: ${matrixString}`;
            elements.matrixDataDisplay.style.display = 'block';
        }
    });
}

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

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 使用事件委托，减少事件监听器数量
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);
    // 添加按钮事件监听器
    elements.undoButton.addEventListener('click', Undo);
    elements.nextButton.addEventListener('click', Next);
    // 添加录入矩阵按钮点击事件
    elements.buttonInputMatrix.addEventListener('click', startMatrixInput);

    // 添加更多按钮点击事件
    if (elements.moreButton && elements.moreDropdown) {
        elements.moreButton.addEventListener('click', toggleMoreDropdown);

        // 点击页面其他区域时关闭下拉菜单
        document.addEventListener('click', function (event) {
            if (!elements.moreButton.contains(event.target) && !elements.moreDropdown.contains(event.target)) {
                elements.moreDropdown.classList.remove('show');
            }
        });
    }

    // 添加导出矩阵按钮点击事件
    if (elements.exportMatrixButton) {
        elements.exportMatrixButton.addEventListener('click', function (event) {
            event.preventDefault();
            exportMatrixToArray();
        });
    }
}

// ==================== 网格操作函数 ====================
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
 * 恢复输入元素状态的网格
 * 根据全局变量matrixData来恢复网格和输入框，并填上输入框的值
 */
function restoreGridForInputElements() {
    // 1. 检查全局matrixData是否存在，先计算并设置输入元素状态下的窗口大小
    if (state.matrixData) {
        const { rows, cols } = state.matrixData;
        // 动态获取输入框的实际尺寸
        const { width: inputWidth, height: inputHeight } = getInputElementDimensions();
        const gap = 0;

        elements.windowDiv.classList.add('dynamic');
        elements.windowDiv.style.width = `${cols * (inputWidth + gap)}px`;
        elements.windowDiv.style.height = `${rows * (inputHeight + gap)}px`;
        elements.windowDiv.style.gridTemplateColumns = `repeat(${cols}, ${inputWidth}px)`;
        elements.windowDiv.style.gridTemplateRows = `repeat(${rows}, ${inputHeight}px)`;
    } else {
        // 无数据时，先恢复到初始网格大小
        elements.windowDiv.classList.remove('dynamic');
        elements.windowDiv.style.width = '400px';
        elements.windowDiv.style.height = '400px';
        elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
        elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';
    }

    // 2. 清空窗口内容，去掉整个表格/网格
    elements.windowDiv.innerHTML = '';

    // 3. 重置状态数组
    state.gridInputs = [];
    state.gridCells = [];

    // 4. 再次检查全局matrixData是否存在，重建输入框
    if (state.matrixData) {
        const { rows, cols, elements: matrixElements } = state.matrixData;

        // 6. 重建输入框并填充值
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'grid-cell-input';

                // 设置统一的dataset属性
                input.dataset.x = col;
                input.dataset.y = row;

                // 填充输入框的值
                input.value = matrixElements[row][col] || '';

                // 添加到窗口和状态数组
                elements.windowDiv.appendChild(input);
                state.gridInputs.push(input);
            }
        }

        // 为所有输入框添加输入事件监听器
        state.gridInputs.forEach(input => {
            input.removeEventListener('input', handleInputChange); // 避免重复添加
            input.addEventListener('input', handleInputChange);

            // 初始化时也调整宽度
            adjustInputWidth(input);
        });

        // 7. 更新坐标显示
        updateCoordinatesDisplay(`${rows}×${cols}`);
    } else {
        // 8. 无数据时恢复初始网格
        createGrid();
        updateCoordinatesDisplay(CONFIG.INITIAL_DIMENSION);
    }
}

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
 * 启用网格交互（用于撤销功能）
 */
function enableGridInteraction() {
    // 重新添加事件监听器
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);
}

/**
 * 禁用网格交互
 */
function disableGridInteraction() {
    // 移除鼠标事件监听器
    elements.windowDiv.removeEventListener('mousedown', handleMouseDown);
    elements.windowDiv.removeEventListener('mouseleave', handleMouseLeave);
}

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
 * 处理输入框内容变化
 */
function handleInputChange(event) {
    adjustInputWidth(event.target);
}

/**
 * 禁用输入框交互
 */
function disableInputInteraction() {
    // 禁用所有输入框
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    inputs.forEach(input => {
        input.disabled = true;
        input.style.backgroundColor = '#f0f0f0';
        input.style.cursor = 'not-allowed';
        console.log('禁用成功');
    });
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
// ====================  数据处理函数 ====================
/**
 * 收集矩阵数据
 */
function collectMatrixData() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));

    inputs.forEach(input => {
        const x = parseInt(input.dataset.x);
        const y = parseInt(input.dataset.y);
        state.matrixData.elements[y][x] = input.value.trim();
    });
}

/**
 * 矩阵数据校验与预处理函数
 * 支持小数转分数、自动补零和多种数据格式验证
 * @param {boolean} useDOM - 是否从DOM元素中读取数据（否则从state.matrixData.elements读取）
 * @returns {Object} {isValid: boolean, message: string}
 */
function validateMatrixData(useDOM = false) {
    // 检查矩阵数据是否存在
    if (!state.matrixData || !state.matrixData.elements) {
        return {
            isValid: true, // 不再进行空数据校验，直接返回通过
            message: '数据处理完成'
        };
    }

    const { rows, cols } = state.matrixData;
    let elements = [];
    let inputs = [];
    // 选择数据来源
    if (useDOM) {
        // 从DOM中读取数据
        inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    } else {
        // 从state中读取数据
        elements = state.matrixData.elements;
    }

    // 遍历数据进行处理
    if (useDOM) {
        // DOM数据源处理（一维数组）
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            let value = input.value.trim();
            const row = Math.floor(i / cols) + 1;
            const col = (i % cols) + 1;

            // 使用增强的格式化函数处理数据
            const formatResult = enhancedFormatMatrixValue(value, true);

            if (!formatResult.success) {
                return {
                    isValid: false,
                    message: `第${row}行第${col}列${formatResult.error}`
                };
            }

            // 更新输入框的值
            input.value = formatResult.formattedValue;
        }
    } else {
        // State数据源处理（二维数组）
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let value = elements[row][col]?.trim() || '';

                // 使用增强的格式化函数处理数据
                const formatResult = enhancedFormatMatrixValue(value, true);

                if (!formatResult.success) {
                    return {
                        isValid: false,
                        message: `第${row + 1}行第${col + 1}列${formatResult.error}`
                    };
                }

                // 更新矩阵数据
                elements[row][col] = formatResult.formattedValue;
            }
        }
    }

    // 始终返回验证通过
    return {
        isValid: true,
        message: '数据处理完成'
    };
}

/**  
* 填充空输入框并验证，函数未被使用
 */
/*function fillEmptyInputsAndValidate() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));

    // 遍历所有输入框，将空输入框的值设为0
    inputs.forEach(input => {
        if (input.value.trim() === '') {
            input.value = '0';
        }
    });

    // 验证所有输入框是否已填写（现在应该都填了）
    return inputs.every(input => input.value.trim() !== '');
}*/

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
// ====================  UI操作函数 ====================

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

/**
 * 显示初等变换UI
 */
function showElementaryTransformationUI() {
    // 移除hidden类，显示初等变换界面
    const elementaryTransformationDiv = document.querySelector('.operator-buttons');
    if (elementaryTransformationDiv) {
        elementaryTransformationDiv.classList.remove('hidden');

        // 确保初等变换界面也继承body的居中样式
        elementaryTransformationDiv.style.alignItems = 'center';
        elementaryTransformationDiv.style.width = '100%';
        elementaryTransformationDiv.style.maxWidth = '1000px';
        elementaryTransformationDiv.style.margin = '0 auto';
    }

    // 为输入框添加行列索引按钮
    createMatrixDisplayTable();

    // 为行列索引按钮添加事件冒泡绑定（现在有双重保护）
    bindRowColumnIndexEvents();

    // 重新组织布局，避免元素重叠
    reorganizeLayoutForElementaryTransformation();
}

/**
 * 为行列索引按钮绑定事件（事件冒泡方式）
 */
function bindRowColumnIndexEvents() {
    // 在最外层添加条件判断：若事件监听器已绑定，则直接返回
    if (state.isRowColumnIndexEventsBound && state.rowColumnIndexEventListener) {
        console.log('行列索引事件监听器已绑定，跳过重复绑定');
        return;
    }

    // 先移除已存在的事件监听器（安全措施）
    if (state.rowColumnIndexEventListener) {
        elements.windowDiv.removeEventListener('click', state.rowColumnIndexEventListener);
        state.rowColumnIndexEventListener = null;
    }

    // 为windowDiv添加点击事件监听器，处理行列索引按钮点击
    const eventListener = function (e) {
        const target = e.target;
        // 判断是否点击了行/列标识按钮（ID以button_add_r或button_add_c开头）
        if (target.id.startsWith('button_add_r') || target.id.startsWith('button_add_c')) {
            const type = target.id.includes('r') ? 'r' : 'c';
            const num = target.textContent.replace(type, ''); // 提取数字（如"r1"→"1"）

            // 获取目标输入框和参数输入框
            const transformTarget = document.getElementById('transform-target');
            const transformParam = document.getElementById('transform-param');

            if (transformTarget && transformParam) {
                if (transformTarget.value.trim() === '') {
                    // 如果目标框为空，将点击的行列索引添加到目标框
                    transformTarget.value += type + num;
                } else {
                    // 如果目标框不为空，将点击的行列索引添加到参数框
                    const currentParam = transformParam.value.trim();
                    const rowColRegex = /[rc]\d+/g;
                    const hasRowCol = rowColRegex.test(currentParam);

                    if (hasRowCol) {
                        // 如果已经包含行列索引，则替换最后一个行列索引
                        const lastRowColMatch = currentParam.match(rowColRegex);
                        if (lastRowColMatch && lastRowColMatch.length > 0) {
                            const lastRowCol = lastRowColMatch[lastRowColMatch.length - 1];
                            const lastIndex = currentParam.lastIndexOf(lastRowCol);
                            transformParam.value = currentParam.substring(0, lastIndex) + type + num + currentParam.substring(lastIndex + lastRowCol.length);
                        } else {
                            transformParam.value += type + num;
                        }
                    } else {
                        // 如果没有行列索引，直接添加
                        transformParam.value += type + num;
                    }
                }
            }
        }
    };

    // 绑定事件监听器并保存引用
    elements.windowDiv.addEventListener('click', eventListener);
    state.rowColumnIndexEventListener = eventListener;
    state.isRowColumnIndexEventsBound = true; // 标记为已绑定
    console.log('行列索引事件监听器已绑定');
}

/**
 * 移除行列索引事件监听器
 */
function unbindRowColumnIndexEvents() {
    if (state.rowColumnIndexEventListener) {
        elements.windowDiv.removeEventListener('click', state.rowColumnIndexEventListener);
        state.rowColumnIndexEventListener = null;
        state.isRowColumnIndexEventsBound = false; // 标记为未绑定
        console.log('行列索引事件监听器已移除');
    }
}

/**
 * 重新组织布局以适应初等变换状态
 */
function reorganizeLayoutForElementaryTransformation() {
    // 不再清空inputMatrixDiv，保持现有结构

    // 获取所有需要操作的元素
    const operatorButtons = document.querySelectorAll('.operator-buttons');

    // 确保初等变换按钮组可见
    operatorButtons.forEach(buttonGroup => {
        buttonGroup.classList.remove('hidden');
    });

    // 确保坐标显示正确更新（但不改变其位置）
    const coordinates = document.getElementById('coordinates');
    if (coordinates && state.matrixData) {
        coordinates.textContent = `矩阵维度: ${state.matrixData.rows}×${state.matrixData.cols}`;
    }
}

/**
 * 创建完整的矩阵显示表格
 * 功能包括：
 * 1. 创建表格结构显示矩阵数据
 * 2. 添加行列索引按钮（r1, r2, c1, c2,...）
 * 3. 实现事件委托处理矩阵单元格点击
 * 4. 调整窗口大小以适应表格布局
 * 5. 替换原有的输入框布局为表格显示
 */
function createMatrixDisplayTable() {
    // 修改：将解构的elements重命名为matrixElements，避免与全局elements对象冲突
    const { rows, cols, elements: matrixElements } = state.matrixData;

    // 创建表格容器
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0px auto';

    // 创建数据行（行索引放在行末尾）
    for (let row = 0; row < rows; row++) {
        const tr = document.createElement('tr');

        // 添加数据单元格（先添加数据，再添加行索引）
        for (let col = 0; col < cols; col++) {
            const td = document.createElement('td');
            // 直接显示矩阵值，不再使用输入框
            const cellValue = matrixElements[row][col] || '0'; // 默认值为0
            td.textContent = cellValue;
            
            // 添加数据属性，用于事件委托
            td.dataset.row = row;
            td.dataset.col = col;
            td.dataset.type = 'matrix-cell';
            
            tr.appendChild(td);
        }

        // 添加行索引按钮（放在行末尾）
        const rowIndexTd = document.createElement('td');
        rowIndexTd.className = 'row-label';
        const rowButton = document.createElement('button');
        rowButton.textContent = `r${row + 1}`;
        rowButton.id = `button_add_r${row + 1}`;
        rowIndexTd.appendChild(rowButton);
        tr.appendChild(rowIndexTd);
        table.appendChild(tr);
    }

    // 创建列索引行（放在表格下方）
    const colTr = document.createElement('tr');

    // 添加列索引按钮（直接与数据列对齐）
    for (let col = 0; col < cols; col++) {
        const colTd = document.createElement('td');
        colTd.className = 'col-label';
        const colButton = document.createElement('button');
        colButton.textContent = `c${col + 1}`;
        colButton.id = `button_add_c${col + 1}`;
        colTd.appendChild(colButton);
        colTr.appendChild(colTd);
    }

    // 添加空单元格（对应行索引列的位置）
    const emptyTd = document.createElement('td');
    colTr.appendChild(emptyTd);

    table.appendChild(colTr);

    // 为表格添加事件委托（事件冒泡）
    table.addEventListener('click', function (event) {
        const target = event.target;

        // 检查是否点击了矩阵单元格
        if (target.dataset.type === 'matrix-cell') {
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);

            // 调用已存在的矩阵元素点击处理函数
            if (typeof handleMatrixElementClick === 'function') {
                handleMatrixElementClick(row, col, target);
            }
        }
    });

    // 替换原来的输入框布局
    elements.windowDiv.innerHTML = '';
    elements.windowDiv.appendChild(table);
    
    // 清除之前的选中状态
    state.selectedMatrixElements = [];

    // 计算并调整windowDiv大小以适应表格
    // 使用setTimeout确保表格已添加到DOM中并完成渲染
    setTimeout(() => {
        // 获取表格的实际宽度和高度
        const windowWidth = table.offsetWidth;
        const windowHeight = table.offsetHeight;
        // 调整windowDiv的大小
        elements.windowDiv.style.width = `${windowWidth}px`;
        elements.windowDiv.style.height = `${windowHeight}px`;
        // 重置grid布局，因为我们不再使用它
        elements.windowDiv.style.gridTemplateColumns = 'none';
        elements.windowDiv.style.gridTemplateRows = 'none';

        // 确保windowDiv能正确显示表格
        elements.windowDiv.style.overflow = 'visible';
        elements.windowDiv.style.display = 'block';
    }, 0);
}

/**
 * 处理矩阵元素点击事件
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @param {HTMLElement} element - 被点击的元素
 */
function handleMatrixElementClick(row, col, element) {
    // 检查是否在初等变换状态下
    if (state.currentState !== CONFIG.STATES.ELEMENTARY_TRANSFORMATION) {
        return;
    }
    
    // 计算元素索引：index = (row) * cols + col+1
    // 注意：row和col都是0-based索引
    // 元素索引手动+1，符合直觉
    const cols = state.matrixData.cols;
    const elementIndex = row * cols + col+1;
    
    // 检查是否已经选中
    const isAlreadySelected = state.selectedMatrixElements.includes(elementIndex);
    
    if (isAlreadySelected) {
        // 取消选中
        state.selectedMatrixElements = state.selectedMatrixElements.filter(index => 
            index !== elementIndex
        );
        element.classList.remove('selected-matrix-element');
    } else {
        // 添加选中
        state.selectedMatrixElements.push(elementIndex);
        element.classList.add('selected-matrix-element');
    }
    
    console.log('选中元素索引:', state.selectedMatrixElements);
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
 * 清除所有高亮
 */
function clearAllHighlights() {
    state.gridCells.forEach(cell => {
        cell.classList.remove('highlighted');
    });
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

/**
 * 更新坐标显示
 */
function updateCoordinatesDisplay(dimensionText) {
    elements.coordinatesDiv.textContent = `矩阵维度: ${dimensionText}`;
}


// ==================== 底层工具函数 ====================
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
* 调整窗口大小以适应矩阵
 */
function resizeWindow(dimensions) {
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

/**
 * 获取当前设备上输入框的实际CSS尺寸
 * @returns {Object} 包含width和height的对象
 */
function getInputElementDimensions() {
    // 创建临时输入框来获取实际计算样式
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
 * 获取当前屏幕尺寸类型
 * @returns {string} 屏幕尺寸类型：'mobile', 'tablet', 'desktop'
 */
function getScreenSizeType() {
    const width = window.innerWidth;
    if (width <= CONFIG.SCREEN_SIZES.MOBILE_MAX) return 'mobile';
    if (width <= CONFIG.SCREEN_SIZES.TABLET_MAX) return 'tablet';
    return 'desktop';
}