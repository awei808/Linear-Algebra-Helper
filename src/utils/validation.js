// ==================== 数据校验和预处理模块 ====================
// 矩阵元素格式化、校验、二维数组解析
import { fraction, format, parse } from 'mathjs';
const math = { fraction, format, parse };
import { CONFIG } from '../config.js';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { showError } from '../ui/popup.js';
import { updateCoordinatesDisplay } from '../features/select-dimension.js';

// 允许的未知数字符列表
export const ALLOWED_VARIABLES = CONFIG.TRANSFORMATION_CONFIG.VALUE_PROCESSING.ALLOWED_VARIABLES;
const ALL_LETTERS = `[${ALLOWED_VARIABLES.join('')}]`;

// ==================== 正则表达式模式 ====================
export const PATTERNS = {
    DECIMAL: /-?\d+\.\d+/,                                          // 匹配小数
    FRACTION: /^-?\d+\/\d+$/,                                        // 匹配分数格式
    ALL_LETTERS: new RegExp(`[${ALLOWED_VARIABLES.join('')}]`),      // 匹配任意允许的未知数
    COMPLEX_FRACTION: new RegExp(`^-?(\\d+${ALL_LETTERS}+)\\/(-?\\d+${ALL_LETTERS}+)$`),
    PURE_NUMBER: /^-?\d+$/,                                         // 纯整数
    PURE_NUMBER_OR_DECIMAL: /^-?\d+(\.\d+)?$/,                      // 整数或小数
    LETTERS: new RegExp(`[${ALLOWED_VARIABLES.join('')}]`, 'g'),     // 全局匹配允许的未知数
    NUMERIC_PART: /-?\d+/,                                           // 提取数字部分
    VALID_CHARS: new RegExp(`^[0-9${ALL_LETTERS}+\\-\\*\\.\\/\\(\\)\\^]+$`), // 合法字符集
    ENDS_WITH_OPERATOR: /[+\-]$/,
    CONSECUTIVE_OPERATORS: /[+\-]{2,}/,
    CONSECUTIVE_SLASHES: /\/{2,}/,
    STARTS_OR_ENDS_WITH_SLASH: /^\/|\/$/,
};

/**
 * 将含未知数的小数转换为分数
 * 例如 "3.5x" → "7/2x"
 * @param {string} decimal - 含小数的表达式
 * @returns {{success: boolean, formattedValue: string, error: string}}
 */
export function convertDecimalToFraction(decimal) {
    try {
        // 检查是否包含未知数
        const variableMatch = decimal.match(PATTERNS.LETTERS);

        if (variableMatch) {
            const decimalPart = decimal.match(PATTERNS.DECIMAL)?.[0];
            const variablePart = decimal.replace(decimalPart, '');

            if (decimalPart) {
                const decimalValue = parseFloat(decimalPart);
                const fraction = math.fraction(decimalValue);

                if (fraction.d === 1) {
                    return { success: true, formattedValue: fraction.n.toString() + variablePart, error: '' };
                } else {
                    const fractionString = math.format(fraction, { fraction: 'ratio' });
                    return { success: true, formattedValue: fractionString + variablePart, error: '' };
                }
            }
        }

        // 纯小数转分数
        const decimalValue = parseFloat(decimal);
        const fraction = math.fraction(decimalValue);

        if (fraction.d === 1) {
            return { success: true, formattedValue: fraction.n.toString(), error: '' };
        } else {
            const fractionString = math.format(fraction, { fraction: 'ratio' });
            return { success: true, formattedValue: fractionString, error: '' };
        }
    } catch (error) {
        return { success: false, formattedValue: decimal, error: `小数转换失败：${decimal}` };
    }
}

/**
 * 化简分数
 * @param {string} fractionStr - 分数字符串，如 "6/4"
 * @returns {{success: boolean, formattedValue: string, error: string}}
 */
export function simplifyFraction(fractionStr) {
    try {
        const fraction = math.fraction(fractionStr);

        if (fraction.d === 1) {
            return { success: true, formattedValue: fraction.n.toString(), error: '' };
        } else {
            const simplifiedFraction = math.format(fraction, { fraction: 'ratio' });
            return { success: true, formattedValue: simplifiedFraction, error: '' };
        }
    } catch (error) {
        return { success: false, formattedValue: fractionStr, error: `分数化简失败：${fractionStr}` };
    }
}

