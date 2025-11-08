# 包自检报告

## 检查时间
2024年

## 检查范围
- package.json 配置
- vite.config.ts 打包配置
- tsconfig.json TypeScript 配置
- 源代码逻辑
- 依赖管理
- 类型定义
- 导出配置

---

## 🔴 严重问题

### 1. vite.config.ts 中缺少 `pdf-lib` 的 external 配置

**问题描述：**
- 代码中使用了 `pdf-lib`（在 `src/core/markerStore.ts` 中动态导入）
- 但 `vite.config.ts` 的 `external` 配置中没有声明 `pdf-lib`
- 这会导致 `pdf-lib` 被打包进构建产物，增加包体积，并可能导致版本冲突

**影响：**
- ❌ 包体积增加
- ❌ 可能导致版本冲突（如果使用方也安装了 pdf-lib）
- ❌ 不符合库的最佳实践（应该将依赖 externalize）

**修复方案：**
```typescript
// vite.config.ts
rollupOptions: {
  external: [
    'react', 
    'react-dom', 
    'pdfjs-dist', 
    'pdfjs-dist/legacy/build/pdf', 
    'pdf-lib', // ✅ 添加这一行
    'uuid', 
    'zustand', 
    'react-rnd'
  ],
}
```

**位置：** `vite.config.ts:14`

---

### 2. package.json 中 `yarn` 不应该在 dependencies 中

**问题描述：**
- `yarn` 是包管理工具，不应该作为运行时依赖
- 这会导致安装包时额外安装 yarn，增加不必要的依赖

**影响：**
- ❌ 增加不必要的依赖
- ❌ 可能与其他包管理工具冲突
- ❌ 不符合 npm 包的最佳实践

**修复方案：**
```json
{
  "dependencies": {
    "pdf-lib": "^1.17.1",
    "pdfjs-dist": "^2.16.105",
    "react-rnd": "^10.4.0",
    "uuid": "^8.3.2",
    // ❌ 删除 "yarn": "^1.22.22",
    "zustand": "^4.4.0"
  }
}
```

**位置：** `package.json:21`

---

## 🟡 中等问题

### 3. RegionLayer.tsx 中使用 require 导入 react-rnd

**问题描述：**
- 使用 `require('react-rnd')` 来导入 react-rnd
- 这可能导致 TypeScript 类型检查失败
- 在 ESM 环境中可能无法正常工作

**影响：**
- ⚠️ TypeScript 类型检查可能失败
- ⚠️ 在纯 ESM 环境中可能无法工作
- ⚠️ 不符合现代 JavaScript 最佳实践

**当前代码：**
```typescript
// src/components/RegionLayer.tsx:6-7
declare const require: any;
const Rnd = require('react-rnd');
const RndComponent = (Rnd.default || Rnd) as React.ComponentType<any>;
```

**说明：**
- 代码注释说明这是为了兼容 React 16 / Webpack 4
- 但实际上 react-rnd 应该支持标准的 ES6 import
- 建议使用标准的 import 方式，让构建工具处理兼容性

**修复方案：**
```typescript
// 使用标准的 ES6 import（推荐）
import Rnd from 'react-rnd';
const RndComponent = Rnd;

// 或者如果需要兼容性，使用动态 import
const RndComponent = React.lazy(() => 
  import('react-rnd').then(m => ({ default: m.default || m }))
);
```

**位置：** `src/components/RegionLayer.tsx:6-7`

---

### 4. FileTabs.tsx 中使用 require 导入 zustand/shallow

**问题描述：**
- 使用 `require('zustand/shallow')` 来导入 shallow
- 这可能导致 TypeScript 类型检查失败
- 在 ESM 环境中可能无法正常工作

**影响：**
- ⚠️ TypeScript 类型检查可能失败
- ⚠️ 在纯 ESM 环境中可能无法工作
- ⚠️ 不符合现代 JavaScript 最佳实践

**当前代码：**
```typescript
// src/components/FileTabs.tsx:5-20
declare const require: any;
let useShallow: ShallowSelector;
try {
  useShallow = require('zustand/shallow');
} catch {
  try {
    useShallow = require('zustand/react/shallow');
  } catch {
    useShallow = <T,>(fn: (state: any) => T) => fn as any;
  }
}
```

**说明：**
- 代码注释说明这是为了兼容 zustand 4.x
- 但实际上 zustand 4.x 应该支持标准的 ES6 import
- 建议使用标准的 import 方式，让构建工具处理兼容性

**修复方案：**
```typescript
// 使用标准的 ES6 import（推荐）
import { useShallow } from 'zustand/react/shallow';

// 或者如果需要兼容性，使用条件导入
import { useShallow } from 'zustand/shallow';
```

**位置：** `src/components/FileTabs.tsx:5-20`

---

### 5. 类型定义文件不完整

