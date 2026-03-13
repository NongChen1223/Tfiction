//go:build !darwin

package services

func desktopReaderOverlaySupported() bool {
	return false
}

func showDesktopReaderOverlay(_ string, _ int, _ float64, _ float64, _, _, _ int) {}

func updateDesktopReaderOverlay(_ string, _ int, _ float64, _ float64, _, _, _ int) {}

func hideDesktopReaderOverlay() {}

func isDesktopReaderOverlayVisible() bool {
	return false
}
