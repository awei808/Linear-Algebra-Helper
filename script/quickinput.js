// ==================== 快速录入功能 ====================
// 全局变量，用于跟踪快速录入输入框是否已添加
let quickInputAdded = false;

/**
 * 初始化快速录入功能
 */
function initQuickInput() {
    // 为快速录入按钮绑定点击事件
    if (elements.buttonQuickInput) {
        elements.buttonQuickInput.addEventListener('click', handleQuickInputClick);
    }
}

/**
 * 处理快速录入按钮点击事件
 */
function handleQuickInputClick() {
    

    // 如果输入框已经存在，则不再添加
    if (quickInputAdded) {
        return;
    }

    // 创建输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'input';
    input.placeholder = '请输入二维数组';
    input.style.marginLeft = '10px';
    input.style.marginRight = '10px';  // 添加右边距
    input.style.padding = '8px 12px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.width = '200px';

    // 添加到header中
    elements.header.appendChild(input);
    quickInputAdded = true;
    
    // 必须更新elements对象中的引用，确保所有DOM访问都通过elements
    if (typeof elements !== 'undefined') {
        elements.quickInput = input;
        console.log('快速录入输入框已添加到elements对象');
    } else {
        console.error('elements对象未定义，无法更新DOM引用');
    }

    // 将"录入矩阵"按钮移动到header的最后面
    if (elements.buttonInputMatrix) {
        elements.header.appendChild(elements.buttonInputMatrix);
    }

}

/**
 * 处理快速录入矩阵功能（由main.js调用）
 */
