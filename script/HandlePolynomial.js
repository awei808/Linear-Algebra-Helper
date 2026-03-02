// ==================== 多项式处理功能 ====================

/**
 * 初始化多项式处理功能
 */
function initPolynomialHandlers() {
    elements.ButtonForceSimplify.addEventListener('click', handleForceSimplify);
    elements.ButtonForceFactorize.addEventListener('click', handleForceFactorize);
}

/**
 * 强制化简计算
 */
function handleForceSimplify() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要化简的矩阵元素');
        return;
    }
    
    let hasChanges = false;
    
    state.selectedMatrixElements.forEach(({row, col}) => {
        const originalValue = state.matrixData.elements[row][col];
        
        try {
            const simplified = math.simplify(originalValue);
            const simplifiedStr = math.format(simplified, {fraction: 'ratio'});
            
            if (simplifiedStr !== originalValue) {
                state.matrixData.elements[row][col] = simplifiedStr;
                hasChanges = true;
            }
        } catch (error) {
            console.error(`化简失败 (${row},${col}):`, error);
        }
    });
    
    if (hasChanges) {
        showSuccess('强制化简完成');
        addRowColumnIndices();
    } else {
        showInfo('所选元素无需化简或化简后无变化');
    }
}

/**
 * 强制因式分解
 */
function handleForceFactorize() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要因式分解的矩阵元素');
        return;
    }
    
    let hasChanges = false;
    
    state.selectedMatrixElements.forEach(({row, col}) => {
        const originalValue = state.matrixData.elements[row][col];
        
        try {
            const factored = math.simplify(originalValue, math.simplify.rules.filter(rule => 
                rule.name === 'factor' || rule.name === 'factorAny'
            ));
            
            const factoredStr = math.format(factored, {fraction: 'ratio'});
            
            if (factoredStr !== originalValue) {
                state.matrixData.elements[row][col] = factoredStr;
                hasChanges = true;
            }
        } catch (error) {
            console.error(`因式分解失败 (${row},${col}):`, error);
        }
    });
    
    if (hasChanges) {
        showSuccess('强制因式分解完成');
        addRowColumnIndices();
    } else {
        showInfo('所选元素无法因式分解或分解后无变化');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保其他组件已加载
    setTimeout(initPolynomialHandlers, 100);
});
