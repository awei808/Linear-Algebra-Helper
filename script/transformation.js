// ====================全局变量及基础代码====================
// 初等变换符号状态管理
let symbolStatus = {
    currentSymbol: '',
    activeButton: null
};

// 设置活动符号和按钮样式
function setActiveSymbol(symbol, activeButton) {
    // 更新状态
    symbolStatus.currentSymbol = symbol;
    symbolStatus.activeButton = activeButton;

    // 重置所有按钮样式
    resetButtonStyles();

    // 设置活动按钮样式（使用CSS类名）
    activeButton.classList.add(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.ACTIVE);
    activeButton.classList.remove(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.INACTIVE);

    // 设置其他按钮为非活动样式
    const allButtons = document.querySelectorAll('#arithmetic-symbols button');
    allButtons.forEach(button => {
        if (button !== activeButton) {
            button.classList.add(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.INACTIVE);
            button.classList.remove(CONFIG.TRANSFORMATION_CONFIG.BUTTON_STYLES.ACTIVE);
        }
    });
}

// 重置所有按钮样式
function resetButtonStyles() {
    const allButtons = document.querySelectorAll('#arithmetic-symbols button');
    allButtons.forEach(button => {
        button.style.backgroundColor = '';
        button.style.color = '';
        button.style.border = '';
    });
}

// 获取当前符号状态
function getCurrentSymbol() {
    return symbolStatus.currentSymbol;
}

// ==================== 初始化函数 ====================
// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    // 等待DOM完全加载后初始化
    setTimeout(initTransformationButtons, 100);
});

// 更新初始化函数，添加执行按钮的初始化
function initTransformationButtons() {

        // 交换按钮
    elements.buttonChange.addEventListener('click', function () {
        setActiveSymbol('↔', elements.buttonChange);
        // 使用空白占位方式隐藏系数输入框和参数框
        elements.transformCoefficient.style.visibility = 'hidden';
        elements.transformCoefficient.style.opacity = '0';
        elements.transformCoefficient.style.pointerEvents = 'none';

        elements.transformParam.style.visibility = 'visible';
        elements.transformParam.style.opacity = '1';
        elements.transformParam.style.pointerEvents = 'auto';
        // 设置运算符值
        if (elements.transformOperator) {
            elements.transformOperator.value = '↔';
        }
    });

    //加法按钮
    elements.buttonAdd.addEventListener('click', function () {
        setActiveSymbol('+', elements.buttonAdd);
        // 显示系数输入框和参数框
        elements.transformCoefficient.style.visibility = 'visible';
        elements.transformCoefficient.style.opacity = '1';
        elements.transformCoefficient.style.pointerEvents = 'auto';

        elements.transformParam.style.visibility = 'visible';
        elements.transformParam.style.opacity = '1';
        elements.transformParam.style.pointerEvents = 'auto';
        // 设置运算符值
        if (elements.transformOperator) {
            elements.transformOperator.value = '+';
        }
    });

    //减法按钮
    elements.buttonSub.addEventListener('click', function () {
        setActiveSymbol('−', elements.buttonSub);
        // 显示系数输入框和参数框
        elements.transformCoefficient.style.visibility = 'visible';
        elements.transformCoefficient.style.opacity = '1';
        elements.transformCoefficient.style.pointerEvents = 'auto';

        elements.transformParam.style.visibility = 'visible';
        elements.transformParam.style.opacity = '1';
        elements.transformParam.style.pointerEvents = 'auto';
        // 设置运算符值
        if (transformOperator) {
            transformOperator.value = '−';
        }
    });

    //倍乘按钮
    elements.buttonMul.addEventListener('click', function () {
        setActiveSymbol('×', elements.buttonMul);
        // 显示系数输入框
        elements.transformCoefficient.style.visibility = 'visible';
        elements.transformCoefficient.style.opacity = '1';
        elements.transformCoefficient.style.pointerEvents = 'auto';

        // 使用空白占位方式隐藏参数框
        elements.transformParam.style.visibility = 'hidden';
        elements.transformParam.style.opacity = '0';
        elements.transformParam.style.pointerEvents = 'none';
        // 设置运算符值
        if (elements.transformOperator) {
            elements.transformOperator.value = '×';
        }
    });

    // 初始化执行按钮
    initTranslateButton();

    // 初始化状态
    resetButtonStyles();
}
// 为执行按钮绑定点击事件
function initTranslateButton() {
    if (elements && elements.buttonTranslate) {
        elements.buttonTranslate.addEventListener('click', executeElementaryTransformation);
    }
}

