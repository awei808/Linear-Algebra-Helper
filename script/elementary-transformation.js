/*
本文件存储初等变换状态的相关函数，包括函数执行完成后进入初等变换状态的函数
*/

// ==================== 底层工具函数 ====================
/**
 * 禁用输入框交互
 */
function disableInputInteraction() {
    // 禁用所有输入框
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    inputs.forEach(input => {
        input.disabled = true;
        input.style.backgroundColor = '#f0f0f0';
        input.style.cursor = 'not-allowed';
        console.log('禁用成功');
    });
}

/**
 * 移除行列索引事件监听器
 */
function unbindRowColumnIndexEvents() {
    if (state.rowColumnIndexEventListener) {
        elements.windowDiv.removeEventListener('click', state.rowColumnIndexEventListener);
        state.rowColumnIndexEventListener = null;
        state.isRowColumnIndexEventsBound = false; // 标记为未绑定
        console.log('行列索引事件监听器已移除');
    }
}

// ==================== 中层操作函数 ====================
/**
* 重新组织布局以适应初等变换状态
*/
function reorganizeLayoutForElementaryTransformation() {
    // 获取所有需要操作的元素
    const operatorButtons = document.querySelectorAll('.operator-buttons');

    // 确保初等变换按钮组可见
    operatorButtons.forEach(buttonGroup => {
        buttonGroup.classList.remove('hidden');
    });

    // 确保坐标显示正确更新（但不改变其位置）
    const coordinates = document.getElementById('coordinates');
    if (coordinates && state.matrixData) {
        coordinates.textContent = `矩阵维度: ${state.matrixData.rows}×${state.matrixData.cols}`;
    }
}

/**
 * 创建完整的矩阵显示表格
 * 功能包括：
 * 1. 创建表格结构显示矩阵数据
 * 2. 添加行列索引按钮（r1, r2, c1, c2,...）
 * 3. 实现事件委托处理矩阵单元格点击
 * 4. 调整窗口大小以适应表格布局
 * 5. 替换原有的输入框布局为表格显示
 */
function createMatrixDisplayTable() {
    // 修改：将解构的elements重命名为matrixElements，避免与全局elements对象冲突
    const { rows, cols, elements: matrixElements } = state.matrixData;

    // 创建表格容器
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0px auto';

    // 创建数据行（行索引放在行末尾）
    for (let row = 0; row < rows; row++) {
        const tr = document.createElement('tr');

        // 添加数据单元格（先添加数据，再添加行索引）
        for (let col = 0; col < cols; col++) {
            const td = document.createElement('td');
            //使用mathjs解析，输出latex格式，使用katex渲染
            const parsedExpr = math.parse(matrixElements[row][col] || '0');
            const latexStr = math.format(parsedExpr, { format: 'latex' });
            katex.render(latexStr, td, {
                displayMode: true, // 块级渲染（公式居中，更美观）
                throwOnError: false, // 容错处理
                errorColor: '#d32f2f'
            }
            );

            // 添加数据属性，用于事件委托
            td.dataset.row = row;
            td.dataset.col = col;
            td.dataset.type = 'matrix-cell';

            tr.appendChild(td);
        }

        // 添加行索引按钮（放在行末尾）
        const rowIndexTd = document.createElement('td');
        rowIndexTd.className = 'row-label';
        const rowButton = document.createElement('button');
        rowButton.textContent = `r${row + 1}`;
        rowButton.id = `button_add_r${row + 1}`;
        rowIndexTd.appendChild(rowButton);
        tr.appendChild(rowIndexTd);
        table.appendChild(tr);
    }

    // 创建列索引行（放在表格下方）
    const colTr = document.createElement('tr');

    // 添加列索引按钮（直接与数据列对齐）
    for (let col = 0; col < cols; col++) {
        const colTd = document.createElement('td');
        colTd.className = 'col-label';
        const colButton = document.createElement('button');
        colButton.textContent = `c${col + 1}`;
        colButton.id = `button_add_c${col + 1}`;
        colTd.appendChild(colButton);
        colTr.appendChild(colTd);
    }

    // 添加空单元格（对应行索引列的位置）
    const emptyTd = document.createElement('td');
    colTr.appendChild(emptyTd);

    table.appendChild(colTr);

    // 为表格添加事件委托（事件冒泡）
    table.addEventListener('click', function (event) {
        const target = event.target;

        // 检查是否点击了矩阵单元格
        if (target.dataset.type === 'matrix-cell') {
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);

            // 调用已存在的矩阵元素点击处理函数
            if (typeof handleMatrixElementClick === 'function') {
                handleMatrixElementClick(row, col, target);
            }
        }
    });

    // 替换原来的输入框布局
    elements.windowDiv.innerHTML = '';
    elements.windowDiv.appendChild(table);

    // 清除之前的选中状态
    state.selectedMatrixElements = [];

    // 计算并调整windowDiv大小以适应表格
    // 使用setTimeout确保表格已添加到DOM中并完成渲染
    setTimeout(() => {
        // 获取表格的实际宽度和高度
        const windowWidth = table.offsetWidth;
        const windowHeight = table.offsetHeight;
        // 调整windowDiv的大小
        elements.windowDiv.style.width = `${windowWidth}px`;
        elements.windowDiv.style.height = `${windowHeight}px`;
        // 重置grid布局，因为我们不再使用它
        elements.windowDiv.style.gridTemplateColumns = 'none';
        elements.windowDiv.style.gridTemplateRows = 'none';
        // 确保windowDiv能正确显示表格
        elements.windowDiv.style.overflow = 'visible';
        elements.windowDiv.style.display = 'block';
        elements.inputMatrixDiv.style.display = 'block';
        console.log('表格显示成功');
    }, 0);
}

