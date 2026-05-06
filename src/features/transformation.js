import { CONFIG } from '../config.js';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { HistoryManager } from '../history/historyManager.js';
import { ALLOWED_VARIABLES } from '../utils/validation.js';
import { createMatrixDisplayTable } from './elementary-transformation.js';
import { updateUIForCurrentState } from '../state/stateMachine.js';
import { showError, showSuccess } from '../ui/popup.js';

export const symbolStatus = {
    currentSymbol: '',
    activeButton: null
};

export function resetSelectionState() {
    state.transformTarget = null;
    state.transformCoefficient = null;
    state.transformParam = null;
}

export function setActiveSymbol(symbol, activeButton) {
    symbolStatus.currentSymbol = symbol;
    symbolStatus.activeButton = activeButton;

    resetButtonStyles();

    activeButton.classList.add(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.ACTIVE);
    activeButton.classList.remove(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.INACTIVE);

    const allButtons = document.querySelectorAll('#arithmetic-symbols button');
    allButtons.forEach(button => {
        if (button !== activeButton) {
            button.classList.add(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.INACTIVE);
            button.classList.remove(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.ACTIVE);
        }
    });
}

export function resetButtonStyles() {
    const allButtons = document.querySelectorAll('#arithmetic-symbols button');
    allButtons.forEach(button => {
        button.style.backgroundColor = '';
        button.style.color = '';
        button.style.border = '';
    });
}

export function getCurrentSymbol() {
    return symbolStatus.currentSymbol;
}

export function handleTransformGroupClick(element) {
    const isTarget = element === elements.target;

    const isActive = element.classList.contains('active');

    if (isActive) {
        element.classList.remove('active');
        if (isTarget) {
            state.targetIsActive = false;
        } else {
            state.paramIsActive = false;
        }
    } else {
        if (isTarget) {
            if (elements.param && elements.param.classList.contains('active')) {
                elements.param.classList.remove('active');
                state.paramIsActive = false;
            }
            element.classList.add('active');
            state.targetIsActive = true;
        } else {
            if (elements.target && elements.target.classList.contains('active')) {
                elements.target.classList.remove('active');
                state.targetIsActive = false;
            }
            element.classList.add('active');
            state.paramIsActive = true;
        }
    }
}

export function initTransformationButtons() {
    elements.buttonChange.addEventListener('pointerup', function () {
        setActiveSymbol('↔', elements.buttonChange);
        elements.transformCoefficient.style.visibility = 'hidden';
        elements.transformCoefficient.style.opacity = '0';
        elements.transformCoefficient.style.pointerEvents = 'none';

        elements.transformParam.style.visibility = 'visible';
        elements.transformParam.style.opacity = '1';
        elements.transformParam.style.pointerEvents = 'auto';
        if (elements.transformOperator) {
            elements.transformOperator.value = '↔';
        }
    });

    elements.buttonAdd.addEventListener('pointerup', function () {
        setActiveSymbol('+', elements.buttonAdd);
        elements.transformCoefficient.style.visibility = 'visible';
        elements.transformCoefficient.style.opacity = '1';
        elements.transformCoefficient.style.pointerEvents = 'auto';

        elements.transformParam.style.visibility = 'visible';
        elements.transformParam.style.opacity = '1';
        elements.transformParam.style.pointerEvents = 'auto';
        if (elements.transformOperator) {
            elements.transformOperator.value = '+';
        }
    });

    elements.buttonSub.addEventListener('pointerup', function () {
        setActiveSymbol('−', elements.buttonSub);
        elements.transformCoefficient.style.visibility = 'visible';
        elements.transformCoefficient.style.opacity = '1';
        elements.transformCoefficient.style.pointerEvents = 'auto';

        elements.transformParam.style.visibility = 'visible';
        elements.transformParam.style.opacity = '1';
        elements.transformParam.style.pointerEvents = 'auto';
        if (elements.transformOperator) {
            elements.transformOperator.value = '−';
        }
    });

    elements.buttonMul.addEventListener('pointerup', function () {
        setActiveSymbol('×', elements.buttonMul);
        elements.transformCoefficient.style.visibility = 'visible';
        elements.transformCoefficient.style.opacity = '1';
        elements.transformCoefficient.style.pointerEvents = 'auto';

        elements.transformParam.style.visibility = 'hidden';
        elements.transformParam.style.opacity = '0';
        elements.transformParam.style.pointerEvents = 'none';
        if (elements.transformOperator) {
            elements.transformOperator.value = '×';
        }
    });

    initTranslateButton();

    resetButtonStyles();
}

