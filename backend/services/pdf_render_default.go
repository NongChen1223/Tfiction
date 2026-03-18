//go:build !darwin

package services

import "fmt"

func getPDFPageCount(string) (int, error) {
	return 0, fmt.Errorf("当前平台暂不支持图片型 PDF 按页渲染")
}

func renderPDFPageDataURL(string, int) (string, error) {
	return "", fmt.Errorf("当前平台暂不支持图片型 PDF 按页渲染")
}