function handleQuickInputMatrix() {
    // 严格通过elements对象访问，不直接获取DOM元素
    if (!elements || !elements.quickInput) {
        showError('快速录入输入框不存在，请先点击"快速录入"按钮创建输入框');
        return false;
    }

    const inputValue = elements.quickInput.value.trim();
    if (inputValue === '') {
        showError('请输入二维数组');
        return false;
    }

    // 检验并解析二维数组
    const validationResult = validateAndParseMatrix(inputValue);
    if (!validationResult.isValid) {
        showError(validationResult.message);
        return false;
    }

    // 存储矩阵数据到state
    state.matrixData = {
        rows: validationResult.rows,
        cols: validationResult.cols,
        elements: validationResult.elements
    };

    // 设置状态为初等变换
    state.currentState = CONFIG.STATES.ELEMENTARY_TRANSFORMATION;

    // 显示表格（使用与addRowColumnIndices相同的格式）
    displayMatrixTable();

    // 更新UI状态
    updateUIForCurrentState();

    // 显示成功消息
    showSuccess(`矩阵录入成功！维度: ${validationResult.rows}×${validationResult.cols}`);
    return true;
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

        // 步骤2: 将小数转为分数（在整个字符串层面处理）
        let processedInput = cleanedInput;
        
        // 匹配并转换所有小数格式
        const decimalPattern = /-?\d+\.\d+/g;
        const decimalMatches = cleanedInput.match(decimalPattern);
        
        if (decimalMatches) {
            for (const decimal of decimalMatches) {
                try {
                    const decimalValue = parseFloat(decimal);
                    const fraction = math.fraction(decimalValue);
                    let fractionString;
                    
                    if (fraction.d === 1) {
                        fractionString = fraction.n.toString();
                    } else {
                        fractionString = math.format(fraction, { fraction: 'ratio' });
                    }
                    
                    // 替换原字符串中的小数
                    processedInput = processedInput.replace(decimal, fractionString);
                } catch (error) {
                    // 如果转换失败，保持原样
                    console.warn(`小数转换失败: ${decimal}`, error);
                }
            }
        }

        // 步骤3: 对字母进行校验，检验是否是未知数
        const allowedVariables = ['a', 'b', 'c', 'd', 'm', 'n', 'x', 'y', 'z', 'λ'];
        const variablePattern = new RegExp(`[^${allowedVariables.join('')}a-zA-Z]`, 'g');
        const allLetters = processedInput.match(/[a-zA-Zλ]/g) || [];
        const invalidLetters = [...new Set(allLetters)].filter(letter => 
            !allowedVariables.includes(letter.toLowerCase())
        );
        
        if (invalidLetters.length > 0) {
            return {
                isValid: false,
                message: `发现不允许的未知数: ${invalidLetters.join(', ')}。允许的未知数: ${allowedVariables.join(', ')}`
            };
        }

        // 步骤4: 将整个输入框传来的值切割，按矩阵元素遍历解析
        // 手动解析二维数组格式
        const matrixData = parseMatrixManually(processedInput);
        if (!matrixData.isValid) {
            return matrixData;
        }

        const { rows, cols, elements: rawElements } = matrixData;

        // 步骤5: 检查是否为多项式，采用多项式相关代码进行校验，并添加分数化简功能
        const elements = [];
        for (let i = 0; i < rows; i++) {
            elements[i] = [];
            for (let j = 0; j < cols; j++) {
                let element = rawElements[i][j].trim();
                
                if (element === '') {
                    elements[i][j] = '0';
                    continue;
                }

                // 使用现有的多项式校验逻辑
                const validationResult = isValidMatrixElement(element);
                if (!validationResult.isValid) {
                    return {
                        isValid: false,
                        message: `第${i + 1}行第${j + 1}列的值"${element}"不是有效矩阵元素。${validationResult.message}`
                    };
                }

                // 新增：分数化简功能
                // 检查是否为纯数字分数（如4/8）或包含未知数的分数（如2x/4y）
                const fractionPattern = /^-?(\d+[a-dm-nxyzλ]*)\/(-?\d+[a-dm-nxyzλ]*)$/;
                const fractionMatch = element.match(fractionPattern);
                
                if (fractionMatch) {
                    try {
                        const numerator = fractionMatch[1];   // 分子
                        const denominator = fractionMatch[2]; // 分母
                        
                        // 检查是否为纯数字分数（分子和分母都是数字）
                        const numeratorIsNumber = /^-?\d+$/.test(numerator);
                        const denominatorIsNumber = /^-?\d+$/.test(denominator);
                        
                        if (numeratorIsNumber && denominatorIsNumber) {
                            // 纯数字分数：使用math.js进行化简
                            const fraction = math.fraction(element);
                            
                            if (fraction.d === 1) {
                                // 分母为1，转换为整数
                                element = fraction.n.toString();
                            } else {
                                // 化简分数
                                element = math.format(fraction, { fraction: 'ratio' });
                            }
                        } else {
                            // 包含未知数的分数：进行简单的数字部分化简
                            // 提取分子和分母中的数字部分
                            const numNumerator = numerator.match(/-?\d+/)?.[0] || '1';
                            const numDenominator = denominator.match(/-?\d+/)?.[0] || '1';
                            
                            // 计算最大公约数
                            const gcd = math.gcd(parseInt(numNumerator), parseInt(numDenominator));
                            
                            if (gcd > 1) {
                                // 化简数字部分
                                const simplifiedNum = parseInt(numNumerator) / gcd;
                                const simplifiedDen = parseInt(numDenominator) / gcd;
                                
                                // 重新构建分数
                                const simplifiedNumerator = numerator.replace(numNumerator, simplifiedNum.toString());
                                const simplifiedDenominator = denominator.replace(numDenominator, simplifiedDen.toString());
                                
                                element = `${simplifiedNumerator}/${simplifiedDenominator}`;
                            }
                        }
                    } catch (error) {
                        // 如果化简失败，保持原样
                        console.warn(`分数化简失败: ${element}`, error);
                    }
                }

                elements[i][j] = element;
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

    // 允许的未知数字符
    const allowedVariables = ['a', 'b', 'c', 'd', 'm', 'n', 'x', 'y', 'z', 'λ'];

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
        const variablePattern = new RegExp(`[${allowedVariables.join('')}]`, 'g');
        
        const numeratorVariables = numerator.match(variablePattern) || [];
        const denominatorVariables = denominator.match(variablePattern) || [];
        
        const allVariables = [...numeratorVariables, ...denominatorVariables];
        const invalidVariables = allVariables.filter(v => !allowedVariables.includes(v));
        
        if (invalidVariables.length > 0) {
            return {
                isValid: false,
                message: `未知数"${invalidVariables[0]}"不在允许范围内（允许的未知数：${allowedVariables.join(', ')}）`
            };
        }
        
        return { isValid: true, message: '' };
    }

    // 3. 单个未知数（只能是允许的字符）
    if (allowedVariables.includes(str)) {
        return { isValid: true, message: '' };
    }

    // 4. 带系数的未知数（如2x, -3y, 0.5λ）
    const coefficientVariablePattern = /^(-?\d+(\.\d+)?)([a-dm-nxyzλ])$/;
    const coefficientMatch = str.match(coefficientVariablePattern);
    if (coefficientMatch) {
        const variable = coefficientMatch[3];
        if (allowedVariables.includes(variable)) {
            return { isValid: true, message: '' };
        }
    }

    // 5. 多项式（如2x+3y, x-y, 3a+2b-λ, 2+3x, -y+2λ, 1/z+7, x/2+3y, 2x+3/y）
    // 先检查是否包含允许的未知数
    const variablePattern = new RegExp(`[${allowedVariables.join('')}]`, 'g');
    const variablesInStr = str.match(variablePattern);

    if (variablesInStr) {
        // 检查所有未知数是否都是允许的
        const invalidVariables = variablesInStr.filter(v => !allowedVariables.includes(v));
        if (invalidVariables.length > 0) {
            return {
                isValid: false,
                message: `未知数"${invalidVariables[0]}"不在允许范围内（允许的未知数：${allowedVariables.join(', ')}）`
            };
        }

        // 扩展的多项式格式验证：支持纯数字项、带系数未知数项、单个未知数项、分数项
        // 格式示例：2x+3y, x-y, 3a+2b-λ, 2+3x, -y+2λ, 0.5x-1.2y+3z+4, 1/z+7, x/2+3y, 2x+3/y
        const extendedPolynomialPattern = /^([+-]?(\d+(\.\d+)?)?([a-dm-nxyzλ])?(\/(\d+([a-dm-nxyzλ])?)?)?)([+-](\d+(\.\d+)?)?([a-dm-nxyzλ])?(\/(\d+([a-dm-nxyzλ])?)?)?)*$/;
        
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
            
            // 检查每一项的格式（支持分数项）
            const termPattern = /^[+-]?((\d+(\.\d+)?)?([a-dm-nxyzλ])?(\/(\d+([a-dm-nxyzλ])?)?)?)$/;
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
        message: `格式错误。支持：数字、分数、未知数（${allowedVariables.join(', ')}）、多项式`
    };
}

/**
 * 显示矩阵表格（使用与addRowColumnIndices相同的格式）
 */
function displayMatrixTable() {
    if (!state.matrixData) return;

    const { rows, cols, elements: matrixElements } = state.matrixData;

    // 创建表格容器
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0px auto';

    // 创建数据行（行索引放在行末尾）
    for (let row = 0; row < rows; row++) {
        const tr = document.createElement('tr');

        // 添加数据单元格（先添加数据，再添加行索引）
        for (let col = 0; col < cols; col++) {
            const td = document.createElement('td');
            // 直接显示矩阵值
            const cellValue = matrixElements[row][col] || '0';
            td.textContent = cellValue;

            // 添加样式类，保持与原输入框相似的外观
            td.className = 'grid-cell-value';
            td.style.border = '1px solid #ccc';
            td.style.padding = '8px 12px';
            td.style.textAlign = 'center';
            td.style.backgroundColor = '#f9f9f9';

            tr.appendChild(td);
        }

        // 添加行索引按钮（放在行末尾）
        const rowIndexTd = document.createElement('td');
        rowIndexTd.className = 'row-label';
        const rowButton = document.createElement('button');
        rowButton.textContent = `r${row + 1}`;
        rowButton.id = `button_add_r${row + 1}`;
        rowIndexTd.appendChild(rowButton);
        tr.appendChild(rowIndexTd);
        table.appendChild(tr);
    }

    // 创建列索引行（放在表格下方）
    const colTr = document.createElement('tr');

    // 添加列索引按钮（直接与数据列对齐）
    for (let col = 0; col < cols; col++) {
        const colTd = document.createElement('td');
        colTd.className = 'col-label';
        const colButton = document.createElement('button');
        colButton.textContent = `c${col + 1}`;
        colButton.id = `button_add_c${col + 1}`;
        colTd.appendChild(colButton);
        colTr.appendChild(colTd);
    }

    // 添加空单元格（对应行索引列的位置）
    const emptyTd = document.createElement('td');
    colTr.appendChild(emptyTd);

    table.appendChild(colTr);

    // 替换原来的输入框布局
    elements.windowDiv.innerHTML = '';
    elements.windowDiv.appendChild(table);

    // 计算并调整windowDiv大小以适应表格
    setTimeout(() => {
        const windowWidth = table.offsetWidth;
        const windowHeight = table.offsetHeight;
        elements.windowDiv.style.width = `${windowWidth}px`;
        elements.windowDiv.style.height = `${windowHeight}px`;
        elements.windowDiv.style.gridTemplateColumns = 'none';
        elements.windowDiv.style.gridTemplateRows = 'none';
        elements.windowDiv.style.overflow = 'visible';
        elements.windowDiv.style.display = 'block';
        elements.inputMatrixDiv.style.display = 'block';
    }, 0);
    console.log('表格显示成功');
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    initQuickInput();
});