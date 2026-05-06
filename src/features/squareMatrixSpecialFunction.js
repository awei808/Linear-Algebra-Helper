import { CONFIG } from '../config.js';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { HistoryManager } from '../history/historyManager.js';
import { createGrid, updateCoordinatesDisplay } from './select-dimension.js';
import { unbindRowColumnIndexEvents } from './elementary-transformation.js';
import { popupCentreManager, showError, showSuccess } from '../ui/popup.js';
import { parseAndSimplifyPolynomial, validatePolynomialVariables, updateHistoryTransformation } from './transformation.js';
import { handleQuickInputClick, handleQuickInputMatrix } from './matrix-input.js';

export function validateMatrixForOperation(operationType) {
    if (!state.matrixData) {
        showError('请先输入矩阵');
        return false;
    }

    if (state.matrixData.rows !== state.matrixData.cols) {
        switch (operationType) {
            case 'diagonalProduct':
                showError('当前矩阵不是方阵，无法计算对角线乘积');
                break;
            case 'augmentedIdentity':
                showError('当前矩阵不是方阵，无法计算增广矩阵');
                break;
            case 'addLamada':
                showError('当前矩阵不是方阵，无法添加lamada');
                break;
            default:
                showError('当前矩阵不是方阵，无法执行该操作');
        }
        return false;
    }

    return true;
}

export function resetToInitialState() {
    if (elements.result) {
        elements.result.innerHTML = '';
    }

    if (elements.windowDiv) {
        elements.windowDiv.innerHTML = '';
        elements.windowDiv.classList.remove('dynamic');
        elements.windowDiv.style.width = '400px';
        elements.windowDiv.style.height = '400px';
        elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
        elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';
        elements.windowDiv.style.display = 'grid';
    }

    state.gridInputs = [];
    state.matrixData = null;
    state.lastSelectedDimension = '0×0';
    state.currentState = CONFIG.STATES.INIT;
    state.previousStates = [];
    state.initialMatrixData = null;
    state.quickInputAdded = false;
    state.rowColumnIndexEventListener = null;
    state.isRowColumnIndexEventsBound = false;
    state.selectedMatrixElements = [];
    state.targetIsActive = false;
    state.paramIsActive = false;
    state.transformTarget = null;
    state.transformCoefficient = null;
    state.transformParam = null;

    HistoryManager.clearAllHistory();

    if (elements.historyTransformation) {
        elements.historyTransformation.innerText = '初等变换历史记录：暂无';
    }

    if (elements.operatorButtons) {
        elements.operatorButtons.classList.add('hidden');
    }
    if (elements.result) {
        elements.result.classList.add('hidden');
    }

    if (elements.quickInput) {
        elements.quickInput.remove();
        elements.quickInput = null;
    }

    createGrid();

    if (elements.coordinatesDiv) {
        updateCoordinatesDisplay('0×0');
    }

    if (elements.inputMatrixDiv) {
        elements.inputMatrixDiv.classList.add('hidden');
    }

    unbindRowColumnIndexEvents();

    updateHistoryTransformation();
}

export function computeDiagonalProduct() {
    try {
        let expression = '1';
        for (let i = 0; i < state.matrixData.rows; i++) {
            const element = state.matrixData.elements[i][i] || '0';
            expression += ` * (${element})`;
        }

        const result = parseAndSimplifyPolynomial(expression);

        if (!validatePolynomialVariables(result)) {
            throw new Error('表达式包含不允许的变量');
        }
        const value = result || '0';
        const latexStr = String(value);
        const formulaHtml = katex.renderToString(latexStr, {
            throwOnError: false,
            errorColor: '#d32f2f'
        });
        const finalHtml = `对角线乘积计算结果：${formulaHtml} <span style="margin-left:10px;"></span>`;
        elements.result.innerHTML = finalHtml;
        elements.result.classList.remove('hidden');
        elements.result.classList.add('transform-center');
        showSuccess('计算完成！结果显示在初等变换区域下方');
    } catch (error) {
        console.error('计算对角线乘积时出错:', error);
        showError('计算对角线乘积失败，请检查矩阵数据');
    }
}

