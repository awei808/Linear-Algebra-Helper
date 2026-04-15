/*本文件用于实现更多菜单中关于进阶变换基础的功能
如：生成伴随矩阵，计算对角线乘积，添加lamada（求特征值）
一些功能基于重置功能来实现，原理：
1.将当前矩阵数据存储，重置到初始状态
2.基于需求修改矩阵数据
3.重新创建网格，显示修改后的矩阵数据
*/

// ==================== 校验操作 ====================
/**
 * 统一验证函数：验证矩阵是否满足特定操作的条件
 * 使用switch case处理不同操作的验证逻辑
 * @param {string} operationType - 操作类型：'diagonalProduct' | 'augmentedIdentity' | 'addLamada'
 * @returns {boolean} 是否可以执行该操作
 */
function validateMatrixForOperation(operationType) {
    // 检查矩阵是否存在
    if (!state.matrixData) {
        showError('请先输入矩阵');
        return false;
    }

    // 检查是否为方阵（所有操作都需要方阵）
    if (state.matrixData.rows !== state.matrixData.cols) {
        switch (operationType) {
            case 'diagonalProduct':
                showError('当前矩阵不是方阵，无法计算对角线乘积');
                break;
            case 'augmentedIdentity':
                showError('当前矩阵不是方阵，无法计算增广矩阵');
                break;
            case 'addLamada':
                showError('当前矩阵不是方阵，无法添加lamada');
                break;
            default:
                showError('当前矩阵不是方阵，无法执行该操作');
        }
        return false;
    }

    return true;
}

//// ==================== 计算操作 ====================
/**
 * 重置到初始状态
 * 为进阶变换功能提供干净的初始环境
 * 清空窗口内容，重置样式，重置坐标显示
 * 移除行列索引事件监听器
 * 清除state中的数据，恢复默认状态
 * 清除历史记录
 */
function resetToInitialState() {
    // 1. 隐藏不需要的HTML
    if (elements.operatorButtons) {
        elements.operatorButtons.classList.add('hidden');
    }
    if (elements.result) {
        elements.result.classList.add('hidden');
    }
    // 2. 重置快速输入框
    if (elements.quickInput) {
        elements.quickInput.remove();
        elements.quickInput = null; // 清除引用
    }

    // 3. 重置windowDiv内容
    if (elements.windowDiv) {
        elements.windowDiv.innerHTML = '';
        elements.windowDiv.classList.remove('dynamic');
        elements.windowDiv.style.width = '400px';
        elements.windowDiv.style.height = '400px';
        elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
        elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';
        elements.windowDiv.style.display = 'grid';
    }

    // 4. 重新创建网格
    createGrid();

    // 5. 重置坐标显示
    if (elements.coordinatesDiv) {
        updateCoordinatesDisplay('0×0');
    }

    // 6. 最后隐藏windowDiv，确保隐藏操作不会被后续操作覆盖
    if (elements.inputMatrixDiv) {
        elements.inputMatrixDiv.classList.add('hidden');
    }

    // 7. 移除行列索引事件监听器
    unbindRowColumnIndexEvents();

    // 8. 清除state中的数据，恢复默认状态   
    state.gridInputs = [];
    state.matrixData = null;
    state.lastSelectedDimension = '0×0';
    state.currentState = CONFIG.STATES.INIT;
    state.previousStates = [];
    state.undoStack = [];
    state.redoStack = [];
    state.initialMatrixData = null;
    state.quickInputAdded = false;
    state.rowColumnIndexEventListener = null;
    state.isRowColumnIndexEventsBound = false;
    state.selectedMatrixElements = [];
    state.targetIsActive = false;
    state.paramIsActive = false;
    state.transformTarget = null;
    state.transformCoefficient = null;
    state.transformParam = null;
}

/**
 * 计算对角线乘积
 * 使用math.js处理
 */
function computeDiagonalProduct() {
    try {
        // 构建对角线乘积表达式
        let expression = '1';
        for (let i = 0; i < state.matrixData.rows; i++) {
            const element = state.matrixData.elements[i][i] || '0';
            expression += ` * (${element})`;
        }

        // 使用math.js简化
        // 本函数在transformation.js中定义
        const result = parseAndSimplifyPolynomial(expression);

        // 验证变量
        if (!validatePolynomialVariables(result)) {
            throw new Error('表达式包含不允许的变量');
        }
        //这里使用renderToString渲染和innerHTML添加显示；与elementary-transformations.js中的显示方式不同
        const value = result || '0';
        // 字符串渲染，使用数字渲染可能导致转为科学计数法
        const latexStr = String(value);
        const formulaHtml = katex.renderToString(latexStr, {
            throwOnError: false,
            errorColor: '#d32f2f'
        });
        const finalHtml = `对角线乘积计算结果：${formulaHtml} <span style="margin-left:10px;"></span>`;
        elements.result.innerHTML = finalHtml;
        elements.result.classList.remove('hidden');
        elements.result.classList.add('transform-center');
        showSuccess(`计算完成！结果显示在初等变换区域下方`);
    } catch (error) {
        console.error('计算对角线乘积时出错:', error);
        showError('计算对角线乘积失败，请检查矩阵数据');
    }
}

