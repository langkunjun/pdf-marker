# pdf-marker-langkunjun

一个基于 React 和 PDF.js 的 PDF 标注组件库，支持在 PDF 文档上创建、编辑和管理交互式标注区域。

**✅ 完全兼容 Webpack 4 + React 16.8**

## 🌟 核心功能

- 📄 **PDF 渲染** - 基于 PDF.js 的高质量 PDF 文档渲染
- 🖍️ **区域标注** - 支持高亮、矩形、文本等多种标注类型
- 🎯 **拖拽编辑** - 标注区域可自由拖拽和调整大小
- 💾 **状态管理** - 使用 Zustand 进行高效的标注状态管理
- 📑 **多文件支持** - 支持同时管理多个 PDF 文件
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 📘 **TypeScript** - 完整的类型定义支持
- ⚡ **Webpack 4 兼容** - 完美支持旧版构建工具

## 📦 安装

```bash
npm install pdf-marker-langkunjun
# 或
yarn add pdf-marker-langkunjun
```

### 对等依赖

本包需要以下对等依赖（通常你的项目中已有）：

```json
{
  "react": ">=16.8.0 <19",
  "react-dom": ">=16.8.0 <19"
}
```

### 其他运行时依赖

安装包时会自动安装以下依赖：

- `pdfjs-dist@^2.16.105` - PDF 渲染引擎
- `pdf-lib@^1.17.1` - PDF 文档处理
- `react-rnd@10.3.7` - 拖拽调整大小组件
- `zustand@^4.4.0` - 状态管理
- `uuid@^8.3.2` - 唯一 ID 生成

## 🔧 快速开始

### 1. 基础配置

**重要**：使用前需要配置 PDF.js Worker。

```javascript
import { setPdfWorkerSrc } from 'pdf-marker-langkunjun';

// 使用 CDN（推荐）
setPdfWorkerSrc('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/legacy/build/pdf.worker.min.js');

// 或使用本地文件
setPdfWorkerSrc('/pdf.worker.min.js');
```

### 2. 基础使用

```jsx
import React from 'react';
import { PdfMarkerViewer, useMarkerStore } from 'pdf-marker-langkunjun';

function App() {
  const addFile = useMarkerStore(state => state.addFile);

  React.useEffect(() => {
    // 添加 PDF 文件
    addFile({
      id: 'my-pdf',
      name: 'document.pdf',
      url: '/path/to/document.pdf',
      regions: []
    });
  }, [addFile]);

  return (
    <PdfMarkerViewer
      fileId="my-pdf"
      fileUrl="/path/to/document.pdf"
      onRegionClick={(regionId) => console.log('点击区域:', regionId)}
      onError={(error) => console.error('PDF 加载错误:', error)}
    />
  );
}

export default App;
```

### 3. 完整示例