/**
 * 格式化矩阵元素值
 * 处理前导小数点、小数转分数、分数化简
 * @param {string} value - 原始值
 * @returns {{success: boolean, formattedValue: string, error: string}}
 */
export function formatMatrixValue(value) {
    // 空值默认为0
    if (!value || value.trim() === '') {
        return { success: true, formattedValue: '0', error: '' };
    }
    value = value.trim();

    // .2 → 0.2（前导小数点补零）
    const leadingDotPattern = /^\.\d+$/;
    if (CONFIG.TRANSFORMATION_CONFIG.VALUE_PROCESSING.LEADING_ZERO_FOR_DECIMAL && leadingDotPattern.test(value)) {
        value = '0' + value;
    }

    // ** → ^（统一幂运算符号）
    value = value.replace(/\*\*/g, '^');

    // 小数转分数
    if (PATTERNS.DECIMAL.test(value)) {
        return convertDecimalToFraction(value);
    }
    // 分数化简
    if (PATTERNS.FRACTION.test(value)) {
        return simplifyFraction(value);
    }

    return { success: true, formattedValue: value, error: '' };
}

/**
 * 验证矩阵元素格式是否合法
 * 检查未知数范围、分数分母、括号匹配等
 * @param {string} str - 待验证的表达式
 * @returns {{success: boolean, formattedValue: string, error: string}}
 */
export function ValidMatrixElement(str) {
    // 空字符串合法（视为0）
    if (str === '') {
        return { success: true, formattedValue: str, error: '' };
    }

    // 纯数字直接通过
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return { success: true, formattedValue: str, error: '' };
    }

    // 检查未知数是否在允许范围内
    const lettersInStr = str.match(PATTERNS.ALL_LETTERS);
    if (lettersInStr) {
        const invalidLetters = lettersInStr.filter(v => !ALLOWED_VARIABLES.includes(v));
        if (invalidLetters.length > 0) {
            return {
                success: false,
                formattedValue: str,
                error: `未知数"${invalidLetters.join(', ')}"不在允许范围内（允许的未知数：${ALLOWED_VARIABLES.join(', ')}）`
            };
        }
    }

    // 分数格式校验（分母不能为0）
    const fractionPattern = new RegExp(`^-?([\\da-dm-nxyzλ]+)/([\\da-dm-nxyzλ]+)$`);
    const fractionMatch = str.match(fractionPattern);
    if (fractionMatch) {
        const denominator = fractionMatch[2];
        if (denominator === '0') {
            return { success: false, formattedValue: str, error: '分母不能为0' };
        }
        return { success: true, formattedValue: str, error: '' };
    }

    const cleanedStr = str.replace(/\s/g, '');

    // 合法字符集校验
    const validCharsPattern = /^[0-9a-dm-nxyzλ+\-\*\.\/\(\)\^]+$/;
    if (!validCharsPattern.test(cleanedStr)) {
        return {
            success: false,
            formattedValue: str,
            error: '格式错误，只能包含数字、未知数、加减号、乘号、乘方符号(^或**)、小数点、斜杠和括号'
        };
    }
    if (/[+\-]$/.test(cleanedStr)) return { success: false, formattedValue: str, error: '不能以加减号结尾' };
    if (/[+\-]{2,}/.test(cleanedStr)) return { success: false, formattedValue: str, error: '不能有连续的加减号' };
    if (/\/{2,}/.test(cleanedStr)) return { success: false, formattedValue: str, error: '不能有连续的斜杠' };
    if (/^\/|\/$/.test(cleanedStr)) return { success: false, formattedValue: str, error: '不能以斜杠开头或结尾' };

    // 括号匹配校验
    let bracketCount = 0;
    for (let char of cleanedStr) {
        if (char === '(') bracketCount++;
        if (char === ')') bracketCount--;
        if (bracketCount < 0) return { success: false, formattedValue: str, error: '括号不匹配，有未闭合的右括号' };
    }
    if (bracketCount > 0) return { success: false, formattedValue: str, error: '括号不匹配，有未闭合的左括号' };
    if (/\(\)/.test(cleanedStr)) return { success: false, formattedValue: str, error: '括号内不能为空' };

    // 使用mathjs最终验证表达式合法性
    try {
        math.parse(cleanedStr);
        return { success: true, formattedValue: str, error: '' };
    } catch (error) {
        return { success: false, formattedValue: str, error: `表达式格式错误：${error.message}` };
    }
}

