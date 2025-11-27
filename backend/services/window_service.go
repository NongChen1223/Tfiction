package services

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// WindowService 窗口服务
// 负责窗口置顶、透明度、摸鱼模式等功能
type WindowService struct {
	ctx              context.Context
	isAlwaysOnTop    bool    // 是否置顶
	isStealthMode    bool    // 是否摸鱼模式
	opacity          float64 // 透明度 (0.0 - 1.0)
	isMouseInWindow  bool    // 鼠标是否在窗口内
	originalPosition struct {
		x, y int
	}
	originalSize struct {
		width, height int
	}
}

// NewWindowService 创建窗口服务实例
func NewWindowService() *WindowService {
	return &WindowService{
		opacity: 1.0,
	}
}

// Init 初始化服务
func (s *WindowService) Init(ctx context.Context) {
	s.ctx = ctx
}

// Cleanup 清理资源
func (s *WindowService) Cleanup() {
	// 恢复窗口状态
	if s.isAlwaysOnTop {
		s.SetAlwaysOnTop(false)
	}
	if s.isStealthMode {
		s.DisableStealthMode()
	}
}

// SetAlwaysOnTop 设置窗口置顶
func (s *WindowService) SetAlwaysOnTop(alwaysOnTop bool) error {
	s.isAlwaysOnTop = alwaysOnTop
	// Wails v2 的窗口置顶功能
	// 注意：需要在运行时调用，编译时无法直接设置
	runtime.WindowSetAlwaysOnTop(s.ctx, alwaysOnTop)
	return nil
}

// IsAlwaysOnTop 获取窗口是否置顶
func (s *WindowService) IsAlwaysOnTop() bool {
	return s.isAlwaysOnTop
}

// SetOpacity 设置窗口透明度
// @param opacity 透明度值 (0.0 - 1.0)
func (s *WindowService) SetOpacity(opacity float64) error {
	if opacity < 0.0 {
		opacity = 0.0
	}
	if opacity > 1.0 {
		opacity = 1.0
	}
	s.opacity = opacity

	// 发送透明度变化事件到前端
	runtime.EventsEmit(s.ctx, "window:opacity", opacity)
	return nil
}

// GetOpacity 获取当前透明度
func (s *WindowService) GetOpacity() float64 {
	return s.opacity
}

// EnableStealthMode 启用摸鱼模式
// 摸鱼模式：背景透明、鼠标移出时隐藏内容、窗口置顶
func (s *WindowService) EnableStealthMode() error {
	s.isStealthMode = true
	s.SetAlwaysOnTop(true)
	s.SetOpacity(0.3) // 默认透明度

	runtime.EventsEmit(s.ctx, "window:stealthMode", true)
	return nil
}

// DisableStealthMode 禁用摸鱼模式
func (s *WindowService) DisableStealthMode() error {
	s.isStealthMode = false
	s.SetOpacity(1.0)

	runtime.EventsEmit(s.ctx, "window:stealthMode", false)
	return nil
}

// IsStealthMode 获取是否处于摸鱼模式
func (s *WindowService) IsStealthMode() bool {
	return s.isStealthMode
}

// ToggleStealthMode 切换摸鱼模式
func (s *WindowService) ToggleStealthMode() error {
	if s.isStealthMode {
		return s.DisableStealthMode()
	}
	return s.EnableStealthMode()
}

// OnMouseEnter 鼠标进入窗口
func (s *WindowService) OnMouseEnter() {
	s.isMouseInWindow = true
	if s.isStealthMode {
		// 摸鱼模式下，鼠标进入时显示内容
		runtime.EventsEmit(s.ctx, "window:mouseEnter", true)
	}
}

// OnMouseLeave 鼠标离开窗口
func (s *WindowService) OnMouseLeave() {
	s.isMouseInWindow = false
	if s.isStealthMode {
		// 摸鱼模式下，鼠标离开时隐藏内容
		runtime.EventsEmit(s.ctx, "window:mouseLeave", true)
	}
}

// IsMouseInWindow 获取鼠标是否在窗口内
func (s *WindowService) IsMouseInWindow() bool {
	return s.isMouseInWindow
}

// MinimizeWindow 最小化窗口
func (s *WindowService) MinimizeWindow() {
	runtime.WindowMinimise(s.ctx)
}

// MaximizeWindow 最大化窗口
func (s *WindowService) MaximizeWindow() {
	runtime.WindowMaximise(s.ctx)
}

// UnmaximizeWindow 取消最大化
func (s *WindowService) UnmaximizeWindow() {
	runtime.WindowUnmaximise(s.ctx)
}

// FullscreenWindow 全屏窗口
func (s *WindowService) FullscreenWindow() {
	runtime.WindowFullscreen(s.ctx)
}

// GetWindowSize 获取窗口大小
func (s *WindowService) GetWindowSize() (int, int) {
	return s.originalSize.width, s.originalSize.height
}

// SetWindowSize 设置窗口大小
func (s *WindowService) SetWindowSize(width, height int) {
	s.originalSize.width = width
	s.originalSize.height = height
	runtime.WindowSetSize(s.ctx, width, height)
}

// GetWindowPosition 获取窗口位置
func (s *WindowService) GetWindowPosition() (int, int) {
	return s.originalPosition.x, s.originalPosition.y
}

// SetWindowPosition 设置窗口位置
func (s *WindowService) SetWindowPosition(x, y int) {
	s.originalPosition.x = x
	s.originalPosition.y = y
	runtime.WindowSetPosition(s.ctx, x, y)
}
