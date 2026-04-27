// 帮助内容：简洁易懂，避免编程专业术语
const helpContent = [
    '<h4>怎样录入矩阵？</h4><p>1.点击页面顶部的“录入矩阵”按钮，点击网格来选择矩阵的行数和列数；选好后点击下一步。</p><p>2.点击对应单元格输入矩阵元素，点击下一步完成录入。</p><p>3.若发现输入的元素有误，或矩阵维度错误，可以点击上一步到对应页面修改。</p>',

    '<h4>这种矩阵录入方式太麻烦了，有没有更简单的录入方式？</h4><p>点击“更多”按钮，选择“导入二维数组为矩阵”，可以输入标准二维数组格式的矩阵数据，例如：[[1,2],[3,4]]。</p><p>输入完成后点击“录入矩阵”按钮，即可完成录入。</p>',

    '<h4>这些目标行/列，系数，参数行/列，以及变换符号，是什么意思，有什么用？</h4><p>目标行/列：你要进行变换的那一行或列</p><p>系数：变换时乘的倍数</p><p>参数行/列：参与变换的另一行或列</p><p>变换符号：↔（交换目标行列和参数行列的位置）、+（向目标行列加上系数*参数行列）、−（向目标行列减去系数*参数行列）、×（对目标行列倍乘）</p>',

    '<h4>怎样进行初等变换？</h4><p>1. 先选择要变换的行或列（如r1、c2）。</p><p>2. 选择变换符号（↔、+、−、×）。</p><p>3. 如果需要，输入系数和选择参数行/列。</p><p>4. 点击“执行初等变换”按钮完成变换。</p>',

    '<h4>怎样选择要变换的行或列，以及符号？</h4><p>1.点击下拉三角选择对应行/列。</p>另一种选择方式：先点击“目标行/列”所在框，再点击矩阵表格中对应的行或列（如r1、c2等），即可选中；参数行/列同理。</p><p>2.点击中间的↔、+、−、×按钮即可选中。</p>',

    '<h4>我输错了初等变换数据，还点击了“执行初等变换”按钮，怎么办？</h4><p>点击“撤销初等变换”按钮可以撤销到上一次变换之前。</p><p>如果需要重做，点击“重做初等变换”按钮。系统支持多步撤销和重做。</p>',

    '<h4>初等变换后，矩阵元素好复杂，看不出元素之间的关系，怎么办？</h4><p>1.点击你认为复杂的矩阵元素。</p><p>2.点击“更多”按钮，选择“多项式展开”可以展开复杂的数学表达式。选择“一元多项式因式分解”可以因式分解（复杂多项式可能无法识别）。</p><p>若对处理结果不满意，可以点击“替换矩阵元素”按钮对单个矩阵元素进行替换。</p>',

    '<h4>我想把变换好后的矩阵发给别人看，怎样将矩阵导出？</h4><p>点击“更多”按钮，选择“导出矩阵为二维数组”，系统会生成标准的二维数组格式，可以直接复制粘贴到其他地方使用。</p>',

    '<h4>这三个方阵特色功能有什么用？</h4><p>“计算对角线乘积”：计算矩阵的对角线乘积，可用于计算行列式、特征值等多种用途。</p><p>“生成增广单位矩阵”：在原先矩阵的右侧，新增同等大小的单位矩阵，用于求逆矩阵。</p><p>“生成含λ的矩阵”：生成的矩阵的所有对角线元素都会变成原值-λ，可用于特征值计算。搭配“计算对角线乘积”功能，可以快速计算特征值。</p>',

    '<h4>这个帮助板块很显眼，能关闭吗？</h4><p>点击“更多”按钮，选择“关闭帮助”即可关闭。</p><p>若使用本地完整版，在config.js中修改UI_CONFIG.DISPLAY_HELP的值为false，即可永久关闭帮助板块。</p>',

    '<h4>发现程序有bug，在哪里反馈？</h4><p>在“更多”中，点击“跳转github仓库”，在issue页面反馈。</p>',
]
let currentIndex = state.helpContentIndex;//值为-1

/**
 * 切换帮助内容
 */
function switchContent(isNext) {
    // 计算索引
    if (isNext) {
        currentIndex = (currentIndex + 1) % helpContent.length;
    } else {
        currentIndex = (currentIndex - 1 + helpContent.length) % helpContent.length;
    }

    // 写入HTML内容（精准匹配你的结构）
    elements.contentbox.innerHTML = helpContent[currentIndex];

    // 更新导航小点状态
    updateNavigationDots();

}

/**
 * 创建导航小点
 */
function createNavigationDots() {
    if (!elements.helpDiv) {
        console.log('helpDiv不存在');
        return;
    }

    // 先检查是否已经存在导航小点，避免重复创建
    if (document.getElementById('navigation-dots')) {
        return;
    }

    // 创建导航小点容器
    const dotsContainer = document.createElement('div');
    dotsContainer.id = 'navigation-dots';
    dotsContainer.style.cssText = `
        position: absolute;
        bottom: 15px;
        right: 15px;
        display: flex;
        gap: 8px;
        z-index: 10;
    `;

    // 创建小点
    for (let i = 0; i < helpContent.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'nav-dot';
        dot.dataset.index = i;
        dot.style.cssText = `
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #ccc;
            cursor: pointer;
            transition: background-color 0.2s ease;
        `;

        // 点击小点切换内容
        dot.addEventListener('pointerup', function () {
            currentIndex = parseInt(this.dataset.index);
            elements.contentbox.innerHTML = helpContent[currentIndex];
            updateNavigationDots();
        });

        // 悬浮效果
        dot.addEventListener('mouseenter', function () {
            this.style.backgroundColor = '#999';
        });

        dot.addEventListener('mouseleave', function () {
            if (parseInt(this.dataset.index) !== currentIndex) {
                this.style.backgroundColor = '#ccc';
            }
        });

        dotsContainer.appendChild(dot);
    }

    elements.helpDiv.appendChild(dotsContainer);

    // 初始化小点状态
    updateNavigationDots();

    console.log('导航小点创建完成，共创建了', helpContent.length, '个小点');
}

/**
 * 更新导航小点状态
 */
function updateNavigationDots() {
    const dots = document.querySelectorAll('.nav-dot');
    dots.forEach((dot, index) => {
        if (index === currentIndex) {
            dot.style.backgroundColor = '#333';
        } else {
            dot.style.backgroundColor = '#ccc';
        }
    });
}

/**
 * 更新帮助板块显示状态
 */
function updateDisplayHelp() {
    if (CONFIG.UI_CONFIG.DISPLAY_HELP) {
        elements.helpDiv.style.display = 'block';
        createNavigationDots();//显示帮助板块的导航小点
        console.log('帮助板块已显示');
    } else {
        elements.helpDiv.style.display = 'none';
        console.log('帮助板块已关闭');
    }
}