export function initTranslateButton() {
    if (elements && elements.buttonTranslate) {
        elements.buttonTranslate.addEventListener('pointerup', executeElementaryTransformation);
    }
}

export function executeElementaryTransformation() {
    state.transformCoefficient = elements.transformCoefficient.value.trim();

    try {
        const targetInput = state.transformTarget || '';
        const coefficientInput = state.transformCoefficient || '';
        const paramInput = state.transformParam || '';

        const currentSymbol = getCurrentSymbol();

        const validationResult = validateTransformationInputs(targetInput, coefficientInput, paramInput, currentSymbol);
        if (!validationResult.isValid) {
            showError(validationResult.message);
            return false;
        }

        const { targetType, targetIndex, paramType, paramIndex, coefficient } = validationResult.parsedData;

        let transformationResult;
        switch (currentSymbol) {
            case '↔':
                transformationResult = executeRowColumnSwap(targetType, targetIndex, paramType, paramIndex);
                break;
            case '+':
            case '−':
                transformationResult = executeRowColumnAddSubtract(targetType, targetIndex, paramType, paramIndex, coefficient, currentSymbol);
                break;
            case '×':
                transformationResult = executeRowColumnMultiply(targetType, targetIndex, coefficient);
                break;
            default:
                showError('请先选择初等变换操作类型');
                return false;
        }

        if (transformationResult.success) {
            showSuccess(`初等变换执行成功: ${transformationResult.description}`);

            if (state.matrixData && state.matrixData.elements) {
                const previousMatrixData = JSON.parse(JSON.stringify(state.matrixData));
                HistoryManager.addHistory(previousMatrixData, transformationResult.description);
                console.log('保存变换前矩阵状态:', {
                    rows: previousMatrixData.rows,
                    cols: previousMatrixData.cols,
                    elements: previousMatrixData.elements
                });
            }

            updateHistoryTransformation();
            updateUIForCurrentState();
            resetSelectionState();
            if (state.matrixData) {
                createMatrixDisplayTable(state.matrixData);
                console.log('变换后矩阵状态:', {
                    rows: state.matrixData.rows,
                    cols: state.matrixData.cols,
                    elements: state.matrixData.elements
                });
            }
            return true;
        } else {
            showError(`初等变换执行失败: ${transformationResult.message}`);
            return false;
        }

    } catch (error) {
        showError(`执行初等变换时发生错误: ${error.message}`);
        return false;
    }
}

