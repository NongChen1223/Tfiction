package services

import (
	"archive/zip"
	"context"
	"encoding/xml"
	"fmt"
	stdhtml "html"
	"io"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/nongchen1223/tfiction/backend/models"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	xhtml "golang.org/x/net/html"
)

// NovelService 小说服务
type NovelService struct {
	ctx             context.Context
	novels          map[string]*models.Novel // 小说缓存，key 为文件路径
	currentNovel    *models.Novel            // 当前打开的小说
	progressService *ProgressService
}

// NewNovelService 创建小说服务实例
func NewNovelService(progressService *ProgressService) *NovelService {
	return &NovelService{
		novels:          make(map[string]*models.Novel),
		progressService: progressService,
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
	if filePath == "" {
		selectedFile, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
			Title: "选择小说文件",
			Filters: []runtime.FileFilter{
				{
					DisplayName: "支持的文件",
					Pattern:     "*.txt;*.epub;*.pdf;*.mobi;*.azw3",
				},
			},
		})
		if err != nil {
			return nil, fmt.Errorf("打开文件选择器失败: %w", err)
		}
		if selectedFile == "" {
			return nil, fmt.Errorf("未选择文件")
		}
		filePath = selectedFile
	}

	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("文件不存在: %s", filePath)
	}

	// 检查是否已在缓存中
	if novel, exists := s.novels[filePath]; exists {
		s.applySavedProgress(novel)
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

	s.applySavedProgress(novel)

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
	return sliceByRuneRange(novel.Content, chapter.StartPos, chapter.EndPos), nil
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
	if s.progressService != nil {
		return s.progressService.SaveProgress(filePath, chapterIndex, 0, novel.ReadProgress)
	}
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

	if s.progressService != nil {
		return s.progressService.SaveProgress(filePath, chapterIndex, position, progress)
	}

	return nil
}

// GetReadingProgress 获取阅读进度
func (s *NovelService) GetReadingProgress(filePath string) (int, int, float64, error) {
	novel, exists := s.novels[filePath]
	if !exists {
		return 0, 0, 0, fmt.Errorf("小说未打开")
	}

	position := 0
	if s.progressService != nil {
		if entry := s.progressService.GetProgress(filePath); entry != nil {
			position = entry.Position
		}
	}

	return novel.CurrentChapter, position, novel.ReadProgress, nil
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
	currentOffset := 0
	chapterIndex := 0

	for _, rawLine := range strings.SplitAfter(novel.Content, "\n") {
		lineWithoutBreak := strings.TrimRight(rawLine, "\r\n")
		trimmedLine := strings.TrimSpace(lineWithoutBreak)
		lineLength := runeLen(rawLine)

		if trimmedLine == "" {
			currentOffset += lineLength
			continue
		}

		// 检查是否是章节标题
		isChapter := false
		for _, re := range regexps {
			if re.MatchString(trimmedLine) {
				isChapter = true
				break
			}
		}

		if isChapter {
			startPos := currentOffset + leadingWhitespaceCount(lineWithoutBreak)
			if len(chapters) > 0 {
				chapters[len(chapters)-1].EndPos = startPos
				chapters[len(chapters)-1].WordCount = chapters[len(chapters)-1].EndPos - chapters[len(chapters)-1].StartPos
			}

			chapters = append(chapters, models.Chapter{
				Title:    trimmedLine,
				StartPos: startPos,
				EndPos:   runeLen(novel.Content), // 临时设置为全文末尾
				Index:    chapterIndex,
			})
			chapterIndex++
		}

		currentOffset += lineLength
	}

	// 如果没有找到章节，则将整个文件作为一个章节
	if len(chapters) == 0 {
		chapters = append(chapters, models.Chapter{
			Title:     "正文",
			StartPos:  0,
			EndPos:    runeLen(novel.Content),
			Index:     0,
			WordCount: runeLen(novel.Content),
		})
	} else {
		// 修正最后一章的结束位置
		lastChapter := &chapters[len(chapters)-1]
		lastChapter.EndPos = runeLen(novel.Content)
		lastChapter.WordCount = lastChapter.EndPos - lastChapter.StartPos
	}

	novel.Chapters = chapters
	return nil
}

