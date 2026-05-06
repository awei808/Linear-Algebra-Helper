import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { saveCurrentState, updateUIForCurrentState } from '../state/stateMachine.js';
import { validateAndParseMatrix } from '../utils/validation.js';
import { createMatrixDisplayTable } from './elementary-transformation.js';
import { showError, showSuccess } from '../ui/popup.js';
import { CONFIG } from '../config.js';

export function handleQuickInputClick() {
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

    elements.quickInput = input;
    console.log('导入二维数组为矩阵输入框已添加到elements对象');

    if (elements.buttonInputMatrix) {
        elements.header.appendChild(elements.buttonInputMatrix);
    }
}

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

    state.initialMatrixData = JSON.parse(JSON.stringify(state.matrixData));

    const originalState = state.currentState;
    state.currentState = CONFIG.STATES.SELECT_DIMENSION;
    saveCurrentState();

    state.currentState = CONFIG.STATES.INPUT_ELEMENTS;
    saveCurrentState();

    state.currentState = CONFIG.STATES.ELEMENTARY_TRANSFORMATION;

    createMatrixDisplayTable();

    updateUIForCurrentState();

    showSuccess(`矩阵录入成功！维度: ${validationResult.rows}×${validationResult.cols}`);
    return true;
}
