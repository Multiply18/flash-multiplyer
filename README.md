# Flash Multiplyer

**Play genuine Adobe Flash Player 34 content in Microsoft Edge and other Chromium browsers.**
Not a Ruffle emulator — this loads the real native Flash plugin, which gives the best compatibility with older Flash sites and games.

The project is a set of three cooperating pieces: a **WebExtension**, a **Rust native-messaging host**, and a **patched Adobe Flash Player 34** plugin.

---

## Features

- 🎮 **Real Flash runtime** — loads `pepflashplayer64.dll` (Flash 34.0.0.376) instead of re-implementing ActionScript, so legacy games behave like they used to
- 🌏 **Bilingual UI** — English / 中文 switch in the popup, defaults to Chinese, choice is persisted
- 🈶 **CJK-safe font rendering** — the default font was Arial (no CJK glyphs, everything rendered as `□`); it is now Microsoft YaHei
- 🔠 **Tuned font scale** — `FONT_SCALE = 1.22` in the host makes in-game text slightly larger and easier to read
- 🧩 **Complete replacement pipeline** — injects a MAIN-world script at `document_start`, takes over `swfobject.embedSWF` and `<object>` / `<embed>`, and freezes the shim so page scripts cannot overwrite it
- 🌐 **Network and cookie pass-through** — same-origin requests use the browser with `credentials: 'include'`; cross-origin falls back to the native host, so logins survive
- 🔒 **Sandboxing** — HTTP(s) and TCP/UDP allow/deny lists, file access whitelist, geolocation / microphone / webcam switches
- 🧰 **One-click installer** — `安装.ps1` installs the host and plugin and registers the native messaging host for Edge, Chrome, Brave, Vivaldi and Opera

---

## Architecture

```
Web page (Flash content)
  │
  ├─ content.js        (ISOLATED world)   replaces embeds, talks to the host, relays network / clipboard / cookies
  ├─ page-script.js    (MAIN world)       freezes the swfobject shim, takes over embedSWF
  │
  ├─ background.js     service worker     nativeMessaging port, cookies permission
  │
  └──► flash-player-host.exe              Rust native-messaging host (PPAPI host, rendering, audio, network)
          └──► pepflashplayer64.dll       Adobe Flash Player 34 (real plugin)
```

---

## Install (end users)

1. Download **`Flash.Multiplyer.zip`** (full package: host + plugin) from [Releases](../../releases)
2. Extract it anywhere
3. Right-click `安装.ps1` → **Run with PowerShell**
   (if script execution is blocked:
   `powershell -NoProfile -ExecutionPolicy Bypass -File ".\安装.ps1"`)
4. Open Edge and go to `edge://extensions`
5. Enable **Developer mode** (bottom-left switch)
6. Click **Load unpacked** and select
   `C:\Users\<you>\AppData\Local\FlashMultiplyer\extension`
7. **Quit Edge completely** and start it again
8. Open any Flash site to verify

> The extension ID is fixed by the `key` in `manifest.json`:
> `dcikaadaeajidejkoekdflmfdgeoldcb`. It is already listed in the native host's
> `allowed_origins`, so no reconfiguration is needed on another machine.

Only need the extension itself (host and plugin already installed)? Use
`Flash-Multiplyer-extension-only.zip` instead.

---

## Build from source

### Requirements

- Windows 10/11 x64
- Rust stable (MSVC toolchain)
- Visual Studio Build Tools (MSVC v143 + Windows SDK)
- CMake and NASM (required by `aws-lc-sys`)

### Build the host

```powershell
cargo build --profile release-lto --package player-web
# output: target\release-lto\flash-player-host.exe
```

Place `pepflashplayer64.dll` in the **same directory** as the executable
(the host looks for `pepflashplayer*.dll` next to itself first), or point the
`FLASH_PLUGIN_PATH` environment variable at it.

### Extension

`web-extension/` is exactly the folder to select in “Load unpacked”.

---

## Repository layout

```
.
├─ crates/
│   ├─ ppapi-host/        PPAPI host, rendering, font rasterization, audio, network, sandboxing
│   ├─ player-core/       player core, plugin path resolution
│   ├─ player-web/        native-messaging host entry point (flash-player-host.exe)
│   └─ …
├─ web-extension/         Edge / Chromium extension (manifest v3)
├─ test/                  ActionScript test cases and local test pages
├─ ppapi-headers/         PPAPI header bindings
└─ Cargo.toml
```

---

## Differences from upstream

