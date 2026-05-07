// ==================== 方阵特色功能模块 ====================
// 对角线乘积、增广单位矩阵、含λ矩阵、重置
import { renderToString } from 'katex';
import { CONFIG } from '../config.js';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { HistoryManager } from '../history/historyManager.js';
import { createGrid, updateCoordinatesDisplay } from './select-dimension.js';
import { unbindRowColumnIndexEvents } from './elementary-transformation.js';
import { popupCentreManager, showError, showSuccess } from '../ui/popup.js';
import { parseAndSimplifyPolynomial, validatePolynomialVariables, updateHistoryTransformation } from './transformation.js';
import { handleQuickInputClick, handleQuickInputMatrix } from './matrix-input.js';

/**
 * 验证当前矩阵是否为方阵
 * 非方阵时弹出对应操作的错误提示
 * @param {string} operationType - 操作类型标识
 * @returns {boolean} 是否为方阵
 */
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

/**
 * 重置到初始状态
 * 清空所有数据、DOM、历史记录，恢复初始网格
 */
export function resetToInitialState() {
    // 清空结果显示区域
    if (elements.result) {
        elements.result.innerHTML = '';
    }

    // 恢复窗口为初始网格
    if (elements.windowDiv) {
        elements.windowDiv.innerHTML = '';
        elements.windowDiv.classList.remove('dynamic');
        elements.windowDiv.style.width = '400px';
        elements.windowDiv.style.height = '400px';
        elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
        elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';
        elements.windowDiv.style.display = 'grid';
    }

    // 重置所有状态变量
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

    // 清空历史记录
    HistoryManager.clearAllHistory();

    if (elements.historyTransformation) {
        elements.historyTransformation.innerText = '初等变换历史记录：暂无';
    }

    // 隐藏操作按钮和结果区域
    if (elements.operatorButtons) {
        elements.operatorButtons.classList.add('hidden');
    }
    if (elements.result) {
        elements.result.classList.add('hidden');
    }

    // 移除快速录入输入框
    if (elements.quickInput) {
        elements.quickInput.remove();
        elements.quickInput = null;
    }

    // 重新创建初始网格
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

/**
 * 计算对角线乘积
 * 将主对角线元素连乘，使用parseAndSimplifyPolynomial简化结果
 */
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
        // 使用KaTeX渲染结果
        const formulaHtml = renderToString(latexStr, {
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

/**
 * 生成增广单位矩阵（在原矩阵右侧添加单位矩阵）
 * 用于求逆矩阵
 */
export function createAugmentedIdentity() {
    try {
        const tempMatrix = JSON.parse(JSON.stringify(state.matrixData.elements));
        const rows = state.matrixData.rows;
        const cols = state.matrixData.cols;

        resetToInitialState();

        // 在每行右侧添加单位矩阵列
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (i === j) {
                    tempMatrix[i].push('1');
                } else {
                    tempMatrix[i].push('0');
                }
            }
        }

        // 构建二维数组字符串
        const matrixArray = [];
        for (let i = 0; i < tempMatrix.length; i++) {
            const row = [];
            for (let j = 0; j < tempMatrix[i].length; j++) {
                row.push(tempMatrix[i][j] || '0');
            }
            matrixArray.push(`[${row.join(', ')}]`);
        }

        const matrixString = `[${matrixArray.join(', ')}]`;

        // 通过快速录入重新导入增广矩阵
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

/**
 * 生成含λ的矩阵（对角线元素变为 原值 - λ）
 * 用于特征值计算
 */
export function addLamada() {
    try {
        const tempMatrix = JSON.parse(JSON.stringify(state.matrixData.elements));
        const rows = state.matrixData.rows;
        const cols = state.matrixData.cols;

        resetToInitialState();

        // 对角线元素添加 -λ
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

// ==================== 对外入口函数 ====================

/**
 * 执行重置操作（含确认弹窗）
 */
export function performReset() {
    popupCentreManager.showConfirmPopup("此操作将完全重置网页，确定重置？", () => {
        resetToInitialState();
        showSuccess('重置完成：应用已恢复到初始状态');
    });
}

/**
 * 执行对角线乘积计算
 */
export function performDiagonalProduct() {
    const isValid = validateMatrixForOperation('diagonalProduct');
    if (!isValid) {
        return;
    }
    computeDiagonalProduct();
}

/**
 * 执行增广单位矩阵生成（含确认弹窗）
 */
export function performAugmentedIdentity() {
    const isValid = validateMatrixForOperation('augmentedIdentity');
    if (!isValid) {
        return;
    }
    popupCentreManager.showConfirmPopup("此操作将完全重置矩阵，并生成用于求逆的增广矩阵，确定执行？", () => {
        createAugmentedIdentity();
    });
}

/**
 * 执行含λ矩阵生成（含确认弹窗）
 */
export function performAddLamada() {
    const isValid = validateMatrixForOperation('addLamada');
    if (!isValid) {
        return;
    }
    popupCentreManager.showConfirmPopup("此操作将完全重置矩阵，并生成含λ的矩阵，用于特征值计算，确定执行？", () => {
        addLamada();
    });
}
