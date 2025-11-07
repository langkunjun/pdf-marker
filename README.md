@kunkun/pdf-marker
一个基于React和PDF.js的PDF标注组件库，支持在PDF文档上创建、编辑和管理交互式标注区域。

🌟 核心功能
PDF渲染 - 基于PDF.js的高质量PDF文档渲染
区域标注 - 支持高亮、矩形、文本等多种标注类型
拖拽编辑 - 标注区域可自由拖拽和调整大小
状态管理 - 使用Zustand进行高效的标注状态管理
多文件支持 - 支持同时管理多个PDF文件
响应式设计 - 适配不同屏幕尺寸
TypeScript - 完整的类型定义支持
📦 安装
npm install @kunkun/pdf-marker
# 或
yarn add @kunkun/pdf-marker
# 或
pnpm add @kunkun/pdf-marker
🔧 快速开始
基础使用
import React from 'react';
import { PdfMarkerViewer } from '@kunkun/pdf-marker';

function App() {
  return (
    <PdfMarkerViewer
      fileId="my-pdf"
      fileUrl="/path/to/document.pdf"
      onRegionClick={(regionId) => console.log('点击区域:', regionId)}
    />
  );
}
完整示例
import React from 'react';
import { 
  PdfMarkerViewer, 
  FileTabs, 
  useMarkerStore,
  regionManager 
} from '@kunkun/pdf-marker';

function PdfMarkerApp() {
  const files = useMarkerStore((state) => state.files);
  const addFile = useMarkerStore((state) => state.addFile);
  const updateFileRegions = useMarkerStore((state) => state.updateFileRegions);

  // 添加PDF文件
  const handleAddFile = () => {
    addFile({
      id: 'file1',
      name: 'document.pdf',
      url: '/sample.pdf',
      regions: []
    });
  };

  // 添加标注区域
  const handleAddRegion = () => {
    const newRegion = regionManager.createRegion(0, 100, 150, 'rectangle');
    updateFileRegions('file1', [...files.file1.regions, newRegion]);
  };

  return (
    <div>
      <FileTabs />
      <PdfMarkerViewer
        fileId="file1"
        fileUrl="/sample.pdf"
        onRegionClick={(regionId) => console.log('区域ID:', regionId)}
      />
      <button onClick={handleAddRegion}>添加区域</button>
    </div>
  );
}
查看完整的示例代码和运行效果，请访问项目仓库。

## 📋 API文档
### 组件 PdfMarkerViewer
主要的PDF查看和标注组件。

Props:

```
interface Props {
  fileId: 
  string;                    // 文件唯
  一标识
  fileUrl: 
  string;                   // PDF文件
  URL
  onRegionClick?: (regionId: string) 
  => void;  // 区域点击回调
  onError?: (error: string) => 
  void; // 错误处理回调
}
``` FileTabs
文件标签页组件，用于切换多个PDF文件。

Props: 无（自动从store获取数据）
 RegionLayer
标注图层组件，通常由PdfMarkerViewer内部使用。

Props:

```
interface Props {
  fileId: 
  string;                    // 文件ID
  scale?: 
  number;                    // 缩放比
  例
  onRegionClick?: (regionId: string) 
  => void;  // 区域点击回调
}
```
### Hooks useMarkerStore
Zustand store hook，用于访问标注状态。

```
const {
  files,                    // 所有文件
  activeFileId,            // 当前活动
  文件ID
  addFile,                 // 添加文件
  switchFile,              // 切换文件
  updateFileRegions,       // 更新文件
  区域
  removeFile,              // 移除文件
  updateRegion             // 更新单个
  区域
} = useMarkerStore();
``` useCurrentFile
获取当前活动文件。

```
const currentFile = useCurrentFile();
``` useFileRegions
获取指定文件的所有区域。

```
const regions = useFileRegions
(fileId);
```
### 工具函数 regionManager
区域管理工具，用于创建和管理标注区域。

