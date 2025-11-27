package app

import (
	"context"

	"github.com/nongchen1223/tfiction/backend/config"
	"github.com/nongchen1223/tfiction/backend/services"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App 应用主结构
type App struct {
	ctx           context.Context
	config        *config.Config
	novelService  *services.NovelService
	windowService *services.WindowService
	searchService *services.SearchService
}

// NewApp 创建应用实例
func NewApp(
	cfg *config.Config,
	novelService *services.NovelService,
	windowService *services.WindowService,
	searchService *services.SearchService,
) *App {
	return &App{
		config:        cfg,
		novelService:  novelService,
		windowService: windowService,
		searchService: searchService,
	}
}

// Startup 应用启动时调用
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	// 初始化各个服务
	a.novelService.Init(ctx)
	a.windowService.Init(ctx)
	a.searchService.Init(ctx)

	// 发送启动完成事件
	runtime.EventsEmit(ctx, "app:ready", map[string]interface{}{
		"version":     a.config.Version,
		"environment": a.config.Environment,
	})
}

// Shutdown 应用关闭时调用
func (a *App) Shutdown(ctx context.Context) {
	// 清理资源
	a.novelService.Cleanup()
	a.windowService.Cleanup()
	a.searchService.Cleanup()
}

// GetAppInfo 获取应用信息
func (a *App) GetAppInfo() map[string]interface{} {
	return map[string]interface{}{
		"name":        a.config.AppName,
		"version":     a.config.Version,
		"environment": a.config.Environment,
		"dataDir":     a.config.DataDir,
	}
}

// GetConfig 获取配置信息
func (a *App) GetConfig() *config.Config {
	return a.config
}
