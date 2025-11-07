export type RegionType = 'highlight' | 'rectangle' | 'text';
export type RegionStatus = 'pending' | 'active' | 'done';

export interface Region {
  id: string;
  pageIndex: number;
  x: number; // 实际坐标（已考虑缩放）
  y: number;
  width: number;
  height: number;
  type: RegionType;
  status: RegionStatus;
  content?: string;
  rotation?: number; // deg
  meta?: Record<string, any>;
  scale?: number; // 标注时的缩放比例
}

export interface FileState {
  id: string;
  name: string;
  url: string;
  regions: Region[];
  scale?: number; // PDF 渲染的缩放比例
  pageCount?: number; // PDF 总页数
}

export interface ViewerState {
  scale: number;
  rotation: 0 | 90 | 180 | 270;
  pageIndex: number;
  isLoading: boolean;
  error?: string | null;
}

// 文件预览相关类型
export interface PagePreview {
  pageIndex: number; // 页码（0-based）
  thumbnail: string; // 缩略图 base64 字符串
  hasRegions?: boolean; // 该页是否有标注区域
}

export interface FilePreview {
  fileId: string; // 文件ID
  fileName: string; // 文件名
  pageCount: number; // 总页数
  pages: PagePreview[]; // 页面数组
}

// 生成预览的输入参数
export interface FilePreviewInput {
  id: string; // 文件ID
  name: string; // 文件名
  url: string; // 文件URL或路径
}
