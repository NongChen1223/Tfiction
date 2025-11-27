package services

import (
	"context"
	"strings"

	"github.com/nongchen1223/tfiction/backend/models"
)

// SearchService 搜索服务
// 提供全文搜索、关键字高亮等功能
type SearchService struct {
	ctx           context.Context
	searchResults []models.SearchResult // 搜索结果缓存
}

// NewSearchService 创建搜索服务实例
func NewSearchService() *SearchService {
	return &SearchService{
		searchResults: []models.SearchResult{},
	}
}

// Init 初始化服务
func (s *SearchService) Init(ctx context.Context) {
	s.ctx = ctx
}

// Cleanup 清理资源
func (s *SearchService) Cleanup() {
	s.searchResults = []models.SearchResult{}
}

// SearchInNovel 在小说中搜索关键字
// @param content 小说内容
// @param keyword 搜索关键字
// @param caseSensitive 是否区分大小写
// @return 搜索结果列表
func (s *SearchService) SearchInNovel(content, keyword string, caseSensitive bool) []models.SearchResult {
	if keyword == "" {
		return []models.SearchResult{}
	}

	results := []models.SearchResult{}
	searchContent := content
	searchKeyword := keyword

	// 不区分大小写时转换为小写
	if !caseSensitive {
		searchContent = strings.ToLower(content)
		searchKeyword = strings.ToLower(keyword)
	}

	// 查找所有匹配位置
	position := 0
	for {
		index := strings.Index(searchContent[position:], searchKeyword)
		if index == -1 {
			break
		}

		actualPosition := position + index
		// 获取上下文（前后各50个字符）
		contextStart := actualPosition - 50
		if contextStart < 0 {
			contextStart = 0
		}
		contextEnd := actualPosition + len(keyword) + 50
		if contextEnd > len(content) {
			contextEnd = len(content)
		}

		result := models.SearchResult{
			Position: actualPosition,
			Context:  content[contextStart:contextEnd],
			Keyword:  keyword,
			Line:     s.getLineNumber(content, actualPosition),
		}
		results = append(results, result)

		position = actualPosition + len(keyword)
	}

	s.searchResults = results
	return results
}

// GetSearchResults 获取搜索结果
func (s *SearchService) GetSearchResults() []models.SearchResult {
	return s.searchResults
}

// ClearSearchResults 清除搜索结果
func (s *SearchService) ClearSearchResults() {
	s.searchResults = []models.SearchResult{}
}

// HighlightKeyword 高亮关键字
// @param content 内容
// @param keyword 关键字
// @param highlightTag HTML标签，如 "<mark>" 或自定义样式
// @return 高亮后的内容
func (s *SearchService) HighlightKeyword(content, keyword, highlightTag string) string {
	if keyword == "" {
		return content
	}

	if highlightTag == "" {
		highlightTag = "<mark>"
	}

	closeTag := strings.Replace(highlightTag, "<", "</", 1)
	highlighted := strings.ReplaceAll(content, keyword, highlightTag+keyword+closeTag)

	return highlighted
}

// getLineNumber 获取指定位置的行号
func (s *SearchService) getLineNumber(content string, position int) int {
	if position > len(content) {
		position = len(content)
	}

	line := 1
	for i := 0; i < position; i++ {
		if content[i] == '\n' {
			line++
		}
	}
	return line
}

// SearchInChapter 在指定章节中搜索
// @param novel 小说对象
// @param chapterIndex 章节索引
// @param keyword 搜索关键字
// @param caseSensitive 是否区分大小写
// @return 搜索结果列表
func (s *SearchService) SearchInChapter(novel *models.Novel, chapterIndex int, keyword string, caseSensitive bool) []models.SearchResult {
	if chapterIndex < 0 || chapterIndex >= len(novel.Chapters) {
		return []models.SearchResult{}
	}

	chapter := novel.Chapters[chapterIndex]
	chapterContent := novel.Content[chapter.StartPos:chapter.EndPos]

	return s.SearchInNovel(chapterContent, keyword, caseSensitive)
}

// GetSearchStatistics 获取搜索统计信息
// @return 匹配数量
func (s *SearchService) GetSearchStatistics() int {
	return len(s.searchResults)
}