// ==================== 相关计算函数 ====================
// 执行初等变换功能
function executeElementaryTransformation() {
    try {
        // 1. 获取三个输入框的值
        const targetInput = elements.transformTarget.value.trim();
        const coefficientInput = elements.transformCoefficient.value.trim();
        const paramInput = elements.transformParam.value.trim();

        // 2. 获取当前符号
        const currentSymbol = getCurrentSymbol();

        // 校验输入
        const validationResult = validateTransformationInputs(targetInput, coefficientInput, paramInput, currentSymbol);
        if (!validationResult.isValid) {
            showError(validationResult.message);
            return false;
        }

        // 解析输入
        const { targetType, targetIndex, paramType, paramIndex, coefficient } = validationResult.parsedData;

        // 3. 根据符号执行相应的初等变换
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
            // 更新矩阵显示
            if (state.matrixData) {
                displayMatrixTable();
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

// 校验和解析输入数据
function validateTransformationInputs(targetInput, coefficientInput, paramInput, currentSymbol) {
    // 校验目标输入
    if (!targetInput) {
        return { isValid: false, message: '请输入目标行/列' };
    }

    const targetMatch = targetInput.match(/^([rc])(\d+)$/i);
    if (!targetMatch) {
        return { isValid: false, message: '目标行/列格式错误，请使用如 r1, c2 的格式' };
    }

    const targetType = targetMatch[1].toLowerCase(); // 'r' 或 'c'
    const targetIndex = parseInt(targetMatch[2]) - 1; // 转换为0-based索引

    // 校验矩阵数据
    if (!state.matrixData || !state.matrixData.elements) {
        return { isValid: false, message: '矩阵数据不存在，请先录入矩阵' };
    }

    // 校验目标索引范围
    const maxIndex = targetType === 'r' ? state.matrixData.rows - 1 : state.matrixData.cols - 1;
    if (targetIndex < 0 || targetIndex > maxIndex) {
        return { isValid: false, message: `目标${targetType === 'r' ? '行' : '列'}索引超出范围` };
    }

    //校验分母是否为零
    if (coefficientInput.includes('/0')) {
        return { isValid: false, message: '系数分母不能为0' };
    }

    let coefficient = null;
    let paramType = null;
    let paramIndex = null;

    // 根据操作类型进行不同的校验
    switch (currentSymbol) {
        case '↔':
            // 交换操作需要参数
            if (!paramInput) {
                return { isValid: false, message: '交换操作需要参数行/列' };
            }

            const paramMatch = paramInput.match(/^([rc])(\d+)$/i);
            if (!paramMatch) {
                return { isValid: false, message: '参数行/列格式错误，请使用如 r1, c2 的格式' };
            }

            paramType = paramMatch[1].toLowerCase();
            paramIndex = parseInt(paramMatch[2]) - 1;

            // 校验参数索引范围
            const paramMaxIndex = paramType === 'r' ? state.matrixData.rows - 1 : state.matrixData.cols - 1;
            if (paramIndex < 0 || paramIndex > paramMaxIndex) {
                return { isValid: false, message: `参数${paramType === 'r' ? '行' : '列'}索引超出范围` };
            }

            // 交换操作要求类型相同
            if (targetType !== paramType) {
                return { isValid: false, message: '交换操作只能在同行或同列之间进行' };
            }
            break;

        case '+':
        case '−':
            // 加减操作需要参数
            if (!paramInput) {
                return { isValid: false, message: '加减操作需要参数行/列' };
            }

            // 如果系数框没有值，则默认为1
            if (!coefficientInput || coefficientInput.trim() === '') {
                coefficient = 1;
            } else {
                // 校验系数（不能包含未知数）
                if (/[a-zA-Zλ]/.test(coefficientInput)) {
                    return { isValid: false, message: '系数不能包含未知数' };
                }

                // 将系数转为最简分数
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

            // 校验参数索引范围
            const addParamMaxIndex = paramType === 'r' ? state.matrixData.rows - 1 : state.matrixData.cols - 1;
            if (paramIndex < 0 || paramIndex > addParamMaxIndex) {
                return { isValid: false, message: `参数${paramType === 'r' ? '行' : '列'}索引超出范围` };
            }

            // 加减操作要求类型相同
            if (targetType !== paramType) {
                return { isValid: false, message: '加减操作只能在同行或同列之间进行' };
            }
            break;

        case '×':
            // 倍乘操作需要系数
            if (!coefficientInput) {
                return { isValid: false, message: '倍乘操作需要系数' };
            }

            // 校验系数（不能包含未知数）
            if (/[a-zA-Zλ]/.test(coefficientInput)) {
                return { isValid: false, message: '系数不能包含未知数' };
            }

            // 将系数转为最简分数
            try {
                coefficient = parseAndSimplifyCoefficient(coefficientInput);
            } catch (error) {
                return { isValid: false, message: `系数格式错误: ${error.message}` };
            }

            // 检查系数是否为1（无效变换）
            if (coefficient === '1/1' || coefficient === '1') {
                return { isValid: false, message: '倍乘系数为1，无效变换' }

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

// 解析并化简系数（处理小数和分数）
function parseAndSimplifyCoefficient(mathInput) {
    try {
        // 核心：math.fraction()自动识别整数/小数/分数字符串/数字，自动化简
        const fraction = math.fraction(mathInput);

        // 格式化输出：分母为1时返回整数，否则返回分数
        return math.format(fraction, { fraction: 'ratio' });
    } catch (error) {
        throw new Error('系数格式不支持');
    }
}

// 解析并简化多项式表达式
function parseAndSimplifyPolynomial(expression) {
    try {
        // 使用math.js解析表达式
        const parsed = math.parse(expression);

        // 简化表达式
        const simplified = math.simplify(parsed);

        // 转换为字符串
        let result = simplified.toString();

        // 替换math.js的lambda符号为希腊字母λ
        result = result.replace(/lambda/g, 'λ');
        result = result.replace(/Lambda/g, 'Λ');

        // 移除不必要的括号
        result = result.replace(/\(([a-zA-Zλ]+)\)/g, '$1');
        result = result.replace(/\((\d+)\)/g, '$1');

        return result;
    } catch (error) {
        // 如果解析失败，返回原始表达式
        console.error('多项式解析错误:', error);
        return expression;
    }
}

// 验证表达式中的变量是否都在允许的列表中
function validatePolynomialVariables(expression) {
    // 提取所有变量
    const variables = expression.match(/[a-zA-Zλ]/g) || [];

    // 检查每个变量是否在允许列表中
    for (const variable of variables) {
        if (!allowedVariables.includes(variable)) {
            return false;
        }
    }

    return true;
}

// 执行行/列交换
function executeRowColumnSwap(targetType, targetIndex, paramType, paramIndex) {
    const matrix = state.matrixData.elements;

    if (targetType === 'r') {
        // 交换行
        const temp = matrix[targetIndex];
        matrix[targetIndex] = matrix[paramIndex];
        matrix[paramIndex] = temp;

        return {
            success: true,
            description: `交换第${targetIndex + 1}行和第${paramIndex + 1}行`
        };
    } else {
        // 交换列
        for (let i = 0; i < state.matrixData.rows; i++) {
            const temp = matrix[i][targetIndex];
            matrix[i][targetIndex] = matrix[i][paramIndex];
            matrix[i][paramIndex] = temp;
        }

        return {
            success: true,
            description: `交换第${targetIndex + 1}列和第${paramIndex + 1}列`
        };
    }
}

// 执行行/列加减
function executeRowColumnAddSubtract(targetType, targetIndex, paramType, paramIndex, coefficient, operation) {
    // 如果系数为空或未定义，默认使用1
    if (!coefficient || coefficient === '') {
        coefficient = 1;
    }

    const matrix = state.matrixData.elements;
    const isAddition = operation === '+';

    if (targetType === 'r') {
        // 行加减
        for (let j = 0; j < state.matrixData.cols; j++) {
            const targetValue = matrix[targetIndex][j];
            const paramValue = matrix[paramIndex][j];

            // 使用math.js执行多项式运算
            try {
                // 构建数学表达式
                let mathExpression;
                if (isAddition) {
                    mathExpression = `(${targetValue}) + (${coefficient})*(${paramValue})`;
                } else {
                    mathExpression = `(${targetValue}) - (${coefficient})*(${paramValue})`;
                }

                // 简化表达式
                const result = parseAndSimplifyPolynomial(mathExpression);

                // 验证结果中的变量
                if (!validatePolynomialVariables(result)) {
                    throw new Error('表达式包含不允许的变量');
                }

                matrix[targetIndex][j] = result;
            } catch (error) {
                // 如果计算失败，使用原始拼接方式
                console.error('多项式计算错误:', error);
                matrix[targetIndex][j] = isAddition ?
                    `(${targetValue})+${coefficient}*(${paramValue})` :
                    `(${targetValue})-${coefficient}*(${paramValue})`;
            }
        }

        return {
            success: true,
            description: `${isAddition ? '加' : '减'}法：第${targetIndex + 1}行 ${isAddition ? '+' : '-'} ${coefficient}×第${paramIndex + 1}行`
        };
    } else {
        // 列加减
        for (let i = 0; i < state.matrixData.rows; i++) {
            const targetValue = matrix[i][targetIndex];
            const paramValue = matrix[i][paramIndex];

            // 使用math.js执行多项式运算
            try {
                // 构建数学表达式
                let mathExpression;
                if (isAddition) {
                    mathExpression = `(${targetValue}) + (${coefficient})*(${paramValue})`;
                } else {
                    mathExpression = `(${targetValue}) - (${coefficient})*(${paramValue})`;
                }

                // 简化表达式
                const result = parseAndSimplifyPolynomial(mathExpression);

                // 验证结果中的变量
                if (!validatePolynomialVariables(result)) {
                    throw new Error('表达式包含不允许的变量');
                }

                matrix[i][targetIndex] = result;
            } catch (error) {
                // 如果计算失败，使用原始拼接方式
                console.error('多项式计算错误:', error);
                matrix[i][targetIndex] = isAddition ?
                    `(${targetValue})+${coefficient}*(${paramValue})` :
                    `(${targetValue})-${coefficient}*(${paramValue})`;
            }
        }

        return {
            success: true,
            description: `${isAddition ? '加' : '减'}法：第${targetIndex + 1}列 ${isAddition ? '+' : '-'} ${coefficient}×第${paramIndex + 1}列`
        };
    }
}

// 执行行/列倍乘
function executeRowColumnMultiply(targetType, targetIndex, coefficient) {
    const matrix = state.matrixData.elements;

    if (targetType === 'r') {
        // 行倍乘
        for (let j = 0; j < state.matrixData.cols; j++) {
            const currentValue = matrix[targetIndex][j];
            
            // 使用math.js执行倍乘运算
            try {
                // 构建数学表达式
                const mathExpression = `(${coefficient})*(${currentValue})`;
                
                // 简化表达式
                const result = parseAndSimplifyPolynomial(mathExpression);
                
                // 验证结果中的变量
                if (!validatePolynomialVariables(result)) {
                    throw new Error('表达式包含不允许的变量');
                }
                
                matrix[targetIndex][j] = result;
            } catch (error) {
                // 如果计算失败，使用原始拼接方式
                console.error('倍乘计算错误:', error);
                matrix[targetIndex][j] = `${coefficient}*(${currentValue})`;
            }
        }

        return {
            success: true,
            description: `倍乘：第${targetIndex + 1}行 × ${coefficient}`
        };
    } else {
        // 列倍乘
        for (let i = 0; i < state.matrixData.rows; i++) {
            const currentValue = matrix[i][targetIndex];
            
            // 使用math.js执行倍乘运算
            try {
                // 构建数学表达式
                const mathExpression = `(${coefficient})*(${currentValue})`;
                
                // 简化表达式
                const result = parseAndSimplifyPolynomial(mathExpression);
                
                // 验证结果中的变量
                if (!validatePolynomialVariables(result)) {
                    throw new Error('表达式包含不允许的变量');
                }
                
                matrix[i][targetIndex] = result;
            } catch (error) {
                // 如果计算失败，使用原始拼接方式
                console.error('倍乘计算错误:', error);
                matrix[i][targetIndex] = `${coefficient}*(${currentValue})`;
            }
        }

        return {
            success: true,
            description: `倍乘：第${targetIndex + 1}列 × ${coefficient}`
        };
    }
}