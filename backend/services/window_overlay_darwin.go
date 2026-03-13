//go:build darwin

package services

/*
#cgo CFLAGS: -x objective-c -fobjc-arc
#cgo LDFLAGS: -framework Cocoa

#include <stdlib.h>
#import <Cocoa/Cocoa.h>
#import <dispatch/dispatch.h>

static NSPanel *tfictionOverlayWindow = nil;
static NSScrollView *tfictionOverlayScrollView = nil;
static NSView *tfictionOverlayRootView = nil;
static NSView *tfictionOverlayHeaderView = nil;
static NSView *tfictionOverlayResizeHandleView = nil;
static NSWindow *tfictionMainAppWindow = nil;
static BOOL tfictionOverlayVisible = NO;

static const CGFloat TFictionOverlayDefaultWidth = 620.0;
static const CGFloat TFictionOverlayDefaultHeight = 280.0;
static const CGFloat TFictionOverlayMinWidth = 320.0;
static const CGFloat TFictionOverlayMinHeight = 160.0;
static const CGFloat TFictionOverlayEdgeMargin = 24.0;
static const CGFloat TFictionOverlayHeaderHeight = 20.0;
static const CGFloat TFictionOverlayHeaderTopInset = 8.0;
static const CGFloat TFictionOverlayContentInset = 10.0;
static const CGFloat TFictionOverlayBottomInset = 20.0;
static const CGFloat TFictionOverlayResizeHandleSize = 18.0;

static void TFictionHideDesktopReaderOverlayWindow(void);
static void TFictionLayoutDesktopReaderOverlayViews(void);
static NSRect TFictionPreferredDesktopReaderOverlayFrame(void);
static NSRect TFictionClampDesktopReaderOverlayFrame(NSRect frame, NSScreen *preferredScreen);

@interface TFictionOverlayPanel : NSPanel
@end

@implementation TFictionOverlayPanel
- (BOOL)canBecomeKeyWindow {
	return YES;
}

- (BOOL)canBecomeMainWindow {
	return NO;
}
@end

@interface TFictionOverlayRootView : NSView
@end

@implementation TFictionOverlayRootView
- (BOOL)isOpaque {
	return NO;
}

- (BOOL)mouseDownCanMoveWindow {
	return YES;
}

- (void)layout {
	[super layout];
	TFictionLayoutDesktopReaderOverlayViews();
}

- (void)drawRect:(NSRect)dirtyRect {
	[super drawRect:dirtyRect];

	NSRect bounds = NSInsetRect(self.bounds, 0.8, 0.8);

	[[NSGraphicsContext currentContext] saveGraphicsState];

	NSShadow *outerShadow = [[NSShadow alloc] init];
	[outerShadow setShadowBlurRadius:10.0];
	[outerShadow setShadowOffset:NSMakeSize(0, -1)];
	[outerShadow setShadowColor:[[NSColor blackColor] colorWithAlphaComponent:0.14]];
	[outerShadow set];

	NSBezierPath *outerFrame = [NSBezierPath bezierPathWithRoundedRect:bounds xRadius:16.0 yRadius:16.0];
	[outerFrame setLineWidth:1.2];
	[[[NSColor whiteColor] colorWithAlphaComponent:0.34] setStroke];
	[outerFrame stroke];

	[[NSGraphicsContext currentContext] restoreGraphicsState];

	NSBezierPath *innerFrame = [NSBezierPath bezierPathWithRoundedRect:NSInsetRect(bounds, 1.6, 1.6) xRadius:14.0 yRadius:14.0];
	[innerFrame setLineWidth:0.8];
	[[[NSColor blackColor] colorWithAlphaComponent:0.12] setStroke];
	[innerFrame stroke];
}
@end

@interface TFictionOverlayHeaderView : NSView
@end

@implementation TFictionOverlayHeaderView
- (BOOL)isOpaque {
	return NO;
}

- (BOOL)mouseDownCanMoveWindow {
	return YES;
}

- (void)drawRect:(NSRect)dirtyRect {
	[super drawRect:dirtyRect];

	NSRect gripRect = NSMakeRect(
		(NSWidth(self.bounds) - 72.0) / 2.0,
		(NSHeight(self.bounds) - 4.0) / 2.0,
		72.0,
		4.0
	);

	[[NSGraphicsContext currentContext] saveGraphicsState];

	NSShadow *shadow = [[NSShadow alloc] init];
	[shadow setShadowBlurRadius:6.0];
	[shadow setShadowOffset:NSMakeSize(0, -1)];
	[shadow setShadowColor:[[NSColor blackColor] colorWithAlphaComponent:0.12]];
	[shadow set];

	NSBezierPath *gripPath = [NSBezierPath bezierPathWithRoundedRect:gripRect xRadius:2.0 yRadius:2.0];
	[[[NSColor whiteColor] colorWithAlphaComponent:0.44] setFill];
	[gripPath fill];

	[[NSGraphicsContext currentContext] restoreGraphicsState];
}
@end

@interface TFictionOverlayResizeHandleView : NSView
@property(nonatomic, assign) NSPoint initialMouseLocation;
@property(nonatomic, assign) NSRect initialWindowFrame;
@end

@implementation TFictionOverlayResizeHandleView
- (BOOL)isOpaque {
	return NO;
}

- (void)resetCursorRects {
	[self addCursorRect:self.bounds cursor:[NSCursor crosshairCursor]];
}

- (void)mouseDown:(NSEvent *)event {
	[super mouseDown:event];
	self.initialMouseLocation = [NSEvent mouseLocation];
	self.initialWindowFrame = self.window.frame;
}

- (void)mouseDragged:(NSEvent *)event {
	[super mouseDragged:event];

	if (self.window == nil) {
		return;
	}

	NSPoint currentMouseLocation = [NSEvent mouseLocation];
	CGFloat deltaX = currentMouseLocation.x - self.initialMouseLocation.x;
	CGFloat deltaY = currentMouseLocation.y - self.initialMouseLocation.y;

	NSRect nextFrame = self.initialWindowFrame;
	nextFrame.size.width = MAX(TFictionOverlayMinWidth, self.initialWindowFrame.size.width + deltaX);
	nextFrame.size.height = MAX(TFictionOverlayMinHeight, self.initialWindowFrame.size.height - deltaY);
	nextFrame.origin.y = NSMaxY(self.initialWindowFrame) - nextFrame.size.height;
	nextFrame = TFictionClampDesktopReaderOverlayFrame(nextFrame, self.window.screen ?: tfictionMainAppWindow.screen);

	[self.window setFrame:nextFrame display:YES animate:NO];
	[self.window.contentView setNeedsDisplay:YES];
}

- (void)drawRect:(NSRect)dirtyRect {
	[super drawRect:dirtyRect];

	[[[NSColor whiteColor] colorWithAlphaComponent:0.55] setStroke];

	for (NSInteger index = 0; index < 3; index++) {
		CGFloat inset = 3.0 + (CGFloat)index * 4.0;
		NSBezierPath *line = [NSBezierPath bezierPath];
		[line setLineWidth:1.2];
		[line moveToPoint:NSMakePoint(inset, 2.0)];
		[line lineToPoint:NSMakePoint(NSWidth(self.bounds) - 2.0, NSHeight(self.bounds) - inset)];
		[line stroke];
	}
}
@end

@interface TFictionOverlayTextView : NSTextView
@end

@implementation TFictionOverlayTextView
- (BOOL)acceptsFirstResponder {
	return YES;
}

- (BOOL)mouseDownCanMoveWindow {
	return YES;
}

- (void)keyDown:(NSEvent *)event {
	if (event.keyCode == 53) {
		TFictionHideDesktopReaderOverlayWindow();
		return;
	}

	[super keyDown:event];
}

- (void)mouseDown:(NSEvent *)event {
	if (event.clickCount >= 2) {
		TFictionHideDesktopReaderOverlayWindow();
		return;
	}

	[super mouseDown:event];
}
@end

static NSWindow *TFictionResolveMainAppWindow(void) {
	for (NSWindow *window in [NSApp windows]) {
		if (window != nil && window != tfictionOverlayWindow) {
			return window;
		}
	}

	NSWindow *mainWindow = [NSApp mainWindow];
	if (mainWindow != nil && mainWindow != tfictionOverlayWindow) {
		return mainWindow;
	}

	NSWindow *keyWindow = [NSApp keyWindow];
	if (keyWindow != nil && keyWindow != tfictionOverlayWindow) {
		return keyWindow;
	}

	return nil;
}

static NSScreen *TFictionPreferredDesktopReaderOverlayScreen(NSRect frame, NSScreen *preferredScreen) {
	if (preferredScreen != nil) {
		return preferredScreen;
	}

	NSPoint frameCenter = NSMakePoint(NSMidX(frame), NSMidY(frame));
	for (NSScreen *screen in [NSScreen screens]) {
		if (NSPointInRect(frameCenter, screen.frame)) {
			return screen;
		}
	}

	NSScreen *mainScreen = [NSScreen mainScreen];
	if (mainScreen != nil) {
		return mainScreen;
	}

	return [[NSScreen screens] firstObject];
}

static NSRect TFictionClampDesktopReaderOverlayFrame(NSRect frame, NSScreen *preferredScreen) {
	NSScreen *screen = TFictionPreferredDesktopReaderOverlayScreen(frame, preferredScreen);
	if (screen == nil) {
		return frame;
	}

	NSRect visibleFrame = screen.visibleFrame;
	CGFloat maxWidth = MAX(TFictionOverlayMinWidth, visibleFrame.size.width - (TFictionOverlayEdgeMargin * 2.0));
	CGFloat maxHeight = MAX(TFictionOverlayMinHeight, visibleFrame.size.height - (TFictionOverlayEdgeMargin * 2.0));

	frame.size.width = MIN(MAX(frame.size.width, TFictionOverlayMinWidth), maxWidth);
	frame.size.height = MIN(MAX(frame.size.height, TFictionOverlayMinHeight), maxHeight);

	CGFloat minX = visibleFrame.origin.x + TFictionOverlayEdgeMargin;
	CGFloat maxX = NSMaxX(visibleFrame) - frame.size.width - TFictionOverlayEdgeMargin;
	if (maxX < minX) {
		frame.origin.x = visibleFrame.origin.x + (visibleFrame.size.width - frame.size.width) / 2.0;
	} else {
		frame.origin.x = MIN(MAX(frame.origin.x, minX), maxX);
	}

	CGFloat minY = visibleFrame.origin.y + TFictionOverlayEdgeMargin;
	CGFloat maxY = NSMaxY(visibleFrame) - frame.size.height - TFictionOverlayEdgeMargin;
	if (maxY < minY) {
		frame.origin.y = visibleFrame.origin.y + (visibleFrame.size.height - frame.size.height) / 2.0;
	} else {
		frame.origin.y = MIN(MAX(frame.origin.y, minY), maxY);
	}

	return frame;
}

// 优先复用用户上一次拖拽后的浮窗位置；首次打开则贴近主阅读窗口中心。
static NSRect TFictionPreferredDesktopReaderOverlayFrame(void) {
	if (tfictionOverlayWindow != nil) {
		return TFictionClampDesktopReaderOverlayFrame(
			tfictionOverlayWindow.frame,
			tfictionOverlayWindow.screen ?: tfictionMainAppWindow.screen
		);
	}

	NSSize overlaySize = NSMakeSize(TFictionOverlayDefaultWidth, TFictionOverlayDefaultHeight);
	NSRect frame = NSMakeRect(0, 0, overlaySize.width, overlaySize.height);
	NSScreen *preferredScreen = nil;

	if (tfictionMainAppWindow != nil) {
		preferredScreen = tfictionMainAppWindow.screen;
		frame.origin.x = NSMidX(tfictionMainAppWindow.frame) - (overlaySize.width / 2.0);
		frame.origin.y = NSMidY(tfictionMainAppWindow.frame) - (overlaySize.height / 2.0);
	} else {
		preferredScreen = [NSScreen mainScreen] ?: [[NSScreen screens] firstObject];
		if (preferredScreen != nil) {
			frame.origin.x = NSMidX(preferredScreen.visibleFrame) - (overlaySize.width / 2.0);
			frame.origin.y = NSMidY(preferredScreen.visibleFrame) - (overlaySize.height / 2.0);
		}
	}

	return TFictionClampDesktopReaderOverlayFrame(frame, preferredScreen);
}

static NSColor *TFictionOverlayColor(int red, int green, int blue, double alpha) {
	return [NSColor colorWithCalibratedRed:MAX(0, MIN(red, 255)) / 255.0
	                                 green:MAX(0, MIN(green, 255)) / 255.0
	                                  blue:MAX(0, MIN(blue, 255)) / 255.0
	                                 alpha:MAX(0.0, MIN(alpha, 1.0))];
}

// 透明浮窗仍保留一层轻量拖拽框，方便用户在极低可见度下找到并调整大小。
static void TFictionLayoutDesktopReaderOverlayViews(void) {
	if (tfictionOverlayRootView == nil || tfictionOverlayScrollView == nil || tfictionOverlayHeaderView == nil || tfictionOverlayResizeHandleView == nil) {
		return;
	}

	NSRect bounds = tfictionOverlayRootView.bounds;
	[tfictionOverlayHeaderView setFrame:NSMakeRect(
		12.0,
		NSHeight(bounds) - TFictionOverlayHeaderHeight - TFictionOverlayHeaderTopInset,
		MAX(80.0, NSWidth(bounds) - 24.0),
		TFictionOverlayHeaderHeight
	)];
	[tfictionOverlayResizeHandleView setFrame:NSMakeRect(
		NSWidth(bounds) - TFictionOverlayResizeHandleSize - 8.0,
		6.0,
		TFictionOverlayResizeHandleSize,
		TFictionOverlayResizeHandleSize
	)];

	NSRect scrollFrame = NSInsetRect(bounds, TFictionOverlayContentInset, TFictionOverlayContentInset);
	scrollFrame.origin.y += TFictionOverlayBottomInset;
	scrollFrame.size.height -= (TFictionOverlayHeaderHeight + TFictionOverlayHeaderTopInset + TFictionOverlayBottomInset + 6.0);
	[tfictionOverlayScrollView setFrame:scrollFrame];

	TFictionOverlayTextView *textView = (TFictionOverlayTextView *)[tfictionOverlayScrollView documentView];
	if (textView != nil) {
		[textView setFrame:NSMakeRect(0, 0, scrollFrame.size.width, scrollFrame.size.height)];
		[textView.textContainer setContainerSize:NSMakeSize(scrollFrame.size.width, CGFLOAT_MAX)];
	}

	[tfictionOverlayRootView setNeedsDisplay:YES];
}

static void TFictionEnsureDesktopReaderOverlayWindow(void) {
	if (tfictionOverlayWindow != nil) {
		return;
	}

	NSRect frame = TFictionPreferredDesktopReaderOverlayFrame();
	NSUInteger styleMask = NSWindowStyleMaskBorderless | NSWindowStyleMaskResizable;

	tfictionOverlayWindow = [[TFictionOverlayPanel alloc] initWithContentRect:frame
	                                                  styleMask:styleMask
	                                                    backing:NSBackingStoreBuffered
	                                                      defer:NO];
	[tfictionOverlayWindow setReleasedWhenClosed:NO];
	[tfictionOverlayWindow setOpaque:NO];
	[tfictionOverlayWindow setBackgroundColor:[NSColor clearColor]];
	[tfictionOverlayWindow setHasShadow:NO];
	[tfictionOverlayWindow setMovableByWindowBackground:YES];
	[tfictionOverlayWindow setLevel:NSFloatingWindowLevel];
	[tfictionOverlayWindow setHidesOnDeactivate:NO];
	[tfictionOverlayWindow setCollectionBehavior:
	  NSWindowCollectionBehaviorCanJoinAllSpaces |
	  NSWindowCollectionBehaviorFullScreenAuxiliary];
	[tfictionOverlayWindow setTitleVisibility:NSWindowTitleHidden];
	[tfictionOverlayWindow setTitlebarAppearsTransparent:YES];
	[tfictionOverlayWindow setMinSize:NSMakeSize(320, 160)];
	[tfictionOverlayWindow setAnimationBehavior:NSWindowAnimationBehaviorNone];

	tfictionOverlayRootView = [[TFictionOverlayRootView alloc] initWithFrame:NSMakeRect(0, 0, frame.size.width, frame.size.height)];
	[tfictionOverlayRootView setWantsLayer:YES];
	tfictionOverlayRootView.layer.backgroundColor = [NSColor clearColor].CGColor;
	[tfictionOverlayWindow setContentView:tfictionOverlayRootView];

	tfictionOverlayHeaderView = [[TFictionOverlayHeaderView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayHeaderView setAutoresizingMask:NSViewWidthSizable | NSViewMinYMargin];
	[tfictionOverlayRootView addSubview:tfictionOverlayHeaderView];

	tfictionOverlayScrollView = [[NSScrollView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayScrollView setDrawsBackground:NO];
	[tfictionOverlayScrollView setBorderType:NSNoBorder];
	[tfictionOverlayScrollView setHasVerticalScroller:NO];
	[tfictionOverlayScrollView setHasHorizontalScroller:NO];
	[tfictionOverlayScrollView setScrollerStyle:NSScrollerStyleOverlay];

	TFictionOverlayTextView *textView = [[TFictionOverlayTextView alloc] initWithFrame:NSZeroRect];
	[textView setAutoresizingMask:NSViewWidthSizable | NSViewHeightSizable];
	[textView setEditable:NO];
	[textView setSelectable:NO];
	[textView setRichText:NO];
	[textView setImportsGraphics:NO];
	[textView setDrawsBackground:NO];
	[textView setHorizontallyResizable:NO];
	[textView setVerticallyResizable:YES];
	[textView setTextContainerInset:NSMakeSize(22, 18)];
	[textView.textContainer setWidthTracksTextView:YES];
	[textView.textContainer setContainerSize:NSMakeSize(frame.size.width, CGFLOAT_MAX)];

	[tfictionOverlayScrollView setDocumentView:textView];
	[tfictionOverlayRootView addSubview:tfictionOverlayScrollView];

	tfictionOverlayResizeHandleView = [[TFictionOverlayResizeHandleView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayResizeHandleView setAutoresizingMask:NSViewMinXMargin | NSViewMaxYMargin];
	[tfictionOverlayRootView addSubview:tfictionOverlayResizeHandleView];

	TFictionLayoutDesktopReaderOverlayViews();
}

static void TFictionApplyDesktopReaderOverlayContent(const char *text, int fontSize, double lineHeight, double opacity, int red, int green, int blue) {
	TFictionEnsureDesktopReaderOverlayWindow();

	NSString *string = text != NULL ? [NSString stringWithUTF8String:text] : @"";
	TFictionOverlayTextView *textView = (TFictionOverlayTextView *)[tfictionOverlayScrollView documentView];

	NSMutableParagraphStyle *paragraphStyle = [[NSMutableParagraphStyle alloc] init];
	[paragraphStyle setLineBreakMode:NSLineBreakByWordWrapping];
	[paragraphStyle setParagraphSpacing:MAX(8.0, fontSize * 0.55)];
	[paragraphStyle setMinimumLineHeight:MAX(18.0, fontSize * lineHeight)];
	[paragraphStyle setMaximumLineHeight:MAX(18.0, fontSize * lineHeight)];

	NSShadow *shadow = [[NSShadow alloc] init];
	[shadow setShadowBlurRadius:8.0];
	[shadow setShadowOffset:NSMakeSize(0, 1)];
	[shadow setShadowColor:[[NSColor blackColor] colorWithAlphaComponent:0.15]];

	NSDictionary *attributes = @{
		NSFontAttributeName: [NSFont systemFontOfSize:MAX(fontSize, 12) weight:NSFontWeightMedium],
		NSForegroundColorAttributeName: TFictionOverlayColor(red, green, blue, opacity),
		NSParagraphStyleAttributeName: paragraphStyle,
		NSShadowAttributeName: shadow,
	};

	NSAttributedString *attributedText = [[NSAttributedString alloc] initWithString:string attributes:attributes];
	[[textView textStorage] setAttributedString:attributedText];
	[textView scrollRangeToVisible:NSMakeRange(0, 0)];
}

static void TFictionShowDesktopReaderOverlayWindow(const char *text, int fontSize, double lineHeight, double opacity, int red, int green, int blue) {
	dispatch_async(dispatch_get_main_queue(), ^{
		tfictionMainAppWindow = TFictionResolveMainAppWindow();
		TFictionApplyDesktopReaderOverlayContent(text, fontSize, lineHeight, opacity, red, green, blue);
		[tfictionOverlayWindow setFrame:TFictionPreferredDesktopReaderOverlayFrame() display:YES animate:NO];
		TFictionLayoutDesktopReaderOverlayViews();

		if (tfictionMainAppWindow != nil) {
			[tfictionMainAppWindow orderOut:nil];
		}

		tfictionOverlayVisible = YES;
		[tfictionOverlayWindow makeKeyAndOrderFront:nil];
		[tfictionOverlayWindow makeFirstResponder:[tfictionOverlayScrollView documentView]];
		[NSApp activateIgnoringOtherApps:YES];
	});
}

static void TFictionUpdateDesktopReaderOverlayWindow(const char *text, int fontSize, double lineHeight, double opacity, int red, int green, int blue) {
	dispatch_async(dispatch_get_main_queue(), ^{
		if (!tfictionOverlayVisible) {
			return;
		}

		TFictionApplyDesktopReaderOverlayContent(text, fontSize, lineHeight, opacity, red, green, blue);
	});
}

static void TFictionHideDesktopReaderOverlayWindow(void) {
	dispatch_async(dispatch_get_main_queue(), ^{
		if (tfictionOverlayWindow != nil) {
			[tfictionOverlayWindow orderOut:nil];
		}

		tfictionOverlayVisible = NO;

		if (tfictionMainAppWindow != nil) {
			[tfictionMainAppWindow makeKeyAndOrderFront:nil];
			[NSApp activateIgnoringOtherApps:YES];
		}
	});
}

static BOOL TFictionIsDesktopReaderOverlayVisible(void) {
	return tfictionOverlayVisible;
}
*/
import "C"

import "unsafe"

func desktopReaderOverlaySupported() bool {
	return true
}

func showDesktopReaderOverlay(text string, fontSize int, lineHeight, opacity float64, red, green, blue int) {
	cText := C.CString(text)
	defer C.free(unsafe.Pointer(cText))

	C.TFictionShowDesktopReaderOverlayWindow(
		cText,
		C.int(fontSize),
		C.double(lineHeight),
		C.double(opacity),
		C.int(red),
		C.int(green),
		C.int(blue),
	)
}

func updateDesktopReaderOverlay(text string, fontSize int, lineHeight, opacity float64, red, green, blue int) {
	cText := C.CString(text)
	defer C.free(unsafe.Pointer(cText))

	C.TFictionUpdateDesktopReaderOverlayWindow(
		cText,
		C.int(fontSize),
		C.double(lineHeight),
		C.double(opacity),
		C.int(red),
		C.int(green),
		C.int(blue),
	)
}

func hideDesktopReaderOverlay() {
	C.TFictionHideDesktopReaderOverlayWindow()
}

func isDesktopReaderOverlayVisible() bool {
	return bool(C.TFictionIsDesktopReaderOverlayVisible())
}
