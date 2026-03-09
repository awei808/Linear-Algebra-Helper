// ==================== 公共常量定义 ====================
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

// ==================== 公共函数定义 ====================

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