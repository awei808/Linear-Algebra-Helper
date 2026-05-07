// ==================== 初等变换UI模块 ====================
// 矩阵表格展示、行列索引事件、选择器管理、预览矩阵
import { format, parse, simplify } from 'mathjs';
const math = { format, parse, simplify };
import { render } from 'katex';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { showSuccess } from '../ui/popup.js';

/**
 * 禁用所有输入框交互
 */
export function disableInputInteraction() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    inputs.forEach(input => {
        input.disabled = true;
        input.style.backgroundColor = '#f0f0f0';
        input.style.cursor = 'not-allowed';
        console.log('禁用成功');
    });
}

/**
 * 解除行列索引事件绑定
 */
export function unbindRowColumnIndexEvents() {
    if (state.rowColumnIndexEventListener) {
        elements.windowDiv.removeEventListener('pointerup', state.rowColumnIndexEventListener);
        state.rowColumnIndexEventListener = null;
        state.isRowColumnIndexEventsBound = false;
        console.log('行列索引事件监听器已移除');
    }
}

/**
 * 调整布局以适应初等变换状态
 * 显示操作按钮组，更新坐标显示
 */
export function reorganizeLayoutForElementaryTransformation() {
    const operatorButtons = document.querySelectorAll('.operator-buttons');

    operatorButtons.forEach(buttonGroup => {
        buttonGroup.classList.remove('hidden');
    });

    const coordinates = document.getElementById('coordinates');
    if (coordinates && state.matrixData) {
        coordinates.textContent = `矩阵维度: ${state.matrixData.rows}×${state.matrixData.cols}`;
    }
}

/**
 * 渲染矩阵表格（纯渲染，无事件绑定，无状态修改）
 * 使用KaTeX渲染每个单元格的数学表达式
 * @param {Object} matrixData - { rows, cols, elements }
 * @returns {HTMLTableElement} 完整的表格元素（含行列标签）
 */
export function renderMatrixTable(matrixData) {
    const { rows, cols, elements: matrixElements } = matrixData;

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0px auto';

    // 渲染数据行
    for (let row = 0; row < rows; row++) {
        const tr = document.createElement('tr');

        for (let col = 0; col < cols; col++) {
            const td = document.createElement('td');
            let value = matrixElements[row][col] || '0';

            // 科学计数法 → fixed格式
            value = value.replace(/\b\d+\.?\d*[eE][+-]?\d+\b/g, match => {
                return math.format(Number(match), { notation: 'fixed' });
            });

            const latexStr = String(value);
            render(latexStr, td, {
                displayMode: true,
                throwOnError: false,
                errorColor: '#d32f2f'
            });

            td.dataset.row = row;
            td.dataset.col = col;
            td.dataset.type = 'matrix-cell';

            tr.appendChild(td);
        }

        // 行标签（r1, r2, ...）
        const rowIndexTd = document.createElement('td');
        rowIndexTd.className = 'row-label';
        rowIndexTd.textContent = `r${row + 1}`;
        tr.appendChild(rowIndexTd);
        table.appendChild(tr);
    }

    // 列标签行（c1, c2, ...）
    const colTr = document.createElement('tr');

    for (let col = 0; col < cols; col++) {
        const colTd = document.createElement('td');
        colTd.className = 'col-label';
        colTd.textContent = `c${col + 1}`;
        colTr.appendChild(colTd);
    }

    const emptyTd = document.createElement('td');
    colTr.appendChild(emptyTd);

    table.appendChild(colTr);

    return table;
}

/**
 * 创建矩阵展示表格并替换windowDiv内容
 * 绑定单元格点击事件用于元素选中，完成后触发预览更新
 */
export function createMatrixDisplayTable() {
    const table = renderMatrixTable(state.matrixData);

    // 绑定单元格点击事件（矩阵元素选中）
    table.addEventListener('pointerup', (event) => {
        const target = event.target;

        if (target.dataset.type === 'matrix-cell') {
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);
            handleMatrixElementClick(row, col, target);
        }
    });

    elements.windowDiv.innerHTML = '';
    elements.windowDiv.appendChild(table);

    state.selectedMatrixElements = [];

    // 延迟调整尺寸（等待KaTeX渲染完成）
    setTimeout(() => {
        const windowWidth = table.offsetWidth;
        const windowHeight = table.offsetHeight;
        elements.windowDiv.style.width = `${windowWidth}px`;
        elements.windowDiv.style.height = `${windowHeight}px`;
        elements.windowDiv.style.gridTemplateColumns = 'none';
        elements.windowDiv.style.gridTemplateRows = 'none';
        elements.inputMatrixDiv.classList.remove('hidden');
        console.log('createMatrixDisplayTable 完成表格显示');
    }, 0);

    // 同步更新预览矩阵
    updatePreviewMatrix();
}

