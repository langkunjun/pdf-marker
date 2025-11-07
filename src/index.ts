// 确保在首次使用前就配置好 worker 源
import { ensurePdfWorkerConfigured } from './core/pdfWorker';
ensurePdfWorkerConfigured();

export * from './components/PdfMarkerViewer';
export * from './components/RegionLayer';
export * from './components/FileTabs';
export * from './hooks/useMarkerStore';
export * from './core/markerStore';
export * from './core/regionManager';
export * from './core/imageUtils';
export * from './core/filePreviewGenerator';
export * from './core/types';
export { setPdfWorkerSrc } from './core/pdfWorker';