// ==================== 快速导入矩阵模块 ====================
// 通过二维数组格式快速导入矩阵数据，打破 main.js ↔ squareMatrixSpecialFunction.js 循环依赖
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { saveCurrentState, updateUIForCurrentState } from '../state/stateMachine.js';
import { validateAndParseMatrix } from '../utils/validation.js';
import { createMatrixDisplayTable } from './elementary-transformation.js';
import { showError, showSuccess } from '../ui/popup.js';
import { CONFIG } from '../config.js';

/**
 * 处理"导入二维数组为矩阵"按钮点击
 * 在header区域创建输入框，让用户输入二维数组
 */
export function handleQuickInputClick() {
    // 避免重复创建输入框
    if (state.quickInputAdded) {
        return;
    }

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

    elements.header.appendChild(input);
    state.quickInputAdded = true;

    // 更新elements对象中的引用
    elements.quickInput = input;
    console.log('导入二维数组为矩阵输入框已添加到elements对象');

    // 将"录入矩阵"按钮移到header最后面，保持布局合理
    if (elements.buttonInputMatrix) {
        elements.header.appendChild(elements.buttonInputMatrix);
    }
}

/**
 * 处理快速录入：解析用户输入的二维数组并直接进入初等变换状态
 * 会模拟完整的状态转换链：INIT → SELECT_DIMENSION → INPUT_ELEMENTS → ELEMENTARY_TRANSFORMATION
 * @returns {boolean} 是否成功
 */
export function handleQuickInputMatrix() {
    if (!elements || !elements.quickInput) {
        showError('导入二维数组为矩阵输入框不存在，请先点击"导入二维数组为矩阵"按钮创建输入框');
        return false;
    }

    const inputValue = elements.quickInput.value.trim();
    if (inputValue === '') {
        showError('请输入二维数组');
        return false;
    }

    // 校验并解析二维数组
    const validationResult = validateAndParseMatrix(inputValue);
    if (!validationResult.isValid) {
        showError(validationResult.message);
        return false;
    }

    saveCurrentState();

    state.matrixData = {
        rows: validationResult.rows,
        cols: validationResult.cols,
        elements: validationResult.elements
    };

    // 保存初始矩阵数据，用于撤销到原始状态
    state.initialMatrixData = JSON.parse(JSON.stringify(state.matrixData));

    // 模拟完整的状态转换链，确保撤销功能正常工作
    const originalState = state.currentState;
    state.currentState = CONFIG.STATES.SELECT_DIMENSION;
    saveCurrentState();

    state.currentState = CONFIG.STATES.INPUT_ELEMENTS;
    saveCurrentState();

    // 直接跳转到初等变换状态
    state.currentState = CONFIG.STATES.ELEMENTARY_TRANSFORMATION;

    createMatrixDisplayTable();
    updateUIForCurrentState();

    showSuccess(`矩阵录入成功！维度: ${validationResult.rows}×${validationResult.cols}`);
    return true;
}
