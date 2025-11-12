import { create } from 'zustand';
import { FileState, Region } from './types';

// 标注全局状态
interface MarkerState {
  files: Record<string, FileState>;
  activeFileId?: string;
  currentPageIndexByFile: Record<string, number>;
  addFile: (file: FileState | FileState[], options?: { autoGetPageCount?: boolean }) => void;
  updateFilePageCount: (fileId: string, pageCount: number) => void;
  switchFile: (fileId: string) => void;
  setActivePage: (fileId: string, pageIndex: number) => void;
  updateFileRegions: (fileId: string, regions: Region[]) => void;
  removeFile: (fileId: string) => void;
  updateRegion: (fileId: string, regionId: string, updates: Partial<Region>) => void;
  // 向指定文件的指定区域插入图片（图片按“等比包含”缩放，并记录在 region.meta 中）
  insertImageIntoRegion: (fileId: string, regionId: string, imageSrc: string) => Promise<void>;
  splitPdfPages: (fileId: string, options?: { pageIndices?: number[], splitIntoIndividual?: boolean }) => Promise<Uint8Array | Uint8Array[]>;
  generateSignedPdf: (fileId: string, removeBackground?: boolean) => Promise<Uint8Array | null>;
}

// 使用最简单的zustand实现，避免任何复杂的比较逻辑
export const useMarkerStore = create<MarkerState>((set) => ({
  files: {},
  activeFileId: undefined,
  currentPageIndexByFile: {},
  addFile: (file, options = {}) => {
    console.log('[markerStore] addFile called', Array.isArray(file) ? file.length + ' files' : file.id);
    
    const { autoGetPageCount = false } = options;
    const filesArray = Array.isArray(file) ? file : [file];
    
    set((state) => {
      console.log('[markerStore] addFile - state before:', Object.keys(state.files));
      
      // 批量添加文件
      const newFiles: Record<string, FileState> = { ...state.files };
      const newPageIndexMap: Record<string, number> = { ...state.currentPageIndexByFile };
      let firstAddedFileId: string | undefined;
      
      filesArray.forEach((f) => {
        newFiles[f.id] = f;
        if (!(f.id in newPageIndexMap)) newPageIndexMap[f.id] = 0;
        if (!firstAddedFileId) firstAddedFileId = f.id;
      });
      
      const newState = {
        files: newFiles,
        activeFileId: state.activeFileId || firstAddedFileId,
        currentPageIndexByFile: newPageIndexMap,
      };
      console.log('[markerStore] addFile - state after:', Object.keys(newState.files));
      
      // 如果需要自动获取页数，异步处理
      if (autoGetPageCount) {
        Promise.resolve().then(async () => {
          // 使用 legacy 版本以兼容 React 16 / Webpack 4
          const { getDocument } = await import('pdfjs-dist/legacy/build/pdf');
          
          for (const f of filesArray) {
            try {
              const pdfDoc = await getDocument({ url: f.url }).promise;
              const pageCount = pdfDoc.numPages;
              
              // 使用 updateFilePageCount 更新页数
              useMarkerStore.getState().updateFilePageCount(f.id, pageCount);
              console.log(`[markerStore] Auto detected page count for ${f.id}: ${pageCount}`);
            } catch (error) {
              console.error(`[markerStore] Failed to get page count for ${f.id}:`, error);
            }
          }
        });
      }
      
      return newState;
    });
  },
  // 更新指定文件的页数
  updateFilePageCount: (fileId, pageCount) => {
    console.log('[markerStore] updateFilePageCount called', fileId, pageCount);
    set((state) => {
      const file = state.files[fileId];
      if (!file) {
        console.warn(`[markerStore] File ${fileId} not found when updating page count`);
        return state;
      }
      
      return {
        files: {
          ...state.files,
          [fileId]: { ...file, pageCount }
        }
      };
    });
  },
  // 切换指定文件
  switchFile: (fileId) => {
    console.log('[markerStore] switchFile called', fileId);
    set({ activeFileId: fileId });
  },
  // 设置指定文件的当前页码
  setActivePage: (fileId, pageIndex) => {
    console.log('[markerStore] setActivePage called', fileId, pageIndex);
    set((state) => {
      const file = state.files[fileId];
      if (!file) return state;
      const pageCount = (file as any).pageCount;
      const clampedIndex = typeof pageCount === 'number' ? Math.max(0, Math.min(pageIndex, pageCount - 1)) : Math.max(0, pageIndex);
      return {
        currentPageIndexByFile: {
          ...state.currentPageIndexByFile,
          [fileId]: clampedIndex,
        }
      } as any;
    });
  },
  // 更新指定文件的区域
  updateFileRegions: (fileId, regions) => {
    console.log('[markerStore] updateFileRegions called', fileId);
    set((state) => {
      const file = state.files[fileId];
      if (!file) return state;
      
      return {
        files: {
          ...state.files,
          [fileId]: { ...file, regions }
        }
      };
    });
  },
  // 删除指定文件
  removeFile: (fileId) => set((state) => {
    const { [fileId]: removed, ...remainingFiles } = state.files;
    const activeFileId = state.activeFileId === fileId ? undefined : state.activeFileId;
    
    return { 
      files: remainingFiles, 
      activeFileId 
    };
  }),
  // 更新指定文件的指定区域状态
  updateRegion: (fileId, regionId, updates) => {
    console.log('[markerStore] updateRegion called', fileId, regionId);
    set((state) => {
      const file = state.files[fileId];
      if (!file) return state;
      
      const updatedRegions = file.regions.map(region =>
        region.id === regionId ? { ...region, ...updates } : region
      );
      
      return {
        files: {
          ...state.files,
          [fileId]: { ...file, regions: updatedRegions }
        }
      };
    });
  },
  // 向指定文件的指定区域插入图片（图片按“等比包含”缩放，并记录在 region.meta 中）
  insertImageIntoRegion: async (fileId, regionId, imageSrc) => {
    // 1) 读取当前文件与区域
    const state = useMarkerStore.getState();
    const file = state.files[fileId];
    if (!file) return;

    // Find region
    const region = file.regions.find(r => r.id === regionId);
    if (!region) return;

    try {
      // 2) 动态加载图片尺寸，计算在区域内的等比“包含”尺寸
      const { loadImage, fitImageContain } = await import('./imageUtils');
      const { width: imgW, height: imgH } = await loadImage(imageSrc);

      // Compute fit inside region (unscaled logical units)
      const { width: fitW, height: fitH } = fitImageContain(imgW, imgH, region.width, region.height);

      // 3) 计算图片在区域内的居中偏移（以区域左上角为原点）
      const offsetX = Math.max(0, (region.width - fitW) / 2);
      const offsetY = Math.max(0, (region.height - fitH) / 2);

      // 4) 将结果写入 region.meta，供渲染层读取
      const nextMeta = {
        ...(region.meta || {}),
        imageSrc,
        imageFit: { width: fitW, height: fitH, offsetX, offsetY, imgW, imgH },
      } as any;
      // 5) 更新区域状态为done
      useMarkerStore.getState().updateRegion(fileId, regionId, {status:'done', meta: nextMeta });
    } catch (e) {
      console.error('[markerStore] insertImageIntoRegion failed', e);
    }
  },
  // 分割指定文件的页面
  splitPdfPages: async (fileId, options = {}) => {
    const { pageIndices, splitIntoIndividual = false } = options;
    console.log('[markerStore] splitPdfPages called', fileId, options);
    
    const state = useMarkerStore.getState();
    const file = state.files[fileId];
    
    if (!file) {
      console.error('[markerStore] File not found:', fileId);
      throw new Error(`File with id ${fileId} not found`);
    }
    
    try {
      // 动态导入 pdf-lib 和 pdfjs-dist（使用 legacy 版本）
      const { PDFDocument } = await import('pdf-lib');
      const { getDocument } = await import('pdfjs-dist/legacy/build/pdf');
      
      // 加载原始 PDF
      const sourcePdfDoc = await getDocument({ url: file.url }).promise;
      const totalPages = sourcePdfDoc.numPages;
      
      // 确定要处理的页面索引
      let pagesToProcess: number[];
      if (pageIndices && pageIndices.length > 0) {
        // 验证页面索引是否有效
        pagesToProcess = pageIndices.filter(idx => idx >= 0 && idx < totalPages);
        if (pagesToProcess.length === 0) {
          throw new Error('No valid page indices provided');
        }
      } else {
        // 如果没有指定，处理所有页面
        pagesToProcess = Array.from({ length: totalPages }, (_, i) => i);
      }
      
      // 获取原始 PDF 的字节数组
      const response = await fetch(file.url);
      const arrayBuffer = await response.arrayBuffer();
      const sourcePdfBytes = new Uint8Array(arrayBuffer);
      
      if (splitIntoIndividual) {
        // 模式1: 切分成多个独立的单页PDF文件，返回数组
        const sourceDoc = await PDFDocument.load(sourcePdfBytes);
        const pdfBytesArray: Uint8Array[] = [];
        
        for (let i = 0; i < pagesToProcess.length; i++) {
          const pageIndex = pagesToProcess[i];
          
          // 创建新的PDF文档
          const newPdfDoc = await PDFDocument.create();
          
          // 复制指定页面
          const [copiedPage] = await newPdfDoc.copyPages(sourceDoc, [pageIndex]);
          newPdfDoc.addPage(copiedPage);
          
          // 生成PDF字节
          const pdfBytes = await newPdfDoc.save();
          pdfBytesArray.push(pdfBytes);
        }
        
        console.log(`[markerStore] Split PDF into ${pagesToProcess.length} individual files`);
        return pdfBytesArray;
      } else {
        // 模式2: 提取指定页面生成一个PDF文件，返回单个数组
        const newPdfDoc = await PDFDocument.create();
        const sourceDoc = await PDFDocument.load(sourcePdfBytes);
        
        // 复制所有指定页面
        const copiedPages = await newPdfDoc.copyPages(sourceDoc, pagesToProcess);
        copiedPages.forEach((page: any) => {
          newPdfDoc.addPage(page);
        });
        
        // 生成PDF字节
        const pdfBytes = await newPdfDoc.save();
        
        console.log(`[markerStore] Extracted ${pagesToProcess.length} pages into one PDF`);
        return pdfBytes;
      }
    } catch (error) {
      console.error('[markerStore] Error splitting PDF pages:', error);
      throw error;
    }
  },
   // 将签名插入 PDF 并生成新文件
  generateSignedPdf: async (fileId: string, removeBackground: boolean = false) => {
    if (!fileId) return null;
    const state = useMarkerStore.getState();
    const file = state.files[fileId];
    if (!file) return null;
    try {
      // 动态导入 pdf-lib 和 imageUtils
      const { PDFDocument } = await import('pdf-lib');
      const { loadImage, fitImageContain, processPngRemoveBackground } = await import('./imageUtils');
      
      console.log('[markerStore] 开始生成带签名的 PDF...', { fileId, removeBackground });
      
      // 1. 加载原始 PDF
      const existingPdfBytes = await fetch(file.url).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      
      // 2. 遍历所有签署区域，将签名图片嵌入对应页面
      for (const region of file.regions) {
        if (region.status === 'done' && region.meta?.imageSrc) {
          const page = pages[region.pageIndex];
          if (!page) continue;
          
          // 获取页面尺寸
          const { width: pageWidth, height: pageHeight } = page.getSize();
          
          // 加载签名图片（优先使用 dataURL 原始字节，保留 PNG 透明通道；否则 fetch 获取）
          let imgBytes;
          const src = region.meta.imageSrc;
          if (typeof src === 'string' && src.startsWith('data:')) {
            // 解析 dataURL
            const commaIndex = src.indexOf(',');
            if (commaIndex === -1) throw new Error('无效的 dataURL');
            const base64 = src.slice(commaIndex + 1);
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
            imgBytes = bytes;
          } else {
            const imgResponse = await fetch(src);
            if (!imgResponse.ok) {
              throw new Error(`签名图片获取失败: ${imgResponse.status}`);
            }
            const imgBuffer = await imgResponse.arrayBuffer();
            imgBytes = new Uint8Array(imgBuffer);
          }
          
          const isPng = imgBytes.length > 4
            && imgBytes[0] === 0x89 && imgBytes[1] === 0x50 && imgBytes[2] === 0x4E && imgBytes[3] === 0x47;
          const isJpg = imgBytes.length > 3
            && imgBytes[0] === 0xFF && imgBytes[1] === 0xD8 && imgBytes[2] === 0xFF;
          
          console.log('[markerStore] 图片格式检测:', { isPng, isJpg, removeBackground });
          
          let signImage;
          if (isPng) {
            // 对于 PNG，根据 removeBackground 参数决定是否移除背景
            if (removeBackground) {
              try {
                const processedBytes = await processPngRemoveBackground(src);
                signImage = await pdfDoc.embedPng(processedBytes);
                console.log('[markerStore] PNG 背景已移除并嵌入');
              } catch (error) {
                console.warn('[markerStore] 背景移除失败，使用原始 PNG:', error);
                // 如果处理失败，使用原始 PNG
                signImage = await pdfDoc.embedPng(imgBytes);
              }
            } else {
              signImage = await pdfDoc.embedPng(imgBytes);
            }
          } else if (isJpg) {
            signImage = await pdfDoc.embedJpg(imgBytes);
          } else {
            throw new Error('不支持的签名图片格式或内容异常');
          }
          
          // 获取图片尺寸并计算适配尺寸
          const { width: imgW, height: imgH } = await loadImage(src);
          const { width: fitW, height: fitH } = fitImageContain(imgW, imgH, region.width, region.height);
          
          // 计算图片在区域内的居中偏移（以区域左上角为原点）
          const offsetX = Math.max(0, (region.width - fitW) / 2);
          const offsetY = Math.max(0, (region.height - fitH) / 2);
          
          // 计算签名在 PDF 中的位置和大小
          // PDF 坐标系：左下角为原点，y 轴向上
          // 标注框坐标系：左上角为原点，y 轴向下
          // 需要转换坐标系
          const x = region.x + offsetX;
          const y = pageHeight - region.y - region.height + offsetY; // 转换 y 坐标
          
          // 在 PDF 页面上绘制签名图片
          page.drawImage(signImage, {
            x: x,
            y: y,
            width: fitW,
            height: fitH,
          });
          
          console.log('[markerStore] 已插入签名到页面', region.pageIndex, {
            x, y, width: fitW, height: fitH, offsetX, offsetY
          });
        }
      }
      
      // 3. 生成新的 PDF 字节数组
      const pdfBytes = await pdfDoc.save();
      console.log('[markerStore] PDF 生成成功，大小:', pdfBytes.length, 'bytes');
      
      return pdfBytes;
    } catch (error) {
      console.error('[markerStore] 生成 PDF 失败:', error);
      throw error;
    }
  },
}));
