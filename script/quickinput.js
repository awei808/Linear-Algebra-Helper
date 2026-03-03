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

    // 显示表格（使用与createMatrixDisplayTable相同的格式）
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
                const formatResult = enhancedFormatMatrixValue(element, true);
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
 * 显示矩阵表格（使用与createMatrixDisplayTable相同的格式）
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

            // 添加数据属性，用于事件委托
            td.dataset.row = row;
            td.dataset.col = col;
            td.dataset.type = 'matrix-cell';

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

    // 为表格添加事件委托（事件冒泡）
    table.addEventListener('click', function (event) {
        const target = event.target;

        // 检查是否点击了矩阵单元格
        if (target.dataset.type === 'matrix-cell') {
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);

            // 调用已存在的矩阵元素点击处理函数
            if (typeof handleMatrixElementClick === 'function') {
                handleMatrixElementClick(row, col, target);
            }
        }
    })

    // 替换原来的输入框布局
    elements.windowDiv.innerHTML = '';
    elements.windowDiv.appendChild(table);

    // 清除之前的选中状态
    state.selectedMatrixElements = [];

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