**问题描述：**
- `src/types/pdfjs-dist.d.ts` 只定义了部分类型
- 缺少完整的类型定义，可能导致类型检查不准确

**影响：**
- ⚠️ TypeScript 类型检查可能不完整
- ⚠️ IDE 自动补全可能不准确
- ⚠️ 运行时类型错误可能无法提前发现

**当前代码：**
```typescript
// src/types/pdfjs-dist.d.ts
declare module 'pdfjs-dist/build/pdf' {
  export const GlobalWorkerOptions: { workerSrc: any };
  export function getDocument(src: any): { promise: Promise<any> };
}
```

**修复方案：**
- 使用 `@types/pdfjs-dist` 包（如果存在）
- 或者扩展类型定义，包含所有使用的 API

**位置：** `src/types/pdfjs-dist.d.ts`

---

## 🟢 轻微问题

### 6. package.json 中缺少 `exports` 字段

**问题描述：**
- 现代 npm 包应该使用 `exports` 字段来定义导出
- 当前只使用了 `main`、`module` 和 `types` 字段

**影响：**
- ⚠️ 在某些构建工具中可能无法正确解析
- ⚠️ 不符合现代 npm 包的最佳实践

**修复方案：**
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

**位置：** `package.json`

---

### 7. tsconfig.json 中缺少 `resolveJsonModule`

**问题描述：**
- 如果代码中需要导入 JSON 文件，需要启用 `resolveJsonModule`

**影响：**
- ⚠️ 如果需要导入 JSON 文件会报错

**修复方案：**
```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

**位置：** `tsconfig.json`

---

### 8. 缺少对 pdf-lib 的类型检查

**问题描述：**
- 代码中使用了 `pdf-lib`，但没有类型定义
- 可能导致类型检查不准确

**影响：**
- ⚠️ TypeScript 类型检查可能不完整

**修复方案：**
- 安装 `@types/pdf-lib`（如果存在）
- 或者添加类型定义文件

**位置：** `src/core/markerStore.ts:210`

---

## ✅ 检查通过的项目

### 1. 依赖版本兼容性
- ✅ React peerDependencies 配置正确（>=16.8.0 <19）
- ✅ 依赖版本使用 `^` 前缀，允许小版本更新

### 2. 打包配置
- ✅ vite.config.ts 正确配置了 external
- ✅ 正确配置了 sourcemap
- ✅ 正确配置了 TypeScript 声明文件生成

### 3. 导出配置
- ✅ src/index.ts 正确导出了所有公共 API
- ✅ 使用了 `export *` 和 `export { }` 的正确组合

### 4. 类型定义
- ✅ 核心类型定义完整（types.ts）
- ✅ 使用了 TypeScript strict 模式

### 5. 代码逻辑
- ✅ 错误处理完善
- ✅ 使用了 try-catch 处理异常
- ✅ 使用了动态导入避免打包问题

---

## 📋 修复优先级

### 高优先级（必须修复）
1. ✅ 添加 `pdf-lib` 到 external 配置
2. ✅ 删除 `yarn` 依赖

### 中优先级（建议修复）
3. ⚠️ 修复 RegionLayer.tsx 中的 require 导入
4. ⚠️ 修复 FileTabs.tsx 中的 require 导入
5. ⚠️ 完善类型定义文件

### 低优先级（可选优化）
6. 💡 添加 `exports` 字段到 package.json
7. 💡 添加 `resolveJsonModule` 到 tsconfig.json
8. 💡 添加 pdf-lib 的类型定义

---

## 🔧 修复建议

### 立即修复（高优先级）

1. **修复 vite.config.ts**
   ```typescript
   external: [
     'react', 
     'react-dom', 
     'pdfjs-dist', 
     'pdfjs-dist/legacy/build/pdf', 
     'pdf-lib', // 添加
     'uuid', 
     'zustand', 
     'react-rnd'
   ],
   ```

2. **修复 package.json**
   ```json
   {
     "dependencies": {
       "pdf-lib": "^1.17.1",
       "pdfjs-dist": "^2.16.105",
       "react-rnd": "^10.4.0",
       "uuid": "^8.3.2",
       "zustand": "^4.4.0"
     }
   }
   ```

### 后续优化（中优先级）

3. **修复 RegionLayer.tsx**
   ```typescript
   import Rnd from 'react-rnd';
   const RndComponent = Rnd;
   ```

4. **修复 FileTabs.tsx**
   ```typescript
   import { useShallow } from 'zustand/react/shallow';
   ```

---

## 📊 总结

- **严重问题：** 2 个
- **中等问题：** 3 个
- **轻微问题：** 3 个
- **检查通过：** 5 个

**总体评估：** 包的整体结构良好，但存在一些配置和代码风格问题需要修复。建议优先修复高优先级问题，然后逐步优化中低优先级问题。

