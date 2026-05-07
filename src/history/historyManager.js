// ==================== 历史记录管理器 ====================
// 变换级撤销/重做双栈系统，与状态级撤销（previousStates）独立
import { state } from '../state/state.js';

export const HistoryManager = {
    /**
     * 初始化历史记录栈
     */
    init: function () {
        if (!state.undoStack) {
            state.undoStack = [];
        }
        if (!state.redoStack) {
            state.redoStack = [];
        }
        console.log('历史记录管理模块初始化完成');
    },

    /**
     * 深拷贝对象（支持嵌套对象和数组）
     * @param {*} obj - 待拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone: function (obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    /**
     * 添加历史记录到撤销栈
     * 新操作会自动清空重做栈（因为历史分支改变）
     * @param {Object} matrixData - 变换前的矩阵数据
     * @param {string} description - 变换描述
     */
    addHistory: function (matrixData, description) {
        // 新操作使重做栈失效
        this.clearRedoStack();

        if (!matrixData || !matrixData.elements) {
            console.error('无效的矩阵数据:', matrixData);
            return;
        }

        try {
            const clonedMatrixData = this.deepClone(matrixData);

            const historyEntry = {
                matrixData: clonedMatrixData,
                description: description,
                timestamp: Date.now()
            };

            state.undoStack.push(historyEntry);

            console.log(`添加历史记录到撤销栈:, {${historyEntry.description},
            ${historyEntry.matrixData.rows},
            ${historyEntry.matrixData.cols},
            ${historyEntry.matrixData.elements},
            ${historyEntry.timestamp}
            }`);
            console.log(`撤销栈大小: ${state.undoStack.length}, 重做栈大小: ${state.redoStack.length}`);
        } catch (error) {
            console.error('保存历史记录时发生错误:', error);
        }
    },

    /**
     * 执行撤销：从撤销栈弹出，并压入重做栈
     * @returns {Object|null} 上一个历史记录条目（用于恢复矩阵状态），或null
     */
    undo: function () {
        if (state.undoStack.length === 0) {
            return null;
        }

        const historyEntry = state.undoStack.pop();

        // 当前状态转移到重做栈
        state.redoStack.push(historyEntry);

        console.log('执行撤销操作:', historyEntry);
        console.log(`撤销栈大小: ${state.undoStack.length}, 重做栈大小: ${state.redoStack.length}`);

        // 返回上一个状态用于恢复
        if (state.undoStack.length > 0) {
            const previousEntry = state.undoStack[state.undoStack.length - 1];
            console.log('返回上一个历史记录:', previousEntry);
            return previousEntry;
        } else {
            // 撤销栈已空，返回初始状态
            console.log('返回初始状态:', state.initialMatrixData);
            return { matrixData: state.initialMatrixData, description: '初始状态' };
        }
    },

    /**
     * 执行重做：从重做栈弹出，并压入撤销栈
     * @returns {Object|null} 重做的历史记录条目，或null
     */
    redo: function () {
        if (state.redoStack.length === 0) {
            return null;
        }

        const historyEntry = state.redoStack.pop();

        state.undoStack.push(historyEntry);

        console.log('执行重做操作:', historyEntry);
        console.log(`撤销栈大小: ${state.undoStack.length}, 重做栈大小: ${state.redoStack.length}`);

        return historyEntry;
    },

    /**
     * 清空重做栈（新增变换时自动调用）
     */
    clearRedoStack: function () {
        state.redoStack = [];
        console.log('重做栈已清空');
    },

    /**
     * 清空所有历史记录
     */
    clearAllHistory: function () {
        state.undoStack = [];
        state.redoStack = [];
        console.log('所有历史记录已清空');
    },

    /**
     * 获取撤销栈大小
     * @returns {number}
     */
    getUndoStackSize: function () {
        return state.undoStack.length;
    },

    /**
     * 获取重做栈大小
     * @returns {number}
     */
    getRedoStackSize: function () {
        return state.redoStack.length;
    },

    /**
     * 格式化历史记录描述文本
     * 将系数为1的项简化显示（如 "r1 + 1×r2" → "r1 + r2"）
     * @param {string} description - 原始描述文本
     * @returns {string} 格式化后的描述
     */
    formatHistoryDescription: function (description) {
        if (!description || typeof description !== 'string') {
            return description || '';
        }

        let formattedDescription = description;

        // 格式化加减操作：系数为1时省略系数
        const addSubtractPattern = /(r\d+|c\d+)\s*([+\-])\s*(\d+\/\d+|\d+)\s*×\s*(r\d+|c\d+)/g;
        formattedDescription = formattedDescription.replace(addSubtractPattern, (match, target, operator, coefficient, param) => {
            let formattedCoefficient = coefficient;
            if (coefficient.includes('/')) {
                const [numerator, denominator] = coefficient.split('/');
                if (denominator === '1') {
                    formattedCoefficient = numerator;
                }
            }

            if (formattedCoefficient === '1') {
                return `${target} ${operator} ${param}`;
            }

            return `${target} ${operator} ${formattedCoefficient}×${param}`;
        });

        // 格式化倍乘操作：分母为1时省略分母
        const multiplyPattern = /(r\d+|c\d+)\s*×\s*(\d+\/\d+|\d+)/g;
        formattedDescription = formattedDescription.replace(multiplyPattern, (match, target, coefficient) => {
            let formattedCoefficient = coefficient;
            if (coefficient.includes('/')) {
                const [numerator, denominator] = coefficient.split('/');
                if (denominator === '1') {
                    formattedCoefficient = numerator;
                }
            }

            return `${target} × ${formattedCoefficient}`;
        });

        return formattedDescription;
    },

    /**
     * 获取撤销栈中所有历史记录的格式化描述
     * @returns {string[]} 描述文本数组
     */
    getUndoHistoryDescriptions: function () {
        return state.undoStack.map(entry => this.formatHistoryDescription(entry.description));
    }
};
