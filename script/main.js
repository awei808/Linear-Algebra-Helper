/* ===================大main残躯功能===================
1. 获取所有dom元素并存储在elements中
2. 初始化应用，并添加事件监听器
3. 处理按钮“更多”的一些简单功能
4. 识别屏幕尺寸
*/
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
    ButtonQuickInput: document.getElementById('ButtonQuickInput'),
    ButtonReplaceElement: document.getElementById('ButtonReplaceElement'),

    // 矩阵数据显示
    matrixDataDisplay: document.getElementById('matrixDataDisplay'),

    // 初等变换界面
    target: document.getElementById('target'),
    param: document.getElementById('param'),
    operatorButtons: document.querySelector('.operator-buttons'),
    transformTarget: document.getElementById('transform-target'),
    transformCoefficient: document.getElementById('transform-coefficient'),
    transformParam: document.getElementById('transform-param'),
    buttonChange: document.getElementById('button-change'),
    buttonAdd: document.getElementById('button-add'),
    buttonSub: document.getElementById('button-sub'),
    buttonMul: document.getElementById('button-mul'),
    buttonTranslate: document.getElementById('button-translate'),
    historyTransformation: document.getElementById('historyTransformation'),
    buttonUndo: document.getElementById('button-undoTransformation'),
    buttonRedo: document.getElementById('button-redoTransformation'),

    // 调试相关
    buttonTest: document.getElementById('ButtonTest'),


    // 弹窗相关
    popupBox: document.getElementById('popupBox'),
    popupCentreContainer: document.getElementById('popupCentreContainer'),

    //特殊element元素，无法直接在此处获取，在其他函数创建后才会进入elements对象
    /*
    buttonInputMatrix  
     */

};

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
    
    // 为target和param元素添加点击事件监听器
    if (elements.target) {
        elements.target.addEventListener('click', function() {
            handleTransformGroupClick(this);
        });
    }
    
    if (elements.param) {
        elements.param.addEventListener('click', function() {
            handleTransformGroupClick(this);
        });
    }

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
    elements.exportMatrixButton.addEventListener('click', function (event) {
        event.preventDefault();
        exportMatrixToArray();
    });
    // 为导入二维数组为矩阵按钮绑定点击事件
    elements.ButtonQuickInput.addEventListener('click', handleQuickInputClick);

    // 添加多项式处理功能事件绑定
    elements.ButtonForceSimplify.addEventListener('click', confirmForceExpand);
    elements.ButtonForceFactorize.addEventListener('click', confirmForceFactorize);
    elements.ButtonReplaceElement.addEventListener('click', confirmReplaceElement);

    // 添加初等变换按钮点击事件
    elements.buttonUndo.addEventListener('click', undoTransformation);
    elements.buttonRedo.addEventListener('click', redoTransformation);

}

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
 * 重置到初始状态，暂未使用
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

/**
 * 处理“导入二维数组为矩阵”功能
 */
function handleQuickInputMatrix() {
    // 严格通过elements对象访问，不直接获取DOM元素
    if (!elements || !elements.quickInput) {
        showError('导入二维数组为矩阵输入框不存在，请先点击"导入二维数组为矩阵"按钮创建输入框');
        return false;
    }

    const inputValue = elements.quickInput.value.trim();
    if (inputValue === '') {
        showError('请输入二维数组');
        return false;
    }

    // 检验并解析二维数组
    const validationResult = validateAndParseMatrix(inputValue);
    if (!validationResult.isValid) {
        showError(validationResult.message);
        return false;
    }

    // 保存当前状态到历史记录（从INIT状态转换）
    saveCurrentState();

    // 存储矩阵数据到state
    state.matrixData = {
        rows: validationResult.rows,
        cols: validationResult.cols,
        elements: validationResult.elements
    };
    
    // 保存初始矩阵数据，用于撤销到初始状态
    state.initialMatrixData = JSON.parse(JSON.stringify(state.matrixData));

    // 模拟完整的状态转换链：INIT → SELECT_DIMENSION → INPUT_ELEMENTS → ELEMENTARY_TRANSFORMATION
    
    // 保存SELECT_DIMENSION状态
    const originalState = state.currentState;
    state.currentState = CONFIG.STATES.SELECT_DIMENSION;
    saveCurrentState();
    
    // 保存INPUT_ELEMENTS状态
    state.currentState = CONFIG.STATES.INPUT_ELEMENTS;
    saveCurrentState();

    // 设置状态为初等变换
    state.currentState = CONFIG.STATES.ELEMENTARY_TRANSFORMATION;

    // 显示表格（使用与createMatrixDisplayTable相同的格式）
    createMatrixDisplayTable();

    // 更新UI状态
    updateUIForCurrentState();

    // 显示成功消息
    showSuccess(`矩阵录入成功！维度: ${validationResult.rows}×${validationResult.cols}`);
    return true;
}

/**
 * 切换更多下拉菜单的显示/隐藏
 */
function toggleMoreDropdown(event) {
    event.stopPropagation(); // 阻止事件冒泡，防止触发关闭菜单事件
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

// ====================  UI操作函数 ====================

//该函数疑似可以用toggle优化
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
    // 注意：row和col都是0-based索引；元素索引手动+1
    const cols = state.matrixData.cols;
    const elementIndex = row * cols + col + 1;

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
 * 处理“导入二维数组为矩阵”按钮点击事件
 */
function handleQuickInputClick() {

    // 如果输入框已经存在，则不再添加
    if (state.quickInputAdded) {
        return;
    }

    // 创建输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'input';
    input.placeholder = '请输入二维数组';
    input.style.marginLeft = '10px';
    input.style.marginRight = '10px';
    input.style.padding = '8px 12px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.width = '200px';

    // 添加到header中
    elements.header.appendChild(input);
    state.quickInputAdded = true;

    // 必须更新elements对象中的引用，确保所有DOM访问都通过elements
    if (typeof elements !== 'undefined') {
        elements.quickInput = input;
        console.log('导入二维数组为矩阵输入框已添加到elements对象');
    } else {
        console.error('elements对象未定义，无法更新DOM引用');
    }

    // 将"录入矩阵"按钮移动到header的最后面
    if (elements.buttonInputMatrix) {
        elements.header.appendChild(elements.buttonInputMatrix);
    }

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