#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('正在生成版本信息...');

let gitHash = '1.0.0';
let gitDate = new Date().toISOString().split('T')[0];

try {
    // 获取Git提交哈希（短版本）
    gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    
    // 获取最新提交日期
    gitDate = execSync('git log -1 --format=%cd --date=short', { encoding: 'utf8' }).trim();
    
    console.log('✓ 成功获取Git信息');
} catch (error) {
    console.log('⚠️  无法获取Git信息，使用默认值');
}

// 生成版本文件内容
const versionContent = `// 自动生成版本信息
export const VERSION = {
    NUMBER: '${gitHash}',
    DATE: '${gitDate}',
    DESCRIPTION: '初等变换辅助学习',
    VERSION: '3.1',
};

export function showVersionAndUpdateTime() {
    const version = VERSION ? VERSION.NUMBER : '1.0.0';
    const updateTime = VERSION ? VERSION.DATE : '2023-12-31';
    alert(\`当前版本：\${version}\\n更新时间：\${updateTime}\`);
}

export function displayVersionInfo() {
    if (document.getElementById('version-info')) return;
    const versionDiv = document.createElement('div');
    versionDiv.id = 'version-info';
    versionDiv.style.cssText = 'position:fixed;bottom:5px;right:5px;font-size:12px;color:#999;z-index:100;';
    const version = VERSION ? VERSION.NUMBER : '1.0.0';
    const date = VERSION ? VERSION.DATE : '2023-12-31';
    versionDiv.innerHTML = \`版本 \${version} | \${date}\`;
    document.body.appendChild(versionDiv);
}
`;

// 写入文件
const versionFile = path.join(__dirname, 'src', 'version.js');

fs.writeFileSync(versionFile, versionContent, 'utf8');

console.log('\n版本生成完成！');
console.log(`版本号: ${gitHash}`);
console.log(`日期: ${gitDate}`);
console.log(`文件: ${versionFile}`);

if (process.stdin.isTTY) {
    console.log('\n按任意键退出...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
}