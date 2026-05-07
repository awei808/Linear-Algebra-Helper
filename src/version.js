// 自动生成版本信息
export const VERSION = {
    NUMBER: 'e4cb244',
    DATE: '2026-05-06',
    DESCRIPTION: '初等变换辅助学习',
    VERSION: '3.1',
};

export function showVersionAndUpdateTime() {
    const version = VERSION ? VERSION.NUMBER : '1.0.0';
    const updateTime = VERSION ? VERSION.DATE : '2023-12-31';
    alert(`当前版本：${version}\n更新时间：${updateTime}`);
}

export function displayVersionInfo() {
    if (document.getElementById('version-info')) return;
    const versionDiv = document.createElement('div');
    versionDiv.id = 'version-info';
    versionDiv.style.cssText = 'position:fixed;bottom:5px;right:5px;font-size:12px;color:#999;z-index:100;';
    const version = VERSION ? VERSION.NUMBER : '1.0.0';
    const date = VERSION ? VERSION.DATE : '2023-12-31';
    versionDiv.innerHTML = `版本 ${version} | ${date}`;
    document.body.appendChild(versionDiv);
}
