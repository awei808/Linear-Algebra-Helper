import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ command, mode }) => {
  const isSingleFile = mode === 'single';  // 判断是否为单文件模式

  return {
    base: './',
    plugins: [
      // 其他插件（如果有）...
      isSingleFile && viteSingleFile(),     // 仅在单文件模式下启用
    ].filter(Boolean),                     // 过滤掉 false
    build: {
      outDir: isSingleFile ? 'dist-single' : 'dist', // 可选：分开放置
      // 其它构建选项...
    },
  };
});