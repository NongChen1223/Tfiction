package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Environment 环境类型
type Environment string

const (
	// EnvLocal 本地开发环境
	EnvLocal Environment = "local"
	// EnvTest 测试环境
	EnvTest Environment = "test"
	// EnvProd 生产环境
	EnvProd Environment = "prod"
)

// Config 应用配置结构
type Config struct {
	// Environment 当前环境
	Environment Environment `json:"environment"`
	// AppName 应用名称
	AppName string `json:"app_name"`
	// Version 应用版本
	Version string `json:"version"`
	// DataDir 数据存储目录
	DataDir string `json:"data_dir"`
	// LogLevel 日志级别
	LogLevel string `json:"log_level"`
	// SupportedFormats 支持的小说格式
	SupportedFormats []string `json:"supported_formats"`
	// MaxFileSize 最大文件大小（MB）
	MaxFileSize int64 `json:"max_file_size"`
}

// LoadConfig 加载配置
// 优先级：环境变量 > 配置文件 > 默认值
func LoadConfig() (*Config, error) {
	// 默认配置
	cfg := &Config{
		Environment:      EnvLocal,
		AppName:          "Tfiction",
		Version:          "1.0.0",
		DataDir:          getDefaultDataDir(),
		LogLevel:         "info",
		SupportedFormats: []string{"txt", "epub", "pdf", "mobi", "azw3"},
		MaxFileSize:      100, // 100MB
	}

	// 从环境变量读取环境配置
	if env := os.Getenv("TFICTION_ENV"); env != "" {
		cfg.Environment = Environment(env)
	}

	// 尝试加载配置文件
	configPath := getConfigPath(cfg.Environment)
	if data, err := os.ReadFile(configPath); err == nil {
		if err := json.Unmarshal(data, cfg); err != nil {
			return nil, err
		}
	}

	// 确保数据目录存在
	if err := os.MkdirAll(cfg.DataDir, 0755); err != nil {
		return nil, err
	}

	return cfg, nil
}

// getDefaultDataDir 获取默认数据目录
func getDefaultDataDir() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "./data"
	}
	return filepath.Join(homeDir, ".tfiction")
}

// getConfigPath 获取配置文件路径
func getConfigPath(env Environment) string {
	switch env {
	case EnvTest:
		return "./config/config.test.json"
	case EnvProd:
		return "./config/config.prod.json"
	default:
		return "./config/config.local.json"
	}
}

// Save 保存配置到文件
func (c *Config) Save() error {
	configPath := getConfigPath(c.Environment)

	// 确保配置目录存在
	if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0644)
}
