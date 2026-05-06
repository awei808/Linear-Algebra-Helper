export const CONFIG = {
    GRID_SIZE: 10,
    INITIAL_DIMENSION: '0×0',

    SCREEN_SIZES: {
        MOBILE_MAX: 768,
        TABLET_MAX: 1024,
        DESKTOP_MIN: 1025
    },

    DEFAULT_INPUT_DIMENSIONS: {
        width: 60,
        height: 50
    },

    STATES: {
        INIT: 'init',
        SELECT_DIMENSION: 'select_dimension',
        INPUT_ELEMENTS: 'input_elements',
        ELEMENTARY_TRANSFORMATION: 'elementary_transformation'
    },

    POPUP_CONFIG: {
        MAX_POPUPS: 3,
        TIMEOUT: 2500,
        STYLES: {
            SUCCESS: 'success-popup',
            ERROR: 'error-popup',
            WARNING: 'warning-popup'
        },
        ANIMATION: {
            DURATION: 300,
            EASING: 'ease-out'
        },
    },

    QUICK_INPUT_CONFIG: {
        MAX_LENGTH: 200
    },

    TRANSFORMATION_CONFIG: {
        VALUE_PROCESSING: {
            ALLOWED_VARIABLES: ['a', 'b', 'c', 'd', 'm', 'n', 'x', 'y', 'z', 'λ'],
            LEADING_ZERO_FOR_DECIMAL: true,
        },

        SYMBOLS: ['↔', '+', '−', '×'],
        OPERATORS: {
            SWAP: '↔',
            ADD: '+',
            SUBTRACT: '−',
            MULTIPLY: '×'
        },
        BUTTON_STYLES: {
            ACTIVE: 'activeButton',
            INACTIVE: 'inactiveButton'
        },
        HISTORY: {
            MAX_UNDO_STACK_SIZE: 20,
            MAX_REDO_STACK_SIZE: 20,
        }
    },

    MATRIX_CONFIG: {
        MAX_ROWS: 10,
        MAX_COLS: 10,
        MIN_ROWS: 1,
        MIN_COLS: 1,
        DEFAULT_VALUE: '0'
    },

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
        DISPLAY_HELP: true,
    },
    TEST_CONFIG: {
        TEST_MODE: false,
    },
};
