# Figma 设计迁移计划

## ✅ 已完成的工作

### 1. 主题系统 (Theme System)
- ✅ 创建了 CSS 变量系统 (`frontend/src/styles/variables.css`)
- ✅ 支持白天/夜间主题切换
- ✅ 使用 RGB 格式的颜色变量，方便透明度调整
- ✅ 定义了完整的设计 Token（颜色、间距、圆角、过渡动画等）
- ✅ 创建主题管理 Store (`stores/themeStore.ts`)

### 2. 全局样式
- ✅ 更新了 `index.css`，引入主题变量
- ✅ 实现了自定义滚动条样式
- ✅ 添加了毛玻璃效果(.glass, .glass-dark)
- ✅ 添加了动画关键帧(fadeIn, slideIn等)
- ✅ 添加了悬停效果(.hover-lift)

### 3. 通用组件
- ✅ Button 组件 (`components/common/Button`)
  - 支持 primary/secondary/ghost/danger 变体
  - 支持 sm/md/lg 三种尺寸
  - 支持图标和全宽模式

---

## 📋 Figma 设计分析

### 主要页面和组件

根据 Figma 导出的代码，项目包含以下主要部分：

#### 1. **Library（书架页面）** ⭐ 核心页面
**组件结构：**
```
Library/
├── Sidebar（侧边栏）
│   ├── Logo & Title
│   ├── Categories（分类导航）
│   │   ├── 全部
│   │   ├── 最近阅读
│   │   ├── 小说
│   │   ├── 漫画
│   │   └── 收藏
│   └── Settings Button
│
├── Main Content
│   ├── Header
│   │   ├── Search Input（搜索框）
│   │   ├── View Mode Toggle（网格/列表切换）
│   │   └── Import Button（导入按钮）
│   │
│   └── Books Grid/List（书籍展示区）
│       └── BookCard（书籍卡片）
│           ├── Cover Image
│           ├── Title & Author
│           ├── Progress Bar
│           ├── Category Badge
│           └── Actions（编辑/删除）
```

