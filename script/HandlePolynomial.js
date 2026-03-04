
/**
 * 确认强制展开多项式
 * 显示确认弹窗，确认后执行强制展开
 */
function confirmForceExpand() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要展开的矩阵元素');
        return;
    }
    
    const elementCount = state.selectedMatrixElements.length;
    const confirmText = `确定对${elementCount}个元素进行强制展开多项式吗？`;

    popupCentreManager.showConfirmPopup(
        confirmText,
        handleForceExpand,
        null
    );
}

/**
 * 确认强制因式分解
 * 显示确认弹窗，确认后执行强制因式分解
 */
function confirmForceFactorize() {
    const elementCount = state.selectedMatrixElements;
    const confirmText = `确定对${elementCount}号矩阵元素进行强制因式分解吗？`;

    popupCentreManager.showConfirmPopup(
        confirmText,
        handleForceFactorize,
        null
    );
}

/**
 * 强制展开多项式
 * 将多项式表达式展开为最简形式
 */
function handleForceExpand() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要展开的矩阵元素');
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
            // 使用math.expand展开多项式
            const expanded = math.expand(originalValue);
            const expandedStr = math.format(expanded, { fraction: 'ratio' });

            if (expandedStr !== originalValue) {
                state.matrixData.elements[row][col] = expandedStr;
                hasChanges = true;
            }
        } catch (error) {
            console.warn(`展开失败: ${originalValue}`, error);
        }
    });

    if (hasChanges) {
        showSuccess('强制展开完成');
        createMatrixDisplayTable();
    } else {
        showWarning('所选元素无需展开或展开后无变化');
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
        showWarning('所选元素无法因式分解或分解后无变化');
    }
}