/**
 * 为行列索引按钮绑定事件（事件冒泡方式）
 */
function bindRowColumnIndexEvents() {
    // 在最外层添加条件判断：若事件监听器已绑定，则直接返回
    if (state.isRowColumnIndexEventsBound && state.rowColumnIndexEventListener) {
        console.log('行列索引事件监听器已绑定，跳过重复绑定');
        return;
    }

    // 先移除已存在的事件监听器（安全措施）
    if (state.rowColumnIndexEventListener) {
        elements.windowDiv.removeEventListener('click', state.rowColumnIndexEventListener);
        state.rowColumnIndexEventListener = null;
    }

    // 为windowDiv添加点击事件监听器，处理行列索引按钮点击
    const eventListener = function (e) {
        const target = e.target;
        // 判断是否点击了行/列标识按钮（ID以button_add_r或button_add_c开头）
        if (target.id.startsWith('button_add_r') || target.id.startsWith('button_add_c')) {
            const type = target.id.includes('r') ? 'r' : 'c';
            const num = target.textContent.replace(type, ''); // 提取数字（如"r1"→"1"）

            // 获取目标输入框和参数输入框
            const transformTarget = document.getElementById('transform-target');
            const transformParam = document.getElementById('transform-param');

            if (transformTarget && transformParam) {
                if (transformTarget.value.trim() === '') {
                    // 如果目标框为空，将点击的行列索引添加到目标框
                    transformTarget.value += type + num;
                } else {
                    // 如果目标框不为空，将点击的行列索引添加到参数框
                    const currentParam = transformParam.value.trim();
                    const rowColRegex = /[rc]\d+/g;
                    const hasRowCol = rowColRegex.test(currentParam);

                    if (hasRowCol) {
                        // 如果已经包含行列索引，则替换最后一个行列索引
                        const lastRowColMatch = currentParam.match(rowColRegex);
                        if (lastRowColMatch && lastRowColMatch.length > 0) {
                            const lastRowCol = lastRowColMatch[lastRowColMatch.length - 1];
                            const lastIndex = currentParam.lastIndexOf(lastRowCol);
                            transformParam.value = currentParam.substring(0, lastIndex) + type + num + currentParam.substring(lastIndex + lastRowCol.length);
                        } else {
                            transformParam.value += type + num;
                        }
                    } else {
                        // 如果没有行列索引，直接添加
                        transformParam.value += type + num;
                    }
                }
            }
        }
    };

    // 绑定事件监听器并保存引用
    elements.windowDiv.addEventListener('click', eventListener);
    state.rowColumnIndexEventListener = eventListener;
    state.isRowColumnIndexEventsBound = true; // 标记为已绑定
}

// ==================== 高级流程函数 ====================
/**
 * 显示初等变换UI
 */
function showElementaryTransformationUI() {
    // 移除hidden类，显示初等变换界面
    const elementaryTransformationDiv = document.querySelector('.operator-buttons');
    if (elementaryTransformationDiv) {
        elementaryTransformationDiv.classList.remove('hidden');

        // 确保初等变换界面也继承body的居中样式
        elementaryTransformationDiv.style.alignItems = 'center';
        elementaryTransformationDiv.style.width = '100%';
        elementaryTransformationDiv.style.maxWidth = '1000px';
        elementaryTransformationDiv.style.margin = '0 auto';
    }

    // 为输入框添加行列索引按钮
    createMatrixDisplayTable();

    // 为行列索引按钮添加事件冒泡绑定（现在有双重保护）
    bindRowColumnIndexEvents();

    // 重新组织布局，避免元素重叠
    reorganizeLayoutForElementaryTransformation();
}
