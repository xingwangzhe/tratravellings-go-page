# 开往 - 友链接力

开往是一个友链接力项目，通过随机跳转的方式，让用户发现更多有趣的网站。

## 🚀 项目结构

```text
/
├── .github/workflows/     # GitHub Actions 工作流配置
├── dist/                  # 构建输出目录
├── public/                # 静态资源目录
│   └── favicon.svg        # 网站图标
├── src/                   # 源代码目录
│   ├── assets/            # 静态资源（SVG图标等）
│   ├── components/        # 组件目录
│   ├── layouts/           # 布局组件
│   └── pages/             # 页面文件
├── astro.config.mjs       # Astro 配置文件
├── single-file-integration.js  # 自定义集成插件
└── package.json           # 项目依赖和脚本配置
```

### 核心组件

1. **页面 (src/pages)**
   - [index.astro](src/pages/index.astro) - 主页，包含左右火车和站点展示组件

2. **布局 (src/layouts)**
   - [Layout.astro](src/layouts/Layout.astro) - 主布局，包含星空背景和页脚

3. **组件 (src/components)**
   - [TrainL.astro](src/components/TrainL.astro) - 左侧火车动画组件
   - [TrainR.astro](src/components/TrainR.astro) - 右侧火车动画组件
   - [Sites.astro](src/components/Sites.astro) - 站点展示和滚动动画组件
   - [StarryBackground.astro](src/components/StarryBackground.astro) - 星空背景组件
   - [Footer.astro](src/components/Footer.astro) - 页脚组件

## 🏗️ 构建流程

### 1. 开发阶段
- 使用 Astro 框架构建静态网站
- 使用 Bun 作为包管理和运行时环境
- 组件使用 Astro 的类 React 语法编写
- 使用 animejs 实现动画效果

### 2. 构建阶段
构建过程分为几个步骤：

1. **Astro 构建**
   ```bash
   bun astro build
   ```
   这会生成标准的静态网站文件到 [dist/](dist/) 目录

2. **单文件集成处理**
   构建完成后，自定义的 [single-file-integration.js](single-file-integration.js) 插件会执行以下操作：
   - 将所有 CSS 和 JS 文件内联到 HTML 中
   - 将 SVG 图标转换为 data URI 格式并内联
   - 使用 [html-minifier-terser](node_modules/html-minifier-terser/src/htmlminifier.js) 压缩 HTML
   - 将生成的文件重命名为 `train-star.html`
   - 删除原始文件和已内联的资源文件

### 3. GitHub Actions 自动化构建
在 `.github/workflows/build.yml` 中配置了自动化构建流程：
1. 检出代码仓库
2. 设置 Bun 环境
3. 安装依赖
4. 执行 Astro 构建
5. 使用 [actions/upload-artifact@v4](node_modules/.pnpm/@types+node@18.19.67/node_modules/@types/node/stream.d.ts#L30-L30) 上传构建产物

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun build`           | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