```jsx
import React, { useState, useRef, useCallback } from 'react';
import {
  PdfMarkerViewer,
  FileTabs,
  useMarkerStore,
  regionManager,
  setPdfWorkerSrc
} from 'pdf-marker-langkunjun';

// 配置 PDF.js Worker
setPdfWorkerSrc('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/legacy/build/pdf.worker.min.js');

function PdfMarkerApp() {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  // 从 store 获取状态
  const files = useMarkerStore(state => state.files);
  const activeFileId = useMarkerStore(state => state.activeFileId);
  const addFile = useMarkerStore(state => state.addFile);
  const updateFileRegions = useMarkerStore(state => state.updateFileRegions);
  const currentPageIndexByFile = useMarkerStore(state => state.currentPageIndexByFile);

  const activeFile = files.find(f => f.id === activeFileId);
  const currentPageIndex = activeFileId ? (currentPageIndexByFile[activeFileId] || 0) : 0;

  // 导入 PDF 文件
  const handleFileImport = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileId = `local-${Date.now()}`;
    const url = URL.createObjectURL(file);

    addFile({
      id: fileId,
      name: file.name,
      url,
      regions: []
    });
  }, [addFile]);

  // 添加标注区域
  const handleAddRegion = useCallback(() => {
    if (!activeFileId || !activeFile) return;

    const newRegion = regionManager.createRegion(
      currentPageIndex,
      100,
      100,
      'rectangle',
      200,
      150,
      'pending'
    );

    updateFileRegions(activeFileId, [...activeFile.regions, newRegion]);
    setIsEditing(true);
  }, [activeFileId, activeFile, currentPageIndex, updateFileRegions]);

  // 删除区域
  const handleRegionDelete = useCallback((regionId) => {
    if (!activeFileId || !activeFile) return;

    const updatedRegions = activeFile.regions.filter(r => r.id !== regionId);
    updateFileRegions(activeFileId, updatedRegions);
  }, [activeFileId, activeFile, updateFileRegions]);

  // PDF 加载错误处理
  const handlePdfError = useCallback((error) => {
    console.error('PDF 加载错误:', error);
    alert('PDF 加载失败: ' + error);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>PDF 标注工具</h1>

      {/* 工具栏 */}
      <div style={{ marginBottom: '20px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current?.click()}>
          导入 PDF
        </button>
        <button
          onClick={handleAddRegion}
          disabled={!activeFileId}
          style={{ marginLeft: '10px' }}
        >
          添加区域
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          disabled={!activeFileId}
          style={{ marginLeft: '10px' }}
        >
          {isEditing ? '完成编辑' : '编辑模式'}
        </button>
      </div>

      {/* 文件标签页 */}
      {files.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <FileTabs />
        </div>
      )}

      {/* PDF 查看器 */}
      {activeFileId && activeFile && (
        <div style={{
          border: '1px solid #ddd',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          display: 'inline-block'
        }}>
          <PdfMarkerViewer
            fileId={activeFileId}
            fileUrl={activeFile.url}
            scale={1.0}
            pageIndex={currentPageIndex}
            isEditing={isEditing}
            onRegionClick={(regionId) => console.log('点击区域:', regionId)}
            onRegionDelete={handleRegionDelete}
            onError={handlePdfError}
          />
        </div>
      )}

      {/* 无文件提示 */}
      {files.length === 0 && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          border: '2px dashed #ddd',
          borderRadius: '8px',
          color: '#999'
        }}>
          请点击"导入 PDF"按钮加载 PDF 文件
        </div>
      )}
    </div>
  );
}

export default PdfMarkerApp;
```

## 🔨 Webpack 4 配置

如果你使用 **Webpack 4**，需要进行以下配置：

### 1. 安装 Babel 依赖

```bash
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react babel-loader
```

### 2. 配置 `webpack.config.js`

```javascript
const path = require('path');

module.exports = {
  // ... 其他配置

  resolve: {
    alias: {
      // PDF.js legacy 版本（兼容 Webpack 4）
      'pdfjs-dist/legacy/build/pdf': path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf'),
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf'),
      
      // React JSX Runtime（Webpack 4 兼容）
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react'),
      'react-rnd/node_modules/react/jsx-runtime': path.resolve(__dirname, 'node_modules/react'),
      'react-rnd/node_modules/react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react'),
    },
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        // 重要：需要转译这些包
        exclude: /node_modules\/(?!(pdf-marker-langkunjun|pdfjs-dist|react-rnd)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  }
};
```

### 3. 常见问题

#### 问题 1：`Module not found: pdfjs-dist/legacy/build/pdf`

**解决方案**：确保在 `resolve.alias` 中配置了 `pdfjs-dist` 的路径。

#### 问题 2：`React has detected a change in the order of Hooks`

**解决方案**：确保所有 React Hooks 都在组件顶层调用，不要在条件语句中调用。

#### 问题 3：`Error: Transport destroyed`（无限循环）

**解决方案**：确保正确配置了 PDF.js Worker CDN 路径。

## 📋 API 文档

### 组件

#### `PdfMarkerViewer`

主要的 PDF 查看和标注组件。

**Props:**

```typescript
interface PdfMarkerViewerProps {
  fileId: string;                          // 文件唯一标识（必需）
  fileUrl: string;                         // PDF 文件 URL（必需）
  scale?: number;                          // 缩放比例，默认 1.0
  pageIndex?: number;                      // 当前页码，默认 0
  isEditing?: boolean;                     // 是否处于编辑模式，默认 false
  onRegionClick?: (regionId: string) => void;    // 区域点击回调
  onRegionDelete?: (regionId: string) => void;   // 区域删除回调
  onError?: (error: string) => void;             // 错误处理回调
}
```

**示例:**

