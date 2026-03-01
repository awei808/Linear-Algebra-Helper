// 弹窗管理器
class PopupManager {
    constructor() {
        // 使用elements对象中的popupBox引用
        this.popupBox = elements ? elements.popupBox : null;
        // 从配置中读取弹窗配置
        this.maxPopups = CONFIG.POPUP_CONFIG.MAX_POPUPS;
        this.popupTimeout = CONFIG.POPUP_CONFIG.TIMEOUT;
        this.animationDuration = CONFIG.POPUP_CONFIG.ANIMATION.DURATION;
        this.animationEasing = CONFIG.POPUP_CONFIG.ANIMATION.EASING;        
        this.currentPopups = new Map(); // 存储弹窗ID和对应的元素
        this.init();
    }
    
    init() {
        // 确保popupBox存在
        if (!this.popupBox) {
            this.createPopupBox();
        }
        
        // 绑定测试按钮事件
        //this.bindTestButtons();
    }
    
    /**
     * 创建弹窗容器
     */
    createPopupBox() {
        this.popupBox = document.createElement('div');
        this.popupBox.id = 'popupBox';
        this.popupBox.className = 'popup-box-container';
        document.body.appendChild(this.popupBox);
    }
    
    
    /**
     * 显示弹窗
     * @param {string} message 信息内容
     * @param {string} type 弹窗类型：error/warning/success
     */
    showPopup(message, type = 'error') {
        // 生成唯一ID
        const popupId = 'popup-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
        
        // 创建弹窗div
        const popupDiv = this.createPopup(message, type, popupId);
        
        // 如果已经有3个弹窗，移除最先出现的
        if (this.currentPopups.size >= this.maxPopups) {
            this.removeOldestPopup();
        }
        
        // 添加新的弹窗div
        this.popupBox.appendChild(popupDiv);
        this.currentPopups.set(popupId, popupDiv);
        
        // 设置5秒后自动消失的计时器
        const timeoutId = setTimeout(() => {
            this.removePopup(popupId);
        }, this.popupTimeout);
        
        // 存储timeout ID以便可以手动清除
        popupDiv.dataset.timeoutId = timeoutId;
    }
    
    /**
     * 创建弹窗元素
     */
    createPopup(message, type, popupId) {
        const popupDiv = document.createElement('div');
        // 从配置中读取对应的样式类名
        const styleClass = CONFIG.POPUP_CONFIG.STYLES[type.toUpperCase()] || 'popup-error';
        popupDiv.className = `popup ${styleClass}`;
        popupDiv.id = popupId;
        
        popupDiv.innerHTML = `
            <div class="popup-content">
                <p class="popup-message">${this.escapeHtml(message)}</p>
                <button class="popup-close" title="关闭">×</button>
            </div>
        `;
        
        // 绑定关闭按钮事件
        this.bindCloseButton(popupDiv, popupId);
        
        return popupDiv;
    }
    
    /**
     * 绑定关闭按钮事件
     */
    bindCloseButton(popupDiv, popupId) {
        const closeButton = popupDiv.querySelector('.popup-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removePopup(popupId);
        });
        
        // 添加键盘支持
        closeButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.removePopup(popupId);
            }
        });
    }
    
    /**
     * 移除最旧的弹窗
     */
    removeOldestPopup() {
        if (this.currentPopups.size === 0) return;
        
        // 获取最旧的弹窗ID（Map的第一个键）
        const oldestId = Array.from(this.currentPopups.keys())[0];
        this.removePopup(oldestId);
    }
    
    /**
     * 移除指定ID的弹窗
     */
    removePopup(popupId) {
        const popupDiv = this.currentPopups.get(popupId);
        if (!popupDiv) return;
        
        // 清除定时器
        const timeoutId = popupDiv.dataset.timeoutId;
        if (timeoutId) {
            clearTimeout(parseInt(timeoutId));
        }
        
        // 立即从currentPopups中删除，确保弹窗数量限制正确生效
        this.currentPopups.delete(popupId);

        // 添加淡出动画
        popupDiv.classList.add('fade-out');
        
        // 动画结束后移除DOM元素
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
     * HTML转义
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

// 全局弹窗管理器实例
const popupManager = new PopupManager();

// 全局弹窗显示函数
function showPopup(message, type = 'error') {
    popupManager.showPopup(message, type);
}


/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showError(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'error');
    } else {
        alert(message);
    }
}
/**
 * 显示成功消息
 * @param {string} message - 成功消息
 */
