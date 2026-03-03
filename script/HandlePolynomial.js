// ==================== 多项式处理功能 ====================



/**
 * 强制化简计算
 */
function handleForceSimplify() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要化简的矩阵元素');
        return;
    }

    let hasChanges = false;

    const cols = state.matrixData.cols;

    state.selectedMatrixElements.forEach(index => {
        // 从索引计算行列坐标：index = row * cols + col + 1
        // 所以：row = Math.floor((index - 1) / cols), col = (index - 1) % cols
        const row = Math.floor((index - 1) / cols);
        const col = (index - 1) % cols;

        const originalValue = state.matrixData.elements[row][col];

        try {
            const simplified = math.simplify(originalValue);
            const simplifiedStr = math.format(simplified, { fraction: 'ratio' });

            if (simplifiedStr !== originalValue) {
                state.matrixData.elements[row][col] = simplifiedStr;
                hasChanges = true;
            }
        } catch (error) {
            console.warn(`化简失败: ${originalValue}`, error);
        }
    });

    if (hasChanges) {
        showSuccess('强制化简完成');
        createMatrixDisplayTable();
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

    const cols = state.matrixData.cols;

    state.selectedMatrixElements.forEach(index => {
        // 从索引计算行列坐标：index = row * cols + col + 1
        // 所以：row = Math.floor((index - 1) / cols), col = (index - 1) % cols
        const row = Math.floor((index - 1) / cols);
        const col = (index - 1) % cols;

        const originalValue = state.matrixData.elements[row][col];

        try {
            const factored = math.simplify(originalValue, math.simplify.rules.filter(rule =>
                rule.name === 'factor' || rule.name === 'factorAny'
            ));

            const factoredStr = math.format(factored, { fraction: 'ratio' });

            if (factoredStr !== originalValue) {
                state.matrixData.elements[row][col] = factoredStr;
                hasChanges = true;
            }
        } catch (error) {
            console.warn(`因式分解失败: ${originalValue}`, error);
        }
    });

    if (hasChanges) {
        showSuccess('强制因式分解完成');
        createMatrixDisplayTable();
    } else {
        showInfo('所选元素无法因式分解或分解后无变化');
    }
}