// ==================== 状态机编排层 ====================
// Next/Undo/updateUIForCurrentState — 唯一"宽依赖"模块
// 不被 main/transformation/handlePolynomial/squareMatrixSpecialFunction 导入
import { CONFIG } from '../config.js';
import { state } from './state.js';
import { elements } from '../dom/elements.js';
import { showWarning, showError, popupCentreManager } from '../ui/popup.js';
import {
    handleDimensionSelection,
    restoreOriginalGrid,
    updateCoordinatesDisplay,
    enableGridInteraction
} from '../features/select-dimension.js';
import { handleDataValidation } from '../utils/validation.js';
import {
    hideElementaryTransformationUI,
    clearSelectedMatrixElements,
    disableGridInteraction,
    enableInputInteraction,
    restoreGridForInputElements
} from '../features/input-elements.js';
import { showElementaryTransformationUI } from '../features/elementary-transformation.js';

/**
 * 更新按钮状态（启用/禁用）
 * @param {HTMLButtonElement} button - 按钮元素
 * @param {boolean} enabled - 是否启用
 */
export function updateButtonState(button, enabled) {
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
 * 根据当前状态更新整个UI
 * 状态机核心：INIT → SELECT_DIMENSION → INPUT_ELEMENTS → ELEMENTARY_TRANSFORMATION
 */
export function updateUIForCurrentState() {
    switch (state.currentState) {
        case CONFIG.STATES.INIT:
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
            elements.tipDiv.textContent = `请在输入框中输入矩阵元素（非'0'），点击下一步后，空白处将用'0'填充`;
            updateButtonState(elements.nextButton, true);
            updateButtonState(elements.undoButton, true);
            enableInputInteraction();
            disableGridInteraction();

            clearSelectedMatrixElements();
            break;

        case CONFIG.STATES.ELEMENTARY_TRANSFORMATION:
            console.log('to 初等变换');
            if (state.matrixData && state.matrixData.elements) {
                console.table(`矩阵数据: ${JSON.stringify(state.matrixData.elements)}`);
            } else {
                console.warn('矩阵数据为空，无法显示详细数据');
            }
            elements.tipDiv.textContent = '可以进行初等变换操作';
            updateButtonState(elements.nextButton, false);
            updateButtonState(elements.undoButton, true);
            showElementaryTransformationUI();
            disableGridInteraction();
            break;
    }
}

/**
 * 执行"下一步"操作
 * SELECT_DIMENSION → INPUT_ELEMENTS → ELEMENTARY_TRANSFORMATION
 */
export function Next() {
    saveCurrentState();

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

    if (success && nextState && isValidStateTransition(state.currentState, nextState)) {
        state.currentState = nextState;
        updateUIForCurrentState();
    } else {
        // 转换失败时移除刚保存的状态
        state.previousStates.pop();
        if (!success) {
            showWarning('状态转换失败，请检查输入数据');
        } else if (!isValidStateTransition(state.currentState, nextState)) {
            showWarning('状态转换不合法');
        }
    }
}

/**
 * 执行"上一步"操作（状态级撤销，非变换级）
 * 回到上一个 state.previousStates 中记录的状态
 */
export function Undo() {
    if (state.previousStates.length === 0) {
        showWarning('没有可撤销的操作');
        return;
    }

    const previousState = state.previousStates.pop();
    const prevStateType = previousState.state;
    const prevMatrixData = previousState.matrixData ? JSON.parse(JSON.stringify(previousState.matrixData)) : null;

    // 离开初等变换状态时，先隐藏对应UI
    if (state.currentState === CONFIG.STATES.ELEMENTARY_TRANSFORMATION) {
        hideElementaryTransformationUI();
    }

    switch (state.currentState) {
        case CONFIG.STATES.INPUT_ELEMENTS:
            console.log('输入元素下, undo');
            restoreOriginalGrid();
            performUndoOperation(prevStateType, prevMatrixData);
            break;

        case CONFIG.STATES.ELEMENTARY_TRANSFORMATION:
            console.log('初等变换下, undo');
            // 如果有变换历史，需确认清空
            if (state.undoStack && state.undoStack.length > 0) {
                popupCentreManager.showConfirmPopup('撤销将清空所有变换历史，确定撤销？',
                    () => {
                        restoreGridForInputElements();
                        state.undoStack = [];
                        state.redoStack = [];
                        state.initialMatrixData = null;
                        performUndoOperation(prevStateType, prevMatrixData);
                    });
            } else {
                restoreGridForInputElements();
                state.undoStack = [];
                state.redoStack = [];
                state.initialMatrixData = null;
                performUndoOperation(prevStateType, prevMatrixData);
            }
            break;

        default:
            console.log(`当前状态 ${state.currentState} 下执行撤销操作`);
            performUndoOperation(prevStateType, prevMatrixData);
            break;
    }
}

/**
 * 保存当前状态到 previousStates 栈（用于状态级撤销）
 */
export function saveCurrentState() {
    state.previousStates.push({
        state: state.currentState,
        matrixData: state.matrixData ? JSON.parse(JSON.stringify(state.matrixData)) : null,
        timestamp: Date.now()
    });

    // 限制历史栈深度
    if (state.previousStates.length > 10) {
        state.previousStates.shift();
    }
}

/**
 * 重置状态到初始值
 */
export function resetState() {
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
 * 获取当前状态信息（用于调试）
 * @returns {Object} 状态摘要
 */
export function getStateInfo() {
    return {
        currentState: state.currentState,
        matrixDimensions: state.matrixData ? `${state.matrixData.rows}×${state.matrixData.cols}` : '未定义',
        historyCount: state.previousStates.length,
        hasMatrixData: !!state.matrixData
    };
}

/**
 * 检查状态转换是否合法
 * @param {string} fromState - 当前状态
 * @param {string} toState - 目标状态
 * @returns {boolean} 是否合法
 */
export function isValidStateTransition(fromState, toState) {
    const validTransitions = {
        [CONFIG.STATES.INIT]: [CONFIG.STATES.SELECT_DIMENSION],
        [CONFIG.STATES.SELECT_DIMENSION]: [CONFIG.STATES.INPUT_ELEMENTS, CONFIG.STATES.INIT],
        [CONFIG.STATES.INPUT_ELEMENTS]: [CONFIG.STATES.ELEMENTARY_TRANSFORMATION, CONFIG.STATES.SELECT_DIMENSION],
        [CONFIG.STATES.ELEMENTARY_TRANSFORMATION]: [CONFIG.STATES.INPUT_ELEMENTS]
    };

    return validTransitions[fromState] && validTransitions[fromState].includes(toState);
}

/**
 * 执行实际的撤销操作（恢复状态和矩阵数据）
 * @param {string} prevStateType - 前一个状态类型
 * @param {Object} prevMatrixData - 前一个矩阵数据
 */
export function performUndoOperation(prevStateType, prevMatrixData) {
    state.currentState = prevStateType;
    state.matrixData = prevMatrixData;

    const dim = state.matrixData ? `${state.matrixData.rows}×${state.matrixData.cols}` : CONFIG.INITIAL_DIMENSION;
    updateCoordinatesDisplay(dim);
    state.lastSelectedDimension = dim;

    updateUIForCurrentState();
}
