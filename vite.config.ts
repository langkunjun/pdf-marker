import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      // 兼容 React 16：将 react/jsx-runtime 映射到 react（React 16 不支持 jsx-runtime）
      'react/jsx-runtime': 'react',
      'react/jsx-dev-runtime': 'react',
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /pdfjs-dist/],
      // 改善 CJS/ESM 默认导出互操作，避免默认导出报错
      defaultIsModuleExports: 'auto',
      // 添加这些配置来处理 pdfjs-dist 的命名导出
      esmExternals: true,
      requireReturnsDefault: 'auto',
      transformMixedEsModules: true
    },
    lib: {
      entry: 'src/index.ts',
      name: 'PdfMarker',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.esm.js' : 'index.js'),
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom', 
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'pdfjs-dist',
        'pdfjs-dist/build/pdf',
        'pdfjs-dist/legacy/build/pdf',
        'pdfjs-dist/legacy/build/pdf.worker.min.js',
        'pdfjs-dist/legacy/build/pdf.worker.entry',
        'uuid', 
        'zustand', 
        'react-rnd',
        'pako'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'pdfjs-dist': 'pdfjsLib',
          'pdfjs-dist/build/pdf': 'pdfjsLib',
        },
        // 关键：处理模块互操作
        interop: 'auto',
        // 确保命名导出正常工作
        preserveModules: false,
        exports: 'auto'
      },
    },
    sourcemap: true,
    target: 'es2015',
    outDir: 'dist',
    emptyOutDir: true,
    // 添加 minify 配置
    minify: 'esbuild',
  },
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: true,
      outDir: 'dist',
      insertTypesEntry: true,
      // 确保类型正确生成
      compilerOptions: {
        preserveSymlinks: false
      }
    }),
  ],
  optimizeDeps: {
    include: [
      'pdfjs-dist/build/pdf',
      'pako'
    ],
    // 添加 esbuild 配置
    esbuildOptions: {
      format: 'esm',
      target: 'es2015'
    }
  }
});