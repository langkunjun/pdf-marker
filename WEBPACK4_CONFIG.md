# Webpack 4 配置指南

本库使用 Vite 构建，但目标项目使用 Webpack 4 时，需要在主项目的 webpack 配置中添加以下设置。

## 必需配置

在 `webpack.config.js` 中添加以下 `resolve.alias` 配置：

```javascript
module.exports = {
  resolve: {
    alias: {
      // 1. pdfjs-dist 使用 legacy 版本
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf',
      
      // 2. react/jsx-runtime 映射到 react（React 16 必需）
      'react/jsx-runtime': 'react',
      'react/jsx-dev-runtime': 'react',
    },
  },
};
```

## 完整配置示例

```javascript
const path = require('path');

module.exports = {
  mode: 'development', // 或 'production'
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      // PDF.js legacy 版本（使用绝对路径）
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf'),
      
      // React 16 兼容性（使用绝对路径确保正确解析）
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react'),
      
      // 处理 react-rnd 的嵌套依赖
      // 确保所有 react-rnd 相关的依赖都使用正确的 react
      'react-rnd/node_modules/react/jsx-runtime': path.resolve(__dirname, 'node_modules/react'),
      'react-rnd/node_modules/react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules\/(?!(pdfjs-dist|react-rnd)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
            ],
          },
        },
      },
    ],
  },
};
```

## 常见错误及解决方案

### 错误 1: `Module not found: Can't resolve 'react/jsx-runtime' in 'react-rnd/node_modules/re-resizable/lib'`

**原因：** `react-rnd` 的嵌套依赖 `re-resizable` 使用了 React 17+ 的 `react/jsx-runtime`，但 React 16 不支持。由于是嵌套在 `react-rnd/node_modules` 中，普通的 alias 可能无法正确解析。

**解决方案 A（推荐）：使用绝对路径的 alias**
```javascript
const path = require('path');

resolve: {
  alias: {
    // 使用绝对路径，确保所有嵌套依赖都能正确解析
    'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react'),
    'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react'),
    
    // 处理 react-rnd 的嵌套依赖路径
    'react-rnd/node_modules/react/jsx-runtime': path.resolve(__dirname, 'node_modules/react'),
    'react-rnd/node_modules/react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react'),
  },
}
```

**解决方案 B：使用 webpack NormalModuleReplacementPlugin**
```javascript
const webpack = require('webpack');

plugins: [
  // ... 其他插件
  new webpack.NormalModuleReplacementPlugin(
    /react-rnd\/node_modules\/re-resizable\/lib\/.*\.js$/,
    (resource) => {
      // 这个插件会在运行时替换模块，但需要手动处理代码
      // 不推荐，因为需要修改源码
    }
  ),
]
```

**解决方案 C：使用 resolveLoader 和自定义 loader（复杂）**
不建议，因为需要编写自定义 loader。

**最佳实践：使用绝对路径的 alias（方案 A）**

### 错误 2: `Missing class properties transform`

**原因：** `pdfjs-dist` 使用了类属性语法，Webpack 4 默认不转译。

**解决：** 使用 legacy 版本：
```javascript
resolve: {
  alias: {
    'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf',
  },
}
```

### 错误 3: 配置后仍然报错

**检查：**
1. 清除 webpack 缓存：删除 `.cache` 或 `node_modules/.cache`
2. 重启开发服务器
3. 确认 webpack 配置文件路径正确
4. 检查是否有其他配置文件覆盖了 alias（如 `webpack.config.prod.js`）

## React 16 版本要求

- React: `>=16.8.0 <17.0.0`
- React DOM: `>=16.8.0 <17.0.0`

## PDF.js Worker 配置

如果使用 `generateFilePreviews` 等方法时遇到 worker 加载错误，需要配置 worker 文件：

### 方案 1：使用 CopyWebpackPlugin 复制 worker 文件（推荐）

```javascript
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    // ... 其他插件
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js'),
          to: path.resolve(__dirname, 'public/pdf.worker.min.js'),
        },
      ],
    }),
  ],
};
```

然后在代码中配置：
```javascript
import { setPdfWorkerSrc } from '@kunkun/pdf-marker';

// 设置 worker 路径（相对于 public 目录）
setPdfWorkerSrc('/pdf.worker.min.js');
```

### 方案 2：使用 CDN（如果网络允许）

```javascript
import { setPdfWorkerSrc } from '@kunkun/pdf-marker';

// 使用 CDN（标准版本，与 legacy 兼容）
setPdfWorkerSrc('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js');
```

### 方案 3：使用 webpack 的 publicPath

在 webpack 配置中：
```javascript
module.exports = {
  output: {
    publicPath: '/',
  },
  resolve: {
    alias: {
      // 将 worker 文件映射到 public 目录
      'pdfjs-dist/legacy/build/pdf.worker.min.js': path.resolve(__dirname, 'public/pdf.worker.min.js'),
    },
  },
};
```

## 验证配置

配置完成后，重新启动开发服务器，应该不再出现 `react/jsx-runtime` 相关的错误。

