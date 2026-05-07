import { format, parse, simplify } from 'mathjs';
const math = { format, parse, simplify };
import { render } from 'katex';
import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { showSuccess } from '../ui/popup.js';

export function disableInputInteraction() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    inputs.forEach(input => {
        input.disabled = true;
        input.style.backgroundColor = '#f0f0f0';
        input.style.cursor = 'not-allowed';
        console.log('禁用成功');
    });
}

export function unbindRowColumnIndexEvents() {
    if (state.rowColumnIndexEventListener) {
        elements.windowDiv.removeEventListener('pointerup', state.rowColumnIndexEventListener);
        state.rowColumnIndexEventListener = null;
        state.isRowColumnIndexEventsBound = false;
        console.log('行列索引事件监听器已移除');
    }
}

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

export function renderMatrixTable(matrixData) {
    const { rows, cols, elements: matrixElements } = matrixData;

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0px auto';

    for (let row = 0; row < rows; row++) {
        const tr = document.createElement('tr');

        for (let col = 0; col < cols; col++) {
            const td = document.createElement('td');
            let value = matrixElements[row][col] || '0';

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

        const rowIndexTd = document.createElement('td');
        rowIndexTd.className = 'row-label';
        rowIndexTd.textContent = `r${row + 1}`;
        tr.appendChild(rowIndexTd);
        table.appendChild(tr);
    }

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

export function createMatrixDisplayTable() {
    const table = renderMatrixTable(state.matrixData);

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

    updatePreviewMatrix();
}

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

export function addRowColumnIndexOptions(rows, cols) {
    const targetSelect = elements.transformTarget;
    const paramSelect = elements.transformParam;

    if (!targetSelect || !paramSelect) {
        console.error('未找到目标行/列或参数行/列的选择器元素');
        return;
    }

    while (targetSelect.options.length > 1) {
        targetSelect.remove(1);
    }
    while (paramSelect.options.length > 1) {
        paramSelect.remove(1);
    }

    for (let i = 0; i < rows; i++) {
        const rowValue = `r${i + 1}`;

        const targetOption = new Option(rowValue, rowValue);
        targetSelect.add(targetOption);

        const paramOption = new Option(rowValue, rowValue);
        paramSelect.add(paramOption);
    }

    for (let i = 0; i < cols; i++) {
        const colValue = `c${i + 1}`;

        const targetOption = new Option(colValue, colValue);
        targetSelect.add(targetOption);

        const paramOption = new Option(colValue, colValue);
        paramSelect.add(paramOption);
    }

    console.log(`已添加 ${rows} 个行选项和 ${cols} 个列选项到选择器中`);
}

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

export function handleMatrixElementClick(row, col, element) {
    if (state.currentState !== 'elementary_transformation') {
        return;
    }
    const cols = state.matrixData.cols;
    const elementIndex = row * cols + col + 1;

    const isAlreadySelected = state.selectedMatrixElements.includes(elementIndex);

    if (isAlreadySelected) {
        state.selectedMatrixElements = state.selectedMatrixElements.filter(index =>
            index !== elementIndex
        );
        element.classList.remove('selected-matrix-element');
    } else {
        state.selectedMatrixElements.push(elementIndex);
        element.classList.add('selected-matrix-element');
    }

    console.log('选中元素索引:', state.selectedMatrixElements);
}

function getCurrentOperator() {
    const activeBtn = document.querySelector('#arithmetic-symbols button.activeButton');
    if (!activeBtn) return '';
    const text = activeBtn.textContent.trim();
    if (text === '−') return '−';
    return text;
}

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
            const param = state.transformParam;
            if (!param) return { complete: false, hintText: '' };
            const paramMatch = param.match(/^([rc])(\d+)$/i);
            if (!paramMatch) return { complete: false, hintText: '' };
            return { complete: true, hintText: `${target} ↔ ${param}` };
        }
        case '+':
        case '−': {
            const param = state.transformParam;
            if (!param) return { complete: false, hintText: '' };
            const paramMatch = param.match(/^([rc])(\d+)$/i);
            if (!paramMatch) return { complete: false, hintText: '' };
            const coeffDisplay = coefficient || '1';
            return { complete: true, hintText: `${target} ${operator} ${coeffDisplay}×${param}` };
        }
        case '×': {
            if (!coefficient) return { complete: false, hintText: '' };
            return { complete: true, hintText: `${target} × ${coefficient}` };
        }
        default:
            return { complete: false, hintText: '' };
    }
}

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

    const matrix = JSON.parse(JSON.stringify(state.matrixData.elements));
    applyTransformationToMatrix(matrix, rows, cols, targetType, targetIndex, paramType, paramIndex, coefficient, operator);

    return { rows, cols, elements: matrix };
}

export function updatePreviewMatrix() {
    if (!elements.matrixPreviewRow) return;

    if (state.isMobile || state.currentState !== 'elementary_transformation') {
        elements.previewArrowSection.style.display = 'none';
        elements.previewTableWrapper.style.display = 'none';
        return;
    }

    elements.previewArrowSection.style.display = 'flex';
    elements.previewTableWrapper.style.display = 'block';

    const infoResult = isTransformationInfoComplete();

    if (elements.previewHintText) {
        elements.previewHintText.textContent = infoResult.hintText;
    }

    if (infoResult.complete) {
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

function setupPreviewListeners() {
    if (!elements.transformCoefficient || previewListenersSetup) return;

    elements.transformCoefficient.addEventListener('input', updatePreviewMatrix);
    document.addEventListener('transformOperatorChanged', updatePreviewMatrix);
    previewListenersSetup = true;
}

export function notifyOperatorChanged() {
    document.dispatchEvent(new CustomEvent('transformOperatorChanged'));
}
