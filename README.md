# Tfiction

Tfiction 是一个基于 Wails 的桌面小说阅读器项目，前端使用 React + TypeScript，后端使用 Go。
当前主线能力是本地小说书架、TXT / EPUB / PDF 阅读、阅读外观设置、全文搜索、阅读进度持久化，以及阅读页摸鱼模式。

详细功能和设计说明见 [docs/功能需求说明.md](docs/功能需求说明.md)。

## 当前技术栈

### 桌面与后端

- Go `1.24.1`
- toolchain `go1.24.4`
- Wails `v2.11.0`

### 前端

- React `18.3.1`
- TypeScript `5.5.2`
- Vite `5.3.1`
- Zustand `4.5.2`
- Ant Design `6.1.0`
- SCSS Modules

### 开发工具

- pnpm
- ESLint
- Sass

## 当前支持情况

### 已实现

- 书架与目录管理
- 单文件导入、目录创建、目录内继续导入
- TXT 阅读
- EPUB 元数据、封面、章节、正文图片渲染
- PDF 阅读（文本型 PDF；macOS 额外支持图片型 PDF 按页阅读）
- 阅读进度保存与恢复
- 阅读页目录、上一章、下一章
- 全文搜索与命中跳转
- 阅读外观设置
- 快捷键设置
- 普通摸鱼模式
- macOS 原生桌面浮窗摸鱼模式

### 未完整实现或仅占位

- MOBI 阅读
- AZW3 阅读
- 格式转换
- 真实阅读统计
- 漫画主线功能

## 平台差异

- macOS：支持原生桌面浮窗式摸鱼模式，也支持图片型 PDF 按页渲染
- Windows / 非 darwin：摸鱼模式退化为普通 WebView 隐身模式；PDF 当前仅保证文本型文件阅读

## 开发命令

### 安装依赖

```bash
go mod tidy
pnpm --dir frontend install
```

### 开发模式

```bash
wails dev
```

### 前端构建

```bash
pnpm --dir frontend build
```

### 前端类型检查

```bash
pnpm --dir frontend type-check
```

### 后端编译检查

```bash
go build ./...
```

### 后端测试

```bash
GOCACHE=$(pwd)/.gocache go test ./...
```

### 打包

```bash
wails build
```

## 项目结构

```text
GO_Tfiction/
├── backend/
│   ├── app/
│   │   └── app.go                      # 应用生命周期、配置接口、Wails 绑定入口
│   ├── models/
│   │   └── models.go                   # 小说、章节、搜索结果等后端模型
│   └── services/
│       ├── novel_service.go            # 文件打开、TXT/EPUB/PDF 解析、章节读取、进度恢复
│       ├── progress_service.go         # 阅读进度持久化
│       ├── search_service.go           # 全文搜索
│       ├── window_service.go           # 置顶、透明度、摸鱼模式控制
│       ├── window_overlay_darwin.go    # macOS 原生桌面浮窗实现
│       └── window_overlay_default.go   # 非 macOS 空实现降级
├── config/
│   ├── config.local.json               # 本地环境配置
│   ├── config.test.json                # 测试环境配置
│   └── config.prod.json                # 生产环境配置
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                 # 通用按钮、输入、滑块、选择器、Dialog 等
│   │   │   └── features/               # 书籍卡片、侧边栏、阅读外观控件等业务组件
│   │   ├── hooks/                      # 自定义 hooks
│   │   ├── layouts/                    # 页面布局
│   │   ├── pages/
│   │   │   ├── Home/                   # 书架页
│   │   │   ├── Reader/                 # 阅读页
│   │   │   └── Settings/               # 设置页
│   │   ├── router/                     # 路由配置
│   │   ├── services/                   # 前端 bridge / service 封装
│   │   ├── stores/                     # Zustand 状态管理
│   │   ├── styles/                     # 主题变量与全局样式资源
│   │   ├── types/                      # 前端类型定义
│   │   ├── utils/                      # 阅读与快捷键相关工具函数
│   │   └── wailsjs/                    # Wails 生成的前端绑定代码
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── 功能需求说明.md                 # 详细功能、交互和设计说明
├── main.go                             # Wails 应用启动入口
├── wails.json                          # Wails 构建配置
└── AGENTS.md                           # 仓库级协作约束
```

## 配置与数据

### 环境配置

- 环境变量：`TFICTION_ENV`
- 默认配置文件：
- `config/config.local.json`
- `config/config.test.json`
- `config/config.prod.json`

### 本地数据

- 设置页里的“本地存储路径”对应后端 `Config.DataDir`
- 阅读进度存储在 `DataDir/progress.json`
- 书架、阅读设置、主题、快捷键主要保存在前端本地存储
- 导入书籍默认保留原始本地文件路径，不会复制到应用数据目录

## 当前注意点

- `wails dev` 依赖 Vite 默认端口，若 `5173` 被占用需要先释放
- Sass 仍有 legacy API / `@import` 警告，但当前不影响构建
- PDF 支持可提取文本的文本型文件；macOS 也支持漫画 / 扫描版等图片型 PDF 按页阅读；加密 PDF 仍不支持
- macOS 测试构建可能出现 Wails private API 警告，这不代表当前可直接用于 App Store 审核