```jsx
<PdfMarkerViewer
  fileId="my-pdf"
  fileUrl="/document.pdf"
  scale={1.5}
  pageIndex={0}
  isEditing={true}
  onRegionClick={(id) => console.log('点击:', id)}
  onError={(err) => console.error(err)}
/>
```

#### `FileTabs`

文件标签页组件，用于切换多个 PDF 文件。

**Props:** 无（自动从 store 获取数据）

**示例:**

```jsx
<FileTabs />
```

#### `RegionLayer`

标注图层组件（通常由 `PdfMarkerViewer` 内部使用）。

**Props:**

```typescript
interface RegionLayerProps {
  fileId: string;                          // 文件 ID
  scale?: number;                          // 缩放比例
  onRegionClick?: (regionId: string) => void;    // 区域点击回调
  isEditing?: boolean;                     // 是否可编辑
  onRegionDelete?: (regionId: string) => void;   // 删除回调
  filterPageIndex?: number;                // 过滤页码
}
```

### Hooks

#### `useMarkerStore`

Zustand store hook，用于访问和修改标注状态。

**返回值:**

```typescript
interface MarkerStore {
  // 状态
  files: FileState[];                      // 所有文件
  activeFileId: string | null;            // 当前活动文件 ID
  currentPageIndexByFile: Record<string, number>;  // 每个文件的当前页码

  // 文件操作
  addFile: (file: FileState) => void;             // 添加文件
  switchFile: (fileId: string) => void;           // 切换文件
  removeFile: (fileId: string) => void;           // 移除文件
  updateFilePageCount: (fileId: string, pageCount: number) => void;  // 更新页数

  // 区域操作
  updateFileRegions: (fileId: string, regions: Region[]) => void;  // 更新文件区域
  updateRegion: (fileId: string, regionId: string, updates: Partial<Region>) => void;  // 更新单个区域

  // 页面导航
  setCurrentPage: (fileId: string, pageIndex: number) => void;  // 设置当前页
}
```

**示例:**

```jsx
const files = useMarkerStore(state => state.files);
const addFile = useMarkerStore(state => state.addFile);
const updateFileRegions = useMarkerStore(state => state.updateFileRegions);
```

#### `useCurrentFile`

获取当前活动文件。

**示例:**

```jsx
const currentFile = useCurrentFile();
```

#### `useFileRegions`

获取指定文件的所有区域。

**示例:**

```jsx
const regions = useFileRegions('file-id');
```

### 工具函数

#### `regionManager`

区域管理工具，用于创建和管理标注区域。

**方法:**

```typescript
// 创建新区域
regionManager.createRegion(
  pageIndex: number,        // 页面索引
  x: number,                // X 坐标
  y: number,                // Y 坐标
  type: RegionType,         // 区域类型: 'highlight' | 'rectangle' | 'text'
  width?: number,           // 宽度，默认 100
  height?: number,          // 高度，默认 100
  status?: RegionStatus     // 状态: 'pending' | 'active' | 'done'，默认 'pending'
): Region

// 更新区域
regionManager.updateRegion(
  regions: Region[],
  regionId: string,
  updates: Partial<Region>
): Region[]

// 删除区域
regionManager.deleteRegion(
  regions: Region[],
  regionId: string
): Region[]

// 验证区域
regionManager.validateRegion(
  region: Partial<Region>
): string | null  // 返回错误信息，或 null（无错误）
```

**示例:**

```jsx
// 创建区域
const newRegion = regionManager.createRegion(
  0,           // 第一页
  100,         // x = 100
  100,         // y = 100
  'rectangle', // 矩形类型
  200,         // 宽度 200
  150,         // 高度 150
  'pending'    // 待处理状态
);

// 更新区域
const updatedRegions = regionManager.updateRegion(
  currentRegions,
  'region-id',
  { x: 150, y: 150, width: 250 }
);

// 删除区域
const filteredRegions = regionManager.deleteRegion(
  currentRegions,
  'region-id'
);

// 验证区域
const error = regionManager.validateRegion(newRegion);
if (error) {
  console.error('区域验证失败:', error);
}
```

#### `setPdfWorkerSrc`

配置 PDF.js Worker 路径。

**签名:**

```typescript
function setPdfWorkerSrc(url: string): void
```

**示例:**

