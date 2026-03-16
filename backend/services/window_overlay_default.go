//go:build !darwin

package services

func desktopReaderOverlaySupported() bool {
	return false
}

func showDesktopReaderOverlay(_ string, _ int, _ float64, _ float64, _, _, _ int) {}

func updateDesktopReaderOverlay(_ string, _ int, _ float64, _ float64, _, _, _ int) {}

func updateDesktopReaderOverlayOpacity(_ float64) {}

func updateDesktopReaderOverlayControls(_ string, _ int, _, _ float64) {}

func hideDesktopReaderOverlay() {}

func isDesktopReaderOverlayVisible() bool {
	return false
}

func consumeDesktopReaderOverlayActions() string {
	return ""
}
