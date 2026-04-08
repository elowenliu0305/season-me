## Why

Season Me 前端核心流程已完成，但缺少 SEO 基础、图片兼容性修复、离线能力、深色模式等关键体验细节。这些问题直接影响用户获取、留存和品牌完成度。需要补齐这些前端可独立完成的优化项，使产品达到可正式推广的状态。

## What Changes

- 修复测验图片大小写扩展名兼容性问题（IMG_0925.PNG）
- 添加 localStorage 容量监控与降级提示
- 添加 SEO 元数据（OG 图片、结构化数据、meta description）
- 添加 PWA 支持（manifest.json、service worker 离线缓存、Add to Home Screen）
- 实现深色模式（CSS 变量切换 + 用户偏好持久化）
- 添加深色模式切换入口（设置齿轮图标）
- 分享卡片 3:4 比例真机验证与修复
- 添加 Plausible 数据埋点（轻量隐私友好方案）

## Capabilities

### New Capabilities
- `image-compat`: 测验图片大小写扩展名兼容性修复
- `storage-monitor`: localStorage 容量监控与降级策略
- `seo-meta`: SEO 元数据（OG 标签、结构化数据、meta description）
- `pwa-offline`: PWA 支持（manifest + service worker + 离线缓存）
- `dark-mode`: 深色模式实现（CSS 变量 + 切换入口 + 偏好持久化）
- `share-card-fix`: 分享卡片比例验证与修复
- `analytics`: Plausible 数据埋点集成

### Modified Capabilities

## Impact

- **index.html**: 添加 SEO meta 标签、manifest link、结构化数据 JSON-LD
- **style.css**: 新增深色模式 CSS 变量集、切换按钮样式、media query 调整
- **app.js**: 新增 localStorage 监控、深色模式切换逻辑、PWA 注册、埋点事件
- **新增文件**: manifest.json、sw.js（service worker）、og-image.png
- **依赖**: 无新增外部依赖（Plausible 使用 script 标签，无需 npm）
