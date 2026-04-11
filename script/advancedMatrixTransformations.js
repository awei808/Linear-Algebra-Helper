/*本文件用于实现更多菜单中关于进阶变换基础的功能
如：生成伴随矩阵，计算对角线乘积，添加lamada（求特征值）
一些功能基于重置功能来实现，原理：
1.将当前矩阵数据存储，重置到初始状态
2.基于需求修改矩阵数据
3.重新创建网格，显示修改后的矩阵数据
*/

/**
 * 重置到初始状态
 * 为进阶变换功能提供干净的初始环境
 * 1.清空窗口内容，重置样式，重置坐标显示
 * 2.移除行列索引事件监听器
 * 3.清除state中的数据，恢复默认状态
 * 4.清除历史记录
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

function performReset() {
    popupCentreManager.showConfirmPopup("此操作将完全重置网页，确定重置？", () => {
        resetToInitialState();
        showSuccess('重置完成：应用已恢复到初始状态');
    });
    
}

/**
 * 计算对角线乘积
 * 使用math.js处理，支持包含未知数的表达式
 */
function computeDiagonalProduct() {
    if (!state.matrixData) {
        showError('请先输入矩阵');
        return;
    }
    if (state.matrixData.rows !== state.matrixData.cols) {
        showError('当前矩阵不是方阵，无法计算');
        return;
    }

    try {
        // 构建对角线乘积表达式
        let expression = '1';
        for (let i = 0; i < state.matrixData.rows; i++) {
            const element = state.matrixData.elements[i][i] || '0';
            expression += ` * (${element})`;
        }

        // 使用math.js解析和简化数学表达式
        // 本函数在transformation.js中定义
        const result = parseAndSimplifyPolynomial(expression);

        // 验证变量
        if (!validatePolynomialVariables(result)) {
            throw new Error('表达式包含不允许的变量');
        }
        const parsedExpr = math.parse(result || '0');
        const latexStr = math.format(parsedExpr, { format: 'latex' });
        katex.render(latexStr, elements.result, {
            displayMode: true, // 块级渲染（公式居中，更美观）
            throwOnError: false, // 容错处理
            errorColor: '#d32f2f'
        });
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
        // 1. 检查矩阵数据是否存在
        if (!state.matrixData) {
            showError('请先输入矩阵');
            return;
        }
        if (state.matrixData.rows !== state.matrixData.cols) {
            showError('当前矩阵不是方阵，无法计算增广矩阵');
            return;
        }
        
        // 2. 使用tempMatrix变量存储现有的矩阵数据
        const tempMatrix = JSON.parse(JSON.stringify(state.matrixData.elements));
        const rows = state.matrixData.rows;
        const cols = state.matrixData.cols;
        
        // 3. 重置到初始状态
        resetToInitialState();
        
        // 4. 直接在tempMatrix中添加单位矩阵部分
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
        
        // 5. 将增广矩阵转换为与main.js相同的二维数组字符串格式
        const matrixArray = [];
        for (let i = 0; i < tempMatrix.length; i++) {
            const row = [];
            for (let j = 0; j < tempMatrix[i].length; j++) {
                row.push(tempMatrix[i][j] || '0');
            }
            matrixArray.push(`[${row.join(', ')}]`);
        }
        
        const matrixString = `[${matrixArray.join(', ')}]`;
        
        // 6. 设置快速录入输入框的值并处理
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

function performAugmentedIdentity() {
    popupCentreManager.showConfirmPopup("此操作将完全重置矩阵，并生成用于求逆的增广矩阵，确定执行？", () => {
        createAugmentedIdentity();
    });
    
}