/**
 * UI language switching (English / 中文).
 *
 * Chrome's built-in chrome.i18n follows the browser UI language and cannot be
 * switched at runtime, so the settings popup keeps its English markup as the
 * source of truth and this script swaps text nodes / placeholder / tooltip
 * attributes against a dictionary.
 *
 * The choice is persisted in chrome.storage.local under "uiLanguage".
 */

"use strict";

const UI_LANG_KEY = "uiLanguage";
const LANG_TITLES = {
  en: "Flash Multiplyer Settings",
  zh: "Flash Multiplyer 设置",
};

const ZH = {
  // ---- tabs / header ----
  "General": "通用",
  "Sandboxing": "沙箱",
  "Advanced": "高级",
  "Changes will take effect on next page reload.": "更改将在下次刷新页面后生效。",

  // ---- Compatibility ----
  "Compatibility": "兼容性",
  "Controls how Flash Multiplyer coexists with the Ruffle emulator.":
    "控制 Flash Multiplyer 与 Ruffle 模拟器如何共存。",
  "Ruffle Compatibility": "Ruffle 兼容模式",
  "Prefer Ruffle": "优先 Ruffle",
  "Ruffle will override Flash Multiplyer content. Flash plugin spoofing and RufflePlayer shim are both disabled.":
    "Ruffle 接管 Flash 内容：同时关闭 Flash 插件伪装和 RufflePlayer shim。",
  "Prefer Flash Multiplyer": "优先 Flash Multiplyer",
  "Flash Multiplyer will override the Ruffle extension. Flash plugin is spoofed so Ruffle backs off, but page-bundled Ruffle can still activate.":
    "Flash Multiplyer 优先于 Ruffle 扩展：伪装 Flash 插件让 Ruffle 退让，但页面自带的 Ruffle 仍可能生效。",
  "Force Flash Multiplyer": "强制 Flash Multiplyer",
  "Flash Multiplyer will aggressively override Ruffle, even on websites that manually embed Ruffle.":
    "即使网站手动嵌入了 Ruffle，也强制使用 Flash Multiplyer。",

  // ---- Networking ----
  "Networking": "网络",
  "Prefer browser network requests": "优先使用浏览器发起请求",
  "The browser will make HTTP requests on behalf of Flash Multiplyer. This is the most secure option and allows for caching.":
    "由浏览器代替 Flash Multiplyer 发起 HTTP 请求。最安全，并且支持缓存。",
  "Fall back to native requests for CORS": "CORS 受阻时回退到原生请求",
  "When CORS blocks a request, the Flash Multiplyer native host will make the request instead. Disabled when browser network requests are not preferred.":
    "当 CORS 阻止请求时，改由原生宿主发起。未启用「优先使用浏览器请求」时此项无效。",
  "Disable crossdomain checks for HTTP requests": "关闭 HTTP 请求的跨域策略检查",
  "Flash checks for a crossdomain.xml file before making cross-origin HTTP requests. If it does not exist, HTTP requests are blocked. Disabling this check skips that behavior.":
    "Flash 在跨域 HTTP 请求前会检查 crossdomain.xml，文件不存在则请求被阻止。关闭后跳过这项检查。",
  "Disable crossdomain checks for TCP sockets": "关闭 TCP 套接字的跨域策略检查",
  "Flash checks for a crossdomain policy on port 843 before opening TCP/UDP socket connections. Disabling this check skips that behavior.":
    "Flash 在建立 TCP/UDP 套接字前会检查 843 端口的跨域策略。关闭后跳过这项检查。",

  // ---- Privacy ----
  "Privacy": "隐私",
  "Disable geolocation services": "禁用地理定位服务",
  "Blocks connections to geolocation servers. Prevents Flash from determining your location.":
    "阻止连接地理定位服务器，避免 Flash 判断你的位置。",
  "Spoof hardware ID": "伪装硬件 ID",
  "Provides a random hardware ID to Flash instead of the real machine identifier. The spoofed ID is regenerated on each page load.":
    "向 Flash 提供随机硬件 ID 代替真实机器标识，每次加载页面都会重新生成。",
  "Disable microphone input": "禁用麦克风",
  "Prevents Flash from accessing the microphone. Flash content will see no audio input devices available.":
    "阻止 Flash 访问麦克风，Flash 内容将看不到任何音频输入设备。",
  "Disable web camera input": "禁用摄像头",
  "Prevents Flash from accessing the webcam. Flash content will see no video capture devices available.":
    "阻止 Flash 访问摄像头，Flash 内容将看不到任何视频采集设备。",

  // ---- Graphics / Audio ----
  "Graphics": "图形",
  "Enable hardware acceleration": "启用硬件加速",
  "Uses OpenGL ES 2.0 hardware acceleration. Unstable and not supported on every computer. Your mileage may vary.":
    "使用 OpenGL ES 2.0 硬件加速。稳定性一般，并非所有电脑都支持。",
  "Audio": "音频",
  "Audio Backend": "音频后端",
  "Controls how audio is played. Browser uses the Web Audio API and provides tab-level audio control, while Native plays audio directly on the system.":
    "控制音频的播放方式：Browser 使用 Web Audio API，支持标签页级别的音量控制；Native 直接在系统上播放。",
  "Browser (Web Audio)": "浏览器（Web Audio）",
  "Native (cpal)": "原生（cpal）",

  // ---- HTTP sandboxing ----
  "HTTP(s) Sandboxing": "HTTP(s) 沙箱",
  "Mode": "模式",
  "Controls whether Flash HTTP(s) requests are filtered by a blacklist (block matching URLs) or whitelist (only allow matching URLs). Use * as a wildcard to match any sequence of characters.":
    "控制 Flash 的 HTTP(s) 请求走黑名单（阻止匹配的 URL）还是白名单（只允许匹配的 URL）。可用 * 作为通配符匹配任意字符。",
  "Blacklist": "黑名单",
  "Whitelist": "白名单",
  "Blacklisted URL Patterns": "黑名单 URL 规则",
  "URL patterns that Flash is not allowed to request. Use * as a wildcard.":
    "Flash 不允许请求的 URL 规则，可用 * 作为通配符。",
  "e.g. *://example.com/* or *://*.tracker.net/*": "例如 *://example.com/* 或 *://*.tracker.net/*",
  "Add": "添加",
  "Whitelisted URL Patterns": "白名单 URL 规则",
  "URL patterns that Flash is allowed to request. All non-matching URLs will be blocked. Use * as a wildcard.\n\nExamples:\n  *://example.com/* — allow all URLs on example.com\n  *://*.cdn.example.com/* — allow all CDN subdomains\n  https://*  — allow all HTTPS requests\n  *://*/game/* — allow any URL with '/game/' in the path":
    "Flash 允许请求的 URL 规则，不匹配的 URL 全部阻止。可用 * 作为通配符。\n\n示例：\n  *://example.com/* —— 允许 example.com 上的所有 URL\n  *://*.cdn.example.com/* —— 允许所有 CDN 子域名\n  https://*  —— 允许所有 HTTPS 请求\n  *://*/game/* —— 允许路径中含 '/game/' 的任意 URL",
  "e.g. *://example.com/* or https://*.cdn.net/*": "例如 *://example.com/* 或 https://*.cdn.net/*",

  // ---- TCP sandboxing ----
  "TCP/UDP Sandboxing": "TCP/UDP 沙箱",
  "Controls whether Flash TCP and UDP socket connections are filtered by a blacklist (block listed hosts) or whitelist (only allow listed hosts). In blacklist mode, all hosts are allowed except those in the list. In whitelist mode, only hosts in the list are allowed.":
    "控制 Flash 的 TCP/UDP 套接字连接走黑名单（阻止列表中的主机）还是白名单（只允许列表中的主机）。黑名单模式下除列表外全部允许；白名单模式下只允许列表中的主机。",
  "Blacklisted Hosts": "黑名单主机",
  "Hostnames or IP addresses that Flash is not allowed to open TCP/UDP socket connections to. One entry per line.":
    "Flash 不允许建立 TCP/UDP 连接的主机名或 IP，每行一个。",
  "e.g. example.com or 10.0.0.1": "例如 example.com 或 10.0.0.1",
  "Whitelisted Hosts": "白名单主机",
  "Hostnames or IP addresses that Flash is allowed to open TCP/UDP socket connections to. All other hosts will be blocked. One entry per line.":
    "Flash 允许建立 TCP/UDP 连接的主机名或 IP，其他主机全部阻止。每行一个。",

  // ---- File system ----
  "File System Access": "文件系统访问",
  "Allow access to whitelisted files and folders only": "仅允许访问白名单中的文件和文件夹",
  "When enabled, Flash can only access files and folders that appear in the whitelist below. Files chosen through the file picker dialog are automatically added. When disabled, Flash has unrestricted file access.":
    "启用后 Flash 只能访问下方白名单中的文件和文件夹；通过文件选择对话框选中的文件会自动加入。禁用时 Flash 可访问任意文件。",
  "Whitelisted Files": "白名单文件",
  "Individual files that Flash is allowed to access. Files chosen via the Flash file picker are automatically added here.":
    "允许 Flash 访问的单个文件，通过 Flash 文件选择器选中的文件会自动加入。",
  "e.g. /home/user/document.txt": "例如 C:\\Users\\Public\\document.txt",
  "Browse…": "浏览…",
  "Whitelisted Folders": "白名单文件夹",
  "Folders that Flash is allowed to access. All files under these folders (including subfolders) are permitted.":
    "允许 Flash 访问的文件夹，其中的所有文件（含子文件夹）都被允许。",
  "e.g. /home/user/documents": "例如 C:\\Users\\Public\\Documents",

  // ---- Advanced ----
  "URL Rewriting": "URL 重写",
  "Rewrite rules let you redirect Flash resource URLs using regular expressions. The source is a regex pattern and the target can use backreferences like $1, $2 to insert captured groups. For developers: it is also possible to set data-url-rewriter on the SWF embed to a JavaScript function name to have more control over URL rewriting.":
    "重写规则可以用正则表达式重定向 Flash 资源 URL：source 是正则，target 可用 $1、$2 这类反向引用插入捕获组。开发者还可以在 SWF embed 上设置 data-url-rewriter 为某个 JS 函数名，以便更灵活地控制重写。",
  "Redirect matching URLs to different targets using regular expressions.":
    "用正则表达式把匹配的 URL 重定向到其他地址。",
  "Source regex, e.g. ^https://old\\.example\\.com/(.*)":
    "源正则，例如 ^https://old\\.example\\.com/(.*)",
  "Target, e.g. https://new.example.com/$1": "目标，例如 https://new.example.com/$1",
  "URL Tester": "URL 测试",
  "Enter a URL to see what it would be rewritten to.": "输入一个 URL，查看它会被重写成什么。",
  "https://old.example.com/path/to/resource.swf": "https://old.example.com/path/to/resource.swf",

  // ---- dynamic strings from settings.js ----
  "No entries": "暂无条目",
  "No rewrite rules": "暂无重写规则",
  "No rules matched.": "没有匹配的规则。",
  "Browse for file": "选择文件",
  "Browse for folder": "选择文件夹",
};