/**
 * 绑定行列索引事件
 * 点击行列标签（r1, c2等）时更新目标行/列或参数行/列
 */
export function bindRowColumnIndexEvents() {
    if (state.isRowColumnIndexEventsBound && state.rowColumnIndexEventListener) {
        return;
    }

    if (state.rowColumnIndexEventListener) {
        elements.windowDiv.removeEventListener('pointerup', state.rowColumnIndexEventListener);
        state.rowColumnIndexEventListener = null;
    }

    const eventListener = function (e) {
        const target = e.target;
        if (target.id.startsWith('add_r') || target.id.startsWith('add_c') ||
            target.className.includes('row-label') || target.className.includes('col-label')) {
            const fullValue = target.textContent;

            // 根据当前激活的是目标还是参数来更新对应字段
            if (state.targetIsActive) {
                state.transformTarget = fullValue;
                showSuccess(`目标行/列已更新：${fullValue}`);
            } else {
                state.transformParam = fullValue;
                showSuccess(`参数行/列已更新：${fullValue}`);
            }
        }
        updateTransformationUIDisplay();
        updatePreviewMatrix();
    };

    elements.windowDiv.addEventListener('pointerup', eventListener);
    state.rowColumnIndexEventListener = eventListener;
    state.isRowColumnIndexEventsBound = true;
}

/**
 * 向目标行/列和参数行/列下拉选择器添加选项
 * 根据矩阵维度动态生成 r1..rn, c1..cn
 * @param {number} rows - 矩阵行数
 * @param {number} cols - 矩阵列数
 */
export function addRowColumnIndexOptions(rows, cols) {
    const targetSelect = elements.transformTarget;
    const paramSelect = elements.transformParam;

    if (!targetSelect || !paramSelect) {
        console.error('未找到目标行/列或参数行/列的选择器元素');
        return;
    }

    // 清除旧选项（保留第一个"无"选项）
    while (targetSelect.options.length > 1) {
        targetSelect.remove(1);
    }
    while (paramSelect.options.length > 1) {
        paramSelect.remove(1);
    }

    // 添加行选项
    for (let i = 0; i < rows; i++) {
        const rowValue = `r${i + 1}`;

        const targetOption = new Option(rowValue, rowValue);
        targetSelect.add(targetOption);

        const paramOption = new Option(rowValue, rowValue);
        paramSelect.add(paramOption);
    }

    // 添加列选项
    for (let i = 0; i < cols; i++) {
        const colValue = `c${i + 1}`;

        const targetOption = new Option(colValue, colValue);
        targetSelect.add(targetOption);

        const paramOption = new Option(colValue, colValue);
        paramSelect.add(paramOption);
    }

    console.log(`已添加 ${rows} 个行选项和 ${cols} 个列选项到选择器中`);
}

/**
 * 处理下拉选择器的值变更
 * @param {string} selectorType - 'target' 或 'param'
 * @param {string} value - 选中的值
 */
export function handleSelectorChange(selectorType, value) {
    if (selectorType !== 'target' && selectorType !== 'param') {
        console.error('无效的选择器类型:', selectorType);
        return;
    }

    if (selectorType === 'target') {
        state.transformTarget = value;
        showSuccess(`目标行/列已更新：${value}`);
    } else if (selectorType === 'param') {
        state.transformParam = value;
        showSuccess(`参数行/列已更新：${value}`);
    }

    updateTransformationUIDisplay();
    updatePreviewMatrix();
}

/**
 * 同步下拉选择器显示值与state中的值
 */
export function updateTransformationUIDisplay() {
    const transformTarget = elements.transformTarget;
    const transformParam = elements.transformParam;

    if (transformTarget && state.transformTarget && transformTarget.value !== state.transformTarget) {
        transformTarget.value = state.transformTarget;
    }

    if (transformParam && state.transformParam && transformParam.value !== state.transformParam) {
        transformParam.value = state.transformParam;
    }
}