export function validateTransformationInputs(targetInput, coefficientInput, paramInput, currentSymbol) {
    if (!targetInput) {
        return { isValid: false, message: '请输入目标行/列' };
    }

    const targetMatch = targetInput.match(/^([rc])(\d+)$/i);
    if (!targetMatch) {
        return { isValid: false, message: '目标行/列格式错误，请使用如 r1, c2 的格式' };
    }

    const targetType = targetMatch[1].toLowerCase();
    const targetIndex = parseInt(targetMatch[2]) - 1;

    if (!state.matrixData || !state.matrixData.elements) {
        return { isValid: false, message: '矩阵数据不存在，请先录入矩阵' };
    }

    const maxIndex = targetType === 'r' ? state.matrixData.rows - 1 : state.matrixData.cols - 1;
    if (targetIndex < 0 || targetIndex > maxIndex) {
        return { isValid: false, message: `目标${targetType === 'r' ? '行' : '列'}索引超出范围` };
    }

    if (coefficientInput.includes('/0')) {
        return { isValid: false, message: '系数分母不能为0' };
    }

    let coefficient = null;
    let paramType = null;
    let paramIndex = null;

    switch (currentSymbol) {
        case '↔':
            if (!paramInput) {
                return { isValid: false, message: '交换操作需要参数行/列' };
            }

            const paramMatch = paramInput.match(/^([rc])(\d+)$/i);
            if (!paramMatch) {
                return { isValid: false, message: '参数行/列格式错误，请使用如 r1, c2 的格式' };
            }

            paramType = paramMatch[1].toLowerCase();
            paramIndex = parseInt(paramMatch[2]) - 1;

            const paramMaxIndex = paramType === 'r' ? state.matrixData.rows - 1 : state.matrixData.cols - 1;
            if (paramIndex < 0 || paramIndex > paramMaxIndex) {
                return { isValid: false, message: `参数${paramType === 'r' ? '行' : '列'}索引超出范围` };
            }

            if (targetType !== paramType) {
                return { isValid: false, message: '交换操作只能在同行或同列之间进行' };
            }
            break;

        case '+':
        case '−':
            if (!paramInput) {
                return { isValid: false, message: '加减操作需要参数行/列' };
            }

            if (!coefficientInput || coefficientInput.trim() === '') {
                coefficient = 1;
            } else {
                if (/[a-zA-Zλ]/.test(coefficientInput)) {
                    return { isValid: false, message: '系数不能包含未知数' };
                }

                try {
                    coefficient = parseAndSimplifyCoefficient(coefficientInput);
                } catch (error) {
                    return { isValid: false, message: `系数格式错误: ${error.message}` };
                }
            }

            const addParamMatch = paramInput.match(/^([rc])(\d+)$/i);
            if (!addParamMatch) {
                return { isValid: false, message: '参数行/列格式错误，请使用如 r1, c2 的格式' };
            }

            paramType = addParamMatch[1].toLowerCase();
            paramIndex = parseInt(addParamMatch[2]) - 1;

            const addParamMaxIndex = paramType === 'r' ? state.matrixData.rows - 1 : state.matrixData.cols - 1;
            if (paramIndex < 0 || paramIndex > addParamMaxIndex) {
                return { isValid: false, message: `参数${paramType === 'r' ? '行' : '列'}索引超出范围` };
            }

            if (targetType !== paramType) {
                return { isValid: false, message: '加减操作只能在同行或同列之间进行' };
            }

            break;

        case '×':
            if (!coefficientInput) {
                return { isValid: false, message: '倍乘操作需要系数' };
            }

            if (/[a-zA-Zλ]/.test(coefficientInput)) {
                return { isValid: false, message: '系数不能包含未知数' };
            }

            try {
                coefficient = parseAndSimplifyCoefficient(coefficientInput);
            } catch (error) {
                return { isValid: false, message: `系数格式错误: ${error.message}` };
            }

            if (coefficient === '1/1' || coefficient === '1') {
                return { isValid: false, message: '倍乘系数为1，无效变换' };
            }
            break;

        default:
            return { isValid: false, message: '请先选择初等变换操作类型' };
    }

    return {
        isValid: true,
        message: '输入校验通过',
        parsedData: {
            targetType,
            targetIndex,
            paramType,
            paramIndex,
            coefficient
        }
    };
}

export function parseAndSimplifyCoefficient(mathInput) {
    try {
        if (!isNaN(mathInput) && isFinite(mathInput)) {
            const num = Number(mathInput);
            if (num.toString().includes('e') || num.toString().includes('E')) {
                mathInput = math.format(num, { notation: 'fixed' });
            }
        }

        const fraction = math.fraction(mathInput);

        return math.format(fraction, { fraction: 'ratio' });
    } catch (error) {
        throw new Error('系数格式不支持');
    }
}

