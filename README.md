# Tfiction - 摸鱼小说阅读器

一款基于 Wails + React + TypeScript + Go 开发的跨平台桌面小说阅读器，支持多种小说格式、窗口置顶、摸鱼模式等特性。

## 项目特点

- 🚀 **跨平台支持**：支持 Windows、macOS 多平台运行
- 📚 **多格式支持**：支持 TXT、EPUB、PDF、MOBI、AZW3 等多种格式
- 👁️ **摸鱼模式**：支持基础隐身 / 完全隐身、悬停唤出、右键快捷控制面板、即时透明度调节
- 🔍 **全文搜索**：支持全文搜索、结果侧栏浏览、章节内跳转和阅读区高亮
- 🎨 **自定义主题**：支持亮色、暗色、护眼色等多种主题
- 💾 **阅读进度**：滚动时自动保存阅读进度，重新打开后恢复章节和进度
- 🪟 **窗口置顶**：支持窗口置顶和阅读态摸鱼切换
- 🗂️ **真实书架**：首页书架已接入本地持久化，可导入单文件、创建目录、移动文件
- ⌨️ **快捷键自定义**：快捷键设置页支持录制式修改，阅读器会即时读取新配置
- 🚪 **打开链路完善**：支持导入后直接入库，书架卡片和目录快速阅读再进入阅读器，也支持一键以老板模式打开
- 📖 **EPUB 导入可读**：已接通 EPUB 解包、目录定位、章节提取和正文兜底解析
- 🖼️ **EPUB 封面可读**：已支持 metadata / manifest / guide / cover.xhtml / 扉页背景图等常见封面来源，若无封面才回退默认图标
- 📂 **目录层级可浏览**：目录支持进入下一层查看文件，阅读页可直接返回书架或原目录
- 🎯 **目录头部更克制**：二级目录只保留箭头和路径标题，位置更贴近顶部且与封面区留出呼吸感
- ▭ **搜索框纯色边框**：首页搜索框去掉发散感和模糊，只保留纯色边框线
- 🪟 **弹窗风格统一**：已抽出项目内通用 Dialog，导入弹窗保持现有风格，删除确认改为会跟随三套主题配色的硬边自定义弹窗
- 🗑️ **删除交互已打通**：删除目录会单独确认，删除书籍会带上书名和文件后缀再确认，确认后会立即从书架移除并清理阅读进度
- 🛠️ **删除入口已补稳**：书架卡片上的删除按钮已补上独立事件链，点击不会再误触卡片打开，删除确认会稳定弹出
- 📥 **导入体验已收敛**：导入成功后只刷新书架或目录，不再强制跳进阅读页；导入选项卡片整块区域都可点击
- ↕️ **设置切换更顺手**：左侧切换设置分类时，右侧内容区会自动回到顶部，不会停留在上一个分类的滚动位置
- 🌙 **夜间配色已收敛**：暗色主题从高亮紫压到更柔和的夜间靛紫，封面底部标题区也改成跟随主题的渐变，不再在白天和护眼模式下发黑
- 🧱 **整版视觉正在统一**：首页、阅读页、设置页、书籍卡片和核心弹窗已切到统一的硬边风格，同时保留 `light / dark / sepia` 三套主题
- 🎛️ **设置控件去第三方壳**：阅读设置里的字体、滑块、颜色选择和老板模式开关已切成项目内可复用控件，目录“添加文件”弹窗也已统一到同一套设计语言
- ✏️ **重命名交互已收口**：书籍和目录重命名不再使用系统 `prompt`，改为项目内输入弹窗，支持空值校验和点击空白取消

## 当前已打通的主流程

1. 首页导入本地小说文件
2. 导入完成后刷新书架或目录
3. 阅读过程中自动保存章节与总进度
4. 返回书架后显示最近阅读时间与进度
5. 重新打开同一文件时恢复上次阅读状态
6. 阅读页可通过 `Ctrl+Shift+H` 快速进入 BOSS 模式
7. BOSS 模式支持 `Esc` 立即隐藏内容，右键呼出快捷控制面板
8. 快捷键设置页可自定义 BOSS 模式、快速隐藏、搜索、翻章和返回书架
9. EPUB 文件导入后会自动提取书名、封面、章节和正文并写入书架
10. 目录内文件会稳定保存在原目录下，重启后不会再回到顶层书架
11. 目录页标题支持用单箭头返回，搜索框视觉已收敛为纯边框样式
12. 设置页阅读控件与目录添加弹窗已接入项目内控件体系，主题切换时会一起保持统一视觉
13. 书籍与目录重命名已切到项目内弹窗，输入和保存反馈更统一

