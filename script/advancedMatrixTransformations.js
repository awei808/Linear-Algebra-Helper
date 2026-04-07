/*本文件用于实现更多菜单中关于进阶变换基础的功能
如：生成伴随矩阵，计算对角线乘积，添加lamada（求特征值）
所有功能基于重置功能来实现，原理：
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
    if (elements.quickInput) {
        elements.quickInput.remove();
        elements.quickInput = null; // 清除引用
    }

    // 2. 重置windowDiv内容
    if (elements.windowDiv) {
        elements.windowDiv.innerHTML = '';
        elements.windowDiv.classList.remove('dynamic');
        elements.windowDiv.style.width = '400px';
        elements.windowDiv.style.height = '400px';
        elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
        elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';
        elements.windowDiv.style.display = 'grid';
    }

    // 3. 重新创建网格
    createGrid();

    // 4. 重置坐标显示
    if (elements.coordinatesDiv) {
        updateCoordinatesDisplay('0×0');
    }

    // 5. 最后隐藏windowDiv，确保隐藏操作不会被后续操作覆盖
    if (elements.inputMatrixDiv) {
        elements.inputMatrixDiv.classList.add('hidden');
    }

    // 5. 移除行列索引事件监听器
    unbindRowColumnIndexEvents();

    // 6. 清除state中的数据，恢复默认状态
    state.gridInputs = [];
    state.matrixData = null;
    state.lastSelectedDimension = '0×0';
    state.currentState = CONFIG.STATES.INIT;
    state.previousStates = [];
    state.undoStack = [];
    state.redoStack = [];
    state.initialMatrixData = null;
    state.quickInputAdded = false;

    showSuccess('进阶变换重置完成：应用已恢复到初始状态');
}