
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
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要因式分解的矩阵元素');
        return;
    }
    const elementCount = state.selectedMatrixElements;
    const confirmText = `确定对${elementCount}号矩阵元素进行因式分解吗？`;
    popupCentreManager.showConfirmPopup(
        confirmText,
        handleFactorize,
        null
    );
}

/**
 * 确认替换矩阵元素
 * 显示确认弹窗，确认后执行替换
 */
function confirmReplaceElement() {
    if (state.selectedMatrixElements.length === 0) {
        showWarning('请先选择要替换的矩阵元素');
        return;
    }
    if (state.selectedMatrixElements.length !== 1) {
        showWarning('只能替换一个矩阵元素');
        return;
    }

    const elementCount = state.selectedMatrixElements;
    const confirmText = `将${elementCount}号矩阵元素替换为：`;
    popupCentreManager.showConfirmPopup(
        confirmText,
        handleReplaceElement,
        null,
        'input'
    );
}

/**
 * 当替换值与原值展开后不同，调用该函数进行确认
 */
function confirmReplaceElementDifferent(newValue) {
    const elementCount = state.selectedMatrixElements;
    const cols = state.matrixData.cols;
    const index = state.selectedMatrixElements[0];
    const row = Math.floor((index - 1) / cols);
    const col = (index - 1) % cols;
    const originalValue = state.matrixData.elements[row][col];
    
    // 计算化简后的值
    let simplifiedNewValue = newValue;
    let simplifiedOriginalValue = originalValue;
    
    try {
        simplifiedNewValue = math.simplify(newValue).toString();
    } catch (error) {
        simplifiedNewValue = newValue;
    }
    
    try {
        simplifiedOriginalValue = math.simplify(originalValue).toString();
    } catch (error) {
        simplifiedOriginalValue = originalValue;
    }
    
    const confirmText = `替换值与原值的化简结果不同：` +
                       `替换值: ${newValue}` +
                       `化简后: ${simplifiedNewValue}` +
                       `原值: ${originalValue}` +
                       `化简后: ${simplifiedOriginalValue}` +
                       `再次输入以确认替换：`;
    
    popupCentreManager.showConfirmPopup(
        confirmText,
        inputValue => replaceElement(inputValue),
        null,
        'input'
    );
}


/**
 * 将多项式表达式展开为最简形式
 */
function handleExpand() {
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

/**
 * 处理替换矩阵元素的入口函数
 */
function handleReplaceElement(inputValue) {
    if (!inputValue) {
        showWarning('请输入替换值');
        return;
    }

    // 预处理和验证输入值是否有效
    const validationResult = validateAndFormatMatrixValue(inputValue);
    console.log(validationResult);
    if (!validationResult.success) {
        showError(`输入值无效: ${validationResult.error}`);
        return;
    }

    // state.selectedMatrixElements只会含有一个索引
    const index = state.selectedMatrixElements[0];
    const cols = state.matrixData.cols;
    const row = Math.floor((index - 1) / cols);
    const col = (index - 1) % cols;

    const originalValue = state.matrixData.elements[row][col];
    console.log(`尝试替换: ${originalValue} -> ${validationResult.formattedValue}`);
    try {
        // 快速路径：字符串完全相同
        if (validationResult.formattedValue === originalValue) {
            replaceElement(validationResult.formattedValue, row, col);
            return;
        }

        // 第一层：math.simplify 规范化后做字符串比较
        const simplifiedNew = math.simplify(validationResult.formattedValue).toString();
        const simplifiedOld = math.simplify(originalValue).toString();

        if (simplifiedNew === simplifiedOld) {
            replaceElement(validationResult.formattedValue, row, col);
            return;
        }

        // 第二层：math.rationalize 展开幂等操作后再比较（simplify 不展开幂）
        const rationalNew = math.rationalize(validationResult.formattedValue).toString();
        const rationalOld = math.rationalize(originalValue).toString();

        if (rationalNew === rationalOld) {
            replaceElement(validationResult.formattedValue, row, col);
        } else {
            confirmReplaceElementDifferent(validationResult.formattedValue);
        }

    } catch (error) {
        console.warn('数学等价性比较失败，进入二次确认:', error);
        confirmReplaceElementDifferent(validationResult.formattedValue);
    }
}

/**
 * 替换矩阵元素
 */
function replaceElement(inputValue, row = -1, col = -1) {
    if (row == -1 || col == -1) {
        const index = state.selectedMatrixElements[0];
        const cols = state.matrixData.cols;
        row = Math.floor((index - 1) / cols);
        col = (index - 1) % cols;
    }

    state.matrixData.elements[row][col] = inputValue;
    createMatrixDisplayTable();

    // 清除选中状态
    clearSelectedMatrixElements();
    showSuccess(`替换成功`);
    console.log(`替换成功: ${inputValue}`);
}