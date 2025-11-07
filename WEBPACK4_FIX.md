# Webpack 4 配置修复指南

## 问题描述

如果你遇到以下错误：
```
Module not found: Can't resolve 'react/jsx-runtime' in 'D:\...\node_modules\react-rnd\node_modules\re-resizable\lib'
```

这是因为 `react-rnd` 的嵌套依赖 `re-resizable` 使用了 React 17+ 的 `react/jsx-runtime`，但你的项目使用 React 16。

## 解决方案

### 方案 1：使用绝对路径的 alias（推荐）

在你的 `webpack.config.js` 中，**必须使用绝对路径**，而不是相对路径：

```javascript
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      // ✅ 正确：使用绝对路径
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react'),
      
      // ✅ 正确：处理嵌套依赖
      'react-rnd/node_modules/react/jsx-runtime': path.resolve(__dirname, 'node_modules/react'),
      
      // ✅ 正确：pdfjs-dist
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf'),
    },
  },
};
```

### 方案 2：使用 webpack.resolve.alias（相对路径 - 可能不工作）

```javascript
// ⚠️ 可能不工作：相对路径在某些情况下无法正确解析嵌套依赖
resolve: {
  alias: {
    'react/jsx-runtime': 'react',
    'react/jsx-dev-runtime': 'react',
  },
}
```

### 方案 3：添加 Babel 转译规则（如果方案 1 不行）

如果 alias 仍然无法解决问题，可以尝试转译 `re-resizable`：

```javascript
module: {
  rules: [
    {
      test: /\.js$/,
      include: [
        /node_modules\/react-rnd/,
        /node_modules\/re-resizable/,
      ],
      use: {
        loader: 'babel-loader',
        options: {
          babelrc: false,
          configFile: false,
          presets: [
            ['@babel/preset-env', { targets: { browsers: ['> 1%', 'last 2 versions'] } }],
            ['@babel/preset-react', { runtime: 'classic' }], // 使用 classic runtime
          ],
          plugins: [
            '@babel/plugin-proposal-class-properties',
          ],
        },
      },
    },
  ],
}
```

## 针对你的 webpack 配置的具体修改

你的配置已经添加了 alias，但建议修改为：

```javascript
resolve: {
  alias: {
    // 修改前（相对路径）
    "react/jsx-runtime": "react",
    "react/jsx-dev-runtime": "react",
    
    // 修改后（绝对路径 - 推荐）
    "react/jsx-runtime": path.resolve(__dirname, "node_modules/react"),
    "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react"),
    
    // 保持原有配置
    "pdfjs-dist": "pdfjs-dist/legacy/build/pdf",
    // ... 其他 alias
  },
}
```

## 验证步骤

1. **修改配置后，清除缓存：**
   ```bash
   # 删除 webpack 缓存
   rm -rf node_modules/.cache
   # 或 Windows
   rmdir /s /q node_modules\.cache
   ```

2. **重启开发服务器**

3. **检查是否还有错误**

## 如果仍然有问题

如果使用绝对路径后仍然有问题，可能需要：

1. **检查 node_modules 结构：**
   ```bash
   # 查看 react-rnd 的依赖
   ls node_modules/react-rnd/node_modules/
   ```

2. **尝试删除并重新安装依赖：**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **检查是否有多个 react 版本：**
   ```bash
   npm ls react
   ```
   如果有多个版本，需要统一版本。

4. **使用 webpack 的 resolve.modules 配置：**
   ```javascript
   resolve: {
     modules: ['node_modules', path.resolve(__dirname, 'node_modules')],
     // ... alias
   }
   ```

## 完整的修复示例

```javascript
const path = require('path');

module.exports = function(webpackEnv) {
  // ... 其他配置
  
  return {
    // ... 其他配置
    resolve: {
      modules: ["node_modules"].concat(
        process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter).filter(Boolean) : []
      ),
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        // 使用绝对路径确保正确解析
        "react/jsx-runtime": path.resolve(__dirname, "node_modules/react"),
        "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react"),
        
        // 处理嵌套依赖
        "react-rnd/node_modules/react/jsx-runtime": path.resolve(__dirname, "node_modules/react"),
        
        // PDF.js
        "pdfjs-dist": path.resolve(__dirname, "node_modules/pdfjs-dist/legacy/build/pdf"),
        
        // 你的其他 alias
        "@": path.join(__dirname, "..", "src"),
        // ... 其他配置
      },
    },
    // ... 其他配置
  };
};
```

