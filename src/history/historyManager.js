import { state } from '../state/state.js';

export const HistoryManager = {
    init: function () {
        if (!state.undoStack) {
            state.undoStack = [];
        }
        if (!state.redoStack) {
            state.redoStack = [];
        }
        console.log('历史记录管理模块初始化完成');
    },

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

    addHistory: function (matrixData, description) {
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

    undo: function () {
        if (state.undoStack.length === 0) {
            return null;
        }

        const historyEntry = state.undoStack.pop();

        state.redoStack.push(historyEntry);

        console.log('执行撤销操作:', historyEntry);
        console.log(`撤销栈大小: ${state.undoStack.length}, 重做栈大小: ${state.redoStack.length}`);

        if (state.undoStack.length > 0) {
            const previousEntry = state.undoStack[state.undoStack.length - 1];
            console.log('返回上一个历史记录:', previousEntry);
            return previousEntry;
        } else {
            console.log('返回初始状态:', state.initialMatrixData);
            return { matrixData: state.initialMatrixData, description: '初始状态' };
        }
    },

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

    clearRedoStack: function () {
        state.redoStack = [];
        console.log('重做栈已清空');
    },

    clearAllHistory: function () {
        state.undoStack = [];
        state.redoStack = [];
        console.log('所有历史记录已清空');
    },

    getUndoStackSize: function () {
        return state.undoStack.length;
    },

    getRedoStackSize: function () {
        return state.redoStack.length;
    },

    formatHistoryDescription: function (description) {
        if (!description || typeof description !== 'string') {
            return description || '';
        }

        let formattedDescription = description;

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

    getUndoHistoryDescriptions: function () {
        return state.undoStack.map(entry => this.formatHistoryDescription(entry.description));
    }
};
