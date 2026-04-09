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
    // 1. 隐藏初等变换部分的HTML
    if (elements.operatorButtons) {
        elements.operatorButtons.classList.add('hidden');
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

    showSuccess('重置完成：应用已恢复到初始状态');
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
    
    // 初始化乘积为1（使用math.js的常量）
    let product = math.parse('1');
    
    // 遍历对角线元素，使用math.js进行乘法运算
    for (let i = 0; i < state.matrixData.rows; i++) {
        const element = state.matrixData.elements[i][i] || '0';
        const elementExpr = math.parse(element);
        product = math.multiply(product, elementExpr);
    }
    
    // 简化表达式
    const simplifiedProduct = math.simplify(product);
    
    // 转换为字符串显示
    const productStr = math.format(simplifiedProduct, { format: 'latex' });
    
    showSuccess(`对角线乘积为：${productStr}`);
}