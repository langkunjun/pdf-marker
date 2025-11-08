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

        // 更新页数到store（只在页数未设置时更新，避免触发无限循环）
        const currentFile = useMarkerStore.getState().files[fileId];
        const pageCount = pdfDocument.numPages;
        console.log('[PdfMarkerViewer] Total pages:', pageCount);
        if (!currentFile?.pageCount) {
          const { updateFilePageCount } = useMarkerStore.getState();
          updateFilePageCount(fileId, pageCount);
        }

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
      <div style={{
        padding: '16px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '4px',
        color: '#991b1b'
      }}>
        Error loading PDF: {error}
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'relative', 
      display: 'inline-block',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(243, 244, 246, 0.9)',
          zIndex: 10
        }}>
          <div style={{
            border: '2px solid #2563eb',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ marginLeft: '8px' }}>Loading PDF...</span>
        </div>
      )}
      <canvas ref={canvasRef} />
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        right: 0, 
        bottom: 0, 
        left: 0 
      }}>
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
