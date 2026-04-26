//临时调试文件
// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    // 等待DOM完全加载后初始化
    setTimeout(initTest, 100);
});
// 为测试按钮绑定点击事件
function initTestButton() {
    const buttonTest = document.getElementById('ButtonTest');
    const buttonTestConfirmPopup = document.getElementById('ButtonTestCofirmPopup');

    if (buttonTest) {
        buttonTest.addEventListener('click', handleTestButtonClick);
        buttonTest.style.display = 'block';
    }
    if (buttonTestConfirmPopup) {
        buttonTestConfirmPopup.addEventListener('click', handleTestConfirmPopupClick);
        buttonTestConfirmPopup.style.display = 'block';
    }
}

// 处理测试按钮点击事件
function handleTestButtonClick() {
    // 1. 触发快速录入功能
    handleQuickInputClick();

    // 等待输入框创建完成
    setTimeout(() => {

        // 3. 设置输入框的值为测试矩阵
        // 备用矩阵，用于测试快速录入功能
        // const martix="[[.2,2**3,a**3,4,2*(15xy+4a)+a],[1.2,7,2x + 3x -5+7,9abc,10a+16abc+xyz],[11,1.2x,3*(a+b),(y+9a)/14,2*(15xy+4a)+a]]";

        // 备用矩阵，用于测试初等变换功能，进阶功能
        // const martix="[[.2,2x,4x,15x],[.5,7,2x + 3x -5+7,9x],[11,1.2x,3*x,14x]]";
         const martix="[[2x,15x],[x,6x]]";
        // const martix="[[2,15],[3,6]]";

        // 备用矩阵，用于测试进阶功能（对角线乘积、增广矩阵等）
        //const martix="[[2 * (x - 2) * (x + 2),(x + 3) * (x + 4),(2*x - 3)^2],[3 * (x + 2) * (x^2 - 2*x + 4),x * (x - 3)^2,(x - 2) * (x + 2) * (x^2 + 4)],[(2*x - 5) * (3*x + 2),(x - 1)^2 * (x + 1)^2,5*x * (x - 3) * (x + 3)]]";
        // const martix="[[x,2y,3z],[4x,5y,6z],[7x,8y,9z]]"; // 3x3变量矩阵，测试符号计算
        // const martix="[[a+b,2*c,3*d],[4,5,6],[7,8,9]]"; // 3x3复杂表达式，测试表达式处理

        // 备用矩阵，用于测试多项式分解和展开功能
        // const martix="[[2*x^2 - 8,x^2 + 7*x + 12,4*x^2 - 12*x + 9],[3*x^3 + 24,x^3 - 6*x^2 + 9*x,x^4 - 16],[6*x^2 - 11*x - 10,x^4 - 2*x^2 + 1,5*x^3 - 45*x]]";
        // const martix="[[2 * (x - 2) * (x + 2),(x + 3) * (x + 4),(2*x - 3)^2],[3 * (x + 2) * (x^2 - 2*x + 4),x * (x - 3)^2,(x - 2) * (x + 2) * (x^2 + 4)],[(2*x - 5) * (3*x + 2),(x - 1)^2 * (x + 1)^2,5*x * (x - 3) * (x + 3)]]";

        // 备用矩阵，用于测试校验功能
        // const martix="";
        // const martix="[1,2,3;[4,5,6]]";
        // const martix="[[1,2,3],[4,5]]";
        // const martix="[[1,2e,3],[4,5,6]]";
        // const martix="[[2x++,3y],[4z,5λ]]";
        // const martix="[[1.5,invalid],[3.75,4.125]]";
        // const martix="[[1.5,1.2x3.4],[3.75,4.125]]";//这里会有问题


        elements.quickInput.value = martix;
        handleQuickInputMatrix();
        showSuccess('测试矩阵已加载到快速录入输入框');
    }, 100);
}

function handleTestConfirmPopupClick() {
    // 触发确认弹窗
    console.log('测试确认弹窗点击事件');
    popupCentreManager.showConfirmPopup(
        '确定要执行此操作吗？',
        function () {
            showSuccess('确认操作已执行');
        },
        function () {
            showWarning('操作已取消');
        }
    );
}

/**
 * 初始化测试功能
 */
function initTest() {
    // 为测试按钮绑定点击事件
    if (CONFIG.TEST_CONFIG.TEST_MODE) {
        initTestButton();
    }
}