```javascript
// 使用 CDN
setPdfWorkerSrc('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/legacy/build/pdf.worker.min.js');

// 使用本地文件
setPdfWorkerSrc('/assets/pdf.worker.min.js');
```

## 🎯 类型定义

### `Region`

标注区域接口定义。

```typescript
interface Region {
  id: string;                    // 唯一标识
  pageIndex: number;             // 所在页面索引（从 0 开始）
  x: number;                     // X 坐标（相对于 PDF 页面）
  y: number;                     // Y 坐标（相对于 PDF 页面）
  width: number;                 // 宽度
  height: number;                // 高度
  type: RegionType;              // 类型: 'highlight' | 'rectangle' | 'text'
  status: RegionStatus;          // 状态: 'pending' | 'active' | 'done'
  content?: string;              // 文本内容（可选）
  rotation?: number;             // 旋转角度（可选）
  meta?: Record<string, any>;    // 自定义元数据（可选）
  scale?: number;                // 缩放比例（可选）
}

type RegionType = 'highlight' | 'rectangle' | 'text';
type RegionStatus = 'pending' | 'active' | 'done';
```

### `FileState`

文件状态接口定义。

```typescript
interface FileState {
  id: string;                    // 文件 ID
  name: string;                  // 文件名
  url: string;                   // 文件 URL（可以是 blob: URL）
  regions: Region[];             // 标注区域数组
  scale?: number;                // PDF 渲染缩放比例（可选）
  pageCount?: number;            // 总页数（可选）
}
```

### `ViewerState`

查看器状态接口定义。

```typescript
interface ViewerState {
  scale: number;                 // 缩放比例
  rotation: 0 | 90 | 180 | 270;  // 旋转角度
  pageIndex: number;             // 当前页面索引
  isLoading: boolean;            // 加载状态
  error?: string | null;         // 错误信息
}
```

## 🎨 样式自定义

组件使用内联样式，确保在所有环境下都能正常工作（包括 Webpack 4）。

如果需要自定义样式，可以通过包装组件的方式：

```jsx
function CustomPdfViewer(props) {
  return (
    <div
      style={{
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        padding: '10px',
        backgroundColor: '#f9fafb'
      }}
    >
      <PdfMarkerViewer {...props} />
    </div>
  );
}
```

### 自定义标注区域样式

标注区域使用 `react-rnd` 组件，可以通过全局 CSS 自定义：

```css
/* 标注区域边框样式 */
.react-rnd {
  border: 2px dashed #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.1) !important;
}

/* 激活状态 */
.react-rnd:hover {
  border-color: #1d4ed8 !important;
  background-color: rgba(59, 130, 246, 0.2) !important;
}

/* 调整手柄 */
.react-rnd .resizeHandle {
  width: 8px !important;
  height: 8px !important;
  background-color: #3b82f6 !important;
  border-radius: 50% !important;
}
```

## 🔧 高级用法

### 自定义区域类型

```typescript
// 扩展区域类型
type CustomRegionType = RegionType | 'circle' | 'arrow';

interface CustomRegion extends Region {
  type: CustomRegionType;
  radius?: number;  // 用于圆形
  points?: Array<{ x: number; y: number }>;  // 用于箭头
}

// 创建自定义区域
const customRegion: CustomRegion = {
  ...regionManager.createRegion(0, 100, 150, 'rectangle'),
  type: 'circle',
  radius: 50
};
```

### 事件处理

```jsx
function AdvancedPdfMarker() {
  const updateRegion = useMarkerStore(state => state.updateRegion);
  const activeFileId = useMarkerStore(state => state.activeFileId);

  // 区域点击事件
  const handleRegionClick = useCallback((regionId) => {
    console.log('点击区域:', regionId);
    // 更新区域状态为激活
    if (activeFileId) {
      updateRegion(activeFileId, regionId, { status: 'active' });
    }
  }, [activeFileId, updateRegion]);

  // 区域拖拽结束事件（通过 react-rnd）
  const handleRegionDragStop = useCallback((regionId, x, y) => {
    console.log('拖拽结束:', regionId, x, y);
    if (activeFileId) {
      updateRegion(activeFileId, regionId, { x, y });
    }
  }, [activeFileId, updateRegion]);

  // 区域调整大小结束事件
  const handleRegionResizeStop = useCallback((regionId, width, height) => {
    console.log('调整大小结束:', regionId, width, height);
    if (activeFileId) {
      updateRegion(activeFileId, regionId, { width, height });
    }
  }, [activeFileId, updateRegion]);

  return (
    <PdfMarkerViewer
      fileId={activeFileId}
      fileUrl="/document.pdf"
      onRegionClick={handleRegionClick}
    />
  );
}
```

