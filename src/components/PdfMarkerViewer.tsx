import React, { useEffect, useRef, useState } from 'react';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { ensurePdfWorkerConfigured } from '../core/pdfWorker';
import { useMarkerStore } from '../core/markerStore';
import { RegionLayer } from './RegionLayer';

// 确保在不同打包环境下 worker 被正确配置（React16 / Webpack4 兼容）
ensurePdfWorkerConfigured();

interface Props {
  fileId: string;
  fileUrl: string;
  pageIndex?: number; // 0-based
  isEditing: boolean;
  onRegionClick?: (regionId: string) => void;
  onRegionDelete?: (regionId: string) => void;
  onError?: (error: string) => void;
}

export const PdfMarkerViewer: React.FC<Props> = ({ 
  fileId, 
  fileUrl, 
  pageIndex = 0,
  onRegionClick,
  onRegionDelete,
  isEditing,
  onError 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.5); // PDF 渲染缩放比例

  useEffect(() => {
    console.log('[PdfMarkerViewer] useEffect called', fileId, fileUrl, pageIndex);
    let mounted = true;
    let pdfDocument: any = null;

    const loadPdf = async () => {
      try {
        console.log('[PdfMarkerViewer] loadPdf starting...');
        setIsLoading(true);
        setError(null);
        
        // 只在文件不存在时添加文件到store，避免重复添加
        const { files, addFile } = useMarkerStore.getState();
        console.log('[PdfMarkerViewer] checking if file exists:', fileId, !!files[fileId]);
        if (!files[fileId]) {
          console.log('[PdfMarkerViewer] adding file to store');
          addFile({ 
            id: fileId, 
            name: fileUrl.split('/').pop() || 'PDF', 
            url: fileUrl, 
            regions: [] 
          });
        }

        // 加载PDF文档
        console.log('[PdfMarkerViewer] Loading PDF document...');
        pdfDocument = await getDocument({
          url: fileUrl,
        }).promise;
        console.log('[PdfMarkerViewer] PDF document loaded');

        if (!mounted) return;

        // 更新页数到store
        const { updateFilePageCount } = useMarkerStore.getState();
        const pageCount = pdfDocument.numPages;
        console.log('[PdfMarkerViewer] Total pages:', pageCount);
        updateFilePageCount(fileId, pageCount);

        console.log('[PdfMarkerViewer] Getting page ...', pageIndex + 1);
        const page = await pdfDocument.getPage(pageIndex + 1);
        console.log('[PdfMarkerViewer] Got page', pageIndex + 1);
        
        const viewport = page.getViewport({ scale: 1.5 });
        
        // 等待 canvas 元素挂载
        let retries = 0;
        while (!canvasRef.current && retries < 10) {
          console.log('[PdfMarkerViewer] Waiting for canvas, retry:', retries);
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        const canvas = canvasRef.current;
        if (!canvas) {
          console.log('[PdfMarkerViewer] Canvas is null after retries!');
          return;
        }
        
        console.log('[PdfMarkerViewer] Canvas found');

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.log('[PdfMarkerViewer] Context is null!');
          return;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        console.log('[PdfMarkerViewer] Canvas size set:', viewport.width, viewport.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        console.log('[PdfMarkerViewer] Rendering page...');
        await page.render(renderContext).promise;
        console.log('[PdfMarkerViewer] Page rendered successfully');
        
        if (!mounted) return;
        console.log('[PdfMarkerViewer] Setting loading to false');
        setIsLoading(false);
      } catch (err) {
        console.error('[PdfMarkerViewer] Error loading PDF:', err);
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
        console.log('[PdfMarkerViewer] Setting error and loading to false');
        setError(errorMessage);
        onError?.(errorMessage);
        setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      mounted = false;
      if (pdfDocument) {
       pdfDocument.destroy().catch(() => {});
       }
     };
  }, [fileId, fileUrl, pageIndex, onError]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
        Error loading PDF: {error}
      </div>
    );
  }

  return (
    <div className="relative inline-block border shadow">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading PDF...</span>
        </div>
      )}
      <canvas ref={canvasRef} />
      <div className="absolute inset-0">
        <RegionLayer
          fileId={fileId}
          scale={scale}
          onRegionClick={onRegionClick}
          isEditing={isEditing}
          onRegionDelete={onRegionDelete}
          filterPageIndex={pageIndex}
        />
      </div>
    </div>
  );
};
