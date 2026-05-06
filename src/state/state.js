import { CONFIG } from '../config.js';

export const state = {
    currentHoverCell: null,
    lastSelectedDimension: CONFIG.INITIAL_DIMENSION,
    gridCells: [],
    gridInputs: [],
    currentState: CONFIG.STATES.INIT,
    matrixData: null,
    previousStates: [],
    quickInputAdded: false,
    isMobile: false,

    undoStack: [],
    redoStack: [],
    initialMatrixData: null,

    rowColumnIndexEventListener: null,
    isRowColumnIndexEventsBound: false,
    selectedMatrixElements: [],

    targetIsActive: false,
    paramIsActive: false,
    transformTarget: null,
    transformCoefficient: null,
    transformParam: null,

    helpContentIndex: -1,
};