### 持久化存储

```jsx
import { useEffect } from 'react';
import { useMarkerStore } from 'pdf-marker-langkunjun';

function PersistentMarker() {
  const files = useMarkerStore(state => state.files);

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('pdf-marker-files', JSON.stringify(files));
  }, [files]);

  // 从 localStorage 恢复
  useEffect(() => {
    const saved = localStorage.getItem('pdf-marker-files');
    if (saved) {
      const savedFiles = JSON.parse(saved);
      // 恢复文件（需要实现 restoreFiles 方法）
      savedFiles.forEach(file => {
        useMarkerStore.getState().addFile(file);
      });
    }
  }, []);

  return <PdfMarkerViewer /* ... */ />;
}
```

### 导出标注数据

```jsx
function ExportAnnotations() {
  const files = useMarkerStore(state => state.files);

  const handleExport = () => {
    const exportData = files.map(file => ({
      fileName: file.name,
      regions: file.regions.map(region => ({
        page: region.pageIndex + 1,
        position: { x: region.x, y: region.y },
        size: { width: region.width, height: region.height },
        type: region.type,
        status: region.status,
        content: region.content
      }))
    }));

    // 导出为 JSON 文件
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={handleExport}>导出标注</button>;
}
```

## 🚨 错误处理

组件内置了错误处理机制：

```jsx
<PdfMarkerViewer
  fileId="my-pdf"
  fileUrl="/document.pdf"
  onError={(error) => {
    console.error('PDF 加载失败:', error);
    
    // 显示用户友好的错误提示
    if (error.includes('Transport destroyed')) {
      alert('PDF Worker 配置错误，请检查 Worker URL');
    } else if (error.includes('CORS')) {
      alert('PDF 文件跨域访问被阻止');
    } else {
      alert('PDF 加载失败: ' + error);
    }
  }}
/>
```

### 常见错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Transport destroyed` | PDF.js Worker 未正确配置 | 调用 `setPdfWorkerSrc()` 配置正确的 Worker URL |
| `Module not found: pdfjs-dist` | Webpack 4 未配置 alias | 在 `webpack.config.js` 中添加 `pdfjs-dist` alias |
| `React has detected a change in the order of Hooks` | Hooks 调用顺序不一致 | 确保所有 Hooks 在组件顶层调用 |
| `CORS error` | PDF 文件跨域访问被阻止 | 配置服务器 CORS 头，或使用代理 |
| `Invalid PDF structure` | PDF 文件格式错误或损坏 | 检查 PDF 文件完整性 |

## 📱 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|---------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 12+ |
| Edge | 79+ |
| IE | ❌ 不支持 |

## 🛠️ 开发

```bash
# 克隆仓库
git clone <repository-url>

# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check
```

## 📝 更新日志

### v0.1.12

- ✅ 完全支持 Webpack 4
- ✅ 修复 React Hooks 顺序问题
- ✅ 修复 PDF Worker 无限循环问题
- ✅ 修复 react-rnd 版本冲突
- ✅ 将 Tailwind CSS 改为内联样式
- ✅ 改进类型定义

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

### 贡献指南

1. Fork 本仓库 https://github.com/langkunjun/pdf-marker.git
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 👤 作者

**langkunjun** <langkunjun@126.com>

## 🆘 支持

如有问题，请：

1. 查看本 README 的常见问题部分
2. 查看项目的技术文档：
   - `WEBPACK4_SOLUTION_ANALYSIS.md` - Webpack 4 兼容性分析
   - `AUDIT_REPORT.md` - 包自检报告
3. 在 GitHub 上提交 Issue
4. 联系维护者

## 🙏 致谢

- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla 的 PDF 渲染引擎
- [react-rnd](https://github.com/bokuweb/react-rnd) - React 拖拽调整大小组件
- [Zustand](https://github.com/pmndrs/zustand) - 轻量级状态管理库
- [pdf-lib](https://pdf-lib.js.org/) - PDF 文档处理库
