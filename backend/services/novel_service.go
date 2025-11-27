package services

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
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
		Title:    filepath.Base(filePath),
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
	// 简单的章节识别逻辑
	// 识别类似 "第X章"、"Chapter X" 等模式
	lines := strings.Split(novel.Content, "\n")
	chapters := []models.Chapter{}
	currentChapter := models.Chapter{
		Title:    "正文",
		StartPos: 0,
	}

	for i, line := range lines {
		line = strings.TrimSpace(line)
		// 简单的章节标题识别
		if strings.HasPrefix(line, "第") && (strings.Contains(line, "章") || strings.Contains(line, "节")) {
			if currentChapter.Title != "" {
				currentChapter.EndPos = i
				chapters = append(chapters, currentChapter)
			}
			currentChapter = models.Chapter{
				Title:    line,
				StartPos: i,
				Index:    len(chapters),
			}
		}
	}

	// 添加最后一章
	if currentChapter.Title != "" {
		currentChapter.EndPos = len(novel.Content)
		chapters = append(chapters, currentChapter)
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
