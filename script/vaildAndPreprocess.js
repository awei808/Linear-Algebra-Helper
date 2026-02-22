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
const ALLOWED_VARIABLES =CONFIG.TRANSFORMATION_CONFIG.ALLOWED_VARIABLES;

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
 * 处理小数转分数、分数化简、自动补零等
 * @param {string} value - 输入的数值字符串
 * @returns {Object} {success: boolean, formattedValue: string, error: string}
 */
function formatMatrixValue(value) {

    // 自动补零
    if (!value || value.trim() === '') {
        return { success: true, formattedValue: '0', error: '' };
    }

    value = value.trim();

    // 新功能：识别.2格式，自动转换为0.2
    const leadingDotPattern = /^\.\d+$/;
    if (leadingDotPattern.test(value)) {
        value = '0' + value;
    }

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
 * 增强的数值格式化函数，在录入矩阵流程中使用
 * 结合formatMatrixValue和isValidMatrixElement的功能
 * @param {string} value - 输入的数值字符串
 * @param {boolean} validate - 是否进行有效性校验
 * @returns {Object} {success: boolean, formattedValue: string, error: string}
 */
function enhancedFormatMatrixValue(value, validate = true) {
    // 先进行基本的格式预处理（包括.2格式转换）
    let processedValue = value;
    
    if (value && value.trim) {
        processedValue = value.trim();
        
        // 新功能：识别.2格式，自动转换为0.2
        const leadingDotPattern = /^\.\d+$/;
        if (leadingDotPattern.test(processedValue)) {
            processedValue = '0' + processedValue;
        }
    }

    // 如果需要校验，进行有效性检查
    if (validate) {
        const validationResult = isValidMatrixElement(processedValue);
        if (!validationResult.isValid) {
            return {
                success: false,
                formattedValue: value,
                error: validationResult.message
            };
        }
    }

    // 然后进行完整的格式化处理
    const formatResult = formatMatrixValue(processedValue);

    if (!formatResult.success) {
        return formatResult;
    }

    return formatResult;
}



/**
 * 检查字符串是否为有效矩阵元素
 * 支持：数字、分数、小数、未知数、包含未知数的多项式
 * 未知数只能是abcdmnxyz和λ中的单个字符
 * @param {string} str - 要检查的字符串
 * @returns {Object} {isValid: boolean, message: string}
 */
function isValidMatrixElement(str) {
    // 空字符串视为0
    if (str === '') {
        return { isValid: true, message: '' };
    }

    // 1. 纯数字（整数、小数）
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return { isValid: true, message: '' };
    }

    // 2. 分数（支持正负分数，支持未知数作为分子或分母）
    const fractionPattern = new RegExp(`^-?([\\da-dm-nxyzλ]+)/([\\da-dm-nxyzλ]+)$`);
    const fractionMatch = str.match(fractionPattern);
    if (fractionMatch) {
        const numerator = fractionMatch[1];   // 分子
        const denominator = fractionMatch[2]; // 分母

        // 检查分母是否为0
        if (denominator === '0') {
            return { isValid: false, message: '分母不能为0' };
        }

        // 检查分子和分母中的未知数是否都是允许的
        const variablePattern = new RegExp(`[${ALLOWED_VARIABLES.join('')}]`, 'g');

        const numeratorVariables = numerator.match(variablePattern) || [];
        const denominatorVariables = denominator.match(variablePattern) || [];

        const allVariables = [...numeratorVariables, ...denominatorVariables];
        const invalidVariables = allVariables.filter(v => !ALLOWED_VARIABLES.includes(v));

        if (invalidVariables.length > 0) {
            return {
                isValid: false,
                message: `未知数"${invalidVariables[0]}"不在允许范围内（允许的未知数：${ALLOWED_VARIABLES.join(', ')}）`
            };
        }

        return { isValid: true, message: '' };
    }

    // 3. 单个未知数（只能是允许的字符）
    if (ALLOWED_VARIABLES.includes(str)) {
        return { isValid: true, message: '' };
    }

    // 4. 带系数的未知数（如2x, -3y, 0.5λ, 3ab, 9xy）
    const coefficientVariablePattern = /^(-?\d+(\.\d+)?)([a-dm-nxyzλ]+)$/;
    const coefficientMatch = str.match(coefficientVariablePattern);
    if (coefficientMatch) {
        const variables = coefficientMatch[3];
        // 检查所有未知数是否都是允许的
        const invalidVariables = [...variables].filter(v => !ALLOWED_VARIABLES.includes(v));
        if (invalidVariables.length === 0) {
            return { isValid: true, message: '' };
        }
    }

    // 5. 多项式（如2x+3y, x-y, 3a+2b-λ, 2+3x, -y+2λ, 1/z+7, x/2+3y, 2x+3/y）
    // 先检查是否包含允许的未知数
    const variablePattern = new RegExp(`[${ALLOWED_VARIABLES.join('')}]`, 'g');
    const variablesInStr = str.match(variablePattern);

    if (variablesInStr) {
        // 检查所有未知数是否都是允许的
        const invalidVariables = variablesInStr.filter(v => !ALLOWED_VARIABLES.includes(v));
        if (invalidVariables.length > 0) {
            return {
                isValid: false,
                message: `未知数"${invalidVariables[0]}"不在允许范围内（允许的未知数：${ALLOWED_VARIABLES.join(', ')}）`
            };
        }

        // 扩展的多项式格式验证：支持纯数字项、带系数未知数项、单个未知数项、分数项、多个未知数组合
        // 格式示例：2x+3y, x-y, 3a+2b-λ, 2+3x, -y+2λ, 0.5x-1.2y+3z+4, 1/z+7, x/2+3y, 2x+3/y, 3ab, 9xy, 10xy+a
        const extendedPolynomialPattern = /^([+-]?(\d+(\.\d+)?)?([a-dm-nxyzλ]+)?(\/(\d+([a-dm-nxyzλ]+)?)?)?)([+-](\d+(\.\d+)?)?([a-dm-nxyzλ]+)?(\/(\d+([a-dm-nxyzλ]+)?)?)?)*$/;

        // 简化验证：检查是否只包含数字、允许的未知数、加减号、小数点、斜杠
        const validCharsPattern = /^[0-9a-dm-nxyzλ+\-\.\/\s]+$/;
        if (!validCharsPattern.test(str.replace(/\s/g, ''))) {
            return {
                isValid: false,
                message: '多项式格式错误，只能包含数字、未知数、加减号、小数点和斜杠'
            };
        }

        // 基本结构检查：不能以加减号结尾，不能有连续的加减号
        const cleanedStr = str.replace(/\s/g, '');
        if (/[+\-]$/.test(cleanedStr)) {
            return { isValid: false, message: '多项式不能以加减号结尾' };
        }
        if (/[+\-]{2,}/.test(cleanedStr)) {
            return { isValid: false, message: '多项式不能有连续的加减号' };
        }

        // 检查斜杠使用：不能有连续的斜杠，斜杠不能出现在开头或结尾
        if (/\/{2,}/.test(cleanedStr)) {
            return { isValid: false, message: '多项式不能有连续的斜杠' };
        }
        if (/^\/|\/$/.test(cleanedStr)) {
            return { isValid: false, message: '多项式不能以斜杠开头或结尾' };
        }

        // 改进的验证：检查多项式结构是否合理
        const terms = cleanedStr.split(/(?=[+-])/); // 按加减号分割，保留符号
        let hasValidStructure = true;

        for (let term of terms) {
            // 处理首项可能没有符号的情况
            if (term === '') continue;

            // 检查每一项的格式（支持分数项、多个未知数组合）
            const termPattern = /^[+-]?((\d+(\.\d+)?)?([a-dm-nxyzλ]+)?(\/(\d+([a-dm-nxyzλ]+)?)?)?)$/;
            if (!termPattern.test(term)) {
                hasValidStructure = false;
                break;
            }

            // 检查不能只有符号没有内容
            if (term === '+' || term === '-') {
                hasValidStructure = false;
                break;
            }

            // 检查分数项的分母不能为0
            if (term.includes('/')) {
                const parts = term.split('/');
                if (parts.length === 2) {
                    const denominator = parts[1];
                    // 检查分母是否为纯数字0
                    if (/^0$/.test(denominator)) {
                        return { isValid: false, message: `分数项"${term}"的分母不能为0` };
                    }
                    // 检查分母是否包含数字0（如x0, 0y等）
                    if (/(^0|[^1-9]0)/.test(denominator)) {
                        return { isValid: false, message: `分数项"${term}"的分母不能包含0` };
                    }
                }
            }
        }

        if (!hasValidStructure) {
            return {
                isValid: false,
                message: '多项式格式错误，请检查各项格式是否正确'
            };
        }

        return { isValid: true, message: '' };
    }

    // 6. 如果以上都不匹配，返回错误
    return {
        isValid: false,
        message: `格式错误。支持：数字、分数、未知数（${ALLOWED_VARIABLES.join(', ')}）、多项式`
    };
}