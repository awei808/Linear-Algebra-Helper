import { CONFIG } from '../config.js';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { showError } from '../ui/popup.js';
import { updateCoordinatesDisplay } from '../features/select-dimension.js';

export const ALLOWED_VARIABLES = CONFIG.TRANSFORMATION_CONFIG.VALUE_PROCESSING.ALLOWED_VARIABLES;
const ALL_LETTERS = `[${ALLOWED_VARIABLES.join('')}]`;

export const PATTERNS = {
    DECIMAL: /-?\d+\.\d+/,
    FRACTION: /^-?\d+\/\d+$/,
    ALL_LETTERS: new RegExp(`[${ALLOWED_VARIABLES.join('')}]`),
    COMPLEX_FRACTION: new RegExp(`^-?(\\d+${ALL_LETTERS}+)\\/(-?\\d+${ALL_LETTERS}+)$`),
    PURE_NUMBER: /^-?\d+$/,
    PURE_NUMBER_OR_DECIMAL: /^-?\d+(\.\d+)?$/,
    LETTERS: new RegExp(`[${ALLOWED_VARIABLES.join('')}]`, 'g'),
    NUMERIC_PART: /-?\d+/,
    VALID_CHARS: new RegExp(`^[0-9${ALL_LETTERS}+\\-\\*\\.\\/\\(\\)\\^]+$`),
    ENDS_WITH_OPERATOR: /[+\-]$/,
    CONSECUTIVE_OPERATORS: /[+\-]{2,}/,
    CONSECUTIVE_SLASHES: /\/{2,}/,
    STARTS_OR_ENDS_WITH_SLASH: /^\/|\/$/,
};

export function convertDecimalToFraction(decimal) {
    try {
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

export function formatMatrixValue(value) {
    if (!value || value.trim() === '') {
        return { success: true, formattedValue: '0', error: '' };
    }
    value = value.trim();
    const leadingDotPattern = /^\.\d+$/;
    if (CONFIG.TRANSFORMATION_CONFIG.VALUE_PROCESSING.LEADING_ZERO_FOR_DECIMAL && leadingDotPattern.test(value)) {
        value = '0' + value;
    }
    value = value.replace(/\*\*/g, '^');
    if (PATTERNS.DECIMAL.test(value)) {
        return convertDecimalToFraction(value);
    }
    if (PATTERNS.FRACTION.test(value)) {
        return simplifyFraction(value);
    }

    return { success: true, formattedValue: value, error: '' };
}

export function ValidMatrixElement(str) {
    if (str === '') {
        return { success: true, formattedValue: str, error: '' };
    }

    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return { success: true, formattedValue: str, error: '' };
    }

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

    const validCharsPattern = /^[0-9a-dm-nxyzλ+\-\*\.\/\(\)\^]+$/;
    if (!validCharsPattern.test(cleanedStr)) {
        return {
            success: false,
            formattedValue: str,
            error: '格式错误，只能包含数字、未知数、加减号、乘号、乘方符号(^或**)、小数点、斜杠和括号'
        };
    }
    if (/[+\-]$/.test(cleanedStr)) {
        return { success: false, formattedValue: str, error: '不能以加减号结尾' };
    }
    if (/[+\-]{2,}/.test(cleanedStr)) {
        return { success: false, formattedValue: str, error: '不能有连续的加减号' };
    }
    if (/\/{2,}/.test(cleanedStr)) {
        return { success: false, formattedValue: str, error: '不能有连续的斜杠' };
    }
    if (/^\/|\/$/.test(cleanedStr)) {
        return { success: false, formattedValue: str, error: '不能以斜杠开头或结尾' };
    }
    let bracketCount = 0;
    for (let char of cleanedStr) {
        if (char === '(') bracketCount++;
        if (char === ')') bracketCount--;
        if (bracketCount < 0) {
            return { success: false, formattedValue: str, error: '括号不匹配，有未闭合的右括号' };
        }
    }
    if (bracketCount > 0) {
        return { success: false, formattedValue: str, error: '括号不匹配，有未闭合的左括号' };
    }
    if (/\(\)/.test(cleanedStr)) {
        return { success: false, formattedValue: str, error: '括号内不能为空' };
    }
    try {
        math.parse(cleanedStr);
        return { success: true, formattedValue: str, error: '' };
    } catch (error) {
        return {
            success: false,
            formattedValue: str,
            error: `表达式格式错误：${error.message}`
        };
    }
}

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

    state.initialMatrixData = JSON.parse(JSON.stringify(state.matrixData));
    console.log('初始矩阵数据已保存:', state.initialMatrixData);

    return true;
}

export function collectMatrixData() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));

    inputs.forEach(input => {
        const x = parseInt(input.dataset.x);
        const y = parseInt(input.dataset.y);
        state.matrixData.elements[y][x] = input.value.trim();
    });
}

export function validateMatrixData(useDOM = false) {
    if (!state.matrixData || !state.matrixData.elements) {
        return {
            isValid: true,
            message: '数据处理完成'
        };
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
                return {
                    isValid: false,
                    message: `第${row}行第${col}列${formatResult.error}`
                };
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

    return {
        isValid: true,
        message: '数据处理完成'
    };
}

export function validateAndParseMatrix(input) {
    try {
        const cleanedInput = input.replace(/\s+/g, ' ').trim();

        if (!cleanedInput.startsWith('[') || !cleanedInput.endsWith(']')) {
            return {
                isValid: false,
                message: '请输入有效的二维数组格式，如：[[1,2,3],[4,5,6]]'
            };
        }

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

        const matrixData = parseMatrixManually(cleanedInput);
        if (!matrixData.isValid) {
            return matrixData;
        }

        const { rows, cols, elements: rawElements } = matrixData;

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
        return {
            isValid: false,
            message: `解析过程中发生错误: ${error.message}`
        };
    }
}

export function parseMatrixManually(matrixStr) {
    try {
        const innerStr = matrixStr.slice(1, -1).trim();
        if (innerStr === '') {
            return { isValid: false, message: '矩阵不能为空' };
        }

        const rowStrings = innerStr.split(/\s*\]\s*,\s*\[\s*/);

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

        return {
            isValid: true,
            rows: rows,
            cols: cols,
            elements: elements
        };

    } catch (error) {
        return {
            isValid: false,
            message: `矩阵格式解析错误: ${error.message}`
        };
    }
}

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
