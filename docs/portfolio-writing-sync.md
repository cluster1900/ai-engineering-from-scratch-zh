# 博客与指南同步

`/blogs` 合集，以及 `/blog/<slug>/` 和 `/guides/<slug>/` 阅读页，会在 AI Engineering from Scratch 上呈现完整的已发表文章。交互式图示和文章内联脚本都会保留。相关文章、合集导航和搜索仍位于课程网站内。每篇文章保留原始的 `https://rohitghumare.com/...` canonical URL（规范网址）；合集则使用课程网站自己的规范网址。

## 发布

在 `rohitg00/portfolio` 中通过其常规 sitemap 和页面元数据流程发布、编辑内容。它的公开 `/api/content` 端点从已发布页面生成合集。课程网站按需获取此内容源和原始文章 HTML，无需维护第二份内容清单、定时提交、webhook secret，也无需重新构建课程网站。

两个服务都缓存五分钟，因此变更会在几分钟内传播，而不是立即生效。课程网站会合并并发请求，并限制文章响应大小和进程内缓存规模。已预热的进程在源站故障期间，最多可继续提供已验证内容 24 小时；CDN 缓存期限更短。冷启动时若源站不可用，会返回不缓存的 503 恢复页面。已移除的条目在内容源刷新后返回 404。

刷新失败后会等待 30 秒再重试源站。此退避不会延长先前已验证内容的有效期上限。

仅允许请求来自固定 portfolio 源站、已发布且经过验证的内容条目。阅读页拒绝 noindex 页面、重定向和规范网址不匹配的页面。原始 HTML 提供文章样式与动画。相对资源路径会解析为原始资源 URL，这些资源必须持续公开可访问。阅读页会适配网站导航，但不会改写可执行的内联脚本。

## 搜索发现

合集是课程网站自有、以自身为规范网址的搜索落地页，包含原创的主题说明、可见的作者信息、课程链接，以及完整的服务端渲染文章链接。其 CollectionPage、Person、ItemList 和面包屑结构化数据反映当前内容源，无需重新构建。静态首页链接、sitemap 条目和 llms.txt 条目让爬虫发现合集。网站现有的 robots.txt 策略已允许 Googlebot、Bingbot 和面向搜索的 AI 爬虫访问。

镜像文章保留 portfolio 的规范网址和原始 Article 元数据。课程 sitemap 只列出课程网站的规范页面，因此有意不收录这些镜像文章。这遵循 [Google 的规范化指南](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)：原始文章是首选搜索结果，重复页面的信号可能合并到原始文章。课程合集和原创课程可以独立参与排名。若想让课程网站在单篇文章的相关查询中优先出现，就需要改变规范网址策略；元数据无法承诺排名，也不能覆盖这一偏好。

部署后，在每个站点资源的 Search Console 中检查 `/blogs` 和一个示例阅读页 URL。确认 Google 选定的规范网址，提交课程 sitemap，并跟踪课程合集与课程页面的展示次数和点击次数。Search Console 访问权限和索引收录与代码部署是不同事项。

## 部署顺序

先部署提供 `/api/content` 的 portfolio 变更，再部署课程网站变更。两个仓库都使用现有的、与 Git 关联的 Vercel 部署。在内容源可用之前，课程阅读页返回 503，而不是返回成功但空白的列表。

## 验证

```bash
node --test site/test_portfolio_sync.js site/test_writing_mirror.js site/test_portfolio_cache.js site/test_writing_seo.js
node site/build.js
node site/build-projects.js --strict
node site/build-manuals.js
node site/version-assets.js
node scripts/preview-writing.js /path/to/portfolio
```

本地预览通过回环 HTTP 使用 portfolio 检出目录中的真实内容源处理器和完整文章 HTML。它在 `http://127.0.0.1:4178/blogs` 提供课程合集和阅读页。使用包含内容源实现的检出版本。外部图片、字体和抖动效果脚本仍从原始公开 URL 加载。

检查合集筛选和搜索，打开博客与指南两类链接，操作文章图示，并检查两种主题下移动端和桌面端的截图。禁用 JavaScript 后，检查响应 HTML 是否包含原始文章的规范网址和完整内容。普通静态服务器无法执行这些阅读页路由。

生成的构建产物和资源版本改写不会被提交。生产环境使用现有构建流程，并明确将合集模板打包进服务端函数。
