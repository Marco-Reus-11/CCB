import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('emoji-')
          }
        }
      }),
      viteCompression({
        verbose: true,       // 打印压缩结果
        disable: false,      // 启用压缩
        threshold: 10240,    // 大于 10kb 才压缩
        algorithm: 'gzip',   // 可选 'gzip' 或 'brotliCompress'
        ext: '.gz'           // 生成的压缩文件后缀
      }),
      visualizer({ open: true }) // 构建后自动打开打包分析
    ],

    server: {
      host: 'localhost',
      port: 5173,
      open: true,
      proxy: {
        '/socket.io': {
          target: env.VITE_BASE_URL,
          ws: true,
          changeOrigin: true
        }
      }
    },

    build: {
      target: 'es2015',
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
              return 'images/[name]-[hash][extname]'
            }
            if (/\.css$/.test(name ?? '')) {
              return 'css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
          manualChunks(id) {
            // 把 node_modules 拆分到 vendor
            if (id.includes('node_modules')) {
              return 'vendor'
            }
            // 可以按需拆分大包，例如 vue、axios、pinia
            if (id.includes('vue')) {
              return 'vue'
            }
            if (id.includes('axios')) {
              return 'axios'
            }
          }
        }
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }
  }
})