## 技术栈

### 后端
- **Go**: 1.21+
- **Wails**: v2.9+
- **架构**: 分层架构（app/services/models）

### 前端
- **React**: 18.3+
- **TypeScript**: 5.5+
- **构建工具**: Vite 5.3+
- **状态管理**: Zustand 4.5+
- **样式方案**: SCSS Modules + CSS Variables
- **兼容目标**: ES2015+（支持更多浏览器版本）

### 开发工具
- **ESLint**: 代码检查
- **TypeScript**: 类型检查
- **PostCSS**: CSS 处理

## 环境要求

### 系统要求
- **Windows**: Windows 10/11 (64-bit)
- **macOS**: macOS 10.15+ (Catalina or later)

### 开发环境
- **Go**: 1.21 或更高版本
- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **Wails CLI**: v2.9+

## 快速开始

### 1. 安装依赖

#### 安装 Go
访问 [Go 官网](https://golang.org/dl/) 下载并安装 Go 1.21+

#### 安装 Node.js
访问 [Node.js 官网](https://nodejs.org/) 下载并安装 Node.js 18+

#### 安装 Wails CLI
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

#### 安装前端依赖
```bash
cd frontend
npm install
```

#### 安装 Go 依赖
```bash
go mod tidy
```

### 2. 配置环境

项目支持三种环境配置：

- **local**: 本地开发环境（默认）
- **test**: 测试环境
- **prod**: 生产环境

环境配置文件位于：
- Go 后端：`config/config.{env}.json`
- React 前端：`frontend/.env.{env}`

可通过环境变量切换：
```bash
# 设置为测试环境
export TFICTION_ENV=test

# 设置为生产环境
export TFICTION_ENV=prod
```

### 3. 开发模式运行

```bash
# 开发模式（热重载）
wails dev

# 或者使用 npm 脚本（前端开发）
cd frontend
npm run dev
```

### 3.1 常用校验命令

```bash
# 前端类型检查
cd frontend
npm run type-check

# 后端校验（项目内缓存，避免系统目录权限问题）
cd ..
GOCACHE=$(pwd)/.gocache go test ./...
```

### 4. 构建项目

#### 构建所有平台（当前平台）
```bash
wails build
```

#### 构建特定环境
```bash
# 本地环境
wails build -clean

# 测试环境
TFICTION_ENV=test wails build

# 生产环境
TFICTION_ENV=prod wails build
```

#### 仅构建前端
```bash
cd frontend

# 本地环境
npm run build:local

# 测试环境
npm run build:test

# 生产环境
npm run build:prod
```

### 5. 跨平台打包

#### Windows 打包
在 Windows 系统上运行：
```bash
wails build -platform windows/amd64
```

#### macOS 打包
在 macOS 系统上运行：
```bash
# Intel 芯片
wails build -platform darwin/amd64

# Apple Silicon (M1/M2)
wails build -platform darwin/arm64

# Universal Binary (同时支持 Intel 和 Apple Silicon)
wails build -platform darwin/universal
```

构建产物位于 `build/bin/` 目录。

## 项目结构

```
GO_Tfiction/
├── backend/                    # Go 后端代码
│   ├── app/                   # 应用主逻辑
│   │   └── app.go            # 应用入口和生命周期管理
│   ├── config/               # 配置管理
│   │   └── config.go         # 配置加载和解析
│   ├── services/             # 业务服务层
│   │   ├── novel_service.go  # 小说管理服务（选择文件、解析章节、恢复进度）
│   │   ├── window_service.go # 窗口管理服务（置顶、透明度、摸鱼模式）
│   │   ├── search_service.go # 搜索服务（全文搜索、关键字定位）
│   │   └── progress_service.go # 阅读进度持久化服务
│   ├── models/               # 数据模型
│   │   └── models.go         # 小说、章节、搜索结果等模型定义
│   └── utils/                # 工具函数
│
├── frontend/                   # React 前端代码
│   ├── src/
│   │   ├── components/       # React 组件
│   │   │   ├── features/BookCard  # 书籍卡片
│   │   │   ├── features/Sidebar   # 书架侧边栏
│   │   │   └── common/            # 通用输入、按钮、选择器、开关、颜色选择、Dialog 等
│   │   ├── stores/           # Zustand 状态管理
│   │   │   ├── novelStore.ts      # 当前阅读小说状态
│   │   │   ├── libraryStore.ts    # 书架与目录持久化
│   │   │   ├── windowStore.ts     # 窗口状态管理
│   │   │   └── settingsStore.ts   # 阅读设置管理
│   │   ├── hooks/            # 自定义 React Hooks
│   │   ├── types/            # TypeScript 类型定义
│   │   │   └── index.ts           # 公共类型定义
│   │   ├── utils/novel.ts    # Wails 模型转换与阅读辅助函数
│   │   ├── assets/           # 静态资源
│   │   ├── App.tsx           # 应用主组件
│   │   ├── main.tsx          # 应用入口
│   │   └── index.scss        # 全局样式
│   ├── package.json          # 前端依赖配置
│   ├── tsconfig.json         # TypeScript 配置
│   ├── vite.config.ts        # Vite 构建配置
│   ├── tailwind.config.js    # TailwindCSS 配置
│   └── .env.*                # 环境变量配置
│
├── config/                    # 配置文件
│   ├── config.local.json     # 本地环境配置
│   ├── config.test.json      # 测试环境配置
│   └── config.prod.json      # 生产环境配置
│
├── build/                     # 构建产物目录
│   └── bin/                  # 可执行文件
│
├── docs/                      # 文档目录
│
├── main.go                    # Go 应用入口
├── go.mod                     # Go 模块依赖
├── wails.json                 # Wails 配置文件
├── README.md                  # 项目说明文档（本文件）
└── FEATURES.md                # 业务功能文档
```

## 开发指南

### 代码规范

#### Go 代码规范
- 遵循 Go 官方代码规范
- 使用 `gofmt` 格式化代码
- 函数和类型添加清晰的注释
- 错误处理使用明确的错误信息

#### TypeScript/React 规范
- 使用 ESLint 进行代码检查
- 遵循 React Hooks 规范
- 组件添加 JSDoc 注释说明
- 使用函数式组件和 Hooks

### 添加新功能

1. **后端服务**：在 `backend/services/` 创建新服务
2. **前端组件**：在 `frontend/src/components/` 创建新组件
3. **状态管理**：在 `frontend/src/stores/` 创建新 store
4. **类型定义**：在 `frontend/src/types/` 添加类型定义
5. **模型转换**：涉及 Wails 返回结构时，统一走 `frontend/src/utils/novel.ts`

### 调试方法

#### 开发模式调试
```bash
wails dev
```
开发模式会自动打开浏览器开发者工具，可以查看 console 日志和网络请求。

#### Go 后端调试
使用日志输出：
```go
import "log"
log.Printf("Debug info: %v", data)
```

#### React 前端调试
使用 console 输出：
```typescript
console.log('Debug info:', data)
```

## 常见问题

### 1. Wails 安装失败
确保已正确安装 Go，并设置了 `GOPATH` 和 `GOBIN` 环境变量。

### 2. 前端依赖安装失败
尝试清理 npm 缓存：
```bash
npm cache clean --force
npm install
```

### 3. 构建失败
确保所有依赖都已正确安装，并检查 Go 和 Node.js 版本是否符合要求。

### 4. 应用无法启动
检查配置文件是否正确，确保数据目录有写入权限。

## 技术版本兼容性

### 最低版本要求
- Go: 1.21
- Node.js: 18.0
- Wails: 2.9.0
- React: 18.3
- TypeScript: 5.5

### 推荐版本
- Go: 1.21+
- Node.js: 20.x LTS
- npm: 10.x

### 浏览器引擎
- Windows: WebView2 (自动安装)
- macOS: WKWebView (系统自带)

## 性能优化

- 前端代码分割和懒加载
- 构建时自动压缩和混淆
- 资源文件嵌入到可执行文件
- 阅读内容缓存机制

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

- 作者: NongChen
- 仓库: [https://github.com/NongChen1223/Tfiction](https://github.com/NongChen1223/Tfiction)

## 更新日志

### v1.0.0 (2024-11-27)
- 初始版本发布
- 基础框架搭建完成
- 支持 TXT 格式小说阅读
- 实现摸鱼模式
- 实现全文搜索
- 支持跨平台打包