export function parseAndSimplifyPolynomial(expression) {
    try {
        const parsed = math.parse(expression);

        const simplified = math.simplify(parsed);

        let result = simplified.toString();

        result = result.replace(/\b\d+\.?\d*[eE][+-]?\d+\b/g, match => {
            const num = Number(match);
            return math.format(num, { notation: 'fixed' });
        });

        result = result.replace(/lambda/g, 'λ');
        result = result.replace(/Lambda/g, 'Λ');

        result = result.replace(/\(([a-zA-Zλ]+)\)/g, '$1');
        result = result.replace(/\((\d+)\)/g, '$1');

        return result;
    } catch (error) {
        console.error('多项式解析错误:', error);
        return expression;
    }
}

export function validatePolynomialVariables(expression) {
    const variables = expression.match(new RegExp(`[${ALLOWED_VARIABLES.join('')}]`, 'g')) || [];

    for (const variable of variables) {
        if (!ALLOWED_VARIABLES.includes(variable)) {
            return false;
        }
    }

    return true;
}

export function executeRowColumnSwap(targetType, targetIndex, paramType, paramIndex) {
    const matrix = state.matrixData.elements;

    if (targetType === 'r') {
        const temp = matrix[targetIndex];
        matrix[targetIndex] = matrix[paramIndex];
        matrix[paramIndex] = temp;

        return {
            success: true,
            description: `r${targetIndex + 1}↔ r${paramIndex + 1}`
        };
    } else {
        for (let i = 0; i < state.matrixData.rows; i++) {
            const temp = matrix[i][targetIndex];
            matrix[i][targetIndex] = matrix[i][paramIndex];
            matrix[i][paramIndex] = temp;
        }

        return {
            success: true,
            description: `c${targetIndex + 1}↔ c${paramIndex + 1}`
        };
    }
}

export function executeRowColumnAddSubtract(targetType, targetIndex, paramType, paramIndex, coefficient, operation) {
    if (!coefficient || coefficient === '') {
        coefficient = 1;
    }

    const matrix = state.matrixData.elements;
    const isAddition = operation === '+';

    if (targetType === 'r') {
        for (let j = 0; j < state.matrixData.cols; j++) {
            const targetValue = matrix[targetIndex][j];
            const paramValue = matrix[paramIndex][j];

            try {
                let mathExpression;
                if (isAddition) {
                    mathExpression = `(${targetValue}) + (${coefficient})*(${paramValue})`;
                } else {
                    mathExpression = `(${targetValue}) - (${coefficient})*(${paramValue})`;
                }

                const result = parseAndSimplifyPolynomial(mathExpression);

                if (!validatePolynomialVariables(result)) {
                    throw new Error('表达式包含不允许的变量');
                }

                matrix[targetIndex][j] = result;
            } catch (error) {
                console.error('多项式计算错误:', error);
                matrix[targetIndex][j] = isAddition ?
                    `(${targetValue})+${coefficient}*(${paramValue})` :
                    `(${targetValue})-${coefficient}*(${paramValue})`;
            }
        }

        return {
            success: true,
            description: `r${targetIndex + 1} ${isAddition ? '+' : '-'} ${coefficient}×r${paramIndex + 1}`
        };
    } else {
        for (let i = 0; i < state.matrixData.rows; i++) {
            const targetValue = matrix[i][targetIndex];
            const paramValue = matrix[i][paramIndex];

            try {
                let mathExpression;
                if (isAddition) {
                    mathExpression = `(${targetValue}) + (${coefficient})*(${paramValue})`;
                } else {
                    mathExpression = `(${targetValue}) - (${coefficient})*(${paramValue})`;
                }

                const result = parseAndSimplifyPolynomial(mathExpression);

                if (!validatePolynomialVariables(result)) {
                    throw new Error('表达式包含不允许的变量');
                }

                matrix[i][targetIndex] = result;
            } catch (error) {
                console.error('多项式计算错误:', error);
                matrix[i][targetIndex] = isAddition ?
                    `(${targetValue})+${coefficient}*(${paramValue})` :
                    `(${targetValue})-${coefficient}*(${paramValue})`;
            }
        }

        return {
            success: true,
            description: `c${targetIndex + 1} ${isAddition ? '+' : '-'} ${coefficient}×c${paramIndex + 1}`
        };
    }
}

