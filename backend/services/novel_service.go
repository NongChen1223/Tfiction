package services

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/nongchen1223/tfiction/backend/models"
)

// NovelService 小说服务
type NovelService struct {
	ctx          context.Context
	novels       map[string]*models.Novel // 小说缓存，key 为文件路径
	currentNovel *models.Novel            // 当前打开的小说
}

// NewNovelService 创建小说服务实例
func NewNovelService() *NovelService {
	return &NovelService{
		novels: make(map[string]*models.Novel),
	}
}

// Init 初始化服务
func (s *NovelService) Init(ctx context.Context) {
	s.ctx = ctx
}

// Cleanup 清理资源
func (s *NovelService) Cleanup() {
	// 清理缓存
	s.novels = make(map[string]*models.Novel)
	s.currentNovel = nil
}

// OpenNovel 打开小说文件
// @param filePath 文件路径
// @return 小说信息和错误
func (s *NovelService) OpenNovel(filePath string) (*models.Novel, error) {
	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("文件不存在: %s", filePath)
	}

	// 检查是否已在缓存中
	if novel, exists := s.novels[filePath]; exists {
		s.currentNovel = novel
		return novel, nil
	}

	// 读取文件内容
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %w", err)
	}

	// 获取文件信息
	fileInfo, _ := os.Stat(filePath)
	ext := strings.ToLower(filepath.Ext(filePath))

	// 创建小说对象
	novel := &models.Novel{
		Title:    strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath)),
		FilePath: filePath,
		Format:   ext,
		Size:     fileInfo.Size(),
		Content:  string(content),
	}

	// 根据格式解析内容
	if err := s.parseNovelContent(novel); err != nil {
		return nil, fmt.Errorf("解析小说内容失败: %w", err)
	}

	// 缓存小说
	s.novels[filePath] = novel
	s.currentNovel = novel

	return novel, nil
}

// GetCurrentNovel 获取当前打开的小说
func (s *NovelService) GetCurrentNovel() *models.Novel {
	return s.currentNovel
}

// CloseNovel 关闭小说
func (s *NovelService) CloseNovel(filePath string) {
	delete(s.novels, filePath)
	if s.currentNovel != nil && s.currentNovel.FilePath == filePath {
		s.currentNovel = nil
	}
}

// GetNovelChapters 获取小说章节列表
func (s *NovelService) GetNovelChapters(filePath string) ([]models.Chapter, error) {
	novel, exists := s.novels[filePath]
	if !exists {
		return nil, fmt.Errorf("小说未打开")
	}
	return novel.Chapters, nil
}

// GetChapterContent 获取指定章节内容
func (s *NovelService) GetChapterContent(filePath string, chapterIndex int) (string, error) {
	novel, exists := s.novels[filePath]
	if !exists {
		return "", fmt.Errorf("小说未打开")
	}

	if chapterIndex < 0 || chapterIndex >= len(novel.Chapters) {
		return "", fmt.Errorf("章节索引越界")
	}

	chapter := novel.Chapters[chapterIndex]
	return novel.Content[chapter.StartPos:chapter.EndPos], nil
}

// SetCurrentChapter 设置当前章节
func (s *NovelService) SetCurrentChapter(filePath string, chapterIndex int) error {
	novel, exists := s.novels[filePath]
	if !exists {
		return fmt.Errorf("小说未打开")
	}

	if chapterIndex < 0 || chapterIndex >= len(novel.Chapters) {
		return fmt.Errorf("章节索引越界")
	}

	novel.CurrentChapter = chapterIndex
	return nil
}

// SaveReadingProgress 保存阅读进度
func (s *NovelService) SaveReadingProgress(filePath string, chapterIndex int, position int, progress float64) error {
	novel, exists := s.novels[filePath]
	if !exists {
		return fmt.Errorf("小说未打开")
	}

	novel.CurrentChapter = chapterIndex
	novel.ReadProgress = progress
	novel.LastReadTime = getCurrentTimestamp()

	// TODO: 持久化保存到文件

	return nil
}

