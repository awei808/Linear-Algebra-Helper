// 历史记录管理模块
/* 注意：正常的历史记录管理模块，数据会在执行之前存入撤销栈，但由于数据结构不同（本项目历史记录结构
            {
                matrixData: clonedMatrixData,
                description: description,
                timestamp: Date.now(),
            }，描述一一对应变换后的矩阵，而不是变换前的矩阵），所以在执行后存入撤销栈
            这种结构非常不规范，出bug难修找难修，新项目中不要使用
*/

/**
 * 历史记录管理模块
 * 双栈设计：撤销栈和重做栈
 */
const HistoryManager = {
    /**
     * 初始化历史记录管理模块
     */
    init: function () {
        // 确保撤销栈和重做栈存在
        if (!state.undoStack) {
            state.undoStack = [];
        }
        if (!state.redoStack) {
            state.redoStack = [];
        }

        console.log('历史记录管理模块初始化完成');
    },

    /**
     * 深度克隆函数
     * @param {Object} obj - 要克隆的对象
     * @returns {Object} 克隆后的对象
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
     * @param {Object} matrixData - 矩阵数据
     * @param {string} description - 变换描述
     */
    addHistory: function (matrixData, description) {
        // 清空重做栈（因为执行了新操作）
        this.clearRedoStack();

        // 验证matrixData是否有效
        if (!matrixData || !matrixData.elements) {
            console.error('无效的矩阵数据:', matrixData);
            return;
        }

        // 深度克隆矩阵数据，确保保存的是当前状态的完整副本
        try {
            const clonedMatrixData = this.deepClone(matrixData);

            // 创建历史记录条目
            const historyEntry = {
                matrixData: clonedMatrixData,
                description: description,
                timestamp: Date.now()
            };

            // 添加到撤销栈
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
     * 执行撤销操作
     * @returns {Object|null} 撤销后的历史记录条目
     */
    undo: function () {
        if (state.undoStack.length === 0) {
            return null;
        }

        // 从撤销栈弹出最后一个条目
        const historyEntry = state.undoStack.pop();

        // 将其添加到重做栈
        state.redoStack.push(historyEntry);

        console.log('执行撤销操作:', historyEntry);
        console.log(`撤销栈大小: ${state.undoStack.length}, 重做栈大小: ${state.redoStack.length}`);

        // 返回上一个历史记录（如果有）
        if (state.undoStack.length > 0) {
            const previousEntry = state.undoStack[state.undoStack.length - 1];
            console.log('返回上一个历史记录:', previousEntry);
            return previousEntry;
        } else {
            // 没有更多历史记录，返回初始状态
            console.log('返回初始状态:', state.initialMatrixData);
            return { matrixData: state.initialMatrixData, description: '初始状态' };
        }
    },

    /**
     * 执行重做操作
     * @returns {Object|null} 重做后的历史记录条目
     */
    redo: function () {
        if (state.redoStack.length === 0) {
            return null;
        }

        // 从重做栈弹出最后一个条目
        const historyEntry = state.redoStack.pop();

        // 将其添加回撤销栈
        state.undoStack.push(historyEntry);

        console.log('执行重做操作:', historyEntry);
        console.log(`撤销栈大小: ${state.undoStack.length}, 重做栈大小: ${state.redoStack.length}`);

        return historyEntry;
    },



    /**
     * 清空重做栈
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
     * @returns {number} 撤销栈大小
     */
    getUndoStackSize: function () {
        return state.undoStack.length;
    },

    /**
     * 获取重做栈大小
     * @returns {number} 重做栈大小
     */
    getRedoStackSize: function () {
        return state.redoStack.length;
    },

    /**
     * 格式化历史记录中的系数
     * 将分数形式的系数转换为更友好的格式
     * @param {string} description - 历史记录描述
     * @returns {string} 格式化后的描述
     */
    formatHistoryDescription: function (description) {
        if (!description || typeof description !== 'string') {
            return description || '';
        }
        
        let formattedDescription = description;
        
        // 模式1：处理加减操作中的系数（如 r3 + 1×r2 → r3 + r2）
        const addSubtractPattern = /(r\d+|c\d+)\s*([+\-])\s*(\d+\/\d+|\d+)\s*×\s*(r\d+|c\d+)/g;
        formattedDescription = formattedDescription.replace(addSubtractPattern, (match, target, operator, coefficient, param) => {
            // 格式化系数
            let formattedCoefficient = coefficient;
            if (coefficient.includes('/')) {
                const [numerator, denominator] = coefficient.split('/');
                if (denominator === '1') {
                    formattedCoefficient = numerator;
                }
            }
            
            // 如果系数为1，则简化显示（如 r3 + 1×r2 → r3 + r2）
            if (formattedCoefficient === '1') {
                return `${target} ${operator} ${param}`;
            }
            
            return `${target} ${operator} ${formattedCoefficient}×${param}`;
        });
        
        // 模式2：处理倍乘操作中的系数（如 r1 × 3/1 → r1 × 3）
        const multiplyPattern = /(r\d+|c\d+)\s*×\s*(\d+\/\d+|\d+)/g;
        formattedDescription = formattedDescription.replace(multiplyPattern, (match, target, coefficient) => {
            // 格式化系数
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
     * 获取所有撤销历史记录的描述
     * @returns {Array} 历史记录描述数组
     */
    getUndoHistoryDescriptions: function () {
        return state.undoStack.map(entry => this.formatHistoryDescription(entry.description));
    }
};

// 导出模块（如果使用模块化系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}