let uiLang = "en";
const langOriginals = new WeakMap();      // text node -> original value
const langAttrOriginals = new WeakMap();  // element -> original attributes

/** Translate a string (used for text nodes and attributes). */
function zhize(value) {
  if (typeof value !== "string") return value;
  const key = value.trim();
  if (ZH[key] !== undefined) {
    return value.replace(key, ZH[key]);
  }
  // "#3 matched: <rule>" from the URL tester
  const m = key.match(/^(#\d+)( matched: )(.+)$/);
  if (m) {
    return value.replace(key, m[1] + " 匹配：" + m[3]);
  }
  return value;
}

function applyLangToTextNode(node) {
  if (!langOriginals.has(node)) {
    langOriginals.set(node, node.nodeValue);
  }
  const original = langOriginals.get(node);
  node.nodeValue = uiLang === "zh" ? zhize(original) : original;
}

function applyLangToElement(el) {
  let orig = langAttrOriginals.get(el);
  if (!orig) {
    orig = {
      placeholder: el.getAttribute("placeholder"),
      title: el.getAttribute("title"),
      tooltip: el.getAttribute("data-tooltip"),
    };
    langAttrOriginals.set(el, orig);
  }
  for (const [attr, key] of [["placeholder", "placeholder"], ["title", "title"], ["data-tooltip", "tooltip"]]) {
    const original = orig[key];
    if (original == null) continue;
    el.setAttribute(attr, uiLang === "zh" ? (ZH[original] !== undefined ? ZH[original] : original) : original);
  }
}

function applyLangToTree(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    applyLangToTextNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;

  applyLangToElement(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      applyLangToTextNode(node);
    } else {
      applyLangToElement(node);
    }
  }
}

function setUiLang(lang) {
  uiLang = lang === "zh" ? "zh" : "en";
  try {
    chrome.storage.local.set({ [UI_LANG_KEY]: uiLang });
  } catch (e) {
    /* storage may be unavailable in plain-web preview; ignore */
  }
  document.documentElement.lang = uiLang === "zh" ? "zh-CN" : "en";
  document.title = LANG_TITLES[uiLang];
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === uiLang);
  });
  applyLangToTree(document.body);
}

// Translate anything the settings script renders later (list items, URL tester…).
const langObserver = new MutationObserver((mutations) => {
  if (uiLang !== "zh") return;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        applyLangToTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        applyLangToTree(node);
      }
    }
  }
});
langObserver.observe(document.body, { childList: true, subtree: true });

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => setUiLang(btn.dataset.lang));
});

// Initial language precedence: ?lang= query override (useful for testing),
// then the stored choice, then Chinese as the default.
const langOverride = new URLSearchParams(location.search).get("lang");
if (langOverride === "zh" || langOverride === "en") {
  setUiLang(langOverride);
} else {
  try {
    chrome.storage.local.get(UI_LANG_KEY, (res) => {
      const stored = res && res[UI_LANG_KEY];
      setUiLang(stored === "en" ? "en" : "zh");
    });
  } catch (e) {
    setUiLang("zh");
  }
}
