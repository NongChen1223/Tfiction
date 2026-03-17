package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// ReadingProgressEntry 单本书的阅读进度
type ReadingProgressEntry struct {
	FilePath       string  `json:"file_path"`
	CurrentChapter int     `json:"current_chapter"`
	Position       int     `json:"position"`
	Progress       float64 `json:"progress"`
	LastReadTime   int64   `json:"last_read_time"`
}

// ProgressData 进度文件数据结构
type ProgressData struct {
	Novels []ReadingProgressEntry `json:"novels"`
}

// ProgressService 阅读进度持久化服务
type ProgressService struct {
	ctx      context.Context
	mu       sync.Mutex
	data     ProgressData
	dataDir  string
	filePath string
}

func resolveProgressDataDir(dataDir string) string {
	trimmedDir := strings.TrimSpace(dataDir)
	if trimmedDir != "" {
		return trimmedDir
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "./data"
	}

	return filepath.Join(homeDir, ".tfiction")
}

// NewProgressService 创建进度服务实例
func NewProgressService(dataDir string) *ProgressService {
	resolvedDataDir := resolveProgressDataDir(dataDir)
	return &ProgressService{
		dataDir:  resolvedDataDir,
		filePath: filepath.Join(resolvedDataDir, "progress.json"),
		data:     ProgressData{Novels: []ReadingProgressEntry{}},
	}
}

// Init 初始化服务，加载已有进度
func (s *ProgressService) Init(ctx context.Context) {
	s.ctx = ctx
	s.ensureDataDir()
	s.load()
}

// Cleanup 清理资源，保存进度
func (s *ProgressService) Cleanup() {
	s.save()
}

// ensureDataDir 确保数据目录存在
func (s *ProgressService) ensureDataDir() {
	if _, err := os.Stat(s.dataDir); os.IsNotExist(err) {
		os.MkdirAll(s.dataDir, 0755)
	}
}

// SetDataDir 更新进度存储目录
func (s *ProgressService) SetDataDir(dataDir string) error {
	nextDataDir := resolveProgressDataDir(dataDir)
	nextFilePath := filepath.Join(nextDataDir, "progress.json")

	s.mu.Lock()
	if nextDataDir == s.dataDir && nextFilePath == s.filePath {
		s.mu.Unlock()
		return nil
	}

	currentData := s.data
	s.dataDir = nextDataDir
	s.filePath = nextFilePath
	s.mu.Unlock()

	s.ensureDataDir()

	if _, err := os.Stat(nextFilePath); err == nil {
		s.load()
		return nil
	}

	s.mu.Lock()
	s.data = currentData
	s.mu.Unlock()

	return s.save()
}

// load 从文件加载进度
func (s *ProgressService) load() {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		// 文件不存在或读取失败，使用空数据
		s.data = ProgressData{Novels: []ReadingProgressEntry{}}
		return
	}

	if err := json.Unmarshal(data, &s.data); err != nil {
		s.data = ProgressData{Novels: []ReadingProgressEntry{}}
	}
}

// save 保存进度到文件
func (s *ProgressService) save() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.ensureDataDir()

	data, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化进度数据失败: %w", err)
	}

	if err := os.WriteFile(s.filePath, data, 0644); err != nil {
		return fmt.Errorf("写入进度文件失败: %w", err)
	}

	return nil
}

// SaveProgress 保存某本书的阅读进度
func (s *ProgressService) SaveProgress(filePath string, chapter int, position int, progress float64) error {
	s.mu.Lock()

	found := false
	for i, entry := range s.data.Novels {
		if entry.FilePath == filePath {
			s.data.Novels[i].CurrentChapter = chapter
			s.data.Novels[i].Position = position
			s.data.Novels[i].Progress = progress
			s.data.Novels[i].LastReadTime = time.Now().Unix()
			found = true
			break
		}
	}

	if !found {
		s.data.Novels = append(s.data.Novels, ReadingProgressEntry{
			FilePath:       filePath,
			CurrentChapter: chapter,
			Position:       position,
			Progress:       progress,
			LastReadTime:   time.Now().Unix(),
		})
	}

	s.mu.Unlock()
	return s.save()
}

// GetProgress 获取某本书的阅读进度
func (s *ProgressService) GetProgress(filePath string) *ReadingProgressEntry {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, entry := range s.data.Novels {
		if entry.FilePath == filePath {
			return &entry
		}
	}
	return nil
}

// GetAllProgress 获取所有阅读进度
func (s *ProgressService) GetAllProgress() []ReadingProgressEntry {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.data.Novels
}

// DeleteProgress 删除某本书的阅读进度
func (s *ProgressService) DeleteProgress(filePath string) error {
	s.mu.Lock()

	for i, entry := range s.data.Novels {
		if entry.FilePath == filePath {
			s.data.Novels = append(s.data.Novels[:i], s.data.Novels[i+1:]...)
			break
		}
	}

	s.mu.Unlock()
	return s.save()
}

// GetRecentBooks 获取最近阅读的书籍（按时间倒序）
func (s *ProgressService) GetRecentBooks(limit int) []ReadingProgressEntry {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 复制一份排序
	sorted := make([]ReadingProgressEntry, len(s.data.Novels))
	copy(sorted, s.data.Novels)

	// 简单冒泡排序（数据量小）
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[j].LastReadTime > sorted[i].LastReadTime {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}

	if limit > 0 && limit < len(sorted) {
		return sorted[:limit]
	}
	return sorted
}
