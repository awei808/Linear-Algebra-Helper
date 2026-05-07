// ==================== 初等变换核心模块 ====================
// 算子管理、输入校验、多项式计算、变换执行、撤销/重做
import { fraction, format, parse, simplify } from 'mathjs';
const math = { fraction, format, parse, simplify };
import { CONFIG } from '../config.js';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { HistoryManager } from '../history/historyManager.js';
import { ALLOWED_VARIABLES } from '../utils/validation.js';
import { createMatrixDisplayTable, notifyOperatorChanged } from './elementary-transformation.js';
import { updateUIForCurrentState } from '../state/stateMachine.js';
import { showError, showSuccess } from '../ui/popup.js';

// 初等变换符号状态管理
export const symbolStatus = {
    currentSymbol: '',
    activeButton: null
};

/**
 * 重置选择状态
 * 清空已选择的目标行/列、系数和参数行/列
 */
export function resetSelectionState() {
    state.transformTarget = null;
    state.transformCoefficient = null;
    state.transformParam = null;
}

/**
 * 设置活动符号和按钮样式
 * 更新符号状态并设置对应按钮的激活样式
 * @param {string} symbol - 操作符号（↔、+、−、×）
 * @param {HTMLElement} activeButton - 被激活的按钮元素
 */
export function setActiveSymbol(symbol, activeButton) {
    symbolStatus.currentSymbol = symbol;
    symbolStatus.activeButton = activeButton;

    resetButtonStyles();

    // 设置活动按钮样式
    activeButton.classList.add(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.ACTIVE);
    activeButton.classList.remove(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.INACTIVE);

    // 其他按钮设为非活动样式
    const allButtons = document.querySelectorAll('#arithmetic-symbols button');
    allButtons.forEach(button => {
        if (button !== activeButton) {
            button.classList.add(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.INACTIVE);
            button.classList.remove(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.ACTIVE);
        }
    });

    // 通知预览更新
    notifyOperatorChanged();
}

/**
 * 重置所有按钮样式为默认
 */
export function resetButtonStyles() {
    const allButtons = document.querySelectorAll('#arithmetic-symbols button');
    allButtons.forEach(button => {
        button.style.backgroundColor = '';
        button.style.color = '';
        button.style.border = '';
    });
}

/**
 * 获取当前选中的操作符号
 * @returns {string}
 */
export function getCurrentSymbol() {
    return symbolStatus.currentSymbol;
}

/**
 * 处理变换组点击事件
 * 切换"目标行/列"和"参数行/列"选中组的激活状态，二者互斥
 * @param {HTMLElement} element - 被点击的变换组元素
 */
