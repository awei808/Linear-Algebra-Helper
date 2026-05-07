// ==================== 弹窗系统 ====================
// PopupManager（右下角toast） + PopupCentreManager（中央确认弹窗）
import { CONFIG } from '../config.js';
import { elements } from '../dom/elements.js';

// ==================== 右下角Toast弹窗 ====================
class PopupManager {
    constructor() {
        this.popupBox = elements ? elements.popupBox : null;
        this.maxPopups = CONFIG.POPUP_CONFIG.MAX_POPUPS;
        this.popupTimeout = CONFIG.POPUP_CONFIG.TIMEOUT;
        this.animationDuration = CONFIG.POPUP_CONFIG.ANIMATION.DURATION;
        this.animationEasing = CONFIG.POPUP_CONFIG.ANIMATION.EASING;
        this.currentPopups = new Map();          // 当前显示的弹窗映射
        this.init();
    }

    /**
     * 初始化：确保弹窗容器存在
     */
    init() {
        if (!this.popupBox) {
            this.createPopupBox();
        }
    }

    /**
     * 创建弹窗容器DOM
     */
    createPopupBox() {
        this.popupBox = document.createElement('div');
        this.popupBox.id = 'popupBox';
        this.popupBox.className = 'popup-box-container';
        document.body.appendChild(this.popupBox);
    }

    /**
     * 显示一个弹窗
     * 超过最大数量时自动移除最早的弹窗
     * @param {string} message - 弹窗消息
     * @param {string} type - 类型：'success' | 'error' | 'warning'
     */
    showPopup(message, type = 'error') {
        const popupId = 'popup-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

        const popupDiv = this.createPopup(message, type, popupId);

        // 超过上限时移除最早的弹窗
        if (this.currentPopups.size >= this.maxPopups) {
            this.removeOldestPopup();
        }

        this.popupBox.appendChild(popupDiv);
        this.currentPopups.set(popupId, popupDiv);

        // 自动超时关闭
        const timeoutId = setTimeout(() => {
            this.removePopup(popupId);
        }, this.popupTimeout);

        popupDiv.dataset.timeoutId = timeoutId;
    }

    /**
     * 创建弹窗DOM元素
     * @param {string} message - 消息文本
     * @param {string} type - 弹窗类型
     * @param {string} popupId - 唯一ID
     * @returns {HTMLElement}
     */
    createPopup(message, type, popupId) {
        const popupDiv = document.createElement('div');
        const styleClass = CONFIG.POPUP_CONFIG.STYLES[type.toUpperCase()] || 'popup-error';
        popupDiv.className = `popup ${styleClass}`;
        popupDiv.id = popupId;

        popupDiv.innerHTML = `
            <div class="popup-content">
                <p class="popup-message">${this.escapeHtml(message)}</p>
                <button class="popup-close" title="关闭">×</button>
            </div>
        `;

        this.bindCloseButton(popupDiv, popupId);

        return popupDiv;
    }

    /**
     * 绑定关闭按钮事件
     */
    bindCloseButton(popupDiv, popupId) {
        const closeButton = popupDiv.querySelector('.popup-close');
        closeButton.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            this.removePopup(popupId);
        });
    }

    /**
     * 移除最早的弹窗
     */
    removeOldestPopup() {
        if (this.currentPopups.size === 0) return;
        const oldestId = Array.from(this.currentPopups.keys())[0];
        this.removePopup(oldestId);
    }

    /**
     * 移除指定弹窗（带淡出动画）
     * @param {string} popupId
     */
    removePopup(popupId) {
        const popupDiv = this.currentPopups.get(popupId);
        if (!popupDiv) return;

        // 清除超时定时器
        const timeoutId = popupDiv.dataset.timeoutId;
        if (timeoutId) {
            clearTimeout(parseInt(timeoutId));
        }

        this.currentPopups.delete(popupId);

        // 淡出动画后移除DOM
        popupDiv.classList.add('fade-out');

        setTimeout(() => {
            if (popupDiv.parentNode) {
                popupDiv.parentNode.removeChild(popupDiv);
            }
        }, this.animationDuration);
    }

    /**
     * 清除所有弹窗
     */
    clearAllPopups() {
        Array.from(this.currentPopups.keys()).forEach(popupId => {
            this.removePopup(popupId);
        });
    }

    /**
     * HTML转义，防止XSS
     * @param {string} text - 原始文本
     * @returns {string} 转义后的HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取当前弹窗数量
     */
    getPopupCount() {
        return this.currentPopups.size;
    }
}

// ==================== 中央确认弹窗 ====================
class PopupCentreManager {
    constructor() {
        this.container = elements ? elements.popupCentreContainer : null;
        this.currentPopup = null;
        this.currentPopupId = null;
    }

