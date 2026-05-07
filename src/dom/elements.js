// ==================== DOM元素引用集合 ====================
// 所有DOM元素集中管理，纯DOM查询，无应用依赖
// 网格内的DOM元素不在此处，动态添加的DOM会后续补充到elements对象
export const elements = {
    // 主要界面元素
    windowDiv: document.getElementById('window'),
    coordinatesDiv: document.getElementById('coordinates'),
    undoButton: document.getElementById('undoButton'),
    nextButton: document.getElementById('nextButton'),
    inputMatrixDiv: document.getElementById('InputMatrix'),
    buttonInputMatrix: document.getElementById('ButtonInputMartix'),
    tipDiv: document.getElementById('tip'),
    header: document.querySelector('header'),

    // 更多菜单相关
    moreButton: document.getElementById('moreButton'),
    moreDropdown: document.getElementById('moreDropdown'),
    exportMatrixButton: document.getElementById('exportMatrixButton'),
    ButtonForceSimplify: document.getElementById('ButtonForceSimplify'),
    ButtonForceFactorize: document.getElementById('ButtonForceFactorize'),
    ButtonQuickInput: document.getElementById('ButtonQuickInput'),
    ButtonReplaceElement: document.getElementById('ButtonReplaceElement'),
    ButtonToggleHelp: document.getElementById('ButtonToggleHelp'),
    ButtonReset: document.getElementById('ButtonReset'),
    ButtonComputeDiagonalProduct: document.getElementById('ButtonComputeDiagonalProduct'),
    ButtonCreateAugmentedIdentity: document.getElementById('ButtonCreateAugmentedIdentity'),
    ButtonAddLamada: document.getElementById('ButtonAddLamada'),
    ButtonShowVersionAndUpdateTime: document.getElementById('ButtonShowVersionAndUpdateTime'),

    // 矩阵数据显示
    matrixDataDisplay: document.getElementById('matrixDataDisplay'),

    // 初等变换界面元素
    target: document.getElementById('target'),
    param: document.getElementById('param'),
    operatorButtons: document.querySelector('.operator-buttons'),
    transformTarget: document.getElementById('transform-target'),
    transformCoefficient: document.getElementById('transform-coefficient'),
    transformParam: document.getElementById('transform-param'),
    buttonChange: document.getElementById('button-change'),
    buttonAdd: document.getElementById('button-add'),
    buttonSub: document.getElementById('button-sub'),
    buttonMul: document.getElementById('button-mul'),
    buttonTranslate: document.getElementById('button-translate'),
    historyTransformation: document.getElementById('historyTransformation'),
    buttonUndo: document.getElementById('button-undoTransformation'),
    buttonRedo: document.getElementById('button-redoTransformation'),

    // 调试相关
    buttonTest: document.getElementById('ButtonTest'),

    // 弹窗相关
    popupBox: document.getElementById('popupBox'),
    popupCentreContainer: document.getElementById('popupCentreContainer'),

    // 帮助相关
    helpDiv: document.getElementById('help'),
    contentbox: document.getElementById('contentbox'),
    scrollLeft: document.getElementById('scroll-left'),
    scrollRight: document.getElementById('scroll-right'),

    // 计算结果展示
    result: document.getElementById('result'),

    // 预览矩阵相关
    matrixPreviewRow: document.getElementById('matrix-preview-row'),
    previewArrowSection: document.getElementById('preview-arrow-section'),
    previewHintText: document.getElementById('preview-hint-text'),
    previewArrowIcon: document.getElementById('preview-arrow-icon'),
    previewTableWrapper: document.getElementById('preview-table-wrapper'),
    previewTable: document.getElementById('preview-table'),
    previewMask: document.getElementById('preview-mask'),
};