// parseEpubNovel 解析 EPUB 格式小说
func (s *NovelService) parseEpubNovel(novel *models.Novel) error {
	reader, err := zip.OpenReader(novel.FilePath)
	if err != nil {
		return fmt.Errorf("打开 EPUB 文件失败: %w", err)
	}
	defer reader.Close()

	fileMap := make(map[string]*zip.File, len(reader.File))
	for _, file := range reader.File {
		fileMap[normalizeZipPath(file.Name)] = file
	}

	containerPath, err := readEpubContainerPath(fileMap)
	if err != nil {
		return err
	}

	opfData, err := readZipFileText(fileMap, containerPath)
	if err != nil {
		return fmt.Errorf("读取 EPUB 元数据失败: %w", err)
	}

	var pkg epubPackage
	if err := xml.Unmarshal([]byte(opfData), &pkg); err != nil {
		return fmt.Errorf("解析 EPUB 元数据失败: %w", err)
	}

	if strings.TrimSpace(pkg.Metadata.Title) != "" {
		novel.Title = strings.TrimSpace(pkg.Metadata.Title)
	}

	manifest := make(map[string]epubManifestItem, len(pkg.Manifest.Items))
	for _, item := range pkg.Manifest.Items {
		manifest[item.ID] = item
	}

	opfDir := path.Dir(containerPath)
	if opfDir == "." {
		opfDir = ""
	}

	var contentBuilder strings.Builder
	chapters := make([]models.Chapter, 0, len(pkg.Spine.ItemRefs))
	currentOffset := 0

	appendChapter := func(rawTitle, rawText string, fallbackIndex int) {
		chapterText := normalizeEpubText(rawText)
		if chapterText == "" {
			return
		}

		chapterTitle := strings.TrimSpace(rawTitle)
		if chapterTitle == "" {
			chapterTitle = fmt.Sprintf("第%d章", fallbackIndex)
		}

		if contentBuilder.Len() > 0 {
			contentBuilder.WriteString("\n\n")
			currentOffset += runeLen("\n\n")
		}

		chapterBody := chapterTitle + "\n\n" + chapterText
		startPos := currentOffset
		contentBuilder.WriteString(chapterBody)
		currentOffset += runeLen(chapterBody)

		chapters = append(chapters, models.Chapter{
			Index:     len(chapters),
			Title:     chapterTitle,
			StartPos:  startPos,
			EndPos:    currentOffset,
			WordCount: runeLen(chapterBody),
		})
	}

	for index, itemRef := range pkg.Spine.ItemRefs {
		item, exists := manifest[itemRef.IDRef]
		if !exists || !isSupportedEpubItem(item.MediaType) {
			continue
		}

		chapterPath := normalizeZipPath(path.Join(opfDir, item.Href))
		chapterMarkup, err := readZipFileText(fileMap, chapterPath)
		if err != nil {
			continue
		}

		chapterTitle, chapterText := extractEpubChapterText(chapterMarkup)
		appendChapter(chapterTitle, chapterText, index+1)
	}

	// 有些 EPUB 的 spine 不规范，这里退回到 manifest 级别兜底提取正文。
	if len(chapters) == 0 {
		for _, item := range pkg.Manifest.Items {
			if !isSupportedEpubItem(item.MediaType) {
				continue
			}

			chapterPath := normalizeZipPath(path.Join(opfDir, item.Href))
			chapterMarkup, err := readZipFileText(fileMap, chapterPath)
			if err != nil {
				continue
			}

			chapterTitle, chapterText := extractEpubChapterText(chapterMarkup)
			appendChapter(chapterTitle, chapterText, len(chapters)+1)
		}
	}

	if len(chapters) == 0 {
		return fmt.Errorf("未从 EPUB 中提取到可阅读正文")
	}

	novel.Content = contentBuilder.String()
	novel.Chapters = chapters
	return nil
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
	return time.Now().Unix()
}

func (s *NovelService) applySavedProgress(novel *models.Novel) {
	if s.progressService == nil {
		return
	}

	entry := s.progressService.GetProgress(novel.FilePath)
	if entry == nil {
		return
	}

	novel.CurrentChapter = clampInt(entry.CurrentChapter, 0, maxInt(len(novel.Chapters)-1, 0))
	novel.ReadProgress = entry.Progress
	novel.LastReadTime = entry.LastReadTime
}

func sliceByRuneRange(content string, start, end int) string {
	runes := []rune(content)
	if start < 0 {
		start = 0
	}
	if end > len(runes) {
		end = len(runes)
	}
	if start > end {
		start = end
	}
	return string(runes[start:end])
}

func runeLen(content string) int {
	return len([]rune(content))
}

func leadingWhitespaceCount(content string) int {
	count := 0
	for _, char := range content {
		if !unicode.IsSpace(char) {
			break
		}
		count++
	}
	return count
}