export function createAugmentedIdentity() {
    try {
        const tempMatrix = JSON.parse(JSON.stringify(state.matrixData.elements));
        const rows = state.matrixData.rows;
        const cols = state.matrixData.cols;

        resetToInitialState();

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (i === j) {
                    tempMatrix[i].push('1');
                } else {
                    tempMatrix[i].push('0');
                }
            }
        }

        const matrixArray = [];
        for (let i = 0; i < tempMatrix.length; i++) {
            const row = [];
            for (let j = 0; j < tempMatrix[i].length; j++) {
                row.push(tempMatrix[i][j] || '0');
            }
            matrixArray.push(`[${row.join(', ')}]`);
        }

        const matrixString = `[${matrixArray.join(', ')}]`;

        if (!elements.quickInput) {
            handleQuickInputClick();

            setTimeout(() => {
                if (elements.quickInput) {
                    elements.quickInput.value = matrixString;
                    handleQuickInputMatrix();
                    showSuccess('增广矩阵创建成功！');
                }
            }, 100);
        } else {
            elements.quickInput.value = matrixString;
            handleQuickInputMatrix();
            showSuccess('增广矩阵创建成功！');
        }

    } catch (error) {
        console.error('创建增广矩阵时出错:', error);
        showError('创建增广矩阵失败，请检查矩阵数据');
    }
}

export function addLamada() {
    try {
        const tempMatrix = JSON.parse(JSON.stringify(state.matrixData.elements));
        const rows = state.matrixData.rows;
        const cols = state.matrixData.cols;

        resetToInitialState();

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (i === j) {
                    const originalValue = tempMatrix[i][j];
                    if (originalValue === '0') {
                        tempMatrix[i][j] = '-λ';
                    } else {
                        tempMatrix[i][j] = `${originalValue} - λ`;
                    }
                }
            }
        }

        const matrixArray = [];
        for (let i = 0; i < tempMatrix.length; i++) {
            const row = [];
            for (let j = 0; j < tempMatrix[i].length; j++) {
                row.push(tempMatrix[i][j] || '0');
            }
            matrixArray.push(`[${row.join(', ')}]`);
        }

        const matrixString = `[${matrixArray.join(', ')}]`;

        if (!elements.quickInput) {
            handleQuickInputClick();

            setTimeout(() => {
                if (elements.quickInput) {
                    elements.quickInput.value = matrixString;
                    handleQuickInputMatrix();
                    showSuccess('特征值矩阵创建成功！对角线元素已添加-λ');
                }
            }, 100);
        } else {
            elements.quickInput.value = matrixString;
            handleQuickInputMatrix();
            showSuccess('特征值矩阵创建成功！对角线元素已添加-λ');
        }

    } catch (error) {
        console.error('创建特征值矩阵时出错:', error);
        showError('创建特征值矩阵失败，请检查矩阵数据');
    }
}

export function performReset() {
    popupCentreManager.showConfirmPopup("此操作将完全重置网页，确定重置？", () => {
        resetToInitialState();
        showSuccess('重置完成：应用已恢复到初始状态');
    });
}

export function performDiagonalProduct() {
    const isValid = validateMatrixForOperation('diagonalProduct');
    if (!isValid) {
        return;
    }
    computeDiagonalProduct();
}

export function performAugmentedIdentity() {
    const isValid = validateMatrixForOperation('augmentedIdentity');
    if (!isValid) {
        return;
    }
    popupCentreManager.showConfirmPopup("此操作将完全重置矩阵，并生成用于求逆的增广矩阵，确定执行？", () => {
        createAugmentedIdentity();
    });
}

export function performAddLamada() {
    const isValid = validateMatrixForOperation('addLamada');
    if (!isValid) {
        return;
    }
    popupCentreManager.showConfirmPopup("此操作将完全重置矩阵，并生成含λ的矩阵，用于特征值计算，确定执行？", () => {
        addLamada();
    });
}