/**
 * 显示初等变换UI
 * 创建表格、绑定事件、填充选择器、设置预览
 */
export function showElementaryTransformationUI() {
    state.transformTarget = null;
    state.transformParam = null;

    const elementaryTransformationDiv = document.querySelector('.operator-buttons');
    if (elementaryTransformationDiv) {
        elementaryTransformationDiv.classList.remove('hidden');

        elementaryTransformationDiv.style.alignItems = 'center';
        elementaryTransformationDiv.style.width = '100%';
        elementaryTransformationDiv.style.maxWidth = '1000px';
        elementaryTransformationDiv.style.margin = '0 auto';
    }

    createMatrixDisplayTable();

    bindRowColumnIndexEvents();

    if (state.matrixData && state.matrixData.rows && state.matrixData.cols) {
        addRowColumnIndexOptions(state.matrixData.rows, state.matrixData.cols);
    }

    reorganizeLayoutForElementaryTransformation();

    setupPreviewListeners();
    updatePreviewMatrix();
}

/**
 * 处理矩阵元素点击事件（选中/取消选中）
 * @param {number} row - 行索引（0-based）
 * @param {number} col - 列索引（0-based）
 * @param {HTMLElement} element - 被点击的td元素
 */
export function handleMatrixElementClick(row, col, element) {
    if (state.currentState !== 'elementary_transformation') {
        return;
    }
    const cols = state.matrixData.cols;
    const elementIndex = row * cols + col + 1; // 元素编号从1开始

    const isAlreadySelected = state.selectedMatrixElements.includes(elementIndex);

    if (isAlreadySelected) {
        // 取消选中
        state.selectedMatrixElements = state.selectedMatrixElements.filter(index =>
            index !== elementIndex
        );
        element.classList.remove('selected-matrix-element');
    } else {
        // 选中
        state.selectedMatrixElements.push(elementIndex);
        element.classList.add('selected-matrix-element');
    }

    console.log('选中元素索引:', state.selectedMatrixElements);
}

// ==================== 预览矩阵相关 ====================

/**
 * 从DOM读取当前选中的运算符
 * 通过查找activeButton类名来判断
 * @returns {string} 运算符字符（↔、+、−、×），或空字符串
 */
function getCurrentOperator() {
    const activeBtn = document.querySelector('#arithmetic-symbols button.activeButton');
    if (!activeBtn) return '';
    const text = activeBtn.textContent.trim();
    if (text === '−') return '−';
    return text;
}

/**
 * 检查初等变换提示信息是否齐全
 * 根据运算符类型判断所需参数是否都已填写
 * @returns {{complete: boolean, hintText: string}}
 */
export function isTransformationInfoComplete() {
    const operator = getCurrentOperator();
    const target = state.transformTarget;

    if (!operator || !target) {
        return { complete: false, hintText: '' };
    }

    const targetMatch = target.match(/^([rc])(\d+)$/i);
    if (!targetMatch) {
        return { complete: false, hintText: '' };
    }

    const coefficientInput = elements.transformCoefficient;
    const coefficient = coefficientInput ? coefficientInput.value.trim() : '';

    switch (operator) {
        case '↔': {
            // 交换操作需要目标 + 参数
            const param = state.transformParam;
            if (!param) return { complete: false, hintText: '' };
            const paramMatch = param.match(/^([rc])(\d+)$/i);
            if (!paramMatch) return { complete: false, hintText: '' };
            return { complete: true, hintText: `${target} ↔ ${param}` };
        }
        case '+':
        case '−': {
            // 加减操作需要目标 + 参数；系数默认为1
            const param = state.transformParam;
            if (!param) return { complete: false, hintText: '' };
            const paramMatch = param.match(/^([rc])(\d+)$/i);
            if (!paramMatch) return { complete: false, hintText: '' };
            const coeffDisplay = coefficient || '1';
            return { complete: true, hintText: `${target} ${operator} ${coeffDisplay}×${param}` };
        }
        case '×': {
            // 倍乘操作需要目标 + 系数
            if (!coefficient) return { complete: false, hintText: '' };
            return { complete: true, hintText: `${target} × ${coefficient}` };
        }
        default:
            return { complete: false, hintText: '' };
    }
}