    /**
     * 显示确认弹窗
     * @param {string} message - 提示消息
     * @param {Function} confirmCallback - 确认回调
     * @param {Function} cancelCallback - 取消回调（可选）
     * @param {string} attachment - 附加功能（'input' 表示含输入框）
     * @returns {string} 弹窗ID
     */
    showConfirmPopup(message, confirmCallback, cancelCallback = null, attachment = null) {
        // 确保容器存在
        if (!this.container) {
            this.container = document.getElementById('popupCentreContainer');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'popupCentreContainer';
                this.container.className = 'popup-centre-container';
                document.body.appendChild(this.container);
            }
        }

        // 关闭之前的弹窗
        this.closePopup(this.currentPopupId);

        const popup = this.createConfirmPopup(message, confirmCallback, cancelCallback, attachment);

        this.container.appendChild(popup);
        this.currentPopup = popup;
        this.currentPopupId = popup.dataset.popupId;

        // 显示动画
        this.container.classList.add('show');
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);

        return this.currentPopupId;
    }

    /**
     * 创建确认弹窗DOM
     * 支持可选的输入框附件
     */
    createConfirmPopup(message, confirmCallback, cancelCallback, attachment = null) {
        const popup = document.createElement('div');
        popup.className = 'popup-centre';

        const popupId = 'popup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        popup.dataset.popupId = popupId;

        // 可选的输入框
        let inputHtml = '';
        if (attachment === 'input') {
            inputHtml = `
                <div class="popup-centre-input">
                    <input type="text" id="popup-input-${popupId}" placeholder="输入更改后的元素"
                           style="margin-left: 10px; margin-right: 10px; padding: 8px 12px; border: 1px solid rgb(204, 204, 204); border-radius: 4px; width: 200px;">
                </div>
            `;
        }

        popup.innerHTML = `
            <div class="popup-centre-content">
                <div class="popup-centre-message">${this.escapeHtml(message)}</div>
                ${inputHtml}
                <div class="popup-centre-buttons">
                    <button class="popup-centre-btn cancel">取消</button>
                    <button class="popup-centre-btn confirm">确认</button>
                </div>
            </div>
        `;

        const cancelBtn = popup.querySelector('.cancel');
        const confirmBtn = popup.querySelector('.confirm');
        const inputElement = attachment === 'input' ? popup.querySelector(`#popup-input-${popupId}`) : null;

        const performConfirm = () => {
            if (confirmCallback) {
                if (attachment === 'input' && inputElement) {
                    confirmCallback(inputElement.value);
                } else {
                    confirmCallback();
                }
            }
            this.closePopup(popupId);
        };

        cancelBtn.addEventListener('pointerup', () => {
            if (cancelCallback) {
                cancelCallback();
            }
            this.closePopup(popupId);
        });

        confirmBtn.addEventListener('pointerup', performConfirm);

        // 键盘快捷键：Enter确认，Escape取消
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                performConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                if (cancelCallback) {
                    cancelCallback();
                }
                this.closePopup(popupId);
            }
        }, { once: true });

        // 自动聚焦
        if (inputElement) {
            inputElement.focus();
        } else {
            confirmBtn.focus();
        }

        return popup;
    }

    /**
     * 关闭弹窗（带淡出动画）
     * @param {string} popupId - 弹窗ID（null表示关闭当前弹窗）
     */
    closePopup(popupId = null) {
        let targetPopup = null;

        if (!popupId) {
            targetPopup = this.currentPopup;
        } else {
            targetPopup = this.container.querySelector(`[data-popup-id="${popupId}"]`);
        }

        if (targetPopup) {
            targetPopup.classList.remove('show');

            setTimeout(() => {
                if (targetPopup && targetPopup.parentNode) {
                    targetPopup.parentNode.removeChild(targetPopup);
                }

                if (popupId === this.currentPopupId || !popupId) {
                    this.currentPopup = null;
                    this.currentPopupId = null;
                }

                // 无剩余弹窗时隐藏容器
                const remainingPopups = this.container.querySelectorAll('.popup-centre');
                if (remainingPopups.length === 0) {
                    this.container.classList.remove('show');
                }
            }, 300);
        }
    }

    /**
     * HTML转义，防止XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 导出单例
export const popupManager = new PopupManager();
export const popupCentreManager = new PopupCentreManager();

// ==================== 便捷函数 ====================

/**
 * 显示弹窗
 * @param {string} message - 消息文本
 * @param {string} type - 类型
 */
export function showPopup(message, type = 'error') {
    popupManager.showPopup(message, type);
}

/**
 * 显示错误弹窗
 */
export function showError(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'error');
    } else {
        alert(message);
    }
    console.error('报错弹窗:', message);
}

/**
 * 显示成功弹窗
 */
export function showSuccess(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'success');
    } else {
        alert(message);
    }
    console.log('成功弹窗:', message);
}

/**
 * 显示警告弹窗
 */
export function showWarning(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'warning');
    } else {
        alert(message);
    }
    console.warn('警告弹窗:', message);
}

/**
 * 清除所有弹窗
 */
export function clearAllPopups() {
    popupManager.clearAllPopups();
}
