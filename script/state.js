// ==================== 状态机管理器 ====================

// 状态管理对象
const state = {
    currentHoverCell: null,
    lastSelectedDimension: CONFIG.INITIAL_DIMENSION,
    gridCells: [], // 缓存网格元素引用
    gridInputs: [], // 缓存输入框元素引用
    currentState: CONFIG.STATES.INIT, // 默认状态为INIT
    matrixData: null, // 存储矩阵数据，预期格式{rows，cols，elements}
    previousStates: [],// 状态历史，用于撤销
    rowColumnIndexEventListener: null, // 存储行列索引事件监听器引用
    isRowColumnIndexEventsBound: false,// 新增：标记行列索引事件是否已绑定
    selectedMatrixElements: [], // 存储用户选中的矩阵元素索引
    quickInputAdded : false,
    transformTarget: null,// 初等变换目标行/列
    transformCoefficient: null,// 初等变换系数
    transformParam: null,// 初等变换参数行/列
};

// ==================== 状态机核心函数 ====================

/**
 * 更新UI以反映当前状态
 */
function updateUIForCurrentState() {
    switch (state.currentState) {
        case CONFIG.STATES.INIT: // 初始状态
            console.log('to 初始状态');
            elements.tipDiv.textContent = '请点击"录入矩阵"按钮开始';
            updateButtonState(elements.nextButton, false);
            updateButtonState(elements.undoButton, false);
            disableGridInteraction();
            break;

        case CONFIG.STATES.SELECT_DIMENSION:
            console.log('to 维度选择');
            elements.tipDiv.textContent = '点击网格选择矩阵大小';
            updateButtonState(elements.nextButton, true);
            updateButtonState(elements.undoButton, false);
            enableGridInteraction();
            break;

        case CONFIG.STATES.INPUT_ELEMENTS:
            console.log('to 输入元素');
            console.log(`矩阵维度: ${state.lastSelectedDimension}`);
            elements.tipDiv.textContent = '请在输入框中输入矩阵元素（非‘0’），点击下一步后，空白处将用‘0’填充';
            updateButtonState(elements.nextButton, true);
            updateButtonState(elements.undoButton, true);
            enableInputInteraction();
            disableGridInteraction();

            // 清除选中的矩阵元素
            if (typeof clearSelectedMatrixElements === 'function') {
                clearSelectedMatrixElements();
            }
            break;

        case CONFIG.STATES.ELEMENTARY_TRANSFORMATION:  // 初等变换状态
            console.log('to 初等变换');
            if (state.matrixData && state.matrixData.elements) {
                console.table(`矩阵数据: ${JSON.stringify(state.matrixData.elements)}`);
            } else {
                console.warn('矩阵数据为空，无法显示详细数据');
            }
            elements.tipDiv.textContent = '可以进行初等变换操作';
            updateButtonState(elements.nextButton, false);
            updateButtonState(elements.undoButton, true);
            if (typeof showElementaryTransformationUI === 'function') {
                showElementaryTransformationUI();
            } else {
                console.error('showElementaryTransformationUI 函数未定义');
            }
            disableGridInteraction();
            break;
    }
}

/**
 * 更新按钮状态
 * @param {HTMLElement} button - 按钮元素
 * @param {boolean} enabled - 是否启用
 */
function updateButtonState(button, enabled) {
    if (enabled) {
        button.disabled = false;
        button.style.opacity = CONFIG.UI_CONFIG.BUTTON_STATES.ENABLED.opacity;
        button.style.cursor = CONFIG.UI_CONFIG.BUTTON_STATES.ENABLED.cursor;
    } else {
        button.disabled = true;
        button.style.opacity = CONFIG.UI_CONFIG.BUTTON_STATES.DISABLED.opacity;
        button.style.cursor = CONFIG.UI_CONFIG.BUTTON_STATES.DISABLED.cursor;
    }
}

/**
 * 处理下一步按钮点击
 */
function Next() {
    // 检查必要的依赖函数是否存在
    const requiredFunctions = ['handleDimensionSelection', 'handleDataValidation', 'updateUIForCurrentState'];
    for (const funcName of requiredFunctions) {
        if (typeof window[funcName] !== 'function') {
            console.error(`${funcName} 函数未定义，请检查文件加载顺序`);
            showError('系统功能未完全加载，请刷新页面重试');
            return;
        }
    }

    // 保存当前状态到历史记录
    state.previousStates.push({
        state: state.currentState,
        matrixData: state.matrixData ? JSON.parse(JSON.stringify(state.matrixData)) : null,
        timestamp: Date.now()
    });

    let success = true;
    let nextState = null;

    switch (state.currentState) {
        case CONFIG.STATES.SELECT_DIMENSION:
            console.log('维度选择下, next');
            success = handleDimensionSelection();
            nextState = CONFIG.STATES.INPUT_ELEMENTS;
            break;

        case CONFIG.STATES.INPUT_ELEMENTS:
            console.log('输入元素下, next');
            success = handleDataValidation();
            nextState = CONFIG.STATES.ELEMENTARY_TRANSFORMATION;
            break;

        default:
            console.warn(`未知的当前状态: ${state.currentState}`);
            success = false;
            break;
    }

    // 验证状态转换是否合法
    if (success && nextState && isValidStateTransition(state.currentState, nextState)) {
        state.currentState = nextState;
        updateUIForCurrentState();
    } else {
        // 如果处理失败，移除刚刚保存的状态
        state.previousStates.pop();
        if (!success) {
            showWarning('状态转换失败，请检查输入数据');
        } else if (!isValidStateTransition(state.currentState, nextState)) {
            showWarning('状态转换不合法');
        }
    }
}

