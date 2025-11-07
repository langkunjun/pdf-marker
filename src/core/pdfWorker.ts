// 默认使用 CDN 上的稳定 legacy 版本（与 package.json 中的 2.16.105 对齐）
let currentWorkerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/legacy/build/pdf.worker.min.js';

// 声明全局 require 类型（用于 CommonJS 环境）
declare const require: any;

// 兼容 legacy 和非 legacy 版本的导入方式（运行时动态获取）
function getGlobalWorkerOptions(): any {
  try {
    // 尝试从全局对象获取（如果已加载）
    if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
      return (window as any).pdfjsLib.GlobalWorkerOptions;
    }
    // 尝试动态 require（CommonJS 环境）
    if (typeof require !== 'undefined') {
      try {
        const pdfjs = require('pdfjs-dist/legacy/build/pdf');
        return pdfjs.GlobalWorkerOptions || pdfjs.default?.GlobalWorkerOptions;
      } catch {
        const pdfjs = require('pdfjs-dist');
        return pdfjs.GlobalWorkerOptions || pdfjs.default?.GlobalWorkerOptions;
      }
    }
  } catch (_) {
    // 忽略
  }
  // 如果都失败，返回一个空对象（运行时可能会失败，但至少不会在构建时报错）
  return {};
}

export function setPdfWorkerSrc(src: string) {
  if (src && typeof src === 'string') {
    currentWorkerSrc = src;
    try {
      const GlobalWorkerOptions = getGlobalWorkerOptions();
      if (GlobalWorkerOptions) {
        GlobalWorkerOptions.workerSrc = currentWorkerSrc;
      }
    } catch (_) {
      // 旧环境容错
    }
  }
}

export function ensurePdfWorkerConfigured() {
  try {
    const GlobalWorkerOptions = getGlobalWorkerOptions();
    if (GlobalWorkerOptions) {
      const existing = GlobalWorkerOptions.workerSrc;
      if (!existing) {
        GlobalWorkerOptions.workerSrc = currentWorkerSrc;
      }
    }
  } catch (_) {
    // 忽略
  }
}


