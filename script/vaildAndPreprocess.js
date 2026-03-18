/* 数据校验和预处理 
在输入元素状态到初等变换状态的跳转过程中，或在“导入二维数组为矩阵”功能（初始状态跳转到初等变换状态）中使用
*/

// ==================== 常量定义 ====================
// 正则表达式常量
const PATTERNS = {
    DECIMAL: /^-?\d+\.\d+/,           // 小数格式（支持带未知数）
    DECIMAL_GLOBAL: /-?\d+\.\d+/g,     // 小数格式（全局匹配）
    FRACTION: /^-?\d+\/\d+$/,           // 分数格式
    COMPLEX_FRACTION: /^-?(\d+[a-dm-nxyzλ]+)\/(-?\d+[a-dm-nxyzλ]+)$/, // 复杂分数（含未知数，支持多个未知数组合）
    PURE_NUMBER: /^-?\d+$/,             // 纯数字
    LETTERS: /[a-zA-Zλ]/g,             // 字母匹配
    NUMERIC_PART: /-?\d+/               // 数字部分
};

// 允许的未知数常量
const ALLOWED_VARIABLES = CONFIG.TRANSFORMATION_CONFIG.ALLOWED_VARIABLES;

// ==================== 数据处理函数 ====================

/**
 * 小数转分数处理 - 公共函数
 * @param {string} decimal - 小数字符串（支持带未知数，如1.2x）
 * @returns {Object} {success: boolean, formattedValue: string, error: string}
 */
