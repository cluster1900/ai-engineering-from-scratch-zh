# 图书 Pipeline

本课程可以编译为六卷图书系列。图书是配套内容，而不是替代品：交互式图示、评分测验和可运行代码仍保留在网站和此 repository 中，每章末尾都会提供引导读者前往这些内容的链接。

## 分卷

在 `volumes.json` 中定义。每一卷对应一组阶段：

| 卷 | 标题 | 阶段 |
|-----|-------|--------|
| 1 | 基础 | 00-02 |
| 2 | Deep Learning | 03, 04, 06 |
| 3 | 语言 | 05, 07 |
| 4 | LLM | 08-11 |
| 5 | Agents | 12-16 |
| 6 | 生产 | 17-19 |

## 构建

```bash
python3 scripts/build_book.py                  # 所有卷，EPUB
python3 scripts/build_book.py --volume language
python3 scripts/build_book.py --pdf            # 添加 PDF（需要 xelatex + DejaVu 字体）
```

需要 pandoc。可选安装：`@mermaid-js/mermaid-cli`（mmdc），用于将 Mermaid 图表渲染为图片；如果未安装，这些图表将变成指向 Web 版本的提示。输出位于 `dist/book/`。

CI（`.github/workflows/build-book.yml`）会在每次涉及 `phases/` 的 push 时构建 EPUB，并在发布 release 时构建 EPUB + PDF，将两者附加到 release。

## Assembler 对每节课执行的操作

- 课程的 `# title` 会变成章节；阶段会变成不编号的分部页。
- `figure` block（交互式 JS widget）会变成带边框的提示，指向该课程的 Web 版本。
- 当 mmdc 可用时，Mermaid block 会渲染为 SVG；否则会变成指向 Web 版本的提示。
- `## Ship It` 章节会替换为指向 repo 产物的提示。
- `## Exercises` 会增加一个指向课程 `code/` 目录的起始代码链接。
- 每章末尾都会显示一个“继续在线学习”框，其中包含 Web 版本、代码和测验。
- 资源图片路径会被重写，以便 pandoc Embedding课程 SVG。

Agent 用于浏览课程的机器可读索引（`site/llms.txt`，部署时由 `site/build.js` 生成）会链接到每节课的原始 Markdown；图书的“使用 AI 学习”扉页会告诉读者如何让自己的 Assistant 读取该索引。
