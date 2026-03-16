//go:build darwin

package services

/*
#cgo CFLAGS: -x objective-c -fobjc-arc
#cgo LDFLAGS: -framework Cocoa

#include <stdlib.h>
#include <math.h>
#import <Cocoa/Cocoa.h>
#import <dispatch/dispatch.h>

static NSPanel *tfictionOverlayWindow = nil;
static NSScrollView *tfictionOverlayScrollView = nil;
static NSView *tfictionOverlayRootView = nil;
static NSView *tfictionOverlayHeaderView = nil;
static NSView *tfictionOverlayResizeHandleView = nil;
static NSView *tfictionOverlayControlsView = nil;
static NSView *tfictionOverlayFooterView = nil;
static NSButton *tfictionOverlayPrevButton = nil;
static NSButton *tfictionOverlayNextButton = nil;
static NSButton *tfictionOverlayDirectoryButton = nil;
static NSButton *tfictionOverlayCloseButton = nil;
static NSSlider *tfictionOverlayOpacitySlider = nil;
static NSTextField *tfictionOverlayProgressLabel = nil;
static NSTextField *tfictionOverlayOpacityLabel = nil;
static NSView *tfictionOverlayProgressTrackView = nil;
static NSView *tfictionOverlayProgressFillView = nil;
static NSView *tfictionOverlayChapterPanelView = nil;
static NSScrollView *tfictionOverlayChapterListScrollView = nil;
static NSView *tfictionOverlayChapterListContentView = nil;
static NSWindow *tfictionMainAppWindow = nil;
static BOOL tfictionOverlayVisible = NO;
static BOOL tfictionOverlayChromeVisible = NO;
static BOOL tfictionOverlayControlsVisible = NO;
static BOOL tfictionOverlayFooterVisible = NO;
static BOOL tfictionOverlayChapterPanelVisible = NO;
static NSMutableArray<NSDictionary *> *tfictionOverlayActionQueue = nil;
static NSArray<NSString *> *tfictionOverlayChapterTitles = nil;
static NSMutableArray<NSButton *> *tfictionOverlayChapterButtons = nil;
static id tfictionOverlayControlTarget = nil;
static NSString *tfictionOverlayCurrentText = @"";
static int tfictionOverlayCurrentFontSize = 16;
static double tfictionOverlayCurrentLineHeight = 1.8;
static double tfictionOverlayCurrentOpacity = 0.3;
static int tfictionOverlayCurrentRed = 34;
static int tfictionOverlayCurrentGreen = 34;
static int tfictionOverlayCurrentBlue = 34;
static NSInteger tfictionOverlayCurrentChapterIndex = 0;
static double tfictionOverlayCurrentProgress = 0.0;

static const CGFloat TFictionOverlayDefaultWidth = 620.0;
static const CGFloat TFictionOverlayDefaultHeight = 280.0;
static const CGFloat TFictionOverlayMinWidth = 600.0;
static const CGFloat TFictionOverlayMinHeight = 220.0;
static const CGFloat TFictionOverlayEdgeMargin = 24.0;
static const CGFloat TFictionOverlayHeaderHeight = 20.0;
static const CGFloat TFictionOverlayHeaderTopInset = 8.0;
static const CGFloat TFictionOverlayContentInset = 10.0;
static const CGFloat TFictionOverlayBottomInset = 20.0;
static const CGFloat TFictionOverlayResizeHandleSize = 18.0;
static const CGFloat TFictionOverlayChromeRevealDistance = 14.0;
static const CGFloat TFictionOverlayControlsHeight = 42.0;
static const CGFloat TFictionOverlayFooterHeight = 28.0;
static const CGFloat TFictionOverlayControlsGap = 8.0;
static const CGFloat TFictionOverlayTopRevealHeight = 76.0;
static const CGFloat TFictionOverlayBottomRevealHeight = 52.0;
static const CGFloat TFictionOverlayChapterPanelWidth = 220.0;
static const CGFloat TFictionOverlayChapterRowHeight = 30.0;
static const CGFloat TFictionOverlayChapterRowGap = 6.0;

static void TFictionHideDesktopReaderOverlayWindow(void);
static void TFictionLayoutDesktopReaderOverlayViews(void);
static NSRect TFictionPreferredDesktopReaderOverlayFrame(void);
static NSRect TFictionClampDesktopReaderOverlayFrame(NSRect frame, NSScreen *preferredScreen);
static void TFictionSetOverlayChromeVisible(BOOL visible);
static void TFictionSetOverlayControlsVisible(BOOL visible);
static void TFictionSetOverlayFooterVisible(BOOL visible);
static BOOL TFictionShouldRevealOverlayUIAtPoint(NSPoint point, NSRect bounds);
static void TFictionHandleOverlayMouseTracking(NSView *view, NSEvent *event);
static void TFictionUpdateOverlayHoverStateAtPoint(NSPoint point);
static void TFictionUpdateOverlayHoverStateForCurrentMouseLocation(NSWindow *window);
static void TFictionPerformOverlayWindowDrag(NSWindow *window, NSEvent *event);
static void TFictionUpdateDesktopReaderOverlayControls(const char *chaptersJSON, int currentChapter, double progress, double opacity);
static char *TFictionConsumeDesktopReaderOverlayActions(void);
static void TFictionSetOverlayChapterPanelVisible(BOOL visible);
static void TFictionRefreshOverlayControls(void);
static void TFictionRefreshOverlayProgressBar(void);
static void TFictionRefreshOverlayChapterButtons(void);
static void TFictionApplyOverlayChapterButtonStyles(void);
static void TFictionEnqueueOverlayAction(NSString *type, NSInteger chapterIndex, double value, BOOL coalesce);
static void TFictionUpdateDesktopReaderOverlayOpacity(double opacity);

@interface TFictionOverlayPanel : NSPanel
@end

@implementation TFictionOverlayPanel
- (BOOL)canBecomeKeyWindow {
	return YES;
}

- (BOOL)canBecomeMainWindow {
	return NO;
}

- (BOOL)acceptsFirstMouse:(NSEvent *)event {
	return YES;
}
@end

@interface TFictionOverlayRootView : NSView
@property(nonatomic, strong) NSTrackingArea *trackingArea;
@end

@implementation TFictionOverlayRootView
- (BOOL)isOpaque {
	return NO;
}

- (BOOL)acceptsFirstMouse:(NSEvent *)event {
	return YES;
}

- (BOOL)mouseDownCanMoveWindow {
	return YES;
}

- (void)updateTrackingAreas {
	[super updateTrackingAreas];

	if (self.trackingArea != nil) {
		[self removeTrackingArea:self.trackingArea];
	}

	self.trackingArea = [[NSTrackingArea alloc] initWithRect:NSZeroRect
	                                                 options:NSTrackingMouseMoved |
	                                                         NSTrackingMouseEnteredAndExited |
	                                                         NSTrackingActiveAlways |
	                                                         NSTrackingInVisibleRect
	                                                   owner:self
	                                                userInfo:nil];
	[self addTrackingArea:self.trackingArea];
}

- (void)layout {
	[super layout];
	TFictionLayoutDesktopReaderOverlayViews();
}

- (void)mouseEntered:(NSEvent *)event {
	TFictionHandleOverlayMouseTracking(self, event);
}

- (void)mouseMoved:(NSEvent *)event {
	TFictionHandleOverlayMouseTracking(self, event);
}

- (void)mouseExited:(NSEvent *)event {
	TFictionSetOverlayChromeVisible(NO);
}

- (void)mouseDown:(NSEvent *)event {
	TFictionPerformOverlayWindowDrag(self.window, event);
}

- (void)drawRect:(NSRect)dirtyRect {
	[super drawRect:dirtyRect];

	if (!tfictionOverlayChromeVisible) {
		return;
	}

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

- (BOOL)acceptsFirstMouse:(NSEvent *)event {
	return YES;
}

- (BOOL)mouseDownCanMoveWindow {
	return YES;
}

- (void)mouseDown:(NSEvent *)event {
	TFictionSetOverlayChromeVisible(YES);
	TFictionPerformOverlayWindowDrag(self.window, event);
}

- (void)drawRect:(NSRect)dirtyRect {
	[super drawRect:dirtyRect];

	if (!tfictionOverlayChromeVisible) {
		return;
	}

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

- (BOOL)acceptsFirstMouse:(NSEvent *)event {
	return YES;
}

- (void)resetCursorRects {
	[self addCursorRect:self.bounds cursor:[NSCursor crosshairCursor]];
}

- (void)mouseDown:(NSEvent *)event {
	[super mouseDown:event];
	TFictionSetOverlayChromeVisible(YES);
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

	if (!tfictionOverlayChromeVisible) {
		return;
	}

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

@interface TFictionOverlayControlTarget : NSObject
@end

@implementation TFictionOverlayControlTarget
- (void)handlePrevChapter:(id)sender {
	TFictionEnqueueOverlayAction(@"prev", -1, NAN, NO);
}

- (void)handleNextChapter:(id)sender {
	TFictionEnqueueOverlayAction(@"next", -1, NAN, NO);
}

- (void)handleToggleDirectory:(id)sender {
	TFictionSetOverlayChapterPanelVisible(!tfictionOverlayChapterPanelVisible);
}

- (void)handleCloseOverlay:(id)sender {
	TFictionEnqueueOverlayAction(@"close", -1, NAN, NO);
	TFictionHideDesktopReaderOverlayWindow();
}

- (void)handleOpacityChanged:(NSSlider *)sender {
	tfictionOverlayCurrentOpacity = sender.doubleValue;
	TFictionRefreshOverlayControls();
	TFictionEnqueueOverlayAction(@"opacity", -1, sender.doubleValue, YES);
}

- (void)handleSelectChapter:(NSButton *)sender {
	TFictionSetOverlayChapterPanelVisible(NO);
	TFictionEnqueueOverlayAction(@"chapter", sender.tag, NAN, NO);
}
@end

@interface TFictionOverlayScrollView : NSScrollView
@property(nonatomic, strong) NSTrackingArea *trackingArea;
@end

@implementation TFictionOverlayScrollView
- (BOOL)acceptsFirstResponder {
	return YES;
}

- (BOOL)acceptsFirstMouse:(NSEvent *)event {
	return YES;
}

- (void)updateTrackingAreas {
	[super updateTrackingAreas];

	if (self.trackingArea != nil) {
		[self removeTrackingArea:self.trackingArea];
	}

	self.trackingArea = [[NSTrackingArea alloc] initWithRect:NSZeroRect
	                                                 options:NSTrackingMouseMoved |
	                                                         NSTrackingMouseEnteredAndExited |
	                                                         NSTrackingActiveAlways |
	                                                         NSTrackingInVisibleRect
	                                                   owner:self
	                                                userInfo:nil];
	[self addTrackingArea:self.trackingArea];
}

- (void)mouseEntered:(NSEvent *)event {
	TFictionHandleOverlayMouseTracking(self, event);
}

- (void)mouseMoved:(NSEvent *)event {
	TFictionHandleOverlayMouseTracking(self, event);
}

- (void)mouseExited:(NSEvent *)event {
	TFictionSetOverlayChromeVisible(NO);
}

- (void)scrollWheel:(NSEvent *)event {
	if (self.window != nil) {
		[self.window orderFrontRegardless];
	}

	[super scrollWheel:event];
}
@end

@interface TFictionOverlayTextView : NSTextView
@property(nonatomic, strong) NSTrackingArea *trackingArea;
@end

@implementation TFictionOverlayTextView
- (BOOL)acceptsFirstResponder {
	return YES;
}

- (BOOL)acceptsFirstMouse:(NSEvent *)event {
	return YES;
}

- (BOOL)mouseDownCanMoveWindow {
	return YES;
}

- (void)updateTrackingAreas {
	[super updateTrackingAreas];

	if (self.trackingArea != nil) {
		[self removeTrackingArea:self.trackingArea];
	}

	self.trackingArea = [[NSTrackingArea alloc] initWithRect:NSZeroRect
	                                                 options:NSTrackingMouseMoved |
	                                                         NSTrackingMouseEnteredAndExited |
	                                                         NSTrackingActiveAlways |
	                                                         NSTrackingInVisibleRect
	                                                   owner:self
	                                                userInfo:nil];
	[self addTrackingArea:self.trackingArea];
}

- (void)mouseEntered:(NSEvent *)event {
	TFictionHandleOverlayMouseTracking(self, event);
}

- (void)mouseMoved:(NSEvent *)event {
	TFictionHandleOverlayMouseTracking(self, event);
}

- (void)mouseExited:(NSEvent *)event {
	TFictionSetOverlayChromeVisible(NO);
}

- (void)keyDown:(NSEvent *)event {
	if (event.keyCode == 53) {
		TFictionEnqueueOverlayAction(@"close", -1, NAN, NO);
		TFictionHideDesktopReaderOverlayWindow();
		return;
	}

	[super keyDown:event];
}

- (void)mouseDown:(NSEvent *)event {
	if (event.clickCount >= 2) {
		TFictionEnqueueOverlayAction(@"close", -1, NAN, NO);
		TFictionHideDesktopReaderOverlayWindow();
		return;
	}

	TFictionPerformOverlayWindowDrag(self.window, event);
}

- (void)scrollWheel:(NSEvent *)event {
	if (self.enclosingScrollView != nil) {
		[self.enclosingScrollView scrollWheel:event];
		return;
	}

	[super scrollWheel:event];
}
@end

static void TFictionPerformSyncOnMainQueue(dispatch_block_t block) {
	if (block == nil) {
		return;
	}

	if ([NSThread isMainThread]) {
		block();
		return;
	}

	dispatch_sync(dispatch_get_main_queue(), block);
}

static NSTextField *TFictionCreateOverlayLabel(NSString *text) {
	NSTextField *label = [NSTextField labelWithString:text ?: @""];
	[label setTextColor:[[NSColor whiteColor] colorWithAlphaComponent:0.84]];
	[label setFont:[NSFont systemFontOfSize:11.0 weight:NSFontWeightSemibold]];
	[label setBackgroundColor:[NSColor clearColor]];
	[label setBezeled:NO];
	[label setDrawsBackground:NO];
	[label setSelectable:NO];
	[label setEditable:NO];
	[label setLineBreakMode:NSLineBreakByTruncatingTail];
	return label;
}

static void TFictionSetOverlayButtonTitle(NSButton *button, NSString *title, NSColor *color, NSFont *font) {
	if (button == nil) {
		return;
	}

	NSString *safeTitle = title ?: @"";
	NSDictionary *attributes = @{
		NSForegroundColorAttributeName: color ?: [[NSColor whiteColor] colorWithAlphaComponent:0.92],
		NSFontAttributeName: font ?: [NSFont systemFontOfSize:12.0 weight:NSFontWeightSemibold],
	};
	[button setTitle:safeTitle];
	[button setAttributedTitle:[[NSAttributedString alloc] initWithString:safeTitle attributes:attributes]];
}

static NSButton *TFictionCreateOverlayActionButton(NSString *title, SEL action) {
	NSButton *button = [NSButton buttonWithTitle:title ?: @""
	                                      target:tfictionOverlayControlTarget
	                                      action:action];
	[button setBordered:NO];
	[button setBezelStyle:NSBezelStyleRegularSquare];
	[button setWantsLayer:YES];
	button.layer.cornerRadius = 10.0;
	button.layer.borderWidth = 1.0;
	button.layer.borderColor = [[NSColor whiteColor] colorWithAlphaComponent:0.16].CGColor;
	button.layer.backgroundColor = [[NSColor blackColor] colorWithAlphaComponent:0.16].CGColor;
	TFictionSetOverlayButtonTitle(button, title, [[NSColor whiteColor] colorWithAlphaComponent:0.92], [NSFont systemFontOfSize:12.0 weight:NSFontWeightSemibold]);
	return button;
}

static NSButton *TFictionCreateOverlayChapterButton(NSString *title, NSInteger index) {
	NSButton *button = [NSButton buttonWithTitle:title ?: @""
	                                      target:tfictionOverlayControlTarget
	                                      action:@selector(handleSelectChapter:)];
	[button setTag:index];
	[button setBordered:NO];
	[button setButtonType:NSButtonTypeMomentaryPushIn];
	[button setBezelStyle:NSBezelStyleRegularSquare];
	[button setAlignment:NSTextAlignmentLeft];
	[button setWantsLayer:YES];
	button.layer.cornerRadius = 10.0;
	button.layer.borderWidth = 1.0;
	button.layer.borderColor = [[NSColor whiteColor] colorWithAlphaComponent:0.12].CGColor;
	button.layer.backgroundColor = [NSColor colorWithCalibratedWhite:0.16 alpha:0.96].CGColor;
	TFictionSetOverlayButtonTitle(button, title, [[NSColor whiteColor] colorWithAlphaComponent:0.94], [NSFont systemFontOfSize:12.0 weight:NSFontWeightMedium]);
	return button;
}

static void TFictionEnqueueOverlayAction(NSString *type, NSInteger chapterIndex, double value, BOOL coalesce) {
	if (type == nil || type.length == 0) {
		return;
	}

	if (tfictionOverlayActionQueue == nil) {
		tfictionOverlayActionQueue = [[NSMutableArray alloc] init];
	}

	NSMutableDictionary *payload = [NSMutableDictionary dictionaryWithObject:type forKey:@"type"];
	if (chapterIndex >= 0) {
		payload[@"chapterIndex"] = @(chapterIndex);
	}
	if (!isnan(value)) {
		payload[@"value"] = @(value);
	}

	if (coalesce) {
		for (NSInteger index = tfictionOverlayActionQueue.count - 1; index >= 0; index--) {
			NSDictionary *existing = tfictionOverlayActionQueue[index];
			if ([existing[@"type"] isEqualToString:type]) {
				tfictionOverlayActionQueue[index] = payload;
				return;
			}
		}
	}

	[tfictionOverlayActionQueue addObject:payload];
}

static void TFictionRefreshOverlayControls(void) {
	if (tfictionOverlayPrevButton == nil || tfictionOverlayNextButton == nil ||
	    tfictionOverlayDirectoryButton == nil ||
	    tfictionOverlayOpacitySlider == nil || tfictionOverlayProgressLabel == nil ||
	    tfictionOverlayOpacityLabel == nil) {
		return;
	}

	NSInteger chapterCount = (NSInteger)tfictionOverlayChapterTitles.count;
	NSInteger currentChapter = MAX(0, MIN(tfictionOverlayCurrentChapterIndex, MAX(chapterCount - 1, 0)));
	tfictionOverlayCurrentChapterIndex = currentChapter;
	tfictionOverlayCurrentProgress = MAX(0.0, MIN(tfictionOverlayCurrentProgress, 100.0));
	tfictionOverlayCurrentOpacity = MAX(0.02, MIN(tfictionOverlayCurrentOpacity, 1.0));

	[tfictionOverlayPrevButton setEnabled:YES];
	[tfictionOverlayNextButton setEnabled:YES];
	[tfictionOverlayOpacitySlider setDoubleValue:tfictionOverlayCurrentOpacity];
	[tfictionOverlayProgressLabel setStringValue:[NSString stringWithFormat:@"总进度 %.1f%%", tfictionOverlayCurrentProgress]];
	[tfictionOverlayOpacityLabel setStringValue:[NSString stringWithFormat:@"透明 %.2f", tfictionOverlayCurrentOpacity]];
	TFictionSetOverlayButtonTitle(
		tfictionOverlayPrevButton,
		@"上章",
		[[NSColor whiteColor] colorWithAlphaComponent:0.96],
		[NSFont systemFontOfSize:12.0 weight:NSFontWeightSemibold]
	);
	TFictionSetOverlayButtonTitle(
		tfictionOverlayNextButton,
		@"下章",
		[[NSColor whiteColor] colorWithAlphaComponent:0.96],
		[NSFont systemFontOfSize:12.0 weight:NSFontWeightSemibold]
	);
	TFictionSetOverlayButtonTitle(
		tfictionOverlayDirectoryButton,
		(tfictionOverlayChapterPanelVisible ? @"收起" : @"目录"),
		[[NSColor whiteColor] colorWithAlphaComponent:0.92],
		[NSFont systemFontOfSize:12.0 weight:NSFontWeightSemibold]
	);
	TFictionSetOverlayButtonTitle(
		tfictionOverlayCloseButton,
		@"退出",
		[[NSColor whiteColor] colorWithAlphaComponent:0.92],
		[NSFont systemFontOfSize:12.0 weight:NSFontWeightSemibold]
	);
	TFictionRefreshOverlayProgressBar();
}

static void TFictionRefreshOverlayProgressBar(void) {
	if (tfictionOverlayProgressTrackView == nil || tfictionOverlayProgressFillView == nil) {
		return;
	}

	CGFloat trackWidth = NSWidth(tfictionOverlayProgressTrackView.bounds);
	CGFloat trackHeight = NSHeight(tfictionOverlayProgressTrackView.bounds);
	if (trackWidth <= 0.0 || trackHeight <= 0.0) {
		return;
	}

	CGFloat progressRatio = MAX(0.0, MIN(tfictionOverlayCurrentProgress / 100.0, 1.0));
	CGFloat fillWidth = trackWidth * progressRatio;
	if (fillWidth > 0.0) {
		fillWidth = MAX(fillWidth, trackHeight);
	}
	fillWidth = MIN(fillWidth, trackWidth);

	[tfictionOverlayProgressFillView setHidden:(fillWidth <= 0.0)];
	[tfictionOverlayProgressFillView setFrame:NSMakeRect(0.0, 0.0, fillWidth, trackHeight)];
}

static void TFictionRefreshOverlayChapterButtons(void) {
	if (tfictionOverlayChapterListContentView == nil) {
		return;
	}

	if (tfictionOverlayChapterButtons == nil) {
		tfictionOverlayChapterButtons = [[NSMutableArray alloc] init];
	}

	for (NSButton *button in tfictionOverlayChapterButtons) {
		[button removeFromSuperview];
	}
	[tfictionOverlayChapterButtons removeAllObjects];

	for (NSInteger index = 0; index < tfictionOverlayChapterTitles.count; index++) {
		NSString *title = tfictionOverlayChapterTitles[index];
		NSButton *button = TFictionCreateOverlayChapterButton(title, index);
		[tfictionOverlayChapterButtons addObject:button];
		[tfictionOverlayChapterListContentView addSubview:button];
	}
}

static void TFictionApplyOverlayChapterButtonStyles(void) {
	for (NSButton *button in tfictionOverlayChapterButtons) {
		BOOL selected = (button.tag == tfictionOverlayCurrentChapterIndex);
		NSString *title = button.title;
		if (title == nil || title.length == 0) {
			title = button.attributedTitle.string ?: @"";
		}
		button.layer.backgroundColor = (selected
			? [NSColor colorWithCalibratedWhite:0.28 alpha:1.0]
			: [NSColor colorWithCalibratedWhite:0.16 alpha:0.96]).CGColor;
		button.layer.borderColor = (selected
			? [[NSColor whiteColor] colorWithAlphaComponent:0.36]
			: [[NSColor whiteColor] colorWithAlphaComponent:0.12]).CGColor;
		TFictionSetOverlayButtonTitle(
			button,
			title,
			[[NSColor whiteColor] colorWithAlphaComponent:(selected ? 0.98 : 0.94)],
			[NSFont systemFontOfSize:12.0 weight:(selected ? NSFontWeightSemibold : NSFontWeightMedium)]
		);
	}
}

static void TFictionScrollCurrentChapterButtonIntoView(void) {
	if (tfictionOverlayChapterListScrollView == nil) {
		return;
	}

	for (NSButton *button in tfictionOverlayChapterButtons) {
		if (button.tag == tfictionOverlayCurrentChapterIndex) {
			[tfictionOverlayChapterListContentView scrollRectToVisible:NSInsetRect(button.frame, 0.0, -12.0)];
			return;
		}
	}
}

static void TFictionSetOverlayChapterPanelVisible(BOOL visible) {
	tfictionOverlayChapterPanelVisible = visible;

	if (tfictionOverlayChapterPanelView != nil) {
		[tfictionOverlayChapterPanelView setHidden:!(visible && tfictionOverlayChromeVisible)];
	}

	TFictionRefreshOverlayControls();
	TFictionLayoutDesktopReaderOverlayViews();
	if (visible) {
		TFictionScrollCurrentChapterButtonIntoView();
	}
}

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

static void TFictionSetOverlayChromeVisible(BOOL visible) {
	tfictionOverlayChromeVisible = visible;
	tfictionOverlayControlsVisible = visible;
	tfictionOverlayFooterVisible = visible;

	if (tfictionOverlayHeaderView != nil) {
		[tfictionOverlayHeaderView setHidden:!visible];
		[tfictionOverlayHeaderView setNeedsDisplay:YES];
	}
	if (tfictionOverlayControlsView != nil) {
		[tfictionOverlayControlsView setHidden:!visible];
	}
	if (tfictionOverlayFooterView != nil) {
		[tfictionOverlayFooterView setHidden:!visible];
	}
	if (tfictionOverlayChapterPanelView != nil) {
		[tfictionOverlayChapterPanelView setHidden:!(visible && tfictionOverlayChapterPanelVisible)];
	}
	if (tfictionOverlayResizeHandleView != nil) {
		[tfictionOverlayResizeHandleView setHidden:!visible];
		[tfictionOverlayResizeHandleView setNeedsDisplay:YES];
	}
	if (tfictionOverlayRootView != nil) {
		[tfictionOverlayRootView setNeedsDisplay:YES];
	}
}

static void TFictionSetOverlayControlsVisible(BOOL visible) {
	TFictionSetOverlayChromeVisible(visible);
}

static void TFictionSetOverlayFooterVisible(BOOL visible) {
	TFictionSetOverlayChromeVisible(visible);
}

static BOOL TFictionShouldRevealOverlayUIAtPoint(NSPoint point, NSRect bounds) {
	if (NSIsEmptyRect(bounds) || !NSPointInRect(point, bounds)) {
		return NO;
	}

	if (tfictionOverlayChapterPanelVisible && tfictionOverlayChapterPanelView != nil &&
	    NSPointInRect(point, tfictionOverlayChapterPanelView.frame)) {
		return YES;
	}

	NSRect innerBounds = NSMakeRect(
		TFictionOverlayChromeRevealDistance,
		TFictionOverlayBottomRevealHeight,
		MAX(0.0, NSWidth(bounds) - (TFictionOverlayChromeRevealDistance * 2.0)),
		MAX(0.0, NSHeight(bounds) - TFictionOverlayTopRevealHeight - TFictionOverlayBottomRevealHeight)
	);
	if (NSWidth(innerBounds) <= 0.0 || NSHeight(innerBounds) <= 0.0) {
		return YES;
	}

	return !NSPointInRect(point, innerBounds);
}

static void TFictionUpdateOverlayHoverStateAtPoint(NSPoint point) {
	if (tfictionOverlayRootView == nil) {
		return;
	}

	NSRect bounds = tfictionOverlayRootView.bounds;
	TFictionSetOverlayChromeVisible(TFictionShouldRevealOverlayUIAtPoint(point, bounds));
}

static void TFictionUpdateOverlayHoverStateForCurrentMouseLocation(NSWindow *window) {
	if (window == nil || tfictionOverlayRootView == nil) {
		TFictionSetOverlayChromeVisible(NO);
		return;
	}

	NSPoint point = [tfictionOverlayRootView convertPoint:[window mouseLocationOutsideOfEventStream] fromView:nil];
	TFictionUpdateOverlayHoverStateAtPoint(point);
}

static void TFictionHandleOverlayMouseTracking(NSView *view, NSEvent *event) {
	if (view == nil || event == nil || tfictionOverlayRootView == nil) {
		return;
	}

	NSPoint point = [tfictionOverlayRootView convertPoint:event.locationInWindow fromView:nil];
	TFictionUpdateOverlayHoverStateAtPoint(point);
}

static void TFictionPerformOverlayWindowDrag(NSWindow *window, NSEvent *event) {
	if (window == nil || event == nil || event.type != NSEventTypeLeftMouseDown) {
		return;
	}

	TFictionSetOverlayChromeVisible(YES);
	[window performWindowDragWithEvent:event];
}

// 透明浮窗仍保留一层轻量拖拽框，方便用户在极低可见度下找到并调整大小。
static void TFictionLayoutDesktopReaderOverlayViews(void) {
	if (tfictionOverlayRootView == nil || tfictionOverlayScrollView == nil || tfictionOverlayHeaderView == nil ||
	    tfictionOverlayResizeHandleView == nil || tfictionOverlayControlsView == nil ||
	    tfictionOverlayFooterView == nil) {
		return;
	}

	NSRect bounds = tfictionOverlayRootView.bounds;
	[tfictionOverlayHeaderView setFrame:NSMakeRect(
		12.0,
		NSHeight(bounds) - TFictionOverlayHeaderHeight - TFictionOverlayHeaderTopInset,
		MAX(80.0, NSWidth(bounds) - 24.0),
		TFictionOverlayHeaderHeight
	)];
	CGFloat controlsY = NSHeight(bounds) - TFictionOverlayHeaderHeight - TFictionOverlayHeaderTopInset - TFictionOverlayControlsHeight - 6.0;
	[tfictionOverlayControlsView setFrame:NSMakeRect(
		12.0,
		controlsY,
		MAX(160.0, NSWidth(bounds) - 24.0),
		TFictionOverlayControlsHeight
	)];
	[tfictionOverlayFooterView setFrame:NSMakeRect(
		12.0,
		12.0,
		MAX(160.0, NSWidth(bounds) - 24.0),
		TFictionOverlayFooterHeight
	)];
	[tfictionOverlayResizeHandleView setFrame:NSMakeRect(
		NSWidth(bounds) - TFictionOverlayResizeHandleSize - 8.0,
		6.0,
		TFictionOverlayResizeHandleSize,
		TFictionOverlayResizeHandleSize
	)];

	CGFloat controlsWidth = NSWidth(tfictionOverlayControlsView.bounds);
	CGFloat buttonWidth = 54.0;
	CGFloat closeWidth = 54.0;
	CGFloat opacityLabelWidth = 58.0;
	CGFloat fixedWidth = (buttonWidth * 3.0) + closeWidth + opacityLabelWidth + (TFictionOverlayControlsGap * 5.0) + 20.0;
	CGFloat opacitySliderWidth = MAX(140.0, controlsWidth - fixedWidth);
	CGFloat currentX = 10.0;
	CGFloat currentY = 6.0;
	CGFloat controlHeight = TFictionOverlayControlsHeight - 12.0;

	[tfictionOverlayPrevButton setFrame:NSMakeRect(currentX, currentY, buttonWidth, controlHeight)];
	currentX += buttonWidth + TFictionOverlayControlsGap;
	[tfictionOverlayNextButton setFrame:NSMakeRect(currentX, currentY, buttonWidth, controlHeight)];
	currentX += buttonWidth + TFictionOverlayControlsGap;
	[tfictionOverlayDirectoryButton setFrame:NSMakeRect(currentX, currentY, buttonWidth, controlHeight)];
	currentX += buttonWidth + TFictionOverlayControlsGap;
	[tfictionOverlayCloseButton setFrame:NSMakeRect(currentX, currentY, closeWidth, controlHeight)];
	currentX += closeWidth + TFictionOverlayControlsGap;

	[tfictionOverlayOpacityLabel setFrame:NSMakeRect(currentX, currentY + 8.0, opacityLabelWidth, 16.0)];
	currentX += opacityLabelWidth + TFictionOverlayControlsGap;
	[tfictionOverlayOpacitySlider setFrame:NSMakeRect(currentX, currentY + 2.0, opacitySliderWidth, controlHeight)];

	CGFloat footerWidth = NSWidth(tfictionOverlayFooterView.bounds);
	CGFloat footerHeight = NSHeight(tfictionOverlayFooterView.bounds);
	CGFloat progressLabelWidth = 92.0;
	[tfictionOverlayProgressLabel setFrame:NSMakeRect(10.0, floor((footerHeight - 16.0) / 2.0), progressLabelWidth, 16.0)];
	[tfictionOverlayProgressTrackView setFrame:NSMakeRect(
		progressLabelWidth + 16.0,
		floor((footerHeight - 8.0) / 2.0),
		MAX(80.0, footerWidth - progressLabelWidth - 28.0),
		8.0
	)];
	TFictionRefreshOverlayProgressBar();

	NSRect scrollFrame = NSInsetRect(bounds, TFictionOverlayContentInset, TFictionOverlayContentInset);
	scrollFrame.origin.y += TFictionOverlayFooterHeight + 14.0;
	scrollFrame.size.height -= (TFictionOverlayHeaderHeight +
		TFictionOverlayHeaderTopInset +
		TFictionOverlayControlsHeight +
		TFictionOverlayFooterHeight +
		24.0);
	[tfictionOverlayScrollView setFrame:scrollFrame];

	TFictionOverlayTextView *textView = (TFictionOverlayTextView *)[tfictionOverlayScrollView documentView];
	if (textView != nil) {
		[textView setFrame:NSMakeRect(0, 0, scrollFrame.size.width, scrollFrame.size.height)];
		[textView.textContainer setContainerSize:NSMakeSize(scrollFrame.size.width, CGFLOAT_MAX)];
	}

	if (tfictionOverlayChapterPanelView != nil && tfictionOverlayChapterListScrollView != nil && tfictionOverlayChapterListContentView != nil) {
		CGFloat chapterPanelWidth = MIN(TFictionOverlayChapterPanelWidth, MAX(180.0, NSWidth(bounds) - 24.0));
		CGFloat chapterPanelHeight = MIN(320.0, MAX(120.0, scrollFrame.size.height - 12.0));
		[tfictionOverlayChapterPanelView setFrame:NSMakeRect(
			12.0,
			MAX(scrollFrame.origin.y + scrollFrame.size.height - chapterPanelHeight, scrollFrame.origin.y),
			chapterPanelWidth,
			chapterPanelHeight
		)];
		[tfictionOverlayChapterListScrollView setFrame:NSInsetRect(tfictionOverlayChapterPanelView.bounds, 8.0, 8.0)];

		CGFloat contentWidth = NSWidth(tfictionOverlayChapterListScrollView.bounds);
		CGFloat currentButtonY = 8.0;
		for (NSButton *button in tfictionOverlayChapterButtons) {
			[button setFrame:NSMakeRect(
				8.0,
				currentButtonY,
				MAX(60.0, contentWidth - 16.0),
				TFictionOverlayChapterRowHeight
			)];
			currentButtonY += TFictionOverlayChapterRowHeight + TFictionOverlayChapterRowGap;
		}
		[tfictionOverlayChapterListContentView setFrame:NSMakeRect(
			0,
			0,
			contentWidth,
			MAX(NSHeight(tfictionOverlayChapterListScrollView.bounds), currentButtonY)
		)];
	}

	TFictionApplyOverlayChapterButtonStyles();
	[tfictionOverlayRootView setNeedsDisplay:YES];
}

static void TFictionEnsureDesktopReaderOverlayWindow(void) {
	if (tfictionOverlayWindow != nil) {
		return;
	}

	NSRect frame = TFictionPreferredDesktopReaderOverlayFrame();
	NSUInteger styleMask = NSWindowStyleMaskBorderless |
		NSWindowStyleMaskResizable |
		NSWindowStyleMaskNonactivatingPanel;

	tfictionOverlayWindow = [[TFictionOverlayPanel alloc] initWithContentRect:frame
	                                                  styleMask:styleMask
	                                                    backing:NSBackingStoreBuffered
	                                                      defer:NO];
	[tfictionOverlayWindow setReleasedWhenClosed:NO];
	[tfictionOverlayWindow setOpaque:NO];
	[tfictionOverlayWindow setBackgroundColor:[NSColor clearColor]];
	[tfictionOverlayWindow setHasShadow:NO];
	[tfictionOverlayWindow setMovableByWindowBackground:YES];
	[tfictionOverlayWindow setFloatingPanel:YES];
	[tfictionOverlayWindow setIgnoresMouseEvents:NO];
	[tfictionOverlayWindow setLevel:NSFloatingWindowLevel];
	[tfictionOverlayWindow setHidesOnDeactivate:NO];
	[tfictionOverlayWindow setAcceptsMouseMovedEvents:YES];
	[tfictionOverlayWindow setCollectionBehavior:
	  NSWindowCollectionBehaviorCanJoinAllSpaces |
	  NSWindowCollectionBehaviorFullScreenAuxiliary];
	[tfictionOverlayWindow setTitleVisibility:NSWindowTitleHidden];
	[tfictionOverlayWindow setTitlebarAppearsTransparent:YES];
	[tfictionOverlayWindow setMinSize:NSMakeSize(TFictionOverlayMinWidth, TFictionOverlayMinHeight)];
	[tfictionOverlayWindow setAnimationBehavior:NSWindowAnimationBehaviorNone];

	tfictionOverlayRootView = [[TFictionOverlayRootView alloc] initWithFrame:NSMakeRect(0, 0, frame.size.width, frame.size.height)];
	[tfictionOverlayRootView setWantsLayer:YES];
	tfictionOverlayRootView.layer.backgroundColor = [NSColor clearColor].CGColor;
	[tfictionOverlayWindow setContentView:tfictionOverlayRootView];

	tfictionOverlayHeaderView = [[TFictionOverlayHeaderView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayHeaderView setAutoresizingMask:NSViewWidthSizable | NSViewMinYMargin];
	[tfictionOverlayRootView addSubview:tfictionOverlayHeaderView];

	if (tfictionOverlayControlTarget == nil) {
		tfictionOverlayControlTarget = [[TFictionOverlayControlTarget alloc] init];
	}

	tfictionOverlayControlsView = [[NSView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayControlsView setWantsLayer:YES];
	tfictionOverlayControlsView.layer.cornerRadius = 14.0;
	tfictionOverlayControlsView.layer.borderWidth = 1.0;
	tfictionOverlayControlsView.layer.borderColor = [[NSColor whiteColor] colorWithAlphaComponent:0.16].CGColor;
	tfictionOverlayControlsView.layer.backgroundColor = [[NSColor blackColor] colorWithAlphaComponent:0.18].CGColor;
	[tfictionOverlayControlsView setHidden:YES];
	[tfictionOverlayRootView addSubview:tfictionOverlayControlsView];

	tfictionOverlayFooterView = [[NSView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayFooterView setWantsLayer:YES];
	tfictionOverlayFooterView.layer.cornerRadius = 12.0;
	tfictionOverlayFooterView.layer.borderWidth = 1.0;
	tfictionOverlayFooterView.layer.borderColor = [[NSColor whiteColor] colorWithAlphaComponent:0.12].CGColor;
	tfictionOverlayFooterView.layer.backgroundColor = [[NSColor blackColor] colorWithAlphaComponent:0.24].CGColor;
	[tfictionOverlayFooterView setHidden:YES];
	[tfictionOverlayRootView addSubview:tfictionOverlayFooterView];

	tfictionOverlayPrevButton = TFictionCreateOverlayActionButton(@"上章", @selector(handlePrevChapter:));
	tfictionOverlayNextButton = TFictionCreateOverlayActionButton(@"下章", @selector(handleNextChapter:));
	tfictionOverlayDirectoryButton = TFictionCreateOverlayActionButton(@"目录", @selector(handleToggleDirectory:));
	tfictionOverlayCloseButton = TFictionCreateOverlayActionButton(@"退出", @selector(handleCloseOverlay:));
	tfictionOverlayProgressLabel = TFictionCreateOverlayLabel(@"总进度 0.0%");
	tfictionOverlayOpacityLabel = TFictionCreateOverlayLabel(@"透明 0.30");
	tfictionOverlayProgressTrackView = [[NSView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayProgressTrackView setWantsLayer:YES];
	tfictionOverlayProgressTrackView.layer.cornerRadius = 4.0;
	tfictionOverlayProgressTrackView.layer.masksToBounds = YES;
	tfictionOverlayProgressTrackView.layer.backgroundColor = [[NSColor whiteColor] colorWithAlphaComponent:0.14].CGColor;

	tfictionOverlayProgressFillView = [[NSView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayProgressFillView setWantsLayer:YES];
	tfictionOverlayProgressFillView.layer.cornerRadius = 4.0;
	tfictionOverlayProgressFillView.layer.masksToBounds = YES;
	tfictionOverlayProgressFillView.layer.backgroundColor = [[NSColor whiteColor] colorWithAlphaComponent:0.92].CGColor;
	[tfictionOverlayProgressTrackView addSubview:tfictionOverlayProgressFillView];

	tfictionOverlayOpacitySlider = [[NSSlider alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayOpacitySlider setMinValue:0.02];
	[tfictionOverlayOpacitySlider setMaxValue:1.0];
	[tfictionOverlayOpacitySlider setTarget:tfictionOverlayControlTarget];
	[tfictionOverlayOpacitySlider setAction:@selector(handleOpacityChanged:)];

	[tfictionOverlayControlsView addSubview:tfictionOverlayPrevButton];
	[tfictionOverlayControlsView addSubview:tfictionOverlayNextButton];
	[tfictionOverlayControlsView addSubview:tfictionOverlayDirectoryButton];
	[tfictionOverlayControlsView addSubview:tfictionOverlayCloseButton];
	[tfictionOverlayControlsView addSubview:tfictionOverlayOpacityLabel];
	[tfictionOverlayControlsView addSubview:tfictionOverlayOpacitySlider];
	[tfictionOverlayFooterView addSubview:tfictionOverlayProgressLabel];
	[tfictionOverlayFooterView addSubview:tfictionOverlayProgressTrackView];

	tfictionOverlayChapterPanelView = [[NSView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayChapterPanelView setWantsLayer:YES];
	tfictionOverlayChapterPanelView.layer.cornerRadius = 14.0;
	tfictionOverlayChapterPanelView.layer.borderWidth = 1.0;
	tfictionOverlayChapterPanelView.layer.borderColor = [[NSColor whiteColor] colorWithAlphaComponent:0.26].CGColor;
	tfictionOverlayChapterPanelView.layer.backgroundColor = [NSColor colorWithCalibratedWhite:0.08 alpha:0.96].CGColor;
	[tfictionOverlayChapterPanelView setHidden:YES];
	[tfictionOverlayRootView addSubview:tfictionOverlayChapterPanelView];

	tfictionOverlayChapterListScrollView = [[NSScrollView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayChapterListScrollView setDrawsBackground:NO];
	[tfictionOverlayChapterListScrollView setBorderType:NSNoBorder];
	[tfictionOverlayChapterListScrollView setHasVerticalScroller:YES];
	[tfictionOverlayChapterListScrollView setHasHorizontalScroller:NO];
	[tfictionOverlayChapterListScrollView setScrollerStyle:NSScrollerStyleOverlay];
	[tfictionOverlayChapterPanelView addSubview:tfictionOverlayChapterListScrollView];

	tfictionOverlayChapterListContentView = [[NSView alloc] initWithFrame:NSZeroRect];
	[tfictionOverlayChapterListContentView setWantsLayer:YES];
	tfictionOverlayChapterListContentView.layer.backgroundColor = [NSColor clearColor].CGColor;
	[tfictionOverlayChapterListScrollView setDocumentView:tfictionOverlayChapterListContentView];

	tfictionOverlayScrollView = [[TFictionOverlayScrollView alloc] initWithFrame:NSZeroRect];
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

	tfictionOverlayChapterTitles = @[];
	tfictionOverlayChapterButtons = [[NSMutableArray alloc] init];
	tfictionOverlayActionQueue = [[NSMutableArray alloc] init];
	tfictionOverlayControlsVisible = NO;
	tfictionOverlayFooterVisible = NO;
	TFictionRefreshOverlayControls();
	TFictionSetOverlayChromeVisible(NO);
	TFictionLayoutDesktopReaderOverlayViews();
}

static NSArray<NSString *> *TFictionParseOverlayChapterTitles(const char *chaptersJSON) {
	if (chaptersJSON == NULL) {
		return @[];
	}

	NSString *jsonString = [NSString stringWithUTF8String:chaptersJSON];
	if (jsonString == nil || jsonString.length == 0) {
		return @[];
	}

	NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
	if (data == nil) {
		return @[];
	}

	id parsed = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
	if (![parsed isKindOfClass:[NSArray class]]) {
		return @[];
	}

	NSMutableArray<NSString *> *titles = [NSMutableArray array];
	for (id item in (NSArray *)parsed) {
		if ([item isKindOfClass:[NSString class]]) {
			[titles addObject:item];
			continue;
		}

		if (item != nil) {
			[titles addObject:[item description]];
		}
	}

	return [titles copy];
}

static void TFictionUpdateDesktopReaderOverlayControls(const char *chaptersJSON, int currentChapter, double progress, double opacity) {
	dispatch_async(dispatch_get_main_queue(), ^{
		TFictionEnsureDesktopReaderOverlayWindow();

		NSArray<NSString *> *nextTitles = TFictionParseOverlayChapterTitles(chaptersJSON);
		if (![tfictionOverlayChapterTitles isEqualToArray:nextTitles]) {
			tfictionOverlayChapterTitles = nextTitles;
			TFictionRefreshOverlayChapterButtons();
		}

		tfictionOverlayCurrentChapterIndex = currentChapter;
		tfictionOverlayCurrentProgress = progress;
		tfictionOverlayCurrentOpacity = opacity;
		TFictionRefreshOverlayControls();
		TFictionLayoutDesktopReaderOverlayViews();
	});
}

static char *TFictionConsumeDesktopReaderOverlayActions(void) {
	__block char *jsonCString = NULL;

	TFictionPerformSyncOnMainQueue(^{
		if (tfictionOverlayActionQueue == nil || tfictionOverlayActionQueue.count == 0) {
			return;
		}

		NSData *jsonData = [NSJSONSerialization dataWithJSONObject:tfictionOverlayActionQueue options:0 error:nil];
		[tfictionOverlayActionQueue removeAllObjects];
		if (jsonData == nil || jsonData.length == 0) {
			return;
		}

		NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
		if (jsonString == nil || jsonString.length == 0) {
			return;
		}

		jsonCString = strdup(jsonString.UTF8String);
	});

	return jsonCString;
}

static void TFictionApplyDesktopReaderOverlayOpacity(double opacity) {
	TFictionEnsureDesktopReaderOverlayWindow();
	tfictionOverlayCurrentOpacity = MAX(0.02, MIN(opacity, 1.0));

	TFictionOverlayTextView *textView = (TFictionOverlayTextView *)[tfictionOverlayScrollView documentView];
	if (textView == nil || [textView textStorage] == nil) {
		TFictionRefreshOverlayControls();
		return;
	}

	NSTextStorage *textStorage = [textView textStorage];
	NSRange fullRange = NSMakeRange(0, textStorage.length);
	if (fullRange.length > 0) {
		[textStorage beginEditing];
		[textStorage addAttribute:NSForegroundColorAttributeName
		                    value:TFictionOverlayColor(
		                    	tfictionOverlayCurrentRed,
		                    	tfictionOverlayCurrentGreen,
		                    	tfictionOverlayCurrentBlue,
		                    	tfictionOverlayCurrentOpacity
		                    )
		                    range:fullRange];
		[textStorage endEditing];
	}

	TFictionRefreshOverlayControls();
}

static void TFictionApplyDesktopReaderOverlayContent(const char *text, int fontSize, double lineHeight, double opacity, int red, int green, int blue) {
	TFictionEnsureDesktopReaderOverlayWindow();

	NSString *string = text != NULL ? [NSString stringWithUTF8String:text] : nil;
	if (string == nil) {
		string = @"";
	}
	BOOL shouldPreserveScroll = tfictionOverlayVisible && [tfictionOverlayCurrentText isEqualToString:string];
	NSPoint preservedScrollOrigin = NSZeroPoint;
	if (shouldPreserveScroll && tfictionOverlayScrollView != nil) {
		preservedScrollOrigin = tfictionOverlayScrollView.contentView.bounds.origin;
	}

	tfictionOverlayCurrentText = string ?: @"";
	tfictionOverlayCurrentFontSize = fontSize;
	tfictionOverlayCurrentLineHeight = lineHeight;
	tfictionOverlayCurrentOpacity = opacity;
	tfictionOverlayCurrentRed = red;
	tfictionOverlayCurrentGreen = green;
	tfictionOverlayCurrentBlue = blue;

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
	if (shouldPreserveScroll && tfictionOverlayScrollView != nil) {
		[tfictionOverlayScrollView.contentView scrollToPoint:preservedScrollOrigin];
		[tfictionOverlayScrollView reflectScrolledClipView:tfictionOverlayScrollView.contentView];
	} else {
		[textView scrollRangeToVisible:NSMakeRange(0, 0)];
	}
	TFictionRefreshOverlayControls();
}

static void TFictionShowDesktopReaderOverlayWindow(const char *text, int fontSize, double lineHeight, double opacity, int red, int green, int blue) {
	dispatch_async(dispatch_get_main_queue(), ^{
		tfictionMainAppWindow = TFictionResolveMainAppWindow();
		[tfictionOverlayActionQueue removeAllObjects];
		TFictionSetOverlayChapterPanelVisible(NO);
		TFictionApplyDesktopReaderOverlayContent(text, fontSize, lineHeight, opacity, red, green, blue);
		[tfictionOverlayWindow setFrame:TFictionPreferredDesktopReaderOverlayFrame() display:YES animate:NO];
		TFictionLayoutDesktopReaderOverlayViews();

		if (tfictionMainAppWindow != nil) {
			[tfictionMainAppWindow orderOut:nil];
		}

		tfictionOverlayVisible = YES;
		TFictionSetOverlayChromeVisible(NO);
		TFictionSetOverlayControlsVisible(NO);
		TFictionSetOverlayFooterVisible(NO);
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

static void TFictionUpdateDesktopReaderOverlayOpacity(double opacity) {
	dispatch_async(dispatch_get_main_queue(), ^{
		if (!tfictionOverlayVisible) {
			return;
		}

		TFictionApplyDesktopReaderOverlayOpacity(opacity);
	});
}

static void TFictionHideDesktopReaderOverlayWindow(void) {
	dispatch_async(dispatch_get_main_queue(), ^{
		if (tfictionOverlayWindow != nil) {
			[tfictionOverlayWindow orderOut:nil];
		}

		tfictionOverlayVisible = NO;
		TFictionSetOverlayChapterPanelVisible(NO);
		TFictionSetOverlayChromeVisible(NO);
		TFictionSetOverlayControlsVisible(NO);
		TFictionSetOverlayFooterVisible(NO);

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

func updateDesktopReaderOverlayOpacity(opacity float64) {
	C.TFictionUpdateDesktopReaderOverlayOpacity(C.double(opacity))
}

func updateDesktopReaderOverlayControls(chaptersJSON string, currentChapter int, progress, opacity float64) {
	cChaptersJSON := C.CString(chaptersJSON)
	defer C.free(unsafe.Pointer(cChaptersJSON))

	C.TFictionUpdateDesktopReaderOverlayControls(
		cChaptersJSON,
		C.int(currentChapter),
		C.double(progress),
		C.double(opacity),
	)
}

func hideDesktopReaderOverlay() {
	C.TFictionHideDesktopReaderOverlayWindow()
}

func isDesktopReaderOverlayVisible() bool {
	return bool(C.TFictionIsDesktopReaderOverlayVisible())
}

func consumeDesktopReaderOverlayActions() string {
	cActions := C.TFictionConsumeDesktopReaderOverlayActions()
	if cActions == nil {
		return ""
	}
	defer C.free(unsafe.Pointer(cActions))

	return C.GoString(cActions)
}
