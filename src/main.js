// ==================== 应用入口 ====================
// init()、事件绑定、DOMContentLoaded —— 唯一入口点
import 'katex/dist/katex.min.css';
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

// ==================== 事件绑定 ====================

/**
 * 设置所有事件监听器
 * 集中管理：网格事件、按钮事件、选择器事件、菜单事件
 */
function setupEventListeners() {
    // 网格鼠标事件（维度选择）
    elements.windowDiv.addEventListener('mousedown', handleMouseDown);
    elements.windowDiv.addEventListener('mouseleave', handleMouseLeave);

    // 上一步/下一步按钮
    elements.undoButton.addEventListener('pointerup', Undo);
    elements.nextButton.addEventListener('pointerup', Next);

    // 录入矩阵按钮
    elements.buttonInputMatrix.addEventListener('pointerup', startMatrixInput);

    // 初等变换相关按钮
    elements.target.addEventListener('pointerup', (e) => handleTransformGroupClick(e.target));
    elements.param.addEventListener('pointerup', (e) => handleTransformGroupClick(e.target));
    elements.buttonUndo.addEventListener('pointerup', undoTransformation);
    elements.buttonRedo.addEventListener('pointerup', redoTransformation);

    // 目标行/列和参数行/列选择器值变更
    if (elements.transformTarget) { elements.transformTarget.addEventListener('change', (e) => handleSelectorChange('target', e.target.value)); }
    if (elements.transformParam) { elements.transformParam.addEventListener('change', (e) => handleSelectorChange('param', e.target.value)); }

    // "更多"下拉菜单
    if (elements.moreButton && elements.moreDropdown) {
        elements.moreButton.addEventListener('pointerup', toggleMoreDropdown);

        // 点击菜单外部时关闭
        document.addEventListener('pointerup', function (event) {
            if (!elements.moreButton.contains(event.target) && !elements.moreDropdown.contains(event.target)) {
                elements.moreDropdown.classList.remove('show');
            }
        });
    }

    // 更多菜单中的功能按钮
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

    // 帮助翻页按钮
    elements.scrollLeft.addEventListener('pointerup', () => switchContent(false));
    elements.scrollRight.addEventListener('pointerup', () => switchContent(true));
}

// ==================== 初始化 ====================

/**
 * 初始化应用
 * 创建网格 → 检测屏幕 → 绑定事件 → 设置初始状态 → 初始化变换按钮
 */
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

// ==================== 录入矩阵 ====================

/**
 * 处理"录入矩阵"按钮点击
 * 支持快速录入（如果快速录入输入框有内容）和普通录入两种方式
 */
export function startMatrixInput() {
    // 快速录入优先
    if (elements.quickInput && elements.quickInput.value.trim() !== '') {
        handleQuickInputMatrix();
        return;
    }

    // 初始状态 → 维度选择状态
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

    // 切换InputMatrix显示状态
    elements.inputMatrixDiv.classList.toggle('hidden');
}

// ==================== 导出矩阵 ====================

/**
 * 导出矩阵为二维数组格式并复制到剪贴板
 */
export function exportMatrixToArray() {
    if (!state.matrixData || !state.matrixData.elements) {
        showError('没有可导出的矩阵数据');
        return;
    }

    const { rows, cols, elements: matrixElements } = state.matrixData;

    // 构建二维数组字符串
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

// ==================== 更多菜单 ====================

/**
 * 切换"更多"下拉菜单显示/隐藏
 * @param {Event} event - 点击事件
 */
export function toggleMoreDropdown(event) {
    event.stopPropagation(); // 阻止冒泡到document（否则会立即被外部点击关闭）
    const moreDropdown = document.getElementById('moreDropdown');
    if (moreDropdown) {
        moreDropdown.classList.toggle('show');
    }
}

// ==================== 帮助板块 ====================

/**
 * 切换帮助板块显示状态和对应按钮文本
 */
export function toggleHelp() {
    CONFIG.UI_CONFIG.DISPLAY_HELP = !CONFIG.UI_CONFIG.DISPLAY_HELP;
    updateDisplayHelp();
    elements.ButtonToggleHelp.textContent = CONFIG.UI_CONFIG.DISPLAY_HELP ? '关闭帮助板块' : '显示帮助板块';
    console.log("若需要永久切换显示状态，需在config.js中修改UI_CONFIG.DISPLAY_HELP的值");
}

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', () => {
    init();
    displayVersionInfo();
});
