//构建多项式展开规则，并与默认规则合并
const expand = [
  { l: 'n1*(n2+n3)', r: 'n1*n2 + n1*n3' },
  { l: '(n1+n2)*n3', r: 'n1*n3 + n2*n3' },
  { l: '(n1+n2)^2', r: '(n1+n2)*(n1+n2)' },
  { l: '(n1+n2)^3', r: '(n1+n2)*(n1+n2)*(n1+n2)' },
  { l: '(n1-n2)^2', r: '(n1-n2)*(n1-n2)' },
  { l: '(n1-n2)^3', r: '(n1-n2)*(n1-n2)*(n1-n2)' },
];
const expandRules = expand.concat(math.simplify.rules);

try {
            // 使用math.simplify展开多项式
             const expanded = math.simplify(originalValue, expandRules,{},{consoleDebug: true});
            const expandedStr = math.format(expanded, { fraction: 'ratio' });

            console.log(`多项式展开: ${originalValue} -> ${expandedStr}`);

            if (expandedStr !== originalValue) {
                state.matrixData.elements[row][col] = expandedStr;
                hasChanges = true;
            }
        } catch (error) {
            console.warn(`展开失败: ${originalValue}`, error);
        }


/**
 * 显示矩阵表格（使用与createMatrixDisplayTable相同的格式）
 * 弃用，因为其功能已被createMatrixDisplayTable替代
 */
function displayMatrixTable() {
    if (!state.matrixData) return;

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
            // 直接显示矩阵值
            const cellValue = matrixElements[row][col] || '0';
            td.textContent = cellValue;

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
    })

    // 替换原来的输入框布局
    elements.windowDiv.innerHTML = '';
    elements.windowDiv.appendChild(table);

    // 清除之前的选中状态
    state.selectedMatrixElements = [];

    // 计算并调整windowDiv大小以适应表格
    setTimeout(() => {
        const windowWidth = table.offsetWidth;
        const windowHeight = table.offsetHeight;
        elements.windowDiv.style.width = `${windowWidth}px`;
        elements.windowDiv.style.height = `${windowHeight}px`;
        elements.windowDiv.style.gridTemplateColumns = 'none';
        elements.windowDiv.style.gridTemplateRows = 'none';
        elements.windowDiv.style.overflow = 'visible';
        elements.windowDiv.style.display = 'block';
        elements.inputMatrixDiv.style.display = 'block';
    }, 0);
    console.log('表格显示成功');
}