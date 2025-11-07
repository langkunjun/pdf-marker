import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { ensurePdfWorkerConfigured } from './pdfWorker';
import { FilePreview, FilePreviewInput } from './types';

// 确保在不同打包环境下配置 worker（兼容 React16 / Webpack4 / Vite）
ensurePdfWorkerConfigured();

/**
 * 生成 PDF 文件预览数据（包含文件名、页数、每页缩略图）
 * @param files PDF 文件数组
 * @param thumbnailScale 缩略图缩放比例，默认 0.3（用于生成较小的缩略图）
 * @returns 返回文件预览数组，每个文件包含文件信息和所有页面的缩略图
 */
export async function generateFilePreviews(
  files: FilePreviewInput[],
  thumbnailScale: number = 0.3
): Promise<FilePreview[]> {
  const results: FilePreview[] = [];

  // 并行处理所有文件
  const filePromises = files.map(async (file) => {
    try {
      // 加载 PDF 文档
      const pdfDocument = await getDocument({ url: file.url }).promise;
      const pageCount = pdfDocument.numPages;

      // 生成所有页面的缩略图
      const pagePromises = Array.from({ length: pageCount }, async (_, index) => {
        const pageIndex = index; // 0-based
        const page = await pdfDocument.getPage(pageIndex + 1); // pdfjs 使用 1-based

        // 创建临时 canvas 用于渲染缩略图
        const viewport = page.getViewport({ scale: thumbnailScale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('无法创建 canvas 上下文');
        }

        // 渲染页面到 canvas
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // 将 canvas 转换为 base64 图片
        const thumbnail = canvas.toDataURL('image/png');

        return {
          pageIndex,
          thumbnail,
        };
      });

      const pages = await Promise.all(pagePromises);

      return {
        fileId: file.id,
        fileName: file.name,
        pageCount,
        pages,
      };
    } catch (error) {
      console.error(`[filePreviewGenerator] 处理文件 ${file.name} 时出错:`, error);
      // 返回错误信息，但不中断整个流程
      return {
        fileId: file.id,
        fileName: file.name,
        pageCount: 0,
        pages: [],
      };
    }
  });

  const fileResults = await Promise.all(filePromises);
  results.push(...fileResults);

  return results;
}

