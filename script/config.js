const CONFIG = {
    // 网格配置
    GRID_SIZE: 10,
    INITIAL_DIMENSION: '0×0',

    // 屏幕大小定义（与CSS断点一致）
    SCREEN_SIZES: {
        MOBILE_MAX: 768,
        TABLET_MAX: 1024,
        DESKTOP_MIN: 1025
    },

    // 输入框默认尺寸（备用）
    DEFAULT_INPUT_DIMENSIONS: {
        width: 60,
        height: 50
    },

    // 状态定义
    STATES: {
        INIT: 'init', // 初始状态
        SELECT_DIMENSION: 'select_dimension',
        INPUT_ELEMENTS: 'input_elements',
        ELEMENTARY_TRANSFORMATION: 'elementary_transformation'  // 初等变换状态
    },

    // 弹窗配置
    POPUP_CONFIG: {
        MAX_POPUPS: 3,//最大弹窗数量
        TIMEOUT: 2500,//弹窗显示时间（毫秒）
        STYLES: {
            SUCCESS: 'success-popup',
            ERROR: 'error-popup',
            WARNING: 'warning-popup'
        },
        ANIMATION: {
            DURATION: 300,//动画持续时间（毫秒）
            EASING: 'ease-out'
        },
    },

    // 快速录入配置
    QUICK_INPUT_CONFIG: {
        MAX_LENGTH: 200
    },

    // 初等变换配置
    TRANSFORMATION_CONFIG: {
        VALUE_PROCESSING: {
            ALLOWED_VARIABLES: ['a', 'b', 'c', 'd', 'm', 'n', 'x', 'y', 'z', 'λ'],//允许作为未知数的字符
            LEADING_ZERO_FOR_DECIMAL: true,
        },

        SYMBOLS: ['↔', '+', '−', '×'],
        OPERATORS: {
            SWAP: '↔',
            ADD: '+',
            SUBTRACT: '−',
            MULTIPLY: '×'
        },
        // 按钮样式类名配置
        BUTTON_STYLES: {
            ACTIVE: 'activeButton',
            INACTIVE: 'inactiveButton'
        },
        // 历史记录配置
        HISTORY: {
            MAX_UNDO_STACK_SIZE: 20, // 最大撤销栈大小
            MAX_REDO_STACK_SIZE: 20, // 最大重做栈大小
        }
    },

    // 矩阵配置
    MATRIX_CONFIG: {
        MAX_ROWS: 10,
        MAX_COLS: 10,
        MIN_ROWS: 1,
        MIN_COLS: 1,
        DEFAULT_VALUE: '0'
    },

    // UI配置
    UI_CONFIG: {
        BUTTON_STATES: {
            ENABLED: {
                opacity: '1',
                cursor: 'pointer'
            },
            DISABLED: {
                opacity: '0.6',
                cursor: 'not-allowed'
            }
        },
        GRID_COLORS: {
            HIGHLIGHT: '#ffeb3b',
            NORMAL: '#f0f0f0',
            BORDER: '#ccc'
        },
        DISPLAY_HELP: true,//是否显示帮助板块
    }
};