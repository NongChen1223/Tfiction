# Tfiction 前端架构说明

## 技术栈更新

### 路由管理
- ✅ **React Router v7** - 使用 `createBrowserRouter` 进行路由管理
- ✅ 支持嵌套路由和布局系统

### 样式方案
- ✅ **CSS Modules** - 作用域隔离的样式方案
- ❌ ~~Tailwind CSS~~ - 已移除，改用原生 CSS

## 项目结构

```
frontend/src/
├── App.tsx                    # 应用根组件（路由入口）
├── main.tsx                   # 应用入口文件
├── index.css                  # 全局样式
├── vite-env.d.ts             # TypeScript 环境声明
│
├── router/                    # 路由配置
│   └── index.tsx             # 路由定义和配置
│
├── layouts/                   # 布局组件
│   └── MainLayout/           # 主布局
│       ├── index.tsx         # 布局组件
│       └── MainLayout.module.css  # 布局样式
│
├── pages/                     # 页面组件
│   ├── Home/                 # 首页（书架）
│   │   ├── index.tsx
│   │   └── Home.module.css
│   ├── Reader/               # 阅读器页面
│   │   ├── index.tsx
│   │   └── Reader.module.css
│   ├── Settings/             # 设置页面
│   │   ├── index.tsx
│   │   └── Settings.module.css
│   └── Bookmarks/            # 书签管理页面
│       ├── index.tsx
│       └── Bookmarks.module.css
│
├── components/                # 可复用组件
│   ├── common/               # 通用组件（按钮、输入框等）
│   └── features/             # 功能组件（搜索面板、工具栏等）
│
├── stores/                    # Zustand 状态管理
│   ├── novelStore.ts         # 小说状态
│   ├── windowStore.ts        # 窗口状态
│   └── settingsStore.ts      # 设置状态
│
├── types/                     # TypeScript 类型定义
│   └── index.ts              # 公共类型
│
├── hooks/                     # 自定义 Hooks
├── utils/                     # 工具函数
└── assets/                    # 静态资源
```

## 路由配置

### 路由表

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | Redirect → `/home` | 根路径重定向到首页 |
| `/home` | Home | 首页（书架页面） |
| `/reader` | Reader | 阅读器页面 |
| `/settings` | Settings | 设置页面 |
| `/bookmarks` | Bookmarks | 书签管理页面 |

### 路由使用

```tsx
import { Link, useNavigate } from 'react-router-dom'

// 使用 Link 导航
<Link to="/reader">去阅读</Link>

// 使用 useNavigate Hook 编程式导航
const navigate = useNavigate()
navigate('/reader')
```

## CSS Modules 使用说明

### 基本用法

```tsx
// 组件文件：Button.tsx
import styles from './Button.module.css'

export default function Button() {
  return (
    <button className={styles.button}>
      点击
    </button>
  )
}
```

```css
/* 样式文件：Button.module.css */
.button {
  padding: 8px 16px;
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.button:hover {
  background: #0284c7;
}
```

### 组合类名

```tsx
import styles from './Component.module.css'

// 使用模板字符串组合
<div className={`${styles.container} ${styles.active}`}>

// 使用条件类名
<div className={`${styles.button} ${isActive ? styles.active : ''}`}>
```

### 全局样式

```css
/* 使用 :global 声明全局样式 */
:global(.global-class) {
  color: red;
}

/* 在模块中使用全局类名 */
.container :global(.global-class) {
  font-size: 14px;
}
```

## 状态管理

### novelStore - 小说状态

```tsx
import { useNovelStore } from '@/stores/novelStore'

function Component() {
  const { currentNovel, setCurrentNovel } = useNovelStore()

  // 使用状态
  console.log(currentNovel)

  // 更新状态
  setCurrentNovel(novel)
}
```

### windowStore - 窗口状态

```tsx
import { useWindowStore } from '@/stores/windowStore'

function Component() {
  const { isStealthMode, toggleStealthMode } = useWindowStore()

  // 切换摸鱼模式
  toggleStealthMode()
}
```

### settingsStore - 阅读设置

```tsx
import { useSettingsStore } from '@/stores/settingsStore'

function Component() {
  const { fontSize, setFontSize } = useSettingsStore()

  // 调整字体大小
  setFontSize(18)
}
```

## 页面说明

### Home - 首页（书架）

- 显示用户的小说列表
- 最近阅读记录
- 快速打开文件功能

**待实现功能：**
- 小说列表展示
- 封面图显示
- 阅读进度显示
- 搜索和筛选

### Reader - 阅读器

- 小说内容展示
- 章节导航
- 阅读设置调整
- 摸鱼模式支持

**已实现：**
- 基础阅读界面
- 样式自定义（字体、行高、颜色等）

**待实现：**
- 章节切换控件
- 阅读进度保存
- 书签功能
- 搜索功能

### Settings - 设置

**待实现：**
- 阅读设置
  - 字体设置（大小、字体、行高）
  - 主题切换（亮色/暗色/护眼）
  - 页面宽度调整
- 窗口设置
  - 置顶开关
  - 透明度调整
  - 摸鱼模式配置
- 应用设置
  - 语言选择
  - 快捷键配置
  - 数据存储路径

### Bookmarks - 书签管理

**待实现：**
- 书签列表展示
- 书签添加/删除
- 书签跳转
- 书签备注编辑

## 开发规范

### 组件命名

- 页面组件：放在 `pages/` 目录，使用文件夹形式
- 布局组件：放在 `layouts/` 目录
- 通用组件：放在 `components/common/`
- 功能组件：放在 `components/features/`

### 文件命名

- 组件文件：`index.tsx`
- 样式文件：`ComponentName.module.css`
- 类型文件：`types.ts`
- 工具文件：`utils.ts`

### 样式规范

- 使用 CSS Modules 进行样式隔离
- 命名使用 camelCase（如 `.buttonPrimary`）
- 避免使用全局样式，除非必要
- 复用样式使用组件，而不是复制 CSS

### TypeScript 规范

- 所有组件必须有类型定义
- Props 使用 interface 定义
- 避免使用 `any`，使用具体类型
- 导入类型使用 `import type`

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建（带类型检查）
pnpm run build

# 类型检查
pnpm run type-check

# 代码检查
pnpm run lint

# 预览构建产物
pnpm run preview
```

## 下一步开发计划

### 1. 实现通用组件（components/common）

- Button 按钮
- Input 输入框
- Select 选择器
- Modal 模态框
- Toast 提示消息

### 2. 实现功能组件（components/features）

- Toolbar 工具栏
- Sidebar 侧边栏（章节目录）
- SearchPanel 搜索面板
- SettingsPanel 设置面板

### 3. 完善页面功能

- Home: 实现书架列表和最近阅读
- Reader: 添加章节导航和工具栏
- Settings: 实现所有设置项
- Bookmarks: 实现书签管理功能

### 4. 集成后端服务

- 连接 Wails 后端服务
- 实现文件打开对话框
- 实现小说解析和显示
- 实现阅读进度保存

### 5. 优化和测试

- 添加加载状态
- 错误处理
- 性能优化
- 跨平台测试

---

**文档版本**: v2.0.0
**最后更新**: 2024-11-30
**维护者**: NongChen
