import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'PdfMarker',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.esm.js' : 'index.js'),
    },
    rollupOptions: {
      // React 16 不需要 react/jsx-runtime，移除它
      external: ['react', 'react-dom', 'pdfjs-dist', 'pdfjs-dist/legacy/build/pdf', 'pdf-lib', 'uuid', 'zustand', 'react-rnd'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    target: 'es2015',
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: true,
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
});


