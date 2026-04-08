## Context

Season Me 是纯静态单页应用（HTML/CSS/JS），无框架，无构建工具，部署在 Vercel。当前已完成 7 页核心流程和 12 季相色彩引擎。项目依赖仅 html2canvas 1.4.1（CDN）和 Google Fonts。

## Goals / Non-Goals

**Goals:**
- 修复已知兼容性问题（图片扩展名、localStorage 容量）
- 补齐 SEO 基础设施（meta 标签、OG 图片、结构化数据）
- 实现 PWA 离线能力（manifest + service worker）
- 实现深色模式（保持杂志美学风格）
- 集成轻量级数据埋点

**Non-Goals:**
- 不引入构建工具（继续使用纯静态部署）
- 不添加后端 API 或用户系统
- 不添加管理后台
- 不添加多语言支持（中英双语仅限于已有内容）
- 不添加社交对比或电商功能

## Decisions

**1. 深色模式实现：CSS 变量 + `prefers-color-scheme` + 手动切换**
- 使用 `[data-theme="dark"]` 选择器覆盖 `:root` CSS 变量，与现有 ThemeManager 的季相变量共存
- 默认跟随系统 `prefers-color-scheme`，用户可手动切换并持久化到 localStorage
- 不使用 `color-scheme` meta 标签，因为部分页面（Cover、Darkroom、Sampling）已有自定义深色背景

**2. PWA Service Worker：Cache-First 策略**
- 使用简单的 cache-first 策略缓存静态资源（HTML、CSS、JS、图片、字体）
- App Shell：index.html + style.css + app.js 为核心缓存
- 图片按需缓存，设置 30 天过期
- 使用 `sw.js` 手写（无 Workbox），保持零依赖

**3. 数据埋点：Plausible script 标签**
- 使用 Plausible `<script defer>` 集成，无需 npm 依赖
- 追踪关键转化事件：开始测试、完成测试、生成分享卡、保存图片
- 延迟到 Vercel 部署后再配置域名

**4. SEO：纯 meta 标签 + JSON-LD**
- 添加 OG 标签（title、description、image）
- 添加 JSON-LD 结构化数据（WebApplication）
- OG 图片使用 CSS 绘制（或 placeholder），后续可替换为设计稿

**5. localStorage 监控：写入前检查 + 超限提示**
- 在 `smse.set` 和 `smse.setJSON` 中添加 `try/catch` 增强
- 在写入 base64 图片前预估大小，超过 4MB 时提醒用户
- 检测 `QuotaExceededError` 并显示 toast 提示

## Risks / Trade-offs

- **Service Worker 缓存过期** → 用户可能看到旧版本。缓解：sw.js 文件名加 hash，更新时修改 HTML 引用路径
- **深色模式与季相主题冲突** → 深色模式只影响 UI 框架色（bg、text、border），不影响季相配色（accent、palette）。缓解：深色模式变量仅覆盖通用变量，季相变量保持不变
- **html2canvas + 深色模式** → 分享卡片在深色模式下可能渲染异常。缓解：分享卡片强制使用季相主题色作为背景，不受深色模式影响
- **Plausible 阻断** → 广告拦截器可能屏蔽 Plausible。缓解：不依赖 Plausible 做任何功能逻辑