**设计特点：**
- 深色背景 + 渐变光效
- 毛玻璃效果的卡片
- 紫色 (#9333EA) 作为主色调
- 悬停时卡片上浮效果
- 平滑的过渡动画

#### 2. **NovelReader（小说阅读器）**
**组件结构：**
```
NovelReader/
├── Header（顶部工具栏）
│   ├── Back Button
│   ├── Book Title
│   └── Settings Button
│
├── Sidebar（章节列表）
│   └── Chapter List
│
├── Main Content（阅读区域）
│   ├── Chapter Title
│   ├── Content
│   └── Pagination
│
└── Settings Panel（阅读设置）
    ├── Font Size Slider
    ├── Font Family Select
    ├── Line Height Slider
    ├── Theme Toggle (day/night/sepia)
    └── Auto Scroll Speed
```

**设计特点：**
- 可自定义字体大小、行高、字体
- 支持多种主题（日间/夜间/护眼）
- 侧边章节导航
- 自动滚动功能

#### 3. **MangaReader（漫画阅读器）**
**组件结构：**
```
MangaReader/
├── Header
├── Main Viewer
│   ├── Single Page Mode
│   └── Double Page Mode
│
├── Controls
│   ├── Previous/Next Page
│   ├── Page Counter
│   └── Settings
│
└── Settings Panel
    ├── View Mode (single/double)
    ├── Brightness Slider
    ├── Contrast Slider
    └── Saturation Slider
```

#### 4. **Settings（设置页面）**
**组件结构：**
```
Settings/
├── Navigation Tabs
│   ├── 阅读设置
│   ├── 外观设置
│   └── 统计信息
│
├── Reading Settings
│   ├── Default Font Size
│   ├── Default Theme
│   └── Auto Scroll Settings
│
├── Appearance Settings
│   ├── Theme Toggle
│   ├── Sidebar Width
│   └── Animation Toggle
│
└── Statistics
    ├── Today's Reading Time
    ├── Weekly Reading Time
    ├── Completed Books
    └── Total Pages Read
```

#### 5. **BossMode（摸鱼模式）** ⭐ 特色功能
- 窗口置顶
- 背景透明/毛玻璃效果
- 鼠标悬停显示/离开隐藏
- 快捷键切换（Ctrl+Shift+B）

---

## 🛠️ 待实现的组件列表

### A. Common Components（通用组件）

1. ✅ **Button** - 已完成
2. ⏳ **Input** - 需实现
   ```tsx
   <Input
     placeholder="搜索..."
     icon={<SearchIcon />}
     onClear={() => {}}
   />
   ```

3. ⏳ **Badge** - 需实现
   ```tsx
   <Badge variant="primary">科幻</Badge>
   ```

4. ⏳ **Slider** - 需实现
   ```tsx
   <Slider
     min={12}
     max={32}
     value={18}
     onChange={(val) => {}}
   />
   ```

5. ⏳ **Select** - 需实现
   ```tsx
   <Select
     options={fonts}
     value={currentFont}
     onChange={setFont}
   />
   ```

6. ⏳ **Tabs** - 需实现
   ```tsx
   <Tabs>
     <Tab label="小说">...</Tab>
     <Tab label="漫画">...</Tab>
   </Tabs>
   ```

### B. Feature Components（功能组件）

1. ⏳ **BookCard** - 需实现
   ```tsx
   <BookCard
     book={book}
     viewMode="grid" // or "list"
     onOpen={() => {}}
     onEdit={() => {}}
     onDelete={() => {}}
   />
   ```

2. ⏳ **ChapterList** - 需实现
   ```tsx
   <ChapterList
     chapters={chapters}
     currentChapter={0}
     onSelect={(index) => {}}
   />
   ```

3. ⏳ **ProgressBar** - 需实现
   ```tsx
   <ProgressBar value={45} max={100} />
   ```

### C. Layout Components（布局组件）

1. ⏳ **Sidebar** - 需实现
   ```tsx
   <Sidebar
     categories={categories}
     selected={selected}
     onSelect={setSelected}
   />
   ```

2. ⏳ **Toolbar** - 需实现
   ```tsx
   <Toolbar
     onBack={() => {}}
     title="三体"
     actions={[...]}
   />
   ```

---

## 📝 实施步骤

### Phase 1: 基础组件（1-2小时）
```bash
# 需要创建的文件：
frontend/src/components/common/
├── Input/
│   ├── index.tsx
│   └── Input.module.css
├── Badge/
│   ├── index.tsx
│   └── Badge.module.css
├── Slider/
│   ├── index.tsx
│   └── Slider.module.css
└── Select/
    ├── index.tsx
    └── Select.module.css
```

### Phase 2: 功能组件（2-3小时）
```bash
frontend/src/components/features/
├── BookCard/
│   ├── index.tsx
│   └── BookCard.module.css
├── ChapterList/
│   ├── index.tsx
│   └── ChapterList.module.css
└── ProgressBar/
    ├── index.tsx
    └── ProgressBar.module.css
```

### Phase 3: Library 页面（2-3小时）
```bash
frontend/src/pages/Home/
├── index.tsx（重写为 Library 设计）
├── Home.module.css（使用 Figma 样式）
├── components/
│   ├── Sidebar.tsx
│   ├── SearchBar.tsx
│   └── BooksGrid.tsx
```

### Phase 4: 阅读器页面（3-4小时）
```bash
frontend/src/pages/Reader/
├── index.tsx（重写为完整阅读器）
├── Reader.module.css
├── components/
│   ├── ReaderToolbar.tsx
│   ├── ChapterSidebar.tsx
│   ├── ReadingArea.tsx
│   └── SettingsPanel.tsx
```

### Phase 5: 设置页面（1-2小时）
```bash
frontend/src/pages/Settings/
├── index.tsx（重写为完整设置页面）
├── Settings.module.css
└── components/
    ├── SettingsTabs.tsx
    ├── ReadingSettings.tsx
    └── AppearanceSettings.tsx
```

### Phase 6: 主题切换和优化（1小时）
- 在 MainLayout 添加主题切换按钮
- 测试白天/夜间模式切换
- 优化动画和过渡效果
- 性能优化

---

## 🎨 设计规范

### 颜色系统
```css
/* 主色调 */
Primary Purple: #9333EA (rgb(147, 51, 234))
Primary Light: #A855F7 (rgb(168, 85, 247))
Primary Dark: #7E22CE (rgb(126, 34, 206))

/* 夜间模式背景 */
Background Primary: #0A0E14 (rgb(10, 14, 20))
Background Secondary: #0F141E (rgb(15, 20, 30))
Background Tertiary: #141923 (rgb(20, 25, 35))

/* 白天模式背景 */
Background Primary: #FFFFFF
Background Secondary: #F9FAFB
Background Tertiary: #F3F4F6
```

### 间距系统
```css
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### 圆角
```css
sm: 4px
md: 8px
lg: 12px
xl: 16px
2xl: 24px
```

### 毛玻璃效果
```css
backdrop-filter: blur(20px) 或 blur(40px)
background: rgba(15, 20, 30, 0.9)
border: 1px solid rgba(100, 120, 150, 0.1)
```

---

## 📦 需要的图标库

Figma 设计使用了 **Lucide React** 图标库：

```bash
pnpm add lucide-react
```

常用图标：
- Search, Grid, List, Plus, Settings
- BookOpen, FileText, Image
- ChevronLeft, ChevronRight, X
- Moon, Sun, Eye, EyeOff

---

## 🔧 类型定义更新

需要在 `types/index.ts` 添加以下类型：

```typescript
// 书籍类型
export interface Book {
  id: string
  title: string
  author: string
  cover: string
  type: 'novel' | 'manga'
  progress?: number  // 小说进度 0-100
  currentPage?: number  // 漫画当前页
  totalPages?: number  // 漫画总页数
  category: string
  lastRead?: string  // ISO date string
  content: NovelContent | MangaContent
}

// 小说内容
export interface NovelContent {
  chapters: Chapter[]
}

// 漫画内容
export interface MangaContent {
  pages: string[]  // 图片URL数组
}

// 视图模式
export type ViewMode = 'grid' | 'list'
```

---

## 🚀 快速开始指南

### 1. 安装图标库
```bash
cd frontend
pnpm add lucide-react
```

### 2. 创建组件
按照上面的 Phase 1-6 顺序创建组件

### 3. 测试构建
```bash
pnpm run build
```

### 4. 运行开发服务器
```bash
wails dev
```

---

## 📌 注意事项

1. **所有组件使用 CSS Modules**，不使用 Tailwind
2. **颜色使用 CSS 变量**，确保主题切换正常工作
3. **组件要有 TypeScript 类型**，确保类型安全
4. **动画使用 CSS transition 和 animation**，不使用 JS 动画库
5. **图标统一使用 Lucide React**，保持一致性
6. **响应式设计**不是重点（桌面应用），但要确保不同窗口大小下正常显示

---

## 🎯 优先级建议

### 第一优先级（核心功能）
1. Library 页面 - 用户看到的第一个界面
2. BookCard 组件 - 书籍展示的核心
3. 基础 Input/Button - 交互必需

### 第二优先级（阅读体验）
1. NovelReader - 小说阅读器
2. ChapterList - 章节导航
3. ReaderToolbar - 阅读工具栏

### 第三优先级（增强功能）
1. Settings 页面
2. BossMode（摸鱼模式）
3. 统计功能

---

## 💡 建议

由于代码量较大（预计需要创建 30+ 个文件），建议：

1. **我可以继续帮你实现**：告诉我从哪个组件开始，我会逐个实现
2. **或者你可以基于这份文档自己实现**：参考 Figma 代码和这份文档
3. **或者我们可以先实现一个完整的 Library 页面**：这样你能立即看到效果

你希望怎么进行？我可以：
- A. 继续实现所有组件（会生成大量代码）
- B. 先实现 Library 页面让你看到效果
- C. 只实现关键组件，其他的你自己完成

请告诉我你的选择！😊
