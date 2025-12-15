package main

import (
	"embed"
	"log"

	"github.com/nongchen1223/tfiction/backend/app"
	"github.com/nongchen1223/tfiction/backend/config"
	"github.com/nongchen1223/tfiction/backend/services"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化服务
	novelService := services.NewNovelService()
	windowService := services.NewWindowService()
	searchService := services.NewSearchService()

	// 创建应用实例
	appInstance := app.NewApp(cfg, novelService, windowService, searchService)

	// 创建 Wails 应用配置
	err = wails.Run(&options.App{
		Title:  "Tfiction - 阅读器",
		Width:  1200,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 255},
		OnStartup:        appInstance.Startup,
		OnShutdown:       appInstance.Shutdown,
		Bind: []interface{}{
			appInstance,
			novelService,
			windowService,
			searchService,
		},
		// Windows 平台特定配置
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			DisableWindowIcon:    false,
		},
		// macOS 平台特定配置
		Mac: &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
				HideTitle:                  false,
				HideTitleBar:               false,
				FullSizeContent:            true,
				UseToolbar:                 false,
				HideToolbarSeparator:       true,
			},
			Appearance:           mac.NSAppearanceNameDarkAqua,
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			About: &mac.AboutInfo{
				Title:   "Tfiction",
				Message: "一款支持多格式、跨平台的阅读器",
			},
		},
	})

	if err != nil {
		log.Fatalf("Error running application: %v", err)
	}
}
