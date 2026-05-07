// ==================== 测试调试模块 ====================
// 仅在 CONFIG.TEST_CONFIG.TEST_MODE = true 时激活
import { CONFIG } from '../config.js';
import { elements } from '../dom/elements.js';
import { handleQuickInputClick, handleQuickInputMatrix } from './matrix-input.js';
import { popupCentreManager, showSuccess, showWarning } from '../ui/popup.js';

/**
 * 初始化测试按钮（显示并绑定事件）
 */
function initTestButton() {
    const buttonTest = document.getElementById('ButtonTest');
    const buttonTestConfirmPopup = document.getElementById('ButtonTestCofirmPopup');

    if (buttonTest) {
        buttonTest.addEventListener('click', handleTestButtonClick);
        buttonTest.style.display = 'block';
    }
    if (buttonTestConfirmPopup) {
        buttonTestConfirmPopup.addEventListener('click', handleTestConfirmPopupClick);
        buttonTestConfirmPopup.style.display = 'block';
    }
}

/**
 * 测试按钮点击：自动录入测试矩阵
 */
function handleTestButtonClick() {
    handleQuickInputClick();

    setTimeout(() => {
        const martix = "[[2x,15x],[x,6x]]";

        elements.quickInput.value = martix;
        handleQuickInputMatrix();
        showSuccess('测试矩阵已加载到快速录入输入框');
    }, 100);
}

/**
 * 测试确认弹窗
 */
function handleTestConfirmPopupClick() {
    console.log('测试确认弹窗点击事件');
    popupCentreManager.showConfirmPopup(
        '确定要执行此操作吗？',
        function () {
            showSuccess('确认操作已执行');
        },
        function () {
            showWarning('操作已取消');
        }
    );
}

/**
 * 根据TEST_MODE配置决定是否启用测试功能
 */
export function initTest() {
    if (CONFIG.TEST_CONFIG.TEST_MODE) {
        initTestButton();
    }
}