function convertDecimalToFraction(decimal) {
    try {
        // 检查是否包含未知数
        const variableMatch = decimal.match(PATTERNS.LETTERS);

        if (variableMatch) {
            // 处理带未知数的小数（如1.2x）
            const decimalPart = decimal.match(PATTERNS.DECIMAL_GLOBAL)?.[0];
            const variablePart = decimal.replace(decimalPart, '');

            if (decimalPart) {
                const decimalValue = parseFloat(decimalPart);
                const fraction = math.fraction(decimalValue);

                // 构建带未知数的分数形式
                if (fraction.d === 1) {
                    return { success: true, formattedValue: fraction.n.toString() + variablePart, error: '' };
                } else {
                    const fractionString = math.format(fraction, { fraction: 'ratio' });
                    return { success: true, formattedValue: fractionString + variablePart, error: '' };
                }
            }
        }

        // 处理纯小数
        const decimalValue = parseFloat(decimal);
        const fraction = math.fraction(decimalValue);

        // 检查分母是否为1，如果是则转换为整数
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
 * 分数化简处理 - 公共函数
 * @param {string} fractionStr - 分数字符串
 * @returns {Object} {success: boolean, formattedValue: string, error: string}
 */
function simplifyFraction(fractionStr) {
    try {
        const fraction = math.fraction(fractionStr);

        // 检查分母是否为1，如果是则转换为整数
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
 * 复杂分数化简处理（包含未知数）- 公共函数
 * @param {string} complexFraction - 包含未知数的分数字符串
 * @returns {string} 化简后的分数字符串
 */
function simplifyComplexFraction(complexFraction) {
    try {
        const fractionMatch = complexFraction.match(PATTERNS.COMPLEX_FRACTION);
        if (!fractionMatch) return complexFraction;

        const numerator = fractionMatch[1];   // 分子
        const denominator = fractionMatch[2]; // 分母

        // 检查是否为纯数字分数（分子和分母都是数字）
        const numeratorIsNumber = PATTERNS.PURE_NUMBER.test(numerator);
        const denominatorIsNumber = PATTERNS.PURE_NUMBER.test(denominator);

        if (numeratorIsNumber && denominatorIsNumber) {
            // 纯数字分数：使用math.js进行化简
            const fraction = math.fraction(complexFraction);

            if (fraction.d === 1) {
                // 分母为1，转换为整数
                return fraction.n.toString();
            } else {
                // 化简分数
                return math.format(fraction, { fraction: 'ratio' });
            }
        } else {
            // 包含未知数的分数：进行简单的数字部分化简
            // 提取分子和分母中的数字部分
            const numNumerator = numerator.match(PATTERNS.NUMERIC_PART)?.[0] || '1';
            const numDenominator = denominator.match(PATTERNS.NUMERIC_PART)?.[0] || '1';

            // 计算最大公约数
            const gcd = math.gcd(parseInt(numNumerator), parseInt(numDenominator));

            if (gcd > 1) {
                // 化简数字部分
                const simplifiedNum = parseInt(numNumerator) / gcd;
                const simplifiedDen = parseInt(numDenominator) / gcd;

                // 重新构建分数
                const simplifiedNumerator = numerator.replace(numNumerator, simplifiedNum.toString());
                const simplifiedDenominator = denominator.replace(numDenominator, simplifiedDen.toString());

                return `${simplifiedNumerator}/${simplifiedDenominator}`;
            }
        }
    } catch (error) {
        // 如果化简失败，保持原样
        console.warn(`复杂分数化简失败: ${complexFraction}`, error);
        return complexFraction;
    }

    return complexFraction;
}

/**
 * 数值格式化函数 - 公共函数
 * 处理小数转分数、分数化简、空值补零、小数补零、**到^转换等预处理操作
 * @param {string} value - 输入的数值字符串
 * @returns {Object} {success: boolean, formattedValue: string, error: string}
 */
function formatMatrixValue(value) {
    // 空值补零
    if (!value || value.trim() === '') {
        return { success: true, formattedValue: '0', error: '' };
    }
    value = value.trim();
    // 小数补零
    const leadingDotPattern = /^\.\d+$/;
    if (leadingDotPattern.test(value)) {
        value = '0' + value;
    }
    // 将**替换为^
    value = value.replace(/\*\*/g, '^');
    // 小数转分数处理
    if (PATTERNS.DECIMAL.test(value)) {
        return convertDecimalToFraction(value);
    }
    // 分数化简处理
    if (PATTERNS.FRACTION.test(value)) {
        return simplifyFraction(value);
    }

    // 其他格式保持原样
    return { success: true, formattedValue: value, error: '' };
}


/**
 * 检查字符串是否为有效矩阵元素 - 公共函数
 * 重构版本：按照清晰步骤进行验证
 * 支持：数字、分数、小数、未知数、包含未知数的多项式
 * 未知数只能是abcdmnxyz和λ中的单个字符
 * @param {string} str - 要检查的字符串
 * @returns {Object} {isValid: boolean, message: string}
 */
function isValidMatrixElement(str) {
    // 步骤1：空字符串视为0
    if (str === '') {
        return { isValid: true, message: '' };
    }

    // 步骤2：纯数字（整数、小数）
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return { isValid: true, message: '' };
    }

    // 步骤3：字符串形式检测未知数是否都是允许的
    // 匹配所有可能的字母字符（包括非法未知数）
    const allLettersPattern = /[a-zA-Zλ]/g;
    const lettersInStr = str.match(allLettersPattern);
    if (lettersInStr) {
        const invalidLetters = lettersInStr.filter(v => !ALLOWED_VARIABLES.includes(v));
        if (invalidLetters.length > 0) {
            return {
                isValid: false,
                message: `未知数"${invalidVariables.join(', ')}"不在允许范围内（允许的未知数：${ALLOWED_VARIABLES.join(', ')}）`
            };
        }
    }

    // 步骤4：分数（支持正负分数，支持未知数作为分子或分母）
    const fractionPattern = new RegExp(`^-?([\\da-dm-nxyzλ]+)/([\\da-dm-nxyzλ]+)$`);
    const fractionMatch = str.match(fractionPattern);
    if (fractionMatch) {
        const denominator = fractionMatch[2]; // 分母
        if (denominator === '0') {
            return { isValid: false, message: '分母不能为0' };
        }
        return { isValid: true, message: '' };
    }

    // 步骤5：剩余无法识别的矩阵元素先进行基本格式检查，再交给math.parse处理
    const cleanedStr = str.replace(/\s/g, '');

    // 基本字符集检查
    const validCharsPattern = /^[0-9a-dm-nxyzλ+\-\*\.\/\(\)\^]+$/;
    if (!validCharsPattern.test(cleanedStr)) {
        return {
            isValid: false,
            message: '格式错误，只能包含数字、未知数、加减号、乘号、乘方符号(^或**)、小数点、斜杠和括号'
        };
    }
    // 基本结构检查
    if (/[+\-]$/.test(cleanedStr)) {
        return { isValid: false, message: '不能以加减号结尾' };
    }
    if (/[+\-]{2,}/.test(cleanedStr)) {
        return { isValid: false, message: '不能有连续的加减号' };
    }
    if (/\/{2,}/.test(cleanedStr)) {
        return { isValid: false, message: '不能有连续的斜杠' };
    }
    if (/^\/|\/$/.test(cleanedStr)) {
        return { isValid: false, message: '不能以斜杠开头或结尾' };
    }
    // 括号匹配检查
    let bracketCount = 0;
    for (let char of cleanedStr) {
        if (char === '(') bracketCount++;
        if (char === ')') bracketCount--;
        if (bracketCount < 0) {
            return { isValid: false, message: '括号不匹配，有未闭合的右括号' };
        }
    }
    if (bracketCount > 0) {
        return { isValid: false, message: '括号不匹配，有未闭合的左括号' };
    }
    if (/\(\)/.test(cleanedStr)) {
        return { isValid: false, message: '括号内不能为空' };
    }
    // 使用math.js进行最终验证
    try {
        math.parse(cleanedStr);
        return { isValid: true, message: '' };
    } catch (error) {
        return {
            isValid: false,
            message: `表达式格式错误：${error.message}`
        };
    }
}

/**
 * 验证并格式化矩阵元素 - 公共函数
 * 结合formatMatrixValue和isValidMatrixElement的功能
 * @param {string} value - 输入的数值字符串
 * @param {boolean} validate - 是否进行有效性校验
 * @returns {Object} {success: boolean, formattedValue: string, error: string}
 */
function validateAndFormatMatrixValue(value, validate = true) {
    // 保存原始值用于错误信息
    const originalValue = value;
    // 调用formatMatrixValue进行格式化处理
    const formatResult = formatMatrixValue(value);
    // 如果格式化失败，直接返回错误
    if (!formatResult.success) {
        return formatResult;
    }

    // 如果需要校验，对格式化后的值进行有效性检查
    if (validate) {
        const validationResult = isValidMatrixElement(formatResult.formattedValue);
        if (!validationResult.isValid) {
            return {
                success: false,
                formattedValue: formatResult.formattedValue,
                error: validationResult.message
            };
        }
    }

    return formatResult;
}

// ==================== 逻辑处理函数 ====================
/**
 * 分割列元素，支持保护字符串内的逗号
 * @param {string} rowStr - 行字符串
 * @returns {Array} 列元素数组
 */
function splitColumns(rowStr) {
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
            // 遇到逗号且不在引号内，完成当前元素
            elements.push(currentElement.trim());
            currentElement = '';
        } else {
            currentElement += char;
        }
    }

    // 添加最后一个元素
    if (currentElement.trim() !== '') {
        elements.push(currentElement.trim());
    }

    return elements;
}

/**
 * 手动解析矩阵字符串（不使用JSON.parse）
 * @param {string} matrixStr - 矩阵字符串
 * @returns {Object} 解析结果
 */
function parseMatrixManually(matrixStr) {
    try {
        // 去除最外层的中括号
        const innerStr = matrixStr.slice(1, -1).trim();
        if (innerStr === '') {
            return { isValid: false, message: '矩阵不能为空' };
        }

        // 分割行（按], [分割）
        const rowStrings = innerStr.split(/\s*\]\s*,\s*\[\s*/);

        // 处理第一行和最后一行
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

            // 分割列（按逗号分割，但要注意保护字符串内的逗号）
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

/**
 * 收集矩阵数据
 */
function collectMatrixData() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));

    inputs.forEach(input => {
        const x = parseInt(input.dataset.x);
        const y = parseInt(input.dataset.y);
        state.matrixData.elements[y][x] = input.value.trim();
    });
}

