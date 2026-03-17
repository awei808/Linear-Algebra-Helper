
/**
 * 确认展开多项式
 * 显示确认弹窗，确认后执行展开
 */
function confirmForceExpand() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要展开的矩阵元素');
        return;
    }

    const elementCount = state.selectedMatrixElements;
    const confirmText = `确定对${elementCount}号矩阵元素进行展开多项式吗？`;

    popupCentreManager.showConfirmPopup(
        confirmText,
        handleExpand,
        null
    );
}

/**
 * 确认因式分解
 * 显示确认弹窗，确认后执行因式分解
 */
function confirmForceFactorize() {
    const elementCount = state.selectedMatrixElements;
    const confirmText = `确定对${elementCount}号矩阵元素进行因式分解吗？`;

    popupCentreManager.showConfirmPopup(
        confirmText,
        handleFactorize,
        null
    );
}



/**
 * 展开多项式
 * 将多项式表达式展开为最简形式
 */
function handleExpand() {
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
            // 使用math.rationalize展开多项式
            const expanded = math.rationalize(originalValue);
            const expandedStr = math.format(expanded, { fraction: 'ratio' });

            console.log(`多项式展开: ${originalValue} -> ${expandedStr}`);

            if (expandedStr !== originalValue) {
                state.matrixData.elements[row][col] = expandedStr;
                hasChanges = true;
            }
        } catch (error) {
            console.warn(`展开失败: ${originalValue}`, error);
        }
    });

    if (hasChanges) {
        showSuccess('展开完成');
        createMatrixDisplayTable();
    } else {
        showWarning(`无需展开或展开后无变化`);
    }
}

/**
 * 一元多项式因式分解
 */
function handleFactorize() {
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
            //使用第三方库nerdamer进行因式分解，然后使用math.simplify进行格式化
            const factoredStr = math.simplify(nerdamer('factor(' + originalValue + ')').toString()).toString();
            if (factoredStr !== originalValue) {
                state.matrixData.elements[row][col] = factoredStr;
                hasChanges = true;
            }
            console.log(`多项式因式分解: ${originalValue} -> ${factoredStr}`);
        } catch (error) {
            console.warn(`因式分解失败: ${originalValue}`, error);
        }
    });

    if (hasChanges) {
        showSuccess('因式分解完成');
        createMatrixDisplayTable();
    } else {
        showWarning(`无法因式分解或分解后无变化`);
    }
}