/**
 * 处理撤销按钮点击
 */
function Undo() {
    // 检查必要的依赖函数是否存在
    const requiredFunctions = ['hideElementaryTransformationUI', 'restoreOriginalGrid',
        'restoreGridForInputElements', 'updateCoordinatesDisplay',
        'updateUIForCurrentState', 'showWarning'];
    for (const funcName of requiredFunctions) {
        if (typeof window[funcName] !== 'function') {
            console.error(`${funcName} 函数未定义，请检查文件加载顺序`);
            return;
        }
    }

    if (state.previousStates.length === 0) {
        showWarning('没有可撤销的操作');
        return;
    }

    // 弹出最后一次保存的状态
    const previousState = state.previousStates.pop();
    const prevStateType = previousState.state;
    const prevMatrixData = previousState.matrixData ? JSON.parse(JSON.stringify(previousState.matrixData)) : null;

    // 1. 清理当前状态的特殊UI（包括事件监听器）
    if (state.currentState === CONFIG.STATES.ELEMENTARY_TRANSFORMATION) {
        if (typeof hideElementaryTransformationUI === 'function') {
            hideElementaryTransformationUI();
        } else {
            console.warn('hideElementaryTransformationUI 函数未定义');
        }
    }

    // 2. 恢复前一个状态
    switch (state.currentState) {
        case CONFIG.STATES.INPUT_ELEMENTS:
            console.log('输入元素下, undo');
            if (typeof restoreOriginalGrid === 'function') {
                restoreOriginalGrid();
            }
            break;

        case CONFIG.STATES.ELEMENTARY_TRANSFORMATION:
            console.log('初等变换下, undo');
            if (typeof restoreGridForInputElements === 'function') {
                restoreGridForInputElements();
            }
            break;

        default:
            console.log(`当前状态 ${state.currentState} 下执行撤销操作`);
            break;
    }

    // 3. 全局状态回滚
    state.currentState = prevStateType;
    state.matrixData = prevMatrixData;

    // 4. 恢复坐标显示和UI
    const dim = state.matrixData ? `${state.matrixData.rows}×${state.matrixData.cols}` : CONFIG.INITIAL_DIMENSION;
    if (typeof updateCoordinatesDisplay === 'function') {
        updateCoordinatesDisplay(dim);
    }
    state.lastSelectedDimension = dim;

    if (typeof updateUIForCurrentState === 'function') {
        updateUIForCurrentState();
    }
}

/**
 * 保存当前状态到历史记录
 */
function saveCurrentState() {
    state.previousStates.push({
        state: state.currentState,
        matrixData: state.matrixData ? JSON.parse(JSON.stringify(state.matrixData)) : null,
        timestamp: Date.now()
    });

    // 限制历史记录数量，防止内存泄漏
    if (state.previousStates.length > 10) {
        state.previousStates.shift();
    }
}

/**
 * 重置状态到初始状态
 */
function resetState() {
    state.currentHoverCell = null;
    state.lastSelectedDimension = CONFIG.INITIAL_DIMENSION;
    state.gridCells = [];
    state.gridInputs = [];
    state.currentState = CONFIG.STATES.INIT;
    state.matrixData = null;
    state.previousStates = [];
    state.rowColumnIndexEventListener = null;
    state.isRowColumnIndexEventsBound = false;

    updateUIForCurrentState();
}

/**
 * 获取当前状态信息
 * @returns {Object} 状态信息对象
 */
function getStateInfo() {
    return {
        currentState: state.currentState,
        matrixDimensions: state.matrixData ? `${state.matrixData.rows}×${state.matrixData.cols}` : '未定义',
        historyCount: state.previousStates.length,
        hasMatrixData: !!state.matrixData
    };
}

// ==================== 状态验证函数 ====================

/**
 * 验证状态转换是否合法
 * @param {string} fromState - 当前状态
 * @param {string} toState - 目标状态
 * @returns {boolean} 是否合法
 */
function isValidStateTransition(fromState, toState) {
    const validTransitions = {
        [CONFIG.STATES.INIT]: [CONFIG.STATES.SELECT_DIMENSION],
        [CONFIG.STATES.SELECT_DIMENSION]: [CONFIG.STATES.INPUT_ELEMENTS, CONFIG.STATES.INIT],
        [CONFIG.STATES.INPUT_ELEMENTS]: [CONFIG.STATES.ELEMENTARY_TRANSFORMATION, CONFIG.STATES.SELECT_DIMENSION],
        [CONFIG.STATES.ELEMENTARY_TRANSFORMATION]: [CONFIG.STATES.INPUT_ELEMENTS]
    };

    return validTransitions[fromState] && validTransitions[fromState].includes(toState);
}