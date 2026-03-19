//go:build darwin

package services

/*
#cgo CFLAGS: -x objective-c -fobjc-arc
#cgo LDFLAGS: -framework Cocoa

#include <stdlib.h>
#include <string.h>
#include <math.h>
#import <Cocoa/Cocoa.h>

static long MoyuReaderPDFPageCount(const char *path) {
	@autoreleasepool {
		if (path == NULL) {
			return 0;
		}

		NSString *filePath = [NSString stringWithUTF8String:path];
		NSData *pdfData = [NSData dataWithContentsOfFile:filePath];
		if (pdfData == nil) {
			return 0;
		}

		NSPDFImageRep *pdfImageRep = [NSPDFImageRep imageRepWithData:pdfData];
		if (pdfImageRep == nil) {
			return 0;
		}

		return (long)[pdfImageRep pageCount];
	}
}

static char *MoyuReaderRenderPDFPageDataURL(const char *path, long pageIndex, double targetMaxWidth) {
	@autoreleasepool {
		if (path == NULL || pageIndex < 0) {
			return NULL;
		}

		NSString *filePath = [NSString stringWithUTF8String:path];
		NSData *pdfData = [NSData dataWithContentsOfFile:filePath];
		if (pdfData == nil) {
			return NULL;
		}

		NSPDFImageRep *pdfImageRep = [NSPDFImageRep imageRepWithData:pdfData];
		if (pdfImageRep == nil) {
			return NULL;
		}

		if (pageIndex >= [pdfImageRep pageCount]) {
			return NULL;
		}

		[pdfImageRep setCurrentPage:pageIndex];
		NSRect bounds = [pdfImageRep bounds];
		CGFloat width = bounds.size.width;
		CGFloat height = bounds.size.height;
		if (width <= 0 || height <= 0) {
			return NULL;
		}

		CGFloat scale = 1.0;
		if (targetMaxWidth > 0 && width > targetMaxWidth) {
			scale = targetMaxWidth / width;
		}

		NSInteger pixelWidth = MAX((NSInteger) llround(width * scale), 1);
		NSInteger pixelHeight = MAX((NSInteger) llround(height * scale), 1);

		NSBitmapImageRep *bitmap = [[NSBitmapImageRep alloc]
			initWithBitmapDataPlanes:NULL
			              pixelsWide:pixelWidth
			              pixelsHigh:pixelHeight
			           bitsPerSample:8
			         samplesPerPixel:4
			                hasAlpha:YES
			                isPlanar:NO
			          colorSpaceName:NSDeviceRGBColorSpace
			             bytesPerRow:0
			            bitsPerPixel:0];
		if (bitmap == nil) {
			return NULL;
		}

		NSGraphicsContext *graphicsContext = [NSGraphicsContext graphicsContextWithBitmapImageRep:bitmap];
		if (graphicsContext == nil) {
			return NULL;
		}

		[NSGraphicsContext saveGraphicsState];
		[NSGraphicsContext setCurrentContext:graphicsContext];
		[[NSColor whiteColor] setFill];
		NSRectFill(NSMakeRect(0, 0, pixelWidth, pixelHeight));
		[pdfImageRep drawInRect:NSMakeRect(0, 0, pixelWidth, pixelHeight)];
		[graphicsContext flushGraphics];
		[NSGraphicsContext restoreGraphicsState];

		NSData *pngData = [bitmap representationUsingType:NSBitmapImageFileTypePNG properties:@{}];
		if (pngData == nil) {
			return NULL;
		}

		NSString *base64 = [pngData base64EncodedStringWithOptions:0];
		NSString *dataURL = [NSString stringWithFormat:@"data:image/png;base64,%@", base64];
		const char *utf8String = [dataURL UTF8String];
		if (utf8String == NULL) {
			return NULL;
		}

		char *result = (char *)malloc(strlen(utf8String) + 1);
		if (result == NULL) {
			return NULL;
		}

		strcpy(result, utf8String);
		return result;
	}
}
*/
import "C"

import (
	"fmt"
	"unsafe"
)

const pdfRenderTargetMaxWidth = 1600

func getPDFPageCount(filePath string) (int, error) {
	if filePath == "" {
		return 0, fmt.Errorf("PDF 路径不能为空")
	}

	cPath := C.CString(filePath)
	defer C.free(unsafe.Pointer(cPath))

	pageCount := int(C.MoyuReaderPDFPageCount(cPath))
	if pageCount <= 0 {
		return 0, fmt.Errorf("无法读取 PDF 页数")
	}

	return pageCount, nil
}

func renderPDFPageDataURL(filePath string, pageIndex int) (string, error) {
	if filePath == "" {
		return "", fmt.Errorf("PDF 路径不能为空")
	}
	if pageIndex < 0 {
		return "", fmt.Errorf("PDF 页码越界")
	}

	cPath := C.CString(filePath)
	defer C.free(unsafe.Pointer(cPath))

	result := C.MoyuReaderRenderPDFPageDataURL(cPath, C.long(pageIndex), C.double(pdfRenderTargetMaxWidth))
	if result == nil {
		return "", fmt.Errorf("macOS PDF 渲染失败")
	}
	defer C.free(unsafe.Pointer(result))

	return C.GoString(result), nil
}
