# Season Me · See Myself 开发进度

> 最后更新：2026-04-09

---

## 当前状态：社区社交地图 + 深色模式修复 + 采样页UI优化 已上线

### 本次更新（2026-04-09）

**1. 社区社交地图功能**
- 新增 Page 8: Community Map（Leaflet.js 真实地理地图）
- 封面页 GET STARTED 上方新增 COMMUNITY MAP 入口按钮
- Export 页新增 SHARE TO COMMUNITY MAP 按钮（accent 色填充）
- Supabase 后端（项目: season-me-community, region: ap-southeast-1）
  - `community_posts` 表：卡片图、昵称、灵兽、季相、态度语、经纬度、点赞数
  - `community_likes` 表：UNIQUE(post_id, session_id) 防重复点赞
  - RLS 策略：posts/likes 公开读写
  - RPC 函数：`increment_likes` / `decrement_likes`（SECURITY DEFINER）
  - Storage bucket: `share-cards`（public, 2MB, png/jpeg）
- 匿名身份：localStorage session_id（crypto.randomUUID）
- 发布流程：分享卡片 PNG → `api/upload-card.js` 上传至 Supabase Storage → 插入 posts
- 浏览器定位：Geolocation API + Nominatim 反向地理编码
- 地图 marker：48px 圆形卡片缩略图，加载失败降级为灵兽 emoji
- 底部弹出面板：卡片图 + 季相 + 昵称 + 态度语 + 点赞按钮
- 深色模式重新生成分享卡片：`ensureShareCardPopulated()` + `generateShareImageForCommunity()`

**2. 采样页 UI 重构**
- 浅色玻璃态风格：呼吸渐变背景（#fffbff → #fdf9f2 → #e5e2e1）
- 毛玻璃卡片（backdrop-filter: blur(20px) + 半透明白底）
- 主按钮"实时拍摄"：深色 pill（border-radius: 2rem）
- 次按钮"从相册选择"：文字链接 + 图标
- 底部提示卡片（光线/角度建议）
- 底部隐私栏（lock 图标 + 隐私文案）
- 完整深色模式适配

**3. 深色模式全面修复**
- 根因：`ThemeManager.apply()` 用 inline style 设置 CSS 变量，优先级高于 `[data-theme="dark"]`
- 修复：apply() 内部检测 isDark，强制覆盖 `--base-bg` → `#0F0F0F`、`--text-main` → `#E8E8E8`、`--text-secondary` → `#9A9A9A`
- 深色/浅色切换时自动重新 apply 季相主题
- 初始化顺序：先 initDarkMode() 再 ThemeManager.apply()
- 报告弹窗白天模式文字改为黑色（#111/#222）
- 深色模式报告文字适配（#E8E8E8/#9A9A9A）
- 测验题号深色模式描边：rgba(255,255,255,0.1)

**4. Service Worker 更新**
- CACHE_NAME v1 → v2（强制刷新）
- CDN 白名单：unpkg.com, cdn.jsdelivr.net, cartocdn.com, supabase.co, openstreetmap.org, nominatim

**5. 新增文件**
- `api/upload-card.js` — Vercel serverless function，Supabase Storage 图片上传

**6. 环境变量（Vercel）**
- `SUPABASE_URL` — Supabase 项目 URL
- `SUPABASE_ANON_KEY` — Supabase 公开密钥
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase 服务端密钥（Storage 上传）

---

### GitHub & 部署

- 仓库：https://github.com/elowenliu0305/season-me
- 生产：https://season-me.vercel.app
- Supabase：https://supabase.com/dashboard/project/ufwogjbbhkhnxqtdbplj
- Git push 后 Vercel 自动部署

---

## 历史功能（2026-04-09 之前）

### 已完成功能

**1. 项目基础**
- 7+1 页单页应用：Cover → Identity → Quiz → Sampling → Darkroom → Story → Export → Community
- ThemeManager：12 季相主题系统（CSS 变量池）+ 深色模式适配
- localStorage 数据持久化（smse_ 前缀）
- Web Animations API 页面切换动画