Based on [darktohka/clean-flash-browser-extension](https://github.com/darktohka/clean-flash-browser-extension) (MIT):

| Change | Description |
|---|---|
| CJK default font | `font_rasterizer.rs`: sans-serif Arial → Microsoft YaHei, serif → SimSun |
| Font scale | new `FONT_SCALE = 1.22`, applied to browser fonts and `DrawGlyphs` |
| Plugin path fallback | `resolve_plugin_path()` also scans the executable's own directory |
| Bilingual UI | new `web-extension/i18n.js`, Chinese by default, switchable at runtime |
| Branding | project renamed to Flash Multiplyer |

---

## Disclaimer

- Intended for **nostalgia / single-player Flash games** and similar legitimate uses.
- This repository does not ship Adobe Flash Player binaries. The plugin must be obtained separately and remains the property of Adobe and its licensors.
- Do not use it to sign in to important accounts or to handle sensitive data. Use at your own risk.

---

## License

[MIT](LICENSE) © 2026 Multiply

The upstream project is also MIT-licensed, and this derivative keeps the same license.

---
---

# 中文说明

**在 Microsoft Edge / Chromium 里用真正的 Adobe Flash Player 34 播放 Flash 内容。**
不是 Ruffle 模拟器，而是加载原生 Flash 插件——对老游戏和旧站点的兼容性最好。

整个项目由三部分组成：**WebExtension**、**Rust 原生消息宿主**、**打过补丁的 Adobe Flash Player 34 插件**。

## 特性

- 🎮 **真 Flash 内核**：加载 `pepflashplayer64.dll`（Flash 34.0.0.376），不是用 ActionScript 重写模拟
- 🌏 **中英双语界面**：弹窗右上角一键切换，默认中文，选择会保存
- 🈶 **中文字体修复**：默认字体原本是 Arial（没有中文字形，全渲染成 `□`），现改为微软雅黑
- 🔠 **字号调整**：宿主内 `FONT_SCALE = 1.22`，游戏内文字比默认略大，更易读
- 🧩 **完整替换链路**：在 `document_start` 注入 MAIN world 脚本，接管 `swfobject.embedSWF` 与 `<object>` / `<embed>`，并冻结 shim 防止被页面脚本覆盖
- 🌐 **网络与 Cookie 透传**：同源请求走浏览器 `credentials: 'include'`，跨域自动回退到原生宿主，登录态不丢
- 🔒 **沙箱能力**：HTTP(s) / TCP-UDP 黑白名单、文件白名单、地理位置 / 麦克风 / 摄像头开关
- 🧰 **一键安装**：`安装.ps1` 自动安装宿主与插件，并为 Edge、Chrome、Brave、Vivaldi、Opera 注册原生消息宿主

## 架构

```
网页 (Flash 内容)
  │
  ├─ content.js        (ISOLATED world)   替换标签、与宿主通信、转发网络/剪贴板/Cookie
  ├─ page-script.js    (MAIN world)       冻结 swfobject shim、接管 embedSWF
  │
  ├─ background.js     service worker     nativeMessaging 端口、cookies 权限
  │
  └──► flash-player-host.exe              Rust 原生消息宿主（PPAPI 宿主 + 渲染 + 音频 + 网络）
          └──► pepflashplayer64.dll       Adobe Flash Player 34（真插件）
```

## 安装（普通用户）

1. 到 [Releases](../../releases) 下载 **`Flash.Multiplyer.zip`**（完整版，含宿主与插件）
2. 解压到任意目录
3. 右键 `安装.ps1` → **使用 PowerShell 运行**
   （若被执行策略拦截：`powershell -NoProfile -ExecutionPolicy Bypass -File ".\安装.ps1"`）
4. 打开 Edge，进入 `edge://extensions`
5. 打开左下角 **开发人员模式**
6. 点 **加载解压缩的扩展**，选择
   `C:\Users\<你>\AppData\Local\FlashMultiplyer\extension`
7. **完全退出 Edge** 后重新打开
8. 打开任意 Flash 网站验证

> 扩展 ID 由 `manifest.json` 的 `key` 固定为
> `dcikaadaeajidejkoekdflmfdgeoldcb`，已写入原生宿主的 `allowed_origins`，
> 换电脑不需要改任何配置。只需要扩展本体时，请下载
> `Flash-Multiplyer-extension-only.zip`。

## 从源码构建

依赖：Windows 10/11 x64、Rust stable（MSVC 工具链）、Visual Studio Build Tools（MSVC v143 + Windows SDK）、CMake、NASM（`aws-lc-sys` 需要）。

```powershell
cargo build --profile release-lto --package player-web
# 产物：target\release-lto\flash-player-host.exe
```

把 `pepflashplayer64.dll` 放在 exe **同一目录**（宿主会优先在自身目录查找
`pepflashplayer*.dll`），或通过环境变量 `FLASH_PLUGIN_PATH` 指定。

`web-extension/` 即 Edge 里「加载解压缩的扩展」所要选择的目录。

## 与上游的差异

本项目基于 [darktohka/clean-flash-browser-extension](https://github.com/darktohka/clean-flash-browser-extension)（MIT）：

| 改动 | 说明 |
|---|---|
| 中文默认字体 | `font_rasterizer.rs`：sans-serif 由 Arial 改为 Microsoft YaHei，serif → SimSun |
| 字号缩放 | 新增 `FONT_SCALE = 1.22`，统一作用于浏览器字体与 `DrawGlyphs` |
| 插件路径回退 | `resolve_plugin_path()` 增加「exe 所在目录」扫描 |
| 中英文界面 | 新增 `web-extension/i18n.js`，默认中文、可运行时切换 |
| 品牌 | 全项目更名为 Flash Multiplyer |

## 免责声明

- 本项目仅供**怀旧 / 单机 Flash 游戏**等合法用途。
- 仓库不包含 Adobe Flash Player 二进制文件，插件需自行获取，其版权归 Adobe 及相应权利人所有。
- 请勿用于登录重要账号或处理敏感信息，使用风险自负。

## 许可证

[MIT](LICENSE) © 2026 Multiply（上游同为 MIT，本项目作为衍生作品保持相同许可证）。