/**
 * 格式化并（可选）校验矩阵元素
 * @param {string} value - 原始值
 * @param {boolean} validate - 是否进行详细校验
 * @returns {{success: boolean, formattedValue: string, error: string}}
 */
export function validateAndFormatMatrixValue(value, validate = true) {
    const originalValue = value;
    const formatResult = formatMatrixValue(value);
    if (!formatResult.success) {
        return formatResult;
    }

    if (validate) {
        const validationResult = ValidMatrixElement(formatResult.formattedValue);
        if (!validationResult.success) {
            return {
                success: false,
                formattedValue: formatResult.formattedValue,
                error: validationResult.error
            };
        }
    }

    return formatResult;
}

/**
 * 处理数据校验（从INPUT_ELEMENTS进入ELEMENTARY_TRANSFORMATION时调用）
 * 收集输入框数据 → 校验 → 保存初始矩阵快照
 * @returns {boolean}
 */
export function handleDataValidation() {
    if (state.currentState !== CONFIG.STATES.INPUT_ELEMENTS) {
        return false;
    }

    collectMatrixData();

    const validationResult = validateMatrixData();
    if (!validationResult.isValid) {
        showError(validationResult.message);
        return false;
    }
    updateCoordinatesDisplay(`${state.matrixData.rows}×${state.matrixData.cols}`);

    // 保存初始矩阵快照，用于撤销回原始状态
    state.initialMatrixData = JSON.parse(JSON.stringify(state.matrixData));
    console.log('初始矩阵数据已保存:', state.initialMatrixData);

    return true;
}

/**
 * 从DOM输入框收集矩阵数据到state.matrixData
 */
export function collectMatrixData() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));

    inputs.forEach(input => {
        const x = parseInt(input.dataset.x);
        const y = parseInt(input.dataset.y);
        state.matrixData.elements[y][x] = input.value.trim();
    });
}

/**
 * 校验矩阵中的所有元素
 * 支持从DOM（输入框）或state.matrixData.elements读取
 * @param {boolean} useDOM - 是否从DOM读取（默认从state读取）
 * @returns {{isValid: boolean, message: string}}
 */
export function validateMatrixData(useDOM = false) {
    if (!state.matrixData || !state.matrixData.elements) {
        return { isValid: true, message: '数据处理完成' };
    }

    const { rows, cols } = state.matrixData;
    let elementsArr = [];
    let inputs = [];
    if (useDOM) {
        inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    } else {
        elementsArr = state.matrixData.elements;
    }

    if (useDOM) {
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            let value = input.value.trim();
            const row = Math.floor(i / cols) + 1;
            const col = (i % cols) + 1;

            const formatResult = validateAndFormatMatrixValue(value, true);

            if (!formatResult.success) {
                return { isValid: false, message: `第${row}行第${col}列${formatResult.error}` };
            }

            input.value = formatResult.formattedValue;
        }
    } else {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let value = elementsArr[row][col]?.trim() || '';

                const formatResult = validateAndFormatMatrixValue(value, true);

                if (!formatResult.success) {
                    return {
                        isValid: false,
                        message: `第${row + 1}行第${col + 1}列${formatResult.error}`
                    };
                }

                elementsArr[row][col] = formatResult.formattedValue;
            }
        }
    }

    return { isValid: true, message: '数据处理完成' };
}

// ==================== 二维数组快速导入 ====================

/**
 * 解析用户输入的二维数组字符串
 * 支持如 [[1,2x],[3,4]] 格式
 * @param {string} input - 用户输入
 * @returns {Object} 解析结果
 */
