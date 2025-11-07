import { GlobalWorkerOptions } from 'pdfjs-dist';

// 默认使用 CDN 上的稳定版本（与 package.json 中的 2.16.105 对齐）
let currentWorkerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

export function setPdfWorkerSrc(src: string) {
  if (src && typeof src === 'string') {
    currentWorkerSrc = src;
    try {
      // 立即生效
      (GlobalWorkerOptions as any).workerSrc = currentWorkerSrc;
  } catch (_) {
      // 旧环境容错
    }
  }
}

export function ensurePdfWorkerConfigured() {
  try {
    const existing = (GlobalWorkerOptions as any).workerSrc;
      if (!existing) {
      (GlobalWorkerOptions as any).workerSrc = currentWorkerSrc;
    }
  } catch (_) {
    // 忽略
  }
}


