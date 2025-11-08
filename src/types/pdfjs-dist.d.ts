// pdfjs-dist 类型定义
// 支持 legacy 和非 legacy 版本的导入

declare module 'pdfjs-dist/legacy/build/pdf' {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }
  
  export interface PDFPageProxy {
    getViewport(params: { scale: number; rotation?: number }): PageViewport;
    render(params: RenderParameters): RenderTask;
  }
  
  export interface PageViewport {
    width: number;
    height: number;
    scale: number;
    rotation: number;
  }
  
  export interface RenderParameters {
    canvasContext: CanvasRenderingContext2D;
    viewport: PageViewport;
  }
  
  export interface RenderTask {
    promise: Promise<void>;
  }
  
  export interface LoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }
  
  export function getDocument(src: string | { url: string } | { data: Uint8Array }): LoadingTask;
}

declare module 'pdfjs-dist/build/pdf' {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }
  
  export interface PDFPageProxy {
    getViewport(params: { scale: number; rotation?: number }): PageViewport;
    render(params: RenderParameters): RenderTask;
  }
  
  export interface PageViewport {
    width: number;
    height: number;
    scale: number;
    rotation: number;
  }
  
  export interface RenderParameters {
    canvasContext: CanvasRenderingContext2D;
    viewport: PageViewport;
  }
  
  export interface RenderTask {
    promise: Promise<void>;
  }
  
  export interface LoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }
  
  export function getDocument(src: string | { url: string } | { data: Uint8Array }): LoadingTask;
}

declare module 'pdfjs-dist/build/pdf.worker.js' {
  const workerSrc: string;
  export default workerSrc;
}