```
// 创建新区域
const region = regionManager.
createRegion(
  pageIndex: number,      // 页面索引
  x: number,              // X坐标
  y: number,              // Y坐标
  type: RegionType,       // 区域类型
  width?: number,         // 宽度
  height?: number,        // 高度
  status?: RegionStatus   // 状态
);

// 更新区域
const updatedRegions = regionManager.
updateRegion(regions, regionId, 
updates);

// 删除区域
const filteredRegions = regionManager.
deleteRegion(regions, regionId);

// 验证区域
const error = regionManager.
validateRegion(region);
```
## 🎯 数据类型
### Region
标注区域接口定义：

```
interface Region {
  id: string;                    // 唯
  一标识
  pageIndex: number;              // 
  所在页面索引
  x: number;                     // X
  坐标
  y: number;                     // Y
  坐标
  width: number;                 // 宽
  度
  height: number;                // 高
  度
  type: RegionType;              // 类
  型: 'highlight' | 'rectangle' | 
  'text'
  status: RegionStatus;          // 状
  态: 'pending' | 'active' | 'done'
  content?: string;              // 文
  本内容
  rotation?: number;             // 旋
  转角度
  meta?: Record<string, any>;    // 自
  定义元数据
  scale?: number;                // 缩
  放比例
}
```
### FileState
文件状态接口定义：

```
interface FileState {
  id: string;                    // 文
  件ID
  name: string;                  // 文
  件名
  url: string;                   // 文
  件URL
  regions: Region[];            // 标
  注区域数组
  scale?: number;                // 
  PDF渲染缩放比例
}
```
### ViewerState
查看器状态接口定义：

```
interface ViewerState {
  scale: number;                 // 缩
  放比例
  rotation: 0 | 90 | 180 | 270; // 旋
  转角度
  pageIndex: number;            // 当
  前页面
  isLoading: boolean;           // 加
  载状态
  error?: string | null;        // 错
  误信息
}
```
## 🎨 样式自定义
组件使用CSS类名，可以通过覆盖样式来自定义外观：

```
/* PDF容器 */
.relative.inline-block.border.shadow {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 
  0, 0.1);
}

/* 标注区域 */
.react-rnd {
  border-width: 2px !important;
  border-style: dashed !important;
}

/* 文件标签 */
.px-3.py-1.rounded {
  transition: all 0.2s ease;
}
```
## 🔧 高级配置
### 自定义区域类型
```
// 扩展区域类型
type CustomRegionType = RegionType | 
'circle' | 'arrow';

// 创建自定义区域
const customRegion = {
  ...regionManager.createRegion(0, 
  100, 150, 'rectangle'),
  type: 'circle' as CustomRegionType,
  radius: 50
};
```
### 事件处理
```
// 区域点击事件
const handleRegionClick = (regionId: 
string) => {
  const region = files[currentFileId].
  regions.find(r => r.id === 
  regionId);
  console.log('点击区域:', region);
};

// 区域拖拽事件
const handleRegionDrag = (regionId: 
string, x: number, y: number) => {
  updateRegion(currentFileId, 
  regionId, { x, y });
};

// 区域调整大小事件
const handleRegionResize = (regionId: 
string, width: number, height: 
number) => {
  updateRegion(currentFileId, 
  regionId, { width, height });
};
```
## 🚨 错误处理
组件内置了错误处理机制：

```
<PdfMarkerViewer
  fileId="my-pdf"
  fileUrl="/document.pdf"
  onError={(error) => {
    console.error('PDF加载失败:', 
    error);
    // 处理错误，如显示错误提示
  }}
/>
```
常见错误：

- Failed to load PDF - PDF文件加载失败
- Invalid PDF structure - PDF文件格式错误
- CORS error - 跨域访问问题
## 📱 浏览器兼容性
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
## 🤝 贡献
欢迎提交Issue和Pull Request来改进这个项目。

## 📄 许可证
MIT License

## 🆘 支持
如有问题，请在GitHub上提交Issue或联系维护者。