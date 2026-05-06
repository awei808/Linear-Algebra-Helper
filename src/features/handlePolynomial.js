import { simplify, rationalize, format } from 'mathjs';
const math = { simplify, rationalize, format };
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra';
import { state } from '../state/state.js';
import { popupCentreManager, showError, showSuccess, showWarning } from '../ui/popup.js';
import { validateAndFormatMatrixValue } from '../utils/validation.js';
import { createMatrixDisplayTable } from './elementary-transformation.js';
import { clearSelectedMatrixElements } from './input-elements.js';

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

export function handleFactorize() {
    let hasChanges = false;
    const cols = state.matrixData.cols;
    state.selectedMatrixElements.forEach(index => {
        const row = Math.floor((index - 1) / cols);
        const col = (index - 1) % cols;

        const originalValue = state.matrixData.elements[row][col];

        try {
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
        if (validationResult.formattedValue === originalValue) {
            replaceElement(validationResult.formattedValue, row, col);
            return;
        }

        const simplifiedNew = math.simplify(validationResult.formattedValue).toString();
        const simplifiedOld = math.simplify(originalValue).toString();

        if (simplifiedNew === simplifiedOld) {
            replaceElement(validationResult.formattedValue, row, col);
            return;
        }

        const rationalNew = math.rationalize(validationResult.formattedValue).toString();
        const rationalOld = math.rationalize(originalValue).toString();

        if (rationalNew === rationalOld) {
            replaceElement(validationResult.formattedValue, row, col);
        } else {
            confirmReplaceElementDifferent(validationResult.formattedValue);
        }

    } catch (error) {
        console.warn('数学等价性比较失败，进入二次确认:', error);
        confirmReplaceElementDifferent(validationResult.formattedValue);
    }
}

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
