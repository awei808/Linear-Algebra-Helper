//这里填要展示给用户看的帮助内容，要求简洁易懂，不搞编程专业术语，以html格式记录在数组中，暂未写入html
const helpContent = [
    '<p>帮助内容1</p>',
    '<p>帮助内容2</p>',
    '<p>帮助内容3</p>',
    '<p>帮助内容4</p>',
]
let currentIndex = state.helpContentIndex;//值为0

/**
 * 切换帮助内容
 */
function switchContent(isNext) {
    // 0.3秒隐藏动画
    elements.contentbox.style.opacity = '0';

    setTimeout(() => {
        // 计算索引
        if (isNext) {
            currentIndex = (currentIndex + 1) % helpContent.length;
        } else {
            currentIndex = (currentIndex - 1 + helpContent.length) % helpContent.length;
        }
        
        // 写入HTML内容（精准匹配你的结构）
        elements.contentbox.innerHTML = helpContent[currentIndex];
        
        // 0.3秒显示动画
        elements.contentbox.style.opacity = '1';
    }, 300);
}
