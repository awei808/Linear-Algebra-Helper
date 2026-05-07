// ==================== 多项式处理模块 ====================
// 多项式展开、因式分解、矩阵元素替换
import { simplify, rationalize, format } from 'mathjs';
const math = { simplify, rationalize, format };
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra';
import { state } from '../state/state.js';
import { popupCentreManager, showError, showSuccess, showWarning } from '../ui/popup.js';
import { validateAndFormatMatrixValue } from '../utils/validation.js';
import { createMatrixDisplayTable } from './elementary-transformation.js';
import { clearSelectedMatrixElements } from './input-elements.js';

/**
 * 确认多项式展开操作
 * 需要先选中矩阵元素
 */
export function confirmForceExpand() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要展开的矩阵元素');
        return;
    }

    const elementCount = state.selectedMatrixElements;
    const confirmText = `确定对${elementCount}号矩阵元素进行展开多项式吗？`;
    popupCentreManager.showConfirmPopup(
        confirmText,
        handleExpand,
        null
    );
}

/**
 * 确认因式分解操作
 * 需要先选中矩阵元素
 */
export function confirmForceFactorize() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要因式分解的矩阵元素');
        return;
    }
    const elementCount = state.selectedMatrixElements;
    const confirmText = `确定对${elementCount}号矩阵元素进行因式分解吗？`;
    popupCentreManager.showConfirmPopup(
        confirmText,
        handleFactorize,
        null
    );
}

/**
 * 确认替换矩阵元素操作
 * 只能替换单个元素
 */
export function confirmReplaceElement() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要替换的矩阵元素');
        return;
    }
    if (state.selectedMatrixElements.length !== 1) {
        showWarning('只能替换一个矩阵元素');
        return;
    }

    const elementCount = state.selectedMatrixElements;
    const confirmText = `将${elementCount}号矩阵元素替换为：`;
    popupCentreManager.showConfirmPopup(
        confirmText,
        handleReplaceElement,
        null,
        'input'
    );
}

/**
 * 二次确认替换（当新旧值化简结果不同时）
 * 显示化简后的新旧值对比，让用户二次输入确认
 * @param {string} newValue - 待替换的新值
 */
export function confirmReplaceElementDifferent(newValue) {
    const elementCount = state.selectedMatrixElements;
    const cols = state.matrixData.cols;
    const index = state.selectedMatrixElements[0];
    const row = Math.floor((index - 1) / cols);
    const col = (index - 1) % cols;
    const originalValue = state.matrixData.elements[row][col];

    let simplifiedNewValue = newValue;
    let simplifiedOriginalValue = originalValue;

    try {
        simplifiedNewValue = math.simplify(newValue).toString();
    } catch (error) {
        simplifiedNewValue = newValue;
    }

    try {
        simplifiedOriginalValue = math.simplify(originalValue).toString();
    } catch (error) {
        simplifiedOriginalValue = originalValue;
    }

    const confirmText = `替换值与原值的化简结果不同：` +
                       `替换值: ${newValue}` +
                       `化简后: ${simplifiedNewValue}` +
                       `原值: ${originalValue}` +
                       `化简后: ${simplifiedOriginalValue}` +
                       `再次输入以确认替换：`;

    popupCentreManager.showConfirmPopup(
        confirmText,
        inputValue => replaceElement(inputValue),
        null,
        'input'
    );
}

/**
 * 执行多项式展开
 * 对选中的元素逐一调用 rationalize 进行展开
 */
export function handleExpand() {
    let hasChanges = false;

    const cols = state.matrixData.cols;

    state.selectedMatrixElements.forEach(index => {
        const row = Math.floor((index - 1) / cols);
        const col = (index - 1) % cols;

        const originalValue = state.matrixData.elements[row][col];

        try {
            const expanded = math.rationalize(originalValue);
            const expandedStr = math.format(expanded, { fraction: 'ratio' });

            console.log(`多项式展开: ${originalValue} -> ${expandedStr}`);

            if (expandedStr !== originalValue) {
                state.matrixData.elements[row][col] = expandedStr;
                hasChanges = true;
            }
        } catch (error) {
            console.warn(`展开失败: ${originalValue}`, error);
        }
    });

    if (hasChanges) {
        showSuccess('展开完成');
        createMatrixDisplayTable();
    } else {
        showWarning('无需展开或展开后无变化');
    }
}

