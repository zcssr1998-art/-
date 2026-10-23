#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

// 服务器地址：登录门（密码页）在此域名下，App 只做一件事——把它装进 WebView。
static NSString *const kBaseURL = @"https://chat.47-254-50-251.sslip.io";

@interface AppDelegate : UIResponder <UIApplicationDelegate>
@property (strong, nonatomic) UIWindow *window;
@end

@interface DSHChatController : UIViewController <WKNavigationDelegate, WKUIDelegate>
@property (strong, nonatomic) WKWebView *web;
@property (strong, nonatomic) UIActivityIndicatorView *spinner;
@end

@implementation DSHChatController

- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor colorWithRed:0.07 green:0.08 blue:0.10 alpha:1.0];

  WKWebViewConfiguration *cfg = [[WKWebViewConfiguration alloc] init];
  cfg.allowsInlineMediaPlayback = YES;
  cfg.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;
  // 默认数据存储 = Cookie 落盘，登录一次后长期免登录。
  cfg.websiteDataStore = [WKWebsiteDataStore defaultDataStore];

  WKUserContentController *ucc = [[WKUserContentController alloc] init];
  WKUserScript *us = [[WKUserScript alloc] initWithSource:@"window.__dshNative = true;" injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO];
  [ucc addUserScript:us];
  cfg.userContentController = ucc;

  self.web = [[WKWebView alloc] initWithFrame:self.view.bounds configuration:cfg];
  self.web.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  self.web.navigationDelegate = self;
  self.web.UIDelegate = self;
  self.web.allowsBackForwardNavigationGestures = NO;
  self.web.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAutomatic;
  self.web.scrollView.keyboardDismissMode = UIScrollViewKeyboardDismissModeInteractive;
  [self.view addSubview:self.web];

  self.spinner = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleMedium];
  self.spinner.color = [UIColor whiteColor];
  self.spinner.hidesWhenStopped = YES;
  [self.view addSubview:self.spinner];

  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillChange:) name:UIKeyboardWillChangeFrameNotification object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];

  [self openBase];
}

- (void)viewWillLayoutSubviews {
  [super viewWillLayoutSubviews];
  self.web.frame = self.view.bounds;
  self.spinner.center = self.view.center;
}

- (UIStatusBarStyle)preferredStatusBarStyle {
  return UIStatusBarStyleLightContent;
}

- (void)keyboardWillChange:(NSNotification *)n {
  CGRect end = [n.userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  CGRect local = [self.view convertRect:end fromView:nil];
  CGFloat overlap = MAX(0, CGRectGetMaxY(self.view.bounds) - CGRectGetMinY(local));
  UIEdgeInsets inset = self.web.scrollView.contentInset;
  inset.bottom = overlap;
  self.web.scrollView.contentInset = inset;
  self.web.scrollView.scrollIndicatorInsets = inset;
}

- (void)keyboardWillHide:(NSNotification *)n {
  UIEdgeInsets inset = self.web.scrollView.contentInset;
  inset.bottom = 0;
  self.web.scrollView.contentInset = inset;
  self.web.scrollView.scrollIndicatorInsets = inset;
}

// 没有任何 token 输入界面：直接打开登录门。已登录过则 Cookie 命中直接进聊天。
- (void)openBase {
  NSString *url = [NSString stringWithFormat:@"%@/", kBaseURL];
  [self openURLString:url];
}

- (void)openURLString:(NSString *)s {
  NSURL *u = [NSURL URLWithString:s];
  if (!u) { return; }
  [self.spinner startAnimating];
  [self.web loadRequest:[NSURLRequest requestWithURL:u cachePolicy:NSURLRequestUseProtocolCachePolicy timeoutInterval:30]];
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
  [self.spinner stopAnimating];
}

- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation withError:(NSError *)error {
  [self.spinner stopAnimating];
  if (error.code == NSURLErrorCancelled) { return; }
  NSString *html = [NSString stringWithFormat:@"<meta name=viewport content='width=device-width,initial-scale=1'><body style='background:#12141a;color:#e8e8ea;font:16px -apple-system;padding:32px'><h3>无法连接</h3><p>%@</p><p style='color:#8a8f98'>请检查网络后再试；服务器恢复后重新打开本 App 即可。</p></body>", error.localizedDescription];
  [webView loadHTMLString:html baseURL:nil];
}

- (void)webView:(WKWebView *)webView requestMediaCapturePermissionForOrigin:(WKSecurityOrigin *)origin initiatedByFrame:(WKFrameInfo *)frame type:(WKMediaCaptureType)type decisionHandler:(void (^)(WKPermissionDecision))decisionHandler API_AVAILABLE(ios(15.0)) {
  decisionHandler(WKPermissionDecisionGrant);
}

- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(void))completionHandler {
  UIAlertController *a = [UIAlertController alertControllerWithTitle:nil message:message preferredStyle:UIAlertControllerStyleAlert];
  [a addAction:[UIAlertAction actionWithTitle:@"好" style:UIAlertActionStyleDefault handler:^(UIAlertAction *x){ completionHandler(); }]];
  [self presentViewController:a animated:YES completion:nil];
}

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)app didFinishLaunchingWithOptions:(NSDictionary *)opts {
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  self.window.rootViewController = [[DSHChatController alloc] init];
  [self.window makeKeyAndVisible];
  return YES;
}

@end

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
  }
}