// GetReadingProgress 获取阅读进度
func (s *NovelService) GetReadingProgress(filePath string) (int, int, float64, error) {
	novel, exists := s.novels[filePath]
	if !exists {
		return 0, 0, 0, fmt.Errorf("小说未打开")
	}

	return novel.CurrentChapter, 0, novel.ReadProgress, nil
}

// parseNovelContent 解析小说内容
// 根据不同格式进行解析，提取章节信息
func (s *NovelService) parseNovelContent(novel *models.Novel) error {
	switch novel.Format {
	case ".txt":
		return s.parseTxtNovel(novel)
	case ".epub":
		return s.parseEpubNovel(novel)
	case ".pdf":
		return s.parsePdfNovel(novel)
	default:
		// 默认按 txt 格式处理
		return s.parseTxtNovel(novel)
	}
}

// parseTxtNovel 解析 TXT 格式小说
// 使用常见的章节标题模式进行识别
func (s *NovelService) parseTxtNovel(novel *models.Novel) error {
	// 多种章节标题匹配模式
	patterns := []string{
		`^第[0-9零一二三四五六七八九十百千]+[章节回]`,
		`^Chapter\s+\d+`,
		`^\d+\.\s+`,
		`^【第.+?】`,
		`^（第.+?）`,
		`^\[第.+?\]`,
	}

	// 预编译正则表达式
	regexps := make([]*regexp.Regexp, len(patterns))
	for i, pattern := range patterns {
		regexps[i] = regexp.MustCompile(pattern)
	}

	chapters := []models.Chapter{}
	currentStartPos := 0
	chapterIndex := 0

	// 逐行扫描
	lines := strings.Split(novel.Content, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// 检查是否是章节标题
		isChapter := false
		for _, re := range regexps {
			if re.MatchString(line) {
				isChapter = true
				break
			}
		}

		if isChapter {
			// 找到章节标题，记录上一章的结束位置
			if currentStartPos > 0 {
				currentEndPos := strings.Index(novel.Content[currentStartPos:], line)
				if currentEndPos > 0 {
					currentEndPos += currentStartPos
					if len(chapters) > 0 {
						chapters[len(chapters)-1].EndPos = currentEndPos
						chapters[len(chapters)-1].WordCount = currentEndPos - chapters[len(chapters)-1].StartPos
					}
				}
			}

			// 添加新章节
			chapterTitle := strings.TrimSpace(line)
			chapters = append(chapters, models.Chapter{
				Title:    chapterTitle,
				StartPos: strings.Index(novel.Content, line),
				EndPos:   len(novel.Content), // 临时设置为文件末尾
				Index:    chapterIndex,
			})

			currentStartPos = chapters[len(chapters)-1].StartPos
			chapterIndex++
		}
	}

	// 如果没有找到章节，则将整个文件作为一个章节
	if len(chapters) == 0 {
		chapters = append(chapters, models.Chapter{
			Title:    "正文",
			StartPos: 0,
			EndPos:   len(novel.Content),
			Index:    0,
		})
	} else {
		// 修正最后一章的结束位置
		lastChapter := &chapters[len(chapters)-1]
		lastChapter.EndPos = len(novel.Content)
		lastChapter.WordCount = lastChapter.EndPos - lastChapter.StartPos
	}

	novel.Chapters = chapters
	return nil
}

// parseEpubNovel 解析 EPUB 格式小说
// TODO: 实现 EPUB 解析逻辑
func (s *NovelService) parseEpubNovel(novel *models.Novel) error {
	return fmt.Errorf("EPUB 格式暂不支持，即将支持")
}

// parsePdfNovel 解析 PDF 格式小说
// TODO: 实现 PDF 解析逻辑
func (s *NovelService) parsePdfNovel(novel *models.Novel) error {
	return fmt.Errorf("PDF 格式暂不支持，即将支持")
}

// ConvertFormat 格式转换
// @param sourcePath 源文件路径
// @param targetFormat 目标格式
// @return 转换后的文件路径和错误
func (s *NovelService) ConvertFormat(sourcePath, targetFormat string) (string, error) {
	// TODO: 实现格式转换逻辑
	return "", fmt.Errorf("格式转换功能即将支持")
}

// getCurrentTimestamp 获取当前时间戳
func getCurrentTimestamp() int64 {
	// TODO: 实现时间戳获取
	return 0
}