/**
 * 检验并解析二维数组字符串
 * @param {string} input - 输入的二维数组字符串
 * @returns {Object} {isValid: boolean, message: string, rows: number, cols: number, elements: Array}
 */
function validateAndParseMatrix(input) {
    try {
        // 步骤1: 以字符串形式解析整个输入框传来的值
        const cleanedInput = input.replace(/\s+/g, ' ').trim();

        // 检查是否为有效的二维数组格式
        if (!cleanedInput.startsWith('[') || !cleanedInput.endsWith(']')) {
            return {
                isValid: false,
                message: '请输入有效的二维数组格式，如：[[1,2,3],[4,5,6]]'
            };
        }

        // 步骤2: 对字母进行校验，检验是否是未知数
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

        // 步骤3: 将整个输入框传来的值切割，按矩阵元素遍历解析
        // 手动解析二维数组格式
        const matrixData = parseMatrixManually(cleanedInput);
        if (!matrixData.isValid) {
            return matrixData;
        }

        const { rows, cols, elements: rawElements } = matrixData;

        // 步骤4: 使用增强的格式化函数统一处理所有元素（包含格式化和校验）
        const elements = [];
        for (let i = 0; i < rows; i++) {
            elements[i] = [];
            for (let j = 0; j < cols; j++) {
                let element = rawElements[i][j].trim();

                // 使用增强的格式化函数一次性完成格式化和校验
                const formatResult = validateAndFormatMatrixValue(element, true);
                if (!formatResult.success) {
                    return {
                        isValid: false,
                        message: `第${i + 1}行第${j + 1}列的值"${element}"不是有效矩阵元素。${formatResult.error}`
                    };
                }

                elements[i][j] = formatResult.formattedValue;
            }
        }

        // 步骤6: 返回解析结果供显示矩阵使用
        return {
            isValid: true,
            message: '解析成功',
            rows: rows,
            cols: cols,
            elements: elements
        };

    } catch (error) {
        return {
            isValid: false,
            message: `解析过程中发生错误: ${error.message}`
        };
    }
}

