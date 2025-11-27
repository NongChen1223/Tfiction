package models

// Novel 小说模型
type Novel struct {
	// Title 小说标题
	Title string `json:"title"`
	// Author 作者
	Author string `json:"author"`
	// FilePath 文件路径
	FilePath string `json:"file_path"`
	// Format 文件格式 (.txt, .epub, .pdf, etc.)
	Format string `json:"format"`
	// Size 文件大小（字节）
	Size int64 `json:"size"`
	// Content 小说内容
	Content string `json:"content"`
	// Chapters 章节列表
	Chapters []Chapter `json:"chapters"`
	// CurrentChapter 当前章节索引
	CurrentChapter int `json:"current_chapter"`
	// ReadProgress 阅读进度（百分比 0-100）
	ReadProgress float64 `json:"read_progress"`
	// LastReadTime 最后阅读时间
	LastReadTime int64 `json:"last_read_time"`
}

// Chapter 章节模型
type Chapter struct {
	// Index 章节索引
	Index int `json:"index"`
	// Title 章节标题
	Title string `json:"title"`
	// StartPos 起始位置
	StartPos int `json:"start_pos"`
	// EndPos 结束位置
	EndPos int `json:"end_pos"`
	// WordCount 字数
	WordCount int `json:"word_count"`
}

// SearchResult 搜索结果模型
type SearchResult struct {
	// Position 匹配位置
	Position int `json:"position"`
	// Line 行号
	Line int `json:"line"`
	// Context 上下文内容
	Context string `json:"context"`
	// Keyword 关键字
	Keyword string `json:"keyword"`
}

// ReadingSettings 阅读设置模型
type ReadingSettings struct {
	// FontSize 字体大小
	FontSize int `json:"font_size"`
	// FontFamily 字体
	FontFamily string `json:"font_family"`
	// LineHeight 行高
	LineHeight float64 `json:"line_height"`
	// BackgroundColor 背景颜色
	BackgroundColor string `json:"background_color"`
	// TextColor 文字颜色
	TextColor string `json:"text_color"`
	// PageWidth 页面宽度
	PageWidth int `json:"page_width"`
	// Theme 主题 (light, dark, sepia)
	Theme string `json:"theme"`
}