export function validateAndParseMatrix(input) {
    try {
        const cleanedInput = input.replace(/\s+/g, ' ').trim();

        // 基本格式检查
        if (!cleanedInput.startsWith('[') || !cleanedInput.endsWith(']')) {
            return {
                isValid: false,
                message: '请输入有效的二维数组格式，如：[[1,2,3],[4,5,6]]'
            };
        }

        // 检查未知数合法性
        const allLetters = cleanedInput.match(PATTERNS.LETTERS) || [];
        const invalidLetters = [...new Set(allLetters)].filter(letter =>
            !ALLOWED_VARIABLES.includes(letter.toLowerCase())
        );

        if (invalidLetters.length > 0) {
            return {
                isValid: false,
                message: `发现不允许的未知数: ${invalidLetters.join(', ')}。允许的未知数: ${ALLOWED_VARIABLES.join(', ')}`
            };
        }

        // 手动解析矩阵结构
        const matrixData = parseMatrixManually(cleanedInput);
        if (!matrixData.isValid) {
            return matrixData;
        }

        const { rows, cols, elements: rawElements } = matrixData;

        // 逐个校验和格式化元素
        const elementsArr = [];
        for (let i = 0; i < rows; i++) {
            elementsArr[i] = [];
            for (let j = 0; j < cols; j++) {
                let element = rawElements[i][j].trim();

                const formatResult = validateAndFormatMatrixValue(element, true);
                if (!formatResult.success) {
                    return {
                        isValid: false,
                        message: `第${i + 1}行第${j + 1}列的值"${element}"不是有效矩阵元素。${formatResult.error}`
                    };
                }

                elementsArr[i][j] = formatResult.formattedValue;
            }
        }

        return {
            isValid: true,
            message: '解析成功',
            rows: rows,
            cols: cols,
            elements: elementsArr
        };

    } catch (error) {
        return { isValid: false, message: `解析过程中发生错误: ${error.message}` };
    }
}

/**
 * 手动解析二维数组字符串（不使用eval，避免安全风险）
 * @param {string} matrixStr - 形如 [[1,2],[3,4]] 的字符串
 * @returns {{isValid: boolean, rows?: number, cols?: number, elements?: string[][], message?: string}}
 */
export function parseMatrixManually(matrixStr) {
    try {
        const innerStr = matrixStr.slice(1, -1).trim();
        if (innerStr === '') {
            return { isValid: false, message: '矩阵不能为空' };
        }

        // 按 "], [" 分割各行
        const rowStrings = innerStr.split(/\s*\]\s*,\s*\[\s*/);

        // 清理首尾的方括号
        if (rowStrings.length > 0) {
            rowStrings[0] = rowStrings[0].replace(/^\[\s*/, '');
            rowStrings[rowStrings.length - 1] = rowStrings[rowStrings.length - 1].replace(/\s*\]$/, '');
        }

        const rows = rowStrings.length;
        const elements = [];
        let cols = 0;

        for (let i = 0; i < rows; i++) {
            const rowStr = rowStrings[i].trim();
            if (rowStr === '') {
                return { isValid: false, message: `第${i + 1}行为空` };
            }

            const columnElements = splitColumns(rowStr);

            // 确保各行列数一致
            if (i === 0) {
                cols = columnElements.length;
            } else if (columnElements.length !== cols) {
                return {
                    isValid: false,
                    message: `第${i + 1}行列数(${columnElements.length})与第一行(${cols})不一致`
                };
            }

            elements.push(columnElements);
        }

        return { isValid: true, rows: rows, cols: cols, elements: elements };

    } catch (error) {
        return { isValid: false, message: `矩阵格式解析错误: ${error.message}` };
    }
}

/**
 * 按逗号分割行内元素（支持引号内逗号）
 * @param {string} rowStr - 行字符串
 * @returns {string[]} 元素数组
 */
export function splitColumns(rowStr) {
    const elements = [];
    let currentElement = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];

        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            currentElement += char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            currentElement += char;
        } else if (char === ',' && !inQuotes) {
            // 逗号分隔（忽略引号内的逗号）
            elements.push(currentElement.trim());
            currentElement = '';
        } else {
            currentElement += char;
        }
    }

    if (currentElement.trim() !== '') {
        elements.push(currentElement.trim());
    }

    return elements;
}
