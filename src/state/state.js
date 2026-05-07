// ==================== 全局状态对象 ====================
// 应用核心状态，只导入CONFIG，无其他应用依赖
import { CONFIG } from '../config.js';

export const state = {
    // 网格相关状态
    currentHoverCell: null,
    lastSelectedDimension: CONFIG.INITIAL_DIMENSION,
    gridCells: [],
    gridInputs: [],

    // 状态机核心
    currentState: CONFIG.STATES.INIT,
    matrixData: null,                        // { rows, cols, elements }
    previousStates: [],                      // 状态级撤销栈（非变换级）
    quickInputAdded: false,

    // 屏幕类型
    isMobile: false,

    // 变换级撤销/重做（由HistoryManager管理）
    undoStack: [],
    redoStack: [],
    initialMatrixData: null,                 // 初始矩阵快照，用于撤销到原始状态

    // 行列索引事件相关
    rowColumnIndexEventListener: null,
    isRowColumnIndexEventsBound: false,
    selectedMatrixElements: [],              // 矩阵元素选中状态

    // 行列切换状态（目标/参数二选一激活）
    targetIsActive: false,
    paramIsActive: false,

    // 初等变换参数
    transformTarget: null,                   // 目标行/列，如 "r1"
    transformCoefficient: null,              // 变换系数
    transformParam: null,                    // 参数行/列，如 "r2"

    // 帮助系统
    helpContentIndex: -1,
};