/**
 * 创建增广单位矩阵
 * 将当前矩阵与单位矩阵合并，形成增广矩阵
 */
function createAugmentedIdentity() {
    try {
        // 使用tempMatrix变量存储现有的矩阵数据
        const tempMatrix = JSON.parse(JSON.stringify(state.matrixData.elements));
        const rows = state.matrixData.rows;
        const cols = state.matrixData.cols;

        // 重置到初始状态
        resetToInitialState();

        // 直接在tempMatrix中添加单位矩阵部分
        for (let i = 0; i < rows; i++) {
            // 为每一行添加单位矩阵部分
            for (let j = 0; j < cols; j++) {
                if (i === j) {
                    tempMatrix[i].push('1'); // 对角线元素为1
                } else {
                    tempMatrix[i].push('0'); // 非对角线元素为0
                }
            }
        }

        // 将增广矩阵转换为与main.js相同的二维数组字符串格式
        const matrixArray = [];
        for (let i = 0; i < tempMatrix.length; i++) {
            const row = [];
            for (let j = 0; j < tempMatrix[i].length; j++) {
                row.push(tempMatrix[i][j] || '0');
            }
            matrixArray.push(`[${row.join(', ')}]`);
        }

        const matrixString = `[${matrixArray.join(', ')}]`;

        // 设置快速录入输入框的值并处理
        if (!elements.quickInput) {
            // 如果快速录入输入框不存在，先创建
            handleQuickInputClick();

            // 等待输入框创建完成
            setTimeout(() => {
                if (elements.quickInput) {
                    elements.quickInput.value = matrixString;
                    handleQuickInputMatrix();
                    showSuccess('增广矩阵创建成功！');
                }
            }, 100);
        } else {
            // 直接设置值并处理
            elements.quickInput.value = matrixString;
            handleQuickInputMatrix();
            showSuccess('增广矩阵创建成功！');
        }

    } catch (error) {
        console.error('创建增广矩阵时出错:', error);
        showError('创建增广矩阵失败，请检查矩阵数据');
    }
}

/**
 * 向对角线元素添加-lamada
 * 用于特征值计算，将原矩阵转换为A-λI形式
 */
function addLamada() {
    try {
        // 使用tempMatrix变量存储现有的矩阵数据
        const tempMatrix = JSON.parse(JSON.stringify(state.matrixData.elements));
        const rows = state.matrixData.rows;
        const cols = state.matrixData.cols;

        // 重置到初始状态
        resetToInitialState();

        // 修改对角线元素：a_ii - λ
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (i === j) {
                    // 对角线元素：原值 - λ
                    const originalValue = tempMatrix[i][j];
                    if (originalValue === '0') {
                        tempMatrix[i][j] = '-λ';
                    } else {
                        tempMatrix[i][j] = `${originalValue} - λ`;
                    }
                }
                // 非对角线元素保持不变
            }
        }

        // 将矩阵转换为与main.js相同的二维数组字符串格式
        const matrixArray = [];
        for (let i = 0; i < tempMatrix.length; i++) {
            const row = [];
            for (let j = 0; j < tempMatrix[i].length; j++) {
                row.push(tempMatrix[i][j] || '0');
            }
            matrixArray.push(`[${row.join(', ')}]`);
        }

        const matrixString = `[${matrixArray.join(', ')}]`;

        // 设置快速录入输入框的值并处理
        if (!elements.quickInput) {
            // 如果快速录入输入框不存在，先创建
            handleQuickInputClick();

            // 等待输入框创建完成
            setTimeout(() => {
                if (elements.quickInput) {
                    elements.quickInput.value = matrixString;
                    handleQuickInputMatrix();
                    showSuccess('特征值矩阵创建成功！对角线元素已添加-λ');
                }
            }, 100);
        } else {
            // 直接设置值并处理
            elements.quickInput.value = matrixString;
            handleQuickInputMatrix();
            showSuccess('特征值矩阵创建成功！对角线元素已添加-λ');
        }

    } catch (error) {
        console.error('创建特征值矩阵时出错:', error);
        showError('创建特征值矩阵失败，请检查矩阵数据');
    }
}

// ==================== 执行操作 ====================
// 执行重置操作
function performReset() {
    popupCentreManager.showConfirmPopup("此操作将完全重置网页，确定重置？", () => {
        resetToInitialState();
        showSuccess('重置完成：应用已恢复到初始状态');
    });
}

// 执行对角线乘积计算
function performDiagonalProduct() {
    const isValid = validateMatrixForOperation('diagonalProduct');
    if (!isValid) {
        return;
    }
    computeDiagonalProduct();
}

// 执行增广单位矩阵计算
function performAugmentedIdentity() {
    const isValid = validateMatrixForOperation('augmentedIdentity');
    if (!isValid) {
        return;
    }
    popupCentreManager.showConfirmPopup("此操作将完全重置矩阵，并生成用于求逆的增广矩阵，确定执行？", () => {
        createAugmentedIdentity();
    });
}


// 执行添加lamada操作
function performAddLamada() {
    const isValid = validateMatrixForOperation('addLamada');
    if (!isValid) {
        return;
    }
    popupCentreManager.showConfirmPopup("此操作将完全重置矩阵，并生成含λ的矩阵，用于特征值计算，确定执行？", () => {
        addLamada();
    });
}