**2. 首页 (Cover)**
- 混排品牌区：SEASON（逐字堆叠）→ 横线 → ME（大字）→ · see myself ·
- stagger 入场动效 + 横线展开动画
- 深色模式切换按钮（☀/☾）+ COMMUNITY MAP 入口

**3. 身份设定页 (Identity)**
- 昵称输入 + localStorage 持久化
- 64 个 emoji 灵兽选择（8×8 网格）
- 自定义头像上传（Canvas 圆形裁剪 + JPEG ≤50KB）

**4. 审美测验页 (Quiz)**
- 5 道审美题，每题 4 个图文选项
- 黑白→彩色触发动效 + 横向滑入切换

**5. 自拍上传页 (Sampling)**
- 浅色玻璃态风格 + 毛玻璃卡片
- "实时拍摄"主按钮 + "从相册选择"次按钮
- 底部提示卡片 + 隐私栏

**6. 暗房页 (Darkroom)**
- SSE 流式连接后端 AI Pipeline
- 打字机效果进度文字

**7. 结果页 (Story)**
- 季相中英文双语大标题
- 名片区（头像 + 昵称 + 关键词水印）
- 5 色色板拼贴效果

**8. 分享导出页 (Export)**
- html2canvas 生成 3:4 分享卡片
- iOS 长按保存 / Android 直接下载
- 剪贴板复制（小红书/微信）
- VIEW ANALYSIS REPORT 按钮 → AI 分析报告弹窗
- SHARE TO COMMUNITY MAP 按钮 → 社区地图

**9. 社区地图页 (Community)**
- Leaflet.js 真实地理地图
- 全屏地图 + 顶部导航 + FAB 发布按钮
- 底部弹出面板查看帖子详情 + 点赞
- Supabase 后端存储

**10. 后端 AI 流水线 (`api/pipeline.js`)**
- Step 1（并行）：问卷 → 人格分析（Gemini Flash）
- Step 2（并行）：照片 → 脸部色彩报告（Claude Sonnet）
- Step 3（串行）：规则初筛 → AI 确认最终季相（Gemini Flash）
- Step 4（串行）：季相 + 人格 → 穿搭推荐（Claude Sonnet）

**11. 图片上传 API (`api/upload-card.js`)**
- POST /api/upload-card — 上传分享卡片 PNG 至 Supabase Storage
- Service role key 认证，返回 public URL

**12. 前端优化**
- 深色模式全页面适配（ThemeManager + CSS 变量）
- PWA（manifest.json + service worker v2）
- SEO（meta + OG + JSON-LD）
- Plausible 数据埋点
- 移动端适配（100dvh + safe-area + 响应式断点）
- CSS/JS 缓存破坏（?v=2 query string）

---

### 技术栈

- 纯 HTML / CSS / JavaScript（无框架）
- 依赖（CDN）：html2canvas 1.4.1、Leaflet 1.9.4、@supabase/supabase-js 2、Plausible
- 字体：Playfair Display + Space Mono（Google Fonts）
- 后端：Vercel Serverless Functions（api/pipeline.js + api/upload-card.js）
- 数据库：Supabase PostgreSQL + Storage
- AI：OpenRouter（Gemini Flash + Claude Sonnet）
- 地图：Leaflet.js + CartoDB Light 瓦片 + Nominatim 反向地理编码
- 部署：Vercel（season-me.vercel.app）
- Git：GitHub（elowenliu0305/season-me）

---

### 待办 / 已知问题

- [ ] 验证线上完整社区流程（发布 → 地图显示 → 点赞）
- [ ] Step 2 无照片时的错误处理优化
- [ ] Step 3 fallback 季相判定（当 face/personality 缺失时）
- [ ] 分享图 OG 图片制作
- [ ] 多语言支持（英文 UI）
- [ ] 社区帖子删除（仅自己的帖子）
- [ ] 社区内容举报/审核机制
- [ ] 地图 marker 聚类（高密度区域）
