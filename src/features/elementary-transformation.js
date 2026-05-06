import { format } from 'mathjs';
const math = { format };
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

export function createMatrixDisplayTable() {
    const { rows, cols, elements: matrixElements } = state.matrixData;

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
        rowIndexTd.id = `add_r${row + 1}`;
        tr.appendChild(rowIndexTd);
        table.appendChild(tr);
    }

    const colTr = document.createElement('tr');

    for (let col = 0; col < cols; col++) {
        const colTd = document.createElement('td');
        colTd.className = 'col-label';
        colTd.textContent = `c${col + 1}`;
        colTd.id = `add_c${col + 1}`;
        colTr.appendChild(colTd);
    }

    const emptyTd = document.createElement('td');
    colTr.appendChild(emptyTd);

    table.appendChild(colTr);

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