/**
 * 执行一元多项式因式分解
 * 使用nerdamer进行因式分解，mathjs进行化简
 */
export function handleFactorize() {
    let hasChanges = false;
    const cols = state.matrixData.cols;
    state.selectedMatrixElements.forEach(index => {
        const row = Math.floor((index - 1) / cols);
        const col = (index - 1) % cols;

        const originalValue = state.matrixData.elements[row][col];

        try {
            // nerdamer因式分解 → mathjs化简
            const factoredStr = math.simplify(nerdamer('factor(' + originalValue + ')').toString()).toString()
                .replace(/\b\d+\.?\d*[eE][+-]?\d+\b/g, match => math.format(Number(match), { notation: 'fixed' }));
            if (factoredStr !== originalValue) {
                state.matrixData.elements[row][col] = factoredStr;
                hasChanges = true;
            }
            console.log(`多项式因式分解: ${originalValue} -> ${factoredStr}`);
        } catch (error) {
            console.warn(`因式分解失败: ${originalValue}`, error);
        }
    });

    if (hasChanges) {
        showSuccess('因式分解完成');
        createMatrixDisplayTable();
    } else {
        showWarning('无法因式分解或分解后无变化');
    }
}

/**
 * 处理替换元素（含等价性检测）
 * 先通过 simplify 和 rationalize 比较新旧值是否数学等价
 * 若等价则直接替换，否则进入二次确认
 * @param {string} inputValue - 用户输入的替换值
 */
export function handleReplaceElement(inputValue) {
    if (!inputValue) {
        showWarning('请输入替换值');
        return;
    }

    const validationResult = validateAndFormatMatrixValue(inputValue);
    console.log(validationResult);
    if (!validationResult.success) {
        showError(`输入值无效: ${validationResult.error}`);
        return;
    }

    const index = state.selectedMatrixElements[0];
    const cols = state.matrixData.cols;
    const row = Math.floor((index - 1) / cols);
    const col = (index - 1) % cols;

    const originalValue = state.matrixData.elements[row][col];
    console.log(`尝试替换: ${originalValue} -> ${validationResult.formattedValue}`);
    try {
        // 完全相同的字符串直接替换
        if (validationResult.formattedValue === originalValue) {
            replaceElement(validationResult.formattedValue, row, col);
            return;
        }

        // 通过 simplify 比较是否数学等价
        const simplifiedNew = math.simplify(validationResult.formattedValue).toString();
        const simplifiedOld = math.simplify(originalValue).toString();

        if (simplifiedNew === simplifiedOld) {
            replaceElement(validationResult.formattedValue, row, col);
            return;
        }

        // 通过 rationalize 进一步比较（处理分式等价）
        const rationalNew = math.rationalize(validationResult.formattedValue).toString();
        const rationalOld = math.rationalize(originalValue).toString();

        if (rationalNew === rationalOld) {
            replaceElement(validationResult.formattedValue, row, col);
        } else {
            // 无法确认等价，进入二次确认
            confirmReplaceElementDifferent(validationResult.formattedValue);
        }

    } catch (error) {
        console.warn('数学等价性比较失败，进入二次确认:', error);
        confirmReplaceElementDifferent(validationResult.formattedValue);
    }
}

/**
 * 执行实际的元素替换操作
 * @param {string} inputValue - 替换后的值
 * @param {number} row - 行索引（可选，默认从selectedMatrixElements推算）
 * @param {number} col - 列索引（可选，默认从selectedMatrixElements推算）
 */
export function replaceElement(inputValue, row = -1, col = -1) {
    if (row == -1 || col == -1) {
        const index = state.selectedMatrixElements[0];
        const cols = state.matrixData.cols;
        row = Math.floor((index - 1) / cols);
        col = (index - 1) % cols;
    }

    state.matrixData.elements[row][col] = inputValue;
    createMatrixDisplayTable();

    clearSelectedMatrixElements();
    showSuccess('替换成功');
    console.log(`替换成功: ${inputValue}`);
}
