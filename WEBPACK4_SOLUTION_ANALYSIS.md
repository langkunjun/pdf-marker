# Webpack4 构建问题解决方案分析

## 问题背景

当前项目使用 `pdfjs-dist@^2.16.105`，在 Webpack4 环境下构建时遇到兼容性问题。代码中已经使用了 `pdfjs-dist/legacy/build/pdf` 路径，但可能仍然存在构建问题。

## 代码使用的 API 分析

经过代码审查，当前项目使用的 `pdfjs-dist` API 都是**基础且稳定的 API**，在 pdfjs-dist 的各个版本中都存在：

### 使用的核心 API

1. **`getDocument()`** - 加载 PDF 文档（所有版本都有）
2. **`pdfDocument.getPage()`** - 获取页面（所有版本都有）
3. **`page.render()`** - 渲染页面（所有版本都有）
4. **`GlobalWorkerOptions`** - Worker 配置（所有版本都有）
5. **`pdfDocument.numPages`** - 页面数量（所有版本都有）
6. **`pdfDocument.destroy()`** - 销毁文档（所有版本都有）

### 结论

✅ **代码使用的 API 都是基础 API，降低版本不会影响功能**

## 方案一：降低 pdfjs-dist 版本

### 可行性分析

#### ✅ 优点
1. **简单直接**：只需修改 `package.json` 中的版本号
2. **功能不受影响**：代码使用的都是基础 API，在旧版本中也存在
3. **维护成本低**：不需要额外的构建配置

#### ⚠️ 缺点
1. **可能失去新版本的 bug 修复**：2.16.105 可能修复了一些旧版本的 bug
2. **需要测试兼容性**：需要找到与 Webpack4 兼容的版本并测试

### 推荐的降级版本

根据 pdfjs-dist 的版本历史，以下版本与 Webpack4 兼容性较好：

- **`2.15.349`** - 稳定版本，legacy 构建完善
- **`2.14.305`** - 较早的稳定版本
- **`2.13.216`** - 更早的稳定版本

### 实施步骤

```bash
# 1. 降低版本
npm install pdfjs-dist@2.15.349 --save

# 2. 更新 CDN 引用（如果需要）
# 在 src/core/pdfWorker.ts 中更新 CDN 地址
```

### 风险评估

**风险等级：低**

- ✅ API 兼容性：100%（使用的都是基础 API）
- ✅ 功能影响：无（功能不受影响）
- ⚠️ 潜在问题：可能失去一些 bug 修复，但可以通过测试验证

---

## 方案二：二次封装 + Babel 转译

### 可行性分析

#### ✅ 优点
1. **保持最新版本**：可以继续使用 2.16.105 的最新功能
2. **隔离问题**：将兼容性问题隔离在封装层

#### ❌ 缺点
1. **复杂度高**：需要创建新的包、配置构建流程
2. **维护成本高**：需要维护额外的包和构建配置
3. **包体积增加**：二次封装会增加包体积
4. **可能引入新问题**：Babel 转译可能引入新的兼容性问题
5. **更新困难**：每次 pdfjs-dist 更新都需要重新构建封装包

### 实施复杂度

**复杂度：高**

需要：
1. 创建新的 npm 包（如 `pdfjs-dist-webpack4-compat`）
2. 配置 Babel 转译规则
3. 配置构建流程（webpack/rollup）
4. 发布和维护包
5. 在主项目中替换依赖

### 风险评估

**风险等级：中高**

- ⚠️ 技术风险：Babel 转译可能不完全兼容
- ⚠️ 维护风险：需要长期维护额外的包
- ⚠️ 性能风险：转译后的代码可能性能略差

---

## 方案三：优化 Webpack4 配置（推荐）

### 可行性分析

由于代码已经使用了 `pdfjs-dist/legacy/build/pdf`，问题可能出在 Webpack4 的配置上。建议先尝试优化配置。

### 实施步骤

#### 1. 确保使用绝对路径的 alias

```javascript
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      // 使用绝对路径确保正确解析
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf'),
    },
  },
};
```

#### 2. 配置 Babel 转译（如果需要）

如果 legacy 版本仍然有问题，可以在 Webpack4 配置中添加 Babel 转译：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'node_modules/pdfjs-dist'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['> 1%', 'last 2 versions'],
                },
                modules: 'commonjs',
              }],
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
            ],
          },
        },
      },
    ],
  },
};
```

#### 3. 配置 externals（如果作为库使用）

如果这个包是作为库被其他项目使用，可以在 `vite.config.ts` 中确保 `pdfjs-dist` 被正确 externalize：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['pdfjs-dist', 'pdfjs-dist/legacy/build/pdf'],
    },
  },
});
```

### 优点

1. **无需修改代码**：保持使用最新版本
2. **配置简单**：只需修改 Webpack4 配置
3. **维护成本低**：不需要额外的包
4. **灵活性高**：可以根据实际情况调整配置

---

## 综合建议

### 推荐方案排序

1. **🥇 方案三：优化 Webpack4 配置**（首选）
   - 最简单、最直接
   - 无需修改代码和依赖
   - 维护成本最低

2. **🥈 方案一：降低版本到 2.15.349**
   - 如果方案三无法解决问题
   - 功能不受影响
   - 实施简单

3. **🥉 方案二：二次封装**（不推荐）
   - 仅当前两个方案都无法解决时考虑
   - 复杂度高，维护成本大

### 实施建议

1. **第一步**：尝试方案三，优化 Webpack4 配置
   - 使用绝对路径 alias
   - 添加 Babel 转译规则（如果需要）
   - 测试构建是否成功

2. **第二步**：如果方案三无法解决，尝试方案一
   - 降低版本到 `2.15.349`
   - 更新 CDN 引用
   - 测试功能是否正常

3. **第三步**：如果前两个方案都无法解决，再考虑方案二
   - 创建封装包
   - 配置 Babel 转译
   - 发布和维护

### 测试清单

无论选择哪个方案，都需要测试以下功能：

- [ ] PDF 文档加载
- [ ] PDF 页面渲染
- [ ] PDF 页面切换
- [ ] PDF 缩略图生成
- [ ] PDF 页面分割
- [ ] Worker 配置
- [ ] 在 Webpack4 项目中的构建
- [ ] 在 Webpack4 项目中的运行

---

## 结论

**推荐优先尝试方案三（优化 Webpack4 配置）**，因为：
1. 代码已经使用了 legacy 版本，理论上应该兼容
2. 问题可能出在 Webpack4 的配置上，而非 pdfjs-dist 本身
3. 无需修改代码和依赖，风险最低

如果方案三无法解决，再考虑方案一（降低版本），因为：
1. 代码使用的都是基础 API，降低版本不会影响功能
2. 实施简单，维护成本低

方案二（二次封装）仅作为最后的选择，因为复杂度高、维护成本大。

