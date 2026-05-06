import { CONFIG } from '../config.js';
import { elements } from '../dom/elements.js';

class PopupManager {
    constructor() {
        this.popupBox = elements ? elements.popupBox : null;
        this.maxPopups = CONFIG.POPUP_CONFIG.MAX_POPUPS;
        this.popupTimeout = CONFIG.POPUP_CONFIG.TIMEOUT;
        this.animationDuration = CONFIG.POPUP_CONFIG.ANIMATION.DURATION;
        this.animationEasing = CONFIG.POPUP_CONFIG.ANIMATION.EASING;
        this.currentPopups = new Map();
        this.init();
    }

    init() {
        if (!this.popupBox) {
            this.createPopupBox();
        }
    }

    createPopupBox() {
        this.popupBox = document.createElement('div');
        this.popupBox.id = 'popupBox';
        this.popupBox.className = 'popup-box-container';
        document.body.appendChild(this.popupBox);
    }

    showPopup(message, type = 'error') {
        const popupId = 'popup-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

        const popupDiv = this.createPopup(message, type, popupId);

        if (this.currentPopups.size >= this.maxPopups) {
            this.removeOldestPopup();
        }

        this.popupBox.appendChild(popupDiv);
        this.currentPopups.set(popupId, popupDiv);

        const timeoutId = setTimeout(() => {
            this.removePopup(popupId);
        }, this.popupTimeout);

        popupDiv.dataset.timeoutId = timeoutId;
    }

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

    bindCloseButton(popupDiv, popupId) {
        const closeButton = popupDiv.querySelector('.popup-close');
        closeButton.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            this.removePopup(popupId);
        });
    }

    removeOldestPopup() {
        if (this.currentPopups.size === 0) return;
        const oldestId = Array.from(this.currentPopups.keys())[0];
        this.removePopup(oldestId);
    }

    removePopup(popupId) {
        const popupDiv = this.currentPopups.get(popupId);
        if (!popupDiv) return;

        const timeoutId = popupDiv.dataset.timeoutId;
        if (timeoutId) {
            clearTimeout(parseInt(timeoutId));
        }

        this.currentPopups.delete(popupId);

        popupDiv.classList.add('fade-out');

        setTimeout(() => {
            if (popupDiv.parentNode) {
                popupDiv.parentNode.removeChild(popupDiv);
            }
        }, this.animationDuration);
    }

    clearAllPopups() {
        Array.from(this.currentPopups.keys()).forEach(popupId => {
            this.removePopup(popupId);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getPopupCount() {
        return this.currentPopups.size;
    }
}

class PopupCentreManager {
    constructor() {
        this.container = elements ? elements.popupCentreContainer : null;
        this.currentPopup = null;
        this.currentPopupId = null;
    }

    showConfirmPopup(message, confirmCallback, cancelCallback = null, attachment = null) {
        if (!this.container) {
            this.container = document.getElementById('popupCentreContainer');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'popupCentreContainer';
                this.container.className = 'popup-centre-container';
                document.body.appendChild(this.container);
            }
        }

        this.closePopup(this.currentPopupId);

        const popup = this.createConfirmPopup(message, confirmCallback, cancelCallback, attachment);

        this.container.appendChild(popup);
        this.currentPopup = popup;

        this.currentPopupId = popup.dataset.popupId;

        this.container.classList.add('show');
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);

        return this.currentPopupId;
    }

    createConfirmPopup(message, confirmCallback, cancelCallback, attachment = null) {
        const popup = document.createElement('div');
        popup.className = 'popup-centre';

        const popupId = 'popup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        popup.dataset.popupId = popupId;

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
                    const inputValue = inputElement.value;
                    confirmCallback(inputValue);
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

        if (inputElement) {
            inputElement.focus();
        } else {
            confirmBtn.focus();
        }

        return popup;
    }

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

                const remainingPopups = this.container.querySelectorAll('.popup-centre');
                if (remainingPopups.length === 0) {
                    this.container.classList.remove('show');
                }
            }, 300);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export const popupManager = new PopupManager();
export const popupCentreManager = new PopupCentreManager();

export function showPopup(message, type = 'error') {
    popupManager.showPopup(message, type);
}

export function showError(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'error');
    } else {
        alert(message);
    }
    console.error('报错弹窗:', message);
}

export function showSuccess(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'success');
    } else {
        alert(message);
    }
    console.log('成功弹窗:', message);
}

export function showWarning(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'warning');
    } else {
        alert(message);
    }
    console.warn('警告弹窗:', message);
}

export function clearAllPopups() {
    popupManager.clearAllPopups();
}
