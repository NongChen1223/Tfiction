import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // 路径别名配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },

    // 开发服务器配置
    server: {
      port: 5173,
      strictPort: true,
      host: '0.0.0.0',
    },

    // 构建配置
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'prod',
      minify: mode === 'prod' ? 'esbuild' : false,
      // 构建目标：支持更多浏览器
      target: 'es2015',
      rollupOptions: {
        output: {
          // 分包策略
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'utils': ['zustand', 'clsx'],
          },
        },
      },
    },

    // 环境变量前缀
    envPrefix: 'VITE_',

    // 优化配置
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand'],
    },
  }
})