func clampInt(value, min, max int) int {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

type epubContainer struct {
	RootFiles []struct {
		FullPath string `xml:"full-path,attr"`
	} `xml:"rootfiles>rootfile"`
}

type epubPackage struct {
	Metadata struct {
		Title string `xml:"title"`
	} `xml:"metadata"`
	Manifest struct {
		Items []epubManifestItem `xml:"item"`
	} `xml:"manifest"`
	Spine struct {
		ItemRefs []struct {
			IDRef string `xml:"idref,attr"`
		} `xml:"itemref"`
	} `xml:"spine"`
}

type epubManifestItem struct {
	ID        string `xml:"id,attr"`
	Href      string `xml:"href,attr"`
	MediaType string `xml:"media-type,attr"`
}

func readEpubContainerPath(fileMap map[string]*zip.File) (string, error) {
	containerXML, err := readZipFileText(fileMap, "META-INF/container.xml")
	if err != nil {
		return "", fmt.Errorf("读取 EPUB 容器信息失败: %w", err)
	}

	var container epubContainer
	if err := xml.Unmarshal([]byte(containerXML), &container); err != nil {
		return "", fmt.Errorf("解析 EPUB 容器信息失败: %w", err)
	}

	if len(container.RootFiles) == 0 || strings.TrimSpace(container.RootFiles[0].FullPath) == "" {
		return "", fmt.Errorf("EPUB 缺少 OPF 路径信息")
	}

	return normalizeZipPath(container.RootFiles[0].FullPath), nil
}

func readZipFileText(fileMap map[string]*zip.File, filePath string) (string, error) {
	file, exists := fileMap[normalizeZipPath(filePath)]
	if !exists {
		return "", fmt.Errorf("文件不存在: %s", filePath)
	}

	reader, err := file.Open()
	if err != nil {
		return "", err
	}
	defer reader.Close()

	content, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}

	return string(content), nil
}

func normalizeZipPath(filePath string) string {
	return strings.TrimPrefix(path.Clean(strings.ReplaceAll(filePath, "\\", "/")), "./")
}

func extractEpubChapterText(markup string) (string, string) {
	doc, err := xhtml.Parse(strings.NewReader(markup))
	if err != nil {
		return "", normalizeEpubText(stripHTMLTags(markup))
	}

	title := ""
	var builder strings.Builder
	var walk func(*xhtml.Node, bool)
	lastCharWasNewline := false

	walk = func(node *xhtml.Node, skip bool) {
		if node == nil {
			return
		}

		nextSkip := skip
		if node.Type == xhtml.ElementNode {
			tag := strings.ToLower(node.Data)
			if tag == "script" || tag == "style" || tag == "head" {
				nextSkip = true
			}
			if isEpubBlockTag(tag) && builder.Len() > 0 && !lastCharWasNewline {
				builder.WriteString("\n")
				lastCharWasNewline = true
			}
		}

		if !nextSkip && node.Type == xhtml.TextNode {
			text := strings.TrimSpace(stdhtml.UnescapeString(node.Data))
			if text != "" {
				if builder.Len() > 0 && !lastCharWasNewline {
					builder.WriteString(" ")
				}
				builder.WriteString(text)
				lastCharWasNewline = false
			}
		}

		if title == "" && node.Type == xhtml.ElementNode {
			tag := strings.ToLower(node.Data)
			if tag == "title" || tag == "h1" || tag == "h2" {
				text := strings.TrimSpace(extractNodeText(node))
				if text != "" {
					title = text
				}
			}
		}

		for child := node.FirstChild; child != nil; child = child.NextSibling {
			walk(child, nextSkip)
		}
	}

	walk(doc, false)
	return title, normalizeEpubText(builder.String())
}

func extractNodeText(node *xhtml.Node) string {
	var builder strings.Builder
	var walk func(*xhtml.Node)
	walk = func(current *xhtml.Node) {
		if current == nil {
			return
		}
		if current.Type == xhtml.TextNode {
			builder.WriteString(current.Data)
		}
		for child := current.FirstChild; child != nil; child = child.NextSibling {
			walk(child)
		}
	}
	walk(node)
	return stdhtml.UnescapeString(strings.TrimSpace(builder.String()))
}

func isEpubBlockTag(tag string) bool {
	switch tag {
	case "p", "div", "section", "article", "br", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr":
		return true
	default:
		return false
	}
}

func isSupportedEpubItem(mediaType string) bool {
	switch mediaType {
	case "application/xhtml+xml", "text/html":
		return true
	default:
		return false
	}
}

func stripHTMLTags(markup string) string {
	tagRegexp := regexp.MustCompile(`<[^>]+>`)
	return tagRegexp.ReplaceAllString(markup, " ")
}

func normalizeEpubText(content string) string {
	lines := strings.Split(content, "\n")
	normalizedLines := make([]string, 0, len(lines))
	blankCount := 0

	for _, line := range lines {
		trimmed := strings.Join(strings.Fields(strings.TrimSpace(line)), " ")
		if trimmed == "" {
			blankCount++
			if blankCount <= 1 {
				normalizedLines = append(normalizedLines, "")
			}
			continue
		}

		blankCount = 0
		normalizedLines = append(normalizedLines, trimmed)
	}

	return strings.TrimSpace(strings.Join(normalizedLines, "\n"))
}
