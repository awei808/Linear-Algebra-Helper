import { CONFIG } from './config.js';
import { VERSION, displayVersionInfo, showVersionAndUpdateTime } from './version.js';
import { state } from './state/state.js';
import { elements } from './dom/elements.js';
import { Next, Undo, updateUIForCurrentState, saveCurrentState } from './state/stateMachine.js';
import { updateDisplayHelp, switchContent } from './ui/help.js';
import { showSuccess, showError } from './ui/popup.js';
import { createGrid, handleMouseDown, handleMouseLeave, updateCoordinatesDisplay } from './features/select-dimension.js';
import { getScreenSizeType } from './utils/dom-utils.js';
import { handleTransformGroupClick, undoTransformation, redoTransformation } from './features/transformation.js';
import { initTransformationButtons } from './features/transformation.js';
import { handleSelectorChange } from './features/elementary-transformation.js';
import { createMatrixDisplayTable } from './features/elementary-transformation.js';
import { hideElementaryTransformationUI } from './features/input-elements.js';
import { handleQuickInputClick, handleQuickInputMatrix } from './features/matrix-input.js';
import { confirmForceExpand, confirmForceFactorize, confirmReplaceElement } from './features/handlePolynomial.js';
import {
    performReset, performDiagonalProduct, performAugmentedIdentity, performAddLamada
} from './features/squareMatrixSpecialFunction.js';
import { initTest } from './features/test.js';

function setupEventListeners() {
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);

    elements.undoButton.addEventListener('pointerup', Undo);
    elements.nextButton.addEventListener('pointerup', Next);

    elements.buttonInputMatrix.addEventListener('pointerup', startMatrixInput);

    elements.target.addEventListener('pointerup', (e) => handleTransformGroupClick(e.target));
    elements.param.addEventListener('pointerup', (e) => handleTransformGroupClick(e.target));
    elements.buttonUndo.addEventListener('pointerup', undoTransformation);
    elements.buttonRedo.addEventListener('pointerup', redoTransformation);

    if (elements.transformTarget) { elements.transformTarget.addEventListener('change', (e) => handleSelectorChange('target', e.target.value)); }
    if (elements.transformParam) { elements.transformParam.addEventListener('change', (e) => handleSelectorChange('param', e.target.value)); }

    if (elements.moreButton && elements.moreDropdown) {
        elements.moreButton.addEventListener('pointerup', toggleMoreDropdown);

        document.addEventListener('pointerup', function (event) {
            if (!elements.moreButton.contains(event.target) && !elements.moreDropdown.contains(event.target)) {
                elements.moreDropdown.classList.remove('show');
            }
        });
    }

    elements.exportMatrixButton.addEventListener('pointerup', function (event) {
        event.preventDefault();
        exportMatrixToArray();
    });
    elements.ButtonQuickInput.addEventListener('pointerup', handleQuickInputClick);
    elements.ButtonForceSimplify.addEventListener('pointerup', confirmForceExpand);
    elements.ButtonForceFactorize.addEventListener('pointerup', confirmForceFactorize);
    elements.ButtonReplaceElement.addEventListener('pointerup', confirmReplaceElement);
    elements.ButtonToggleHelp.addEventListener('pointerup', toggleHelp);
    elements.ButtonReset.addEventListener('pointerup', performReset);
    elements.ButtonComputeDiagonalProduct.addEventListener('pointerup', performDiagonalProduct);
    elements.ButtonCreateAugmentedIdentity.addEventListener('pointerup', performAugmentedIdentity);
    elements.ButtonAddLamada.addEventListener('pointerup', performAddLamada);
    elements.ButtonShowVersionAndUpdateTime.addEventListener('pointerup', showVersionAndUpdateTime);

    elements.scrollLeft.addEventListener('pointerup', () => switchContent(false));
    elements.scrollRight.addEventListener('pointerup', () => switchContent(true));
}

function init() {
    createGrid();
    getScreenSizeType();
    setupEventListeners();

    state.currentState = CONFIG.STATES.INIT;
    updateUIForCurrentState();
    updateDisplayHelp();
    initTransformationButtons();
    initTest();
    showSuccess('初始化完成');
}

export function startMatrixInput() {
    if (elements.quickInput && elements.quickInput.value.trim() !== '') {
        handleQuickInputMatrix();
        return;
    }

    if (state.currentState === CONFIG.STATES.INIT) {
        state.previousStates.push({
            state: state.currentState,
            matrixData: state.matrixData ? JSON.parse(JSON.stringify(state.matrixData)) : null
        });

        state.currentState = CONFIG.STATES.SELECT_DIMENSION;
        updateUIForCurrentState();
        elements.inputMatrixDiv.classList.toggle('hidden');
        return;
    }

    elements.inputMatrixDiv.classList.toggle('hidden');
}

export function exportMatrixToArray() {
    if (!state.matrixData || !state.matrixData.elements) {
        showError('没有可导出的矩阵数据');
        return;
    }

    const { rows, cols, elements: matrixElements } = state.matrixData;

    const matrixArray = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(matrixElements[i][j] || '0');
        }
        matrixArray.push(`[${row.join(', ')}]`);
    }

    const matrixString = `[${matrixArray.join(', ')}]`;

    navigator.clipboard.writeText(matrixString).then(() => {
        showSuccess('矩阵数据已复制到剪贴板，并显示在初等变换区域下方');

        if (elements.result) {
            elements.result.textContent = `矩阵数据: ${matrixString}`;
            elements.result.style.display = 'block';
        }

        if (elements.moreDropdown) {
            elements.moreDropdown.classList.remove('show');
        }

    }).catch(err => {
        console.error('复制失败:', err);
        showError('复制失败，请在初等变换区域下方手动复制以下内容');

        if (elements.result) {
            elements.result.textContent = `矩阵数据: ${matrixString}`;
            elements.result.style.display = 'block';
        }
    });
}

export function toggleMoreDropdown(event) {
    event.stopPropagation();
    const moreDropdown = document.getElementById('moreDropdown');
    if (moreDropdown) {
        moreDropdown.classList.toggle('show');
    }
}

export function toggleHelp() {
    CONFIG.UI_CONFIG.DISPLAY_HELP = !CONFIG.UI_CONFIG.DISPLAY_HELP;
    updateDisplayHelp();
    elements.ButtonToggleHelp.textContent = CONFIG.UI_CONFIG.DISPLAY_HELP ? '关闭帮助板块' : '显示帮助板块';
    console.log("若需要永久切换显示状态，需在config.js中修改UI_CONFIG.DISPLAY_HELP的值");
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    displayVersionInfo();
});
