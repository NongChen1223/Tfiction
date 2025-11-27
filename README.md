# Tfiction - 摸鱼小说阅读器

一款基于 Wails + React + TypeScript + Go 开发的跨平台桌面小说阅读器，支持多种小说格式、窗口置顶、摸鱼模式等特性。

## 项目特点

- 🚀 **跨平台支持**：支持 Windows、macOS 多平台运行
- 📚 **多格式支持**：支持 TXT、EPUB、PDF、MOBI、AZW3 等多种格式
- 👁️ **摸鱼模式**：背景透明、鼠标悬停显示/隐藏，助你职场摸鱼
- 🔍 **全文搜索**：支持关键字搜索，快速定位内容
- 🎨 **自定义主题**：支持亮色、暗色、护眼色等多种主题
- 💾 **阅读进度**：自动保存阅读进度，随时继续阅读
- 🪟 **窗口置顶**：支持窗口置顶功能

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
- **样式方案**: TailwindCSS 3.4+
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
│   │   ├── novel_service.go  # 小说管理服务（打开、解析、格式转换）
│   │   ├── window_service.go # 窗口管理服务（置顶、透明度、摸鱼模式）
│   │   └── search_service.go # 搜索服务（全文搜索、关键字高亮）
│   ├── models/               # 数据模型
│   │   └── models.go         # 小说、章节、搜索结果等模型定义
│   └── utils/                # 工具函数
│
├── frontend/                   # React 前端代码
│   ├── src/
│   │   ├── components/       # React 组件
│   │   │   ├── NovelReader.tsx    # 小说阅读器组件
│   │   │   ├── Toolbar.tsx        # 工具栏组件
│   │   │   ├── Sidebar.tsx        # 侧边栏（章节列表）
│   │   │   └── SearchPanel.tsx    # 搜索面板
│   │   ├── stores/           # Zustand 状态管理
│   │   │   ├── novelStore.ts      # 小说状态管理
│   │   │   ├── windowStore.ts     # 窗口状态管理
│   │   │   └── settingsStore.ts   # 阅读设置管理
│   │   ├── hooks/            # 自定义 React Hooks
│   │   ├── types/            # TypeScript 类型定义
│   │   │   └── index.ts           # 公共类型定义
│   │   ├── utils/            # 工具函数
│   │   ├── assets/           # 静态资源
│   │   ├── App.tsx           # 应用主组件
│   │   ├── main.tsx          # 应用入口
│   │   └── index.css         # 全局样式
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