function showSuccess(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'success');
    } else {
        alert(message);
    }
}

/**
 * 显示警告消息
 * @param {string} message - 警告消息
 */
function showWarning(message) {
    if (typeof showPopup === 'function') {
        showPopup(message, 'warning');
    } else {
        alert(message);
    }
}

// 全局弹窗清除函数
function clearAllPopups() {
    popupManager.clearAllPopups();
}

// 兼容旧版本的clearAllErrors函数
function clearAllErrors() {
    clearAllPopups();
}

// 导出到全局作用域
window.popupManager = popupManager;
window.showPopup = showPopup;
window.showError = showError;
window.showSuccess = showSuccess;
window.showWarning = showWarning;
window.clearAllPopups = clearAllPopups;
window.clearAllErrors = clearAllErrors;

/**
 * 中心弹窗管理器 - 用于在屏幕中心显示确认弹窗
 */
class PopupCentreManager {
    constructor() {
        // 使用elements对象中的popupCentreContainer引用
        this.container = elements ? elements.popupCentreContainer : null;
        // 存储当前显示的弹窗
        this.currentPopup = null;
    }
    
    /**
     * 显示中心确认弹窗
     * @param {string} message - 信息文本
     * @param {Function} confirmCallback - 确认按钮触发的回调函数
     * @param {Function} cancelCallback - 取消按钮触发的回调函数（默认为空）
     */
    showConfirmPopup(message, confirmCallback, cancelCallback = null) {
        // 确保容器存在（参考PopupManager的设计）
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
        this.closePopup();
        
        // 创建弹窗元素
        const popup = this.createConfirmPopup(message, confirmCallback, cancelCallback);
        
        // 添加到容器
        this.container.appendChild(popup);
        this.currentPopup = popup;
        
        // 显示容器和弹窗
        this.container.classList.add('show');
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);
    }
    
    /**
     * 创建确认弹窗元素
     */
    createConfirmPopup(message, confirmCallback, cancelCallback) {
        const popup = document.createElement('div');
        popup.className = 'popup-centre';
        
        popup.innerHTML = `
            <div class="popup-centre-content">
                <div class="popup-centre-message">${this.escapeHtml(message)}</div>
                <div class="popup-centre-buttons">
                    <button class="popup-centre-btn cancel">取消</button>
                    <button class="popup-centre-btn confirm">确认</button>
                </div>
            </div>
        `;
        
        // 绑定按钮事件
        const cancelBtn = popup.querySelector('.cancel');
        const confirmBtn = popup.querySelector('.confirm');
        
        cancelBtn.addEventListener('click', () => {
            if (cancelCallback) {
                cancelCallback();
            }
            this.closePopup();
        });
        
        confirmBtn.addEventListener('click', () => {
            if (confirmCallback) {
                confirmCallback();
            }
            this.closePopup();
        });
        
        return popup;
    }
    
    /**
     * 关闭弹窗
     */
    closePopup() {
        if (this.currentPopup) {
            this.currentPopup.classList.remove('show');
            
            setTimeout(() => {
                if (this.currentPopup && this.currentPopup.parentNode) {
                    this.currentPopup.parentNode.removeChild(this.currentPopup);
                }
                this.currentPopup = null;
                // 隐藏容器
                this.container.classList.remove('show');
            }, 300);
        }
    }
    
    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 全局中心弹窗管理器实例
const popupCentreManager = new PopupCentreManager();

// 导出到全局作用域
window.popupCentreManager = popupCentreManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('弹窗系统已初始化');
});