/**
 * 矩阵数据校验与预处理函数
 * 支持小数转分数、自动补零和多种数据格式验证
 * @param {boolean} useDOM - 是否从DOM元素中读取数据（否则从state.matrixData.elements读取）
 * @returns {Object} {isValid: boolean, message: string}
 */
function validateMatrixData(useDOM = false) {
    // 检查矩阵数据是否存在
    if (!state.matrixData || !state.matrixData.elements) {
        return {
            isValid: true, // 不再进行空数据校验，直接返回通过
            message: '数据处理完成'
        };
    }

    const { rows, cols } = state.matrixData;
    let elements = [];
    let inputs = [];
    // 选择数据来源
    if (useDOM) {
        // 从DOM中读取数据
        inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    } else {
        // 从state中读取数据
        elements = state.matrixData.elements;
    }

    // 遍历数据进行处理
    if (useDOM) {
        // DOM数据源处理（一维数组）
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            let value = input.value.trim();
            const row = Math.floor(i / cols) + 1;
            const col = (i % cols) + 1;

            // 验证并格式化函数处理数据
            const formatResult = validateAndFormatMatrixValue(value, true);

            if (!formatResult.success) {
                return {
                    isValid: false,
                    message: `第${row}行第${col}列${formatResult.error}`
                };
            }

            // 更新输入框的值
            input.value = formatResult.formattedValue;
        }
    } else {
        // State数据源处理（二维数组）
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let value = elements[row][col]?.trim() || '';

                // 使用增强的格式化函数处理数据
                const formatResult = validateAndFormatMatrixValue(value, true);

                if (!formatResult.success) {
                    return {
                        isValid: false,
                        message: `第${row + 1}行第${col + 1}列${formatResult.error}`
                    };
                }

                // 更新矩阵数据
                elements[row][col] = formatResult.formattedValue;
            }
        }
    }

    // 始终返回验证通过
    return {
        isValid: true,
        message: '数据处理完成'
    };
}

/**
 * 处理数据校验的总入口函数
 */
function handleDataValidation() {

    if (state.currentState !== CONFIG.STATES.INPUT_ELEMENTS) {
        return false;
    }

    // 1. 收集矩阵数据（确保数据已收集）
    collectMatrixData();

    // 2. 执行数据校验（去除空数据校验，改为自动补零）
    const validationResult = validateMatrixData();
    if (!validationResult.isValid) {
        // 校验失败：提示错误并终止流程
        showError(validationResult.message);
        return false; // 返回处理失败
    }
    // 4. 更新坐标显示和全局UI
    updateCoordinatesDisplay(`${state.matrixData.rows}×${state.matrixData.cols}`);
    return true; // 返回处理成功
}