/**
 * 在副本矩阵上应用变换（不修改原始state）
 * 使用mathjs parse/simplify进行多项式计算
 */
function applyTransformationToMatrix(matrix, rows, cols, targetType, targetIndex, paramType, paramIndex, coefficient, operator) {
    switch (operator) {
        case '↔':
            if (targetType === 'r') {
                const temp = matrix[targetIndex];
                matrix[targetIndex] = matrix[paramIndex];
                matrix[paramIndex] = temp;
            } else {
                for (let i = 0; i < rows; i++) {
                    const temp = matrix[i][targetIndex];
                    matrix[i][targetIndex] = matrix[i][paramIndex];
                    matrix[i][paramIndex] = temp;
                }
            }
            break;

        case '+':
        case '−': {
            const isAdd = operator === '+';
            const coeff = coefficient || '1';
            if (targetType === 'r') {
                for (let j = 0; j < cols; j++) {
                    try {
                        const expr = isAdd
                            ? `(${matrix[targetIndex][j]}) + (${coeff})*(${matrix[paramIndex][j]})`
                            : `(${matrix[targetIndex][j]}) - (${coeff})*(${matrix[paramIndex][j]})`;
                        const result = math.simplify(math.parse(expr)).toString()
                            .replace(/lambda/g, 'λ')
                            .replace(/\(([a-zA-Zλ]+)\)/g, '$1')
                            .replace(/\((\d+)\)/g, '$1');
                        matrix[targetIndex][j] = result;
                    } catch (e) {
                        matrix[targetIndex][j] = isAdd
                            ? `(${matrix[targetIndex][j]})+${coeff}*(${matrix[paramIndex][j]})`
                            : `(${matrix[targetIndex][j]})-${coeff}*(${matrix[paramIndex][j]})`;
                    }
                }
            } else {
                for (let i = 0; i < rows; i++) {
                    try {
                        const expr = isAdd
                            ? `(${matrix[i][targetIndex]}) + (${coeff})*(${matrix[i][paramIndex]})`
                            : `(${matrix[i][targetIndex]}) - (${coeff})*(${matrix[i][paramIndex]})`;
                        const result = math.simplify(math.parse(expr)).toString()
                            .replace(/lambda/g, 'λ')
                            .replace(/\(([a-zA-Zλ]+)\)/g, '$1')
                            .replace(/\((\d+)\)/g, '$1');
                        matrix[i][targetIndex] = result;
                    } catch (e) {
                        matrix[i][targetIndex] = isAdd
                            ? `(${matrix[i][targetIndex]})+${coeff}*(${matrix[i][paramIndex]})`
                            : `(${matrix[i][targetIndex]})-${coeff}*(${matrix[i][paramIndex]})`;
                    }
                }
            }
            break;
        }

        case '×':
            if (targetType === 'r') {
                for (let j = 0; j < cols; j++) {
                    try {
                        const expr = `(${coefficient})*(${matrix[targetIndex][j]})`;
                        const result = math.simplify(math.parse(expr)).toString()
                            .replace(/lambda/g, 'λ')
                            .replace(/\(([a-zA-Zλ]+)\)/g, '$1')
                            .replace(/\((\d+)\)/g, '$1');
                        matrix[targetIndex][j] = result;
                    } catch (e) {
                        matrix[targetIndex][j] = `${coefficient}*(${matrix[targetIndex][j]})`;
                    }
                }
            } else {
                for (let i = 0; i < rows; i++) {
                    try {
                        const expr = `(${coefficient})*(${matrix[i][targetIndex]})`;
                        const result = math.simplify(math.parse(expr)).toString()
                            .replace(/lambda/g, 'λ')
                            .replace(/\(([a-zA-Zλ]+)\)/g, '$1')
                            .replace(/\((\d+)\)/g, '$1');
                        matrix[i][targetIndex] = result;
                    } catch (e) {
                        matrix[i][targetIndex] = `${coefficient}*(${matrix[i][targetIndex]})`;
                    }
                }
            }
            break;
    }
}

/**
 * 计算预览结果矩阵
 * 深拷贝当前矩阵 → 应用变换 → 返回结果（不修改state）
 * @returns {Object|null} { rows, cols, elements } 或 null
 */