export function handleTransformGroupClick(element) {
    const isTarget = element === elements.target;

    const isActive = element.classList.contains('active');

    if (isActive) {
        // 已激活则取消激活
        element.classList.remove('active');
        if (isTarget) {
            state.targetIsActive = false;
        } else {
            state.paramIsActive = false;
        }
    } else {
        // 激活自身，同时取消另一方的激活
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

// ==================== 初始化函数 ====================

/**
 * 初始化变换按钮
 * 为四个运算符按钮和执行按钮绑定事件，控制系数/参数输入框的显示
 */
export function initTransformationButtons() {
    // 交换按钮：隐藏系数，显示参数
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

    // 加法按钮：显示系数和参数
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

    // 减法按钮：显示系数和参数
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

    // 倍乘按钮：显示系数，隐藏参数
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

/**
 * 为执行按钮绑定点击事件
 */
export function initTranslateButton() {
    if (elements && elements.buttonTranslate) {
        elements.buttonTranslate.addEventListener('pointerup', executeElementaryTransformation);
    }
}

// ==================== 初等变换执行 ====================

/**
 * 执行初等变换
 * 校验输入 → 解析参数 → 根据符号执行对应操作 → 记录历史
 * @returns {boolean} 操作是否成功
 */
export function executeElementaryTransformation() {
    // 将系数输入框的值传入state
    state.transformCoefficient = elements.transformCoefficient.value.trim();

    try {
        const targetInput = state.transformTarget || '';
        const coefficientInput = state.transformCoefficient || '';
        const paramInput = state.transformParam || '';

        const currentSymbol = getCurrentSymbol();

        // 校验和预处理输入
        const validationResult = validateTransformationInputs(targetInput, coefficientInput, paramInput, currentSymbol);
        if (!validationResult.isValid) {
            showError(validationResult.message);
            return false;
        }

        const { targetType, targetIndex, paramType, paramIndex, coefficient } = validationResult.parsedData;

        // 根据符号执行相应变换
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

            // 保存变换前的状态到撤销栈
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

/**
 * 校验和解析变换输入数据
 * 验证用户输入的初等变换参数是否合法，并解析为可执行的格式
 * @param {string} targetInput - 目标行/列输入，如 "r1"
 * @param {string} coefficientInput - 系数输入
 * @param {string} paramInput - 参数行/列输入
 * @param {string} currentSymbol - 当前选择的操作符号
 * @returns {{isValid: boolean, message: string, parsedData?: Object}}
 */
export function validateTransformationInputs(targetInput, coefficientInput, paramInput, currentSymbol) {
    // 校验目标输入
    if (!targetInput) {
        return { isValid: false, message: '请输入目标行/列' };
    }

    const targetMatch = targetInput.match(/^([rc])(\d+)$/i);
    if (!targetMatch) {
        return { isValid: false, message: '目标行/列格式错误，请使用如 r1, c2 的格式' };
    }

    const targetType = targetMatch[1].toLowerCase(); // 'r' 或 'c'
    const targetIndex = parseInt(targetMatch[2]) - 1;  // 转为0-based索引

    if (!state.matrixData || !state.matrixData.elements) {
        return { isValid: false, message: '矩阵数据不存在，请先录入矩阵' };
    }

    // 校验目标索引范围
    const maxIndex = targetType === 'r' ? state.matrixData.rows - 1 : state.matrixData.cols - 1;
    if (targetIndex < 0 || targetIndex > maxIndex) {
        return { isValid: false, message: `目标${targetType === 'r' ? '行' : '列'}索引超出范围` };
    }

    // 校验分母不能为0
    if (coefficientInput.includes('/0')) {
        return { isValid: false, message: '系数分母不能为0' };
    }

    let coefficient = null;
    let paramType = null;
    let paramIndex = null;

    // 根据操作类型进行针对性校验
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

            // 交换操作要求目标与参数同类型（同行或同列）
            if (targetType !== paramType) {
                return { isValid: false, message: '交换操作只能在同行或同列之间进行' };
            }
            break;

        case '+':
        case '−':
            if (!paramInput) {
                return { isValid: false, message: '加减操作需要参数行/列' };
            }

            // 系数为空时默认使用1
            if (!coefficientInput || coefficientInput.trim() === '') {
                coefficient = 1;
            } else {
                // 系数不能包含未知数
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

            // 系数为1是无效变换（不会改变矩阵）
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

// ==================== 数学计算工具函数 ====================

/**
 * 解析并化简系数（处理小数和分数）
 * 使用math.fraction自动化简，返回最简分数形式
 * @param {string|number} mathInput - 输入的系数
 * @returns {string} 化简后的系数
 */
export function parseAndSimplifyCoefficient(mathInput) {
    try {
        // 纯数字且含科学计数法时先转fixed
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

/**
 * 解析并简化多项式表达式
 * 使用mathjs解析并化简，处理科学计数法、lambda符号替换
 * @param {string} expression - 数学表达式
 * @returns {string} 简化后的表达式
 */
export function parseAndSimplifyPolynomial(expression) {
    try {
        const parsed = math.parse(expression);

        const simplified = math.simplify(parsed);

        let result = simplified.toString();

        // 科学计数法 → fixed格式
        result = result.replace(/\b\d+\.?\d*[eE][+-]?\d+\b/g, match => {
            const num = Number(match);
            return math.format(num, { notation: 'fixed' });
        });

        // mathjs的lambda → 希腊字母λ
        result = result.replace(/lambda/g, 'λ');
        result = result.replace(/Lambda/g, 'Λ');

        // 移除不必要的单层括号
        result = result.replace(/\(([a-zA-Zλ]+)\)/g, '$1');
        result = result.replace(/\((\d+)\)/g, '$1');

        return result;
    } catch (error) {
        console.error('多项式解析错误:', error);
        return expression;
    }
}

/**
 * 验证表达式中的变量是否都在允许列表中
 * @param {string} expression - 数学表达式
 * @returns {boolean} 变量是否合法
 */
export function validatePolynomialVariables(expression) {
    const variables = expression.match(new RegExp(`[${ALLOWED_VARIABLES.join('')}]`, 'g')) || [];

    for (const variable of variables) {
        if (!ALLOWED_VARIABLES.includes(variable)) {
            return false;
        }
    }

    return true;
}

// ==================== 具体变换操作 ====================

/**
 * 执行行/列交换
 * @param {string} targetType - 'r'或'c'
 * @param {number} targetIndex - 目标索引（0-based）
 * @param {string} paramType - 参数类型
 * @param {number} paramIndex - 参数索引（0-based）
 * @returns {{success: boolean, description: string}}
 */
export function executeRowColumnSwap(targetType, targetIndex, paramType, paramIndex) {
    const matrix = state.matrixData.elements;

    if (targetType === 'r') {
        // 交换两行
        const temp = matrix[targetIndex];
        matrix[targetIndex] = matrix[paramIndex];
        matrix[paramIndex] = temp;

        return {
            success: true,
            description: `r${targetIndex + 1}↔ r${paramIndex + 1}`
        };
    } else {
        // 交换两列：逐行交换对应列的元素
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

/**
 * 执行行/列加减
 * 对目标行/列的每个元素执行 targetValue ± coefficient × paramValue
 * @param {string} targetType - 'r'或'c'
 * @param {number} targetIndex - 目标索引
 * @param {string} paramType - 参数类型
 * @param {number} paramIndex - 参数索引
 * @param {string|number} coefficient - 系数
 * @param {string} operation - '+'或'−'
 * @returns {{success: boolean, description: string}}
 */
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
                // 计算失败时使用原始拼接方式保留表达式
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

/**
 * 执行行/列倍乘
 * 将目标行/列的每个元素乘以系数
 * @param {string} targetType - 'r'或'c'
 * @param {number} targetIndex - 目标索引
 * @param {string|number} coefficient - 系数
 * @returns {{success: boolean, description: string}}
 */
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

// ==================== 历史记录和撤销/重做 ====================

/**
 * 更新页面上显示的变换历史记录文本
 */
export function updateHistoryTransformation() {
    const validHistory = HistoryManager.getUndoHistoryDescriptions()
        .filter(desc => desc);

    elements.historyTransformation.innerText = `初等变换历史记录：${validHistory.join('，') || '暂无'}`;
    console.log(`页面当前 ${elements.historyTransformation.innerText}`);
}

/**
 * 撤销一次初等变换
 * 从撤销栈弹出上一条记录并恢复矩阵状态
 */
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

/**
 * 重做一次初等变换
 * 从重做栈弹出记录并应用到矩阵
 */
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