export function executeRowColumnMultiply(targetType, targetIndex, coefficient) {
    const matrix = state.matrixData.elements;

    if (targetType === 'r') {
        for (let j = 0; j < state.matrixData.cols; j++) {
            const currentValue = matrix[targetIndex][j];

            try {
                const mathExpression = `(${coefficient})*(${currentValue})`;

                const result = parseAndSimplifyPolynomial(mathExpression);

                if (!validatePolynomialVariables(result)) {
                    throw new Error('表达式包含不允许的变量');
                }

                matrix[targetIndex][j] = result;
            } catch (error) {
                console.error('倍乘计算错误:', error);
                matrix[targetIndex][j] = `${coefficient}*(${currentValue})`;
            }
        }

        return {
            success: true,
            description: `r${targetIndex + 1} × ${coefficient}`
        };
    } else {
        for (let i = 0; i < state.matrixData.rows; i++) {
            const currentValue = matrix[i][targetIndex];

            try {
                const mathExpression = `(${coefficient})*(${currentValue})`;

                const result = parseAndSimplifyPolynomial(mathExpression);

                if (!validatePolynomialVariables(result)) {
                    throw new Error('表达式包含不允许的变量');
                }

                matrix[i][targetIndex] = result;
            } catch (error) {
                console.error('倍乘计算错误:', error);
                matrix[i][targetIndex] = `${coefficient}*(${currentValue})`;
            }
        }

        return {
            success: true,
            description: `c${targetIndex + 1} × ${coefficient}`
        };
    }
}

export function updateHistoryTransformation() {
    const validHistory = HistoryManager.getUndoHistoryDescriptions()
        .filter(desc => desc);

    elements.historyTransformation.innerText = `初等变换历史记录：${validHistory.join('，') || '暂无'}`;
    console.log(`页面当前 ${elements.historyTransformation.innerText}`);
}

export function undoTransformation() {
    console.log(`撤销前检查: 撤销栈大小=${HistoryManager.getUndoStackSize()}, 重做栈大小=${HistoryManager.getRedoStackSize()}`);

    const historyEntry = HistoryManager.undo();

    if (historyEntry) {
        if (historyEntry.matrixData) {
            state.matrixData = JSON.parse(JSON.stringify(historyEntry.matrixData));

            if (state.matrixData) {
                createMatrixDisplayTable(state.matrixData);
            }
        }

        updateHistoryTransformation();
        updateUIForCurrentState();
        showSuccess(`成功撤销：${historyEntry.description}`);
    } else {
        showError('没有可撤销的初等变换');
    }

    console.log(`撤销后状态: 撤销栈大小=${HistoryManager.getUndoStackSize()}, 重做栈大小=${HistoryManager.getRedoStackSize()}`);
}

export function redoTransformation() {
    console.log(`重做前检查: 撤销栈大小=${HistoryManager.getUndoStackSize()}, 重做栈大小=${HistoryManager.getRedoStackSize()}`);

    const historyEntry = HistoryManager.redo();

    if (historyEntry) {
        if (historyEntry.matrixData) {
            state.matrixData = JSON.parse(JSON.stringify(historyEntry.matrixData));

            if (state.matrixData) {
                createMatrixDisplayTable(state.matrixData);
            }
        }

        updateHistoryTransformation();
        updateUIForCurrentState();
        showSuccess(`成功重做：${historyEntry.description}`);
    } else {
        showError('没有可重做的初等变换');
    }

    console.log(`重做后状态: 撤销栈大小=${HistoryManager.getUndoStackSize()}, 重做栈大小=${HistoryManager.getRedoStackSize()}`);
}
