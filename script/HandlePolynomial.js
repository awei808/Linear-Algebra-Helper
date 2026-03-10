
/**
 * 确认强制展开多项式
 * 显示确认弹窗，确认后执行强制展开
 */
function confirmForceExpand() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要展开的矩阵元素');
        return;
    }

    const elementCount = state.selectedMatrixElements;
    const confirmText = `确定对${elementCount}号矩阵元素进行强制展开多项式吗？`;

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

const factorRules = [
    // simplifyCore 基础规则
    { l: 'n+0', r: 'n' },
    { l: 'n^0', r: '1' },
    { l: '0*n', r: '0' },
    { l: 'n/n', r: '1' },
    { l: 'n^1', r: 'n' },
    { l: '+n1', r: 'n1' },
    { l: 'n--n1', r: 'n+n1' },
    
    // 1. 平方差公式: n1² - n2² = (n1 - n2)(n1 + n2)
    { l: 'n1^2 - n2^2', r: '(n1 - n2) * (n1 + n2)' },
    // 2. 完全平方和公式: n1² + 2n1n2 + n2² = (n1 + n2)²
    { l: 'n1^2 + 2*n1*n2 + n2^2', r: '(n1 + n2)^2' },
    // 3. 完全平方差公式: n1² - 2n1n2 + n2² = (n1 - n2)²
    { l: 'n1^2 - 2*n1*n2 + n2^2', r: '(n1 - n2)^2' },
    // 4. 立方和公式: n1³ + n2³ = (n1 + n2)(n1² - n1n2 + n2²)
    { l: 'n1^3 + n2^3', r: '(n1 + n2) * (n1^2 - n1*n2 + n2^2)' },
    // 5. 立方差公式: n1³ - n2³ = (n1 - n2)(n1² + n1n2 + n2²)
    { l: 'n1^3 - n2^3', r: '(n1 - n2) * (n1^2 + n1*n2 + n2^2)' },
    // 6. 通用提取公因式（加法）: cl*n1 + cl*n2 = cl*(n1 + n2)
    { l: 'cl*n1 + cl*n2', r: 'cl * (n1 + n2)' },
    // 7. 通用提取公因式（减法）: cl*n1 - cl*n2 = cl*(n1 - n2)
    { l: 'cl*n1 - cl*n2', r: 'cl * (n1 - n2)' },
    // 8. 四次方平方差: n1^4 - n2^4 = (n1^2 - n2^2)(n1^2 + n2^2)
    { l: 'n1^4 - n2^4', r: '(n1^2 - n2^2) * (n1^2 + n2^2)' },
];


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
        showSuccess('强制展开完成');
        createMatrixDisplayTable();
    } else {
        showWarning(`无需展开或展开后无变化`);
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
            const factored = math.simplify(originalValue, factorRules);
            const factoredStr = math.format(factored, { fraction: 'ratio' });

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
        showSuccess('强制因式分解完成');
        createMatrixDisplayTable();
    } else {
        showWarning(`无法因式分解或分解后无变化`);
    }
}