function computePreviewResult() {
    const operator = getCurrentOperator();
    const target = state.transformTarget;

    if (!operator || !target || !state.matrixData) return null;

    const targetMatch = target.match(/^([rc])(\d+)$/i);
    if (!targetMatch) return null;

    const targetType = targetMatch[1].toLowerCase();
    const targetIndex = parseInt(targetMatch[2]) - 1;
    const { rows, cols } = state.matrixData;

    let paramType = null;
    let paramIndex = null;
    let coefficient = null;

    // 根据运算符解析所需参数
    switch (operator) {
        case '↔': {
            const param = state.transformParam;
            if (!param) return null;
            const paramMatch = param.match(/^([rc])(\d+)$/i);
            if (!paramMatch) return null;
            paramType = paramMatch[1].toLowerCase();
            paramIndex = parseInt(paramMatch[2]) - 1;
            if (targetType !== paramType) return null;
            break;
        }
        case '+':
        case '−': {
            const param = state.transformParam;
            if (!param) return null;
            const paramMatch = param.match(/^([rc])(\d+)$/i);
            if (!paramMatch) return null;
            paramType = paramMatch[1].toLowerCase();
            paramIndex = parseInt(paramMatch[2]) - 1;
            if (targetType !== paramType) return null;
            coefficient = elements.transformCoefficient.value.trim() || '1';
            break;
        }
        case '×': {
            coefficient = elements.transformCoefficient.value.trim();
            if (!coefficient) return null;
            break;
        }
        default:
            return null;
    }

    // 深拷贝矩阵元素，在副本上执行变换
    const matrix = JSON.parse(JSON.stringify(state.matrixData.elements));
    applyTransformationToMatrix(matrix, rows, cols, targetType, targetIndex, paramType, paramIndex, coefficient, operator);

    return { rows, cols, elements: matrix };
}

/**
 * 更新预览矩阵区域
 * 桌面端 + 初等变换状态下显示；参数齐全时计算并显示预览；不全时显示灰色遮罩
 */
export function updatePreviewMatrix() {
    if (!elements.matrixPreviewRow) return;

    // 非桌面端或非初等变换状态：隐藏预览
    if (state.isMobile || state.currentState !== 'elementary_transformation') {
        elements.previewArrowSection.style.display = 'none';
        elements.previewTableWrapper.style.display = 'none';
        return;
    }

    elements.previewArrowSection.style.display = 'flex';
    elements.previewTableWrapper.style.display = 'block';

    const infoResult = isTransformationInfoComplete();

    // 更新变换提示文本
    if (elements.previewHintText) {
        elements.previewHintText.textContent = infoResult.hintText;
    }

    if (infoResult.complete) {
        // 信息齐全：计算并显示预览结果
        const previewData = computePreviewResult();
        if (previewData && elements.previewTable) {
            elements.previewTable.innerHTML = '';
            const previewTable = renderMatrixTable(previewData);
            elements.previewTable.appendChild(previewTable);
        }
        if (elements.previewMask) {
            elements.previewMask.classList.add('hide-mask');
        }
    } else {
        // 信息不全：渲染当前矩阵供遮罩覆盖（确保遮罩有正确的尺寸）
        if (elements.previewTable && state.matrixData) {
            elements.previewTable.innerHTML = '';
            const dimTable = renderMatrixTable(state.matrixData);
            elements.previewTable.appendChild(dimTable);
        }
        if (elements.previewMask) {
            elements.previewMask.classList.remove('hide-mask');
        }
    }
}

let previewListenersSetup = false;

/**
 * 设置预览相关的监听器
 * 系数输入框变化 → 更新预览；运算符变化事件 → 更新预览
 */
function setupPreviewListeners() {
    if (!elements.transformCoefficient || previewListenersSetup) return;

    elements.transformCoefficient.addEventListener('input', updatePreviewMatrix);
    document.addEventListener('transformOperatorChanged', updatePreviewMatrix);
    previewListenersSetup = true;
}

/**
 * 通知运算符已变更（通过自定义事件，避免循环导入）
 */
export function notifyOperatorChanged() {
    document.dispatchEvent(new CustomEvent('transformOperatorChanged'));
}
