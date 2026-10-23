#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

static NSString *const kBaseURL = @"https://chat.47-254-50-251.sslip.io";
static NSString *const kSavedKey = @"dsh.login.url";

@interface AppDelegate : UIResponder <UIApplicationDelegate>
@property (strong, nonatomic) UIWindow *window;
@end

@interface DSHChatController : UIViewController <WKNavigationDelegate, WKUIDelegate>
@property (strong, nonatomic) WKWebView *web;
@property (strong, nonatomic) UIView *gate;
@property (strong, nonatomic) UITextField *field;
@property (strong, nonatomic) UIActivityIndicatorView *spinner;
@end

@implementation DSHChatController

- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor colorWithRed:0.07 green:0.08 blue:0.10 alpha:1.0];

  WKWebViewConfiguration *cfg = [[WKWebViewConfiguration alloc] init];
  cfg.allowsInlineMediaPlayback = YES;
  cfg.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;
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

  NSString *saved = [[NSUserDefaults standardUserDefaults] stringForKey:kSavedKey];
  if (saved.length > 0) {
    [self openURLString:saved];
  } else {
    [self showGate];
  }
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
  if (self.gate.superview) {
    [UIView animateWithDuration:0.25 animations:^{
      self.gate.transform = CGAffineTransformMakeTranslation(0, -overlap * 0.45);
    }];
  }
}

- (void)keyboardWillHide:(NSNotification *)n {
  UIEdgeInsets inset = self.web.scrollView.contentInset;
  inset.bottom = 0;
  self.web.scrollView.contentInset = inset;
  self.web.scrollView.scrollIndicatorInsets = inset;
  if (self.gate.superview) {
    [UIView animateWithDuration:0.25 animations:^{ self.gate.transform = CGAffineTransformIdentity; }];
  }
}

- (void)showGate {
  UIView *gate = [[UIView alloc] initWithFrame:self.view.bounds];
  gate.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  gate.backgroundColor = [UIColor colorWithRed:0.07 green:0.08 blue:0.10 alpha:0.98];

  UILabel *title = [[UILabel alloc] init];
  title.text = @"DSH Chat";
  title.font = [UIFont systemFontOfSize:30 weight:UIFontWeightBold];
  title.textColor = [UIColor whiteColor];
  title.textAlignment = NSTextAlignmentCenter;

  UILabel *hint = [[UILabel alloc] init];
  hint.text = @"首次使用请粘贴登录链接（服务器生成，含一次性 token），或只填 token。";
  hint.numberOfLines = 0;
  hint.font = [UIFont systemFontOfSize:14];
  hint.textColor = [UIColor colorWithWhite:0.72 alpha:1.0];
  hint.textAlignment = NSTextAlignmentCenter;

  UITextField *field = [[UITextField alloc] init];
  field.placeholder = @"https://chat.47-254-50-251.sslip.io/?token=...";
  field.textColor = [UIColor whiteColor];
  field.tintColor = [UIColor whiteColor];
  field.backgroundColor = [UIColor colorWithWhite:1.0 alpha:0.08];
  field.layer.cornerRadius = 12;
  field.autocapitalizationType = UITextAutocapitalizationTypeNone;
  field.autocorrectionType = UITextAutocorrectionTypeNo;
  field.keyboardType = UIKeyboardTypeURL;
  field.returnKeyType = UIReturnKeyGo;
  field.clearButtonMode = UITextFieldViewModeWhileEditing;
  self.field = field;

  UIButton *go = [UIButton buttonWithType:UIButtonTypeSystem];
  [go setTitle:@"打开聊天" forState:UIControlStateNormal];
  [go setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
  go.titleLabel.font = [UIFont systemFontOfSize:17 weight:UIFontWeightSemibold];
  go.backgroundColor = [UIColor whiteColor];
  go.layer.cornerRadius = 12;
  [go addTarget:self action:@selector(commitGate) forControlEvents:UIControlEventTouchUpInside];

  UIButton *direct = [UIButton buttonWithType:UIButtonTypeSystem];
  [direct setTitle:@"已有登录状态，直接进入" forState:UIControlStateNormal];
  [direct setTitleColor:[UIColor colorWithWhite:0.85 alpha:1.0] forState:UIControlStateNormal];
  direct.titleLabel.font = [UIFont systemFontOfSize:14];
  [direct addTarget:self action:@selector(openBase) forControlEvents:UIControlEventTouchUpInside];

  NSArray *views = @[title, hint, field, go, direct];
  for (UIView *v in views) {
    v.translatesAutoresizingMaskIntoConstraints = NO;
    [gate addSubview:v];
  }

  UILayoutGuide *safe = gate.safeAreaLayoutGuide;
  [NSLayoutConstraint activateConstraints:@[
    [title.leadingAnchor constraintEqualToAnchor:safe.leadingAnchor constant:24],
    [title.trailingAnchor constraintEqualToAnchor:safe.trailingAnchor constant:-24],
    [title.topAnchor constraintEqualToAnchor:safe.topAnchor constant:120],
    [hint.leadingAnchor constraintEqualToAnchor:safe.leadingAnchor constant:24],
    [hint.trailingAnchor constraintEqualToAnchor:safe.trailingAnchor constant:-24],
    [hint.topAnchor constraintEqualToAnchor:title.bottomAnchor constant:14],
    [field.leadingAnchor constraintEqualToAnchor:safe.leadingAnchor constant:24],
    [field.trailingAnchor constraintEqualToAnchor:safe.trailingAnchor constant:-24],
    [field.topAnchor constraintEqualToAnchor:hint.bottomAnchor constant:28],
    [field.heightAnchor constraintEqualToConstant:48],
    [go.leadingAnchor constraintEqualToAnchor:safe.leadingAnchor constant:24],
    [go.trailingAnchor constraintEqualToAnchor:safe.trailingAnchor constant:-24],
    [go.topAnchor constraintEqualToAnchor:field.bottomAnchor constant:14],
    [go.heightAnchor constraintEqualToConstant:48],
    [direct.centerXAnchor constraintEqualToAnchor:safe.centerXAnchor],
    [direct.topAnchor constraintEqualToAnchor:go.bottomAnchor constant:18],
  ]];

  self.gate = gate;
  [self.view addSubview:gate];
  [field becomeFirstResponder];
}

- (void)commitGate {
  NSString *text = [self.field.text stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  if (text.length == 0) { return; }
  NSString *url;
  if ([text.lowercaseString hasPrefix:@"http://"] || [text.lowercaseString hasPrefix:@"https://"]) {
    url = text;
  } else {
    url = [NSString stringWithFormat:@"%@/?token=%@", kBaseURL, text];
  }
  [[NSUserDefaults standardUserDefaults] setObject:url forKey:kSavedKey];
  [[NSUserDefaults standardUserDefaults] synchronize];
  [self.gate removeFromSuperview];
  self.gate = nil;
  [self openURLString:url];
}

- (void)openBase {
  NSString *url = [NSString stringWithFormat:@"%@/", kBaseURL];
  [[NSUserDefaults standardUserDefaults] setObject:url forKey:kSavedKey];
  [[NSUserDefaults standardUserDefaults] synchronize];
  [self.gate removeFromSuperview];
  self.gate = nil;
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
  NSString *html = [NSString stringWithFormat:@"<meta name=viewport content='width=device-width,initial-scale=1'><body style='background:#12141a;color:#e8e8ea;font:16px -apple-system;padding:32px'><h3>无法连接</h3><p>%@</p><p style='color:#8a8f98'>请检查网络后再试。</p></body>", error.localizedDescription];
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
