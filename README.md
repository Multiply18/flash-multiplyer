# Flash Multiplyer

> 在 Microsoft Edge / Chromium 里，用**真正的 Adobe Flash Player 34** 内核播放 Flash 内容。
> 不是 Ruffle 模拟器，是原生插件——兼容性最好。

**WebExtension + Rust 原生消息宿主 + 打过补丁的 Flash Player 34**，三件套组成一个完整可用的 Flash 运行环境。

---

## 特性

- 🎮 **真 Flash 内核**：加载 `pepflashplayer64.dll`（Flash 34.0.0.376），不是 AS 重写/模拟，老游戏兼容性最好
- 🌏 **中英双语界面**：弹窗右上角一键切换，默认中文，选择自动保存
- 🈶 **中文字体修复**：默认字体从 Arial 改为微软雅黑，不再出现方块 `□`
- 🔠 **字号可调**：宿主内置 `FONT_SCALE`（当前 1.22），比浏览器默认大一号，玩文字多的游戏更舒服
- 🧩 **完整替换链路**：在 `document_start` 注入 MAIN world 脚本，接管 `swfobject.embedSWF`、`<object>/<embed>`，并冻结 shim 防止被页面脚本覆盖
- 🌐 **网络与 Cookie 透传**：同源请求走浏览器 `credentials: 'include'`，跨域自动回退到原生宿主直连，登录态不丢
- 🔒 **沙箱能力**：HTTP(s) 黑白名单、TCP/UDP 黑白名单、文件访问白名单、地理位置/麦克风/摄像头开关
- 🧰 **一键安装脚本**：`安装.ps1` 自动安装宿主、插件、注册原生消息宿主（Edge/Chrome/Brave/Vivaldi/Opera）

---

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

---

## 安装（普通用户）

1. 到 [Releases](../../releases) 下载 **`Flash.Multiplyer.zip`**（完整版，含宿主与 Flash 插件）
2. 解压到任意目录
3. 右键 `安装.ps1` → **使用 PowerShell 运行**
   （若被策略拦截：`powershell -NoProfile -ExecutionPolicy Bypass -File ".\安装.ps1"`）
4. 打开 Edge → 地址栏输入 `edge://extensions`
5. 打开左下角 **开发人员模式**
6. 点 **加载解压缩的扩展**，选择
   `C:\Users\<你>\AppData\Local\FlashMultiplyer\extension`
7. **完全退出 Edge 再重新打开**
8. 打开任意 Flash 网站验证

> 扩展 ID 由 `manifest.json` 的 `key` 固定为 `dcikaadaeajidejkoekdflmfdgeoldcb`，
> 该 ID 已写入原生消息宿主的 `allowed_origins`，换电脑不用改配置。

详细图文说明见 Release 包内的「安装说明.md」。若只需要扩展本体（已装好宿主/插件），下载 `Flash-Multiplyer-extension-only.zip`。

---

## 从源码构建

### 依赖

- Windows 10/11 x64
- Rust stable（MSVC toolchain）
- Visual Studio Build Tools（MSVC v143 + Windows SDK）
- CMake、NASM（`aws-lc-sys` 需要）

### 构建宿主

```powershell
cargo build --profile release-lto --package player-web
# 产物：target\release-lto\flash-player-host.exe
```

把 `pepflashplayer64.dll` 放在 exe **同一目录**（宿主会优先在自身目录查找 `pepflashplayer*.dll`），
或通过环境变量 `FLASH_PLUGIN_PATH` 指定。

### 扩展

`web-extension/` 即 Edge 里「加载解压缩的扩展」所要选择的目录。

---

## 目录结构

```
.
├─ crates/
│   ├─ ppapi-host/        PPAPI 宿主、渲染、字体光栅化、音频、网络、沙箱
│   ├─ player-core/       播放器核心、插件路径解析
│   ├─ player-web/        原生消息宿主入口（flash-player-host.exe）
│   └─ …
├─ web-extension/         Edge 扩展（manifest v3）
├─ test/                  ActionScript 测试用例与本地测试页
├─ ppapi-headers/         PPAPI 头文件绑定
└─ Cargo.toml
```

---

## 与上游的差异

本项目基于 [darktohka/clean-flash-browser-extension](https://github.com/darktohka/clean-flash-browser-extension)（MIT），主要改动：

| 改动 | 说明 |
|---|---|
| 中文默认字体 | `font_rasterizer.rs`：sans-serif 由 Arial 改为 Microsoft YaHei，serif → SimSun |
| 字号缩放 | 新增 `FONT_SCALE = 1.22`，统一作用于浏览器字体与 `DrawGlyphs` |
| 插件路径回退 | `resolve_plugin_path()` 增加「exe 所在目录」扫描，不再依赖环境变量 |
| 中英文界面 | 新增 `web-extension/i18n.js`，默认中文、可运行时切换 |
| 品牌 | 全项目更名为 Flash Multiplyer |

---

## 免责声明

- 本项目仅供**怀旧 / 单机 Flash 游戏**等合法用途。
- 仓库不包含 Adobe Flash Player 二进制文件，插件需自行获取；其版权归 Adobe 及相应权利人所有。
- 请勿用于登录重要账号或处理敏感信息，使用风险自负。

---

## License

[MIT](LICENSE) © 2026 Multiply

上游项目同样以 MIT 发布，本项目作为其衍生作品保持相同许可证。
