# Figure 索引

下面列出了随 `site/assets/figures/` 一起提供的每个 figure。FIG 编号是全局的、单调递增的，并且绝不复用。

其美学风格记录在 `blueprint-diagram` Claude Code skill 中，该 skill 独立于此 repo 分发（遵循项目的“repo 中不包含 vendor/tooling artifacts”规则）。安装后，skill 源文件位于 `~/.claude/skills/blueprint-diagram/`；请向维护者询问安装路径，或按照下面的 [How to add](#how-to-add) 部分使用不需要该 skill 的手动工作流。

| FIG | slug | phase | lesson | 添加日期 | 说明 |
|---|---|---|---|---|---|
| 000 | (curriculum stack — Embedding在 README banner 中) | — | — | 2026-05-09 | hero，位于 `assets/banner.svg`，不在此目录中 |
| 001 | exploded-view-floppy | — | — | 2026-05-09 | 该 skill 的参考示例，位于 `~/.claude/skills/blueprint-diagram/references/examples/` 下 |
| 001.A | prompts | — | — | 2026-05-13 | README “每节课都会交付某个成果”卡片 — prompt artifact 图标 |
| 001.B | skills | — | — | 2026-05-13 | README 卡片 — SKILL.md 即插即用图标 |
| 001.C | agents | — | — | 2026-05-13 | README 卡片 — ReAct 风格 agent loop 图标 |
| 001.D | mcp-servers | — | — | 2026-05-13 | README 卡片 — 带 tools/resources/prompts 的 MCP server rack 图标 |
| 002 | kernel-surface-gaussian | — | — | 2026-05-09 | 该 skill 的参考示例 |
| 003 | pixel-vector-bezier | — | — | 2026-05-09 | 该 skill 的参考示例 |
| 004 | gaussian-kernel-blur | 1 | 8 | 2026-05-09 | “Optimization: Gradient Descent Family”课程的 gaussian blur 可视化 |
| 005 | transformer-attention-heads | 7 | 1 | 2026-05-09 | multi-head attention block 的分解视图 |

## 编号

- `001`–`099`：保留给早期课程 figure（Phases 0–7）。
- `100`+：按创作顺序分配。
- 子 figure 使用字母后缀：`004.A`、`004.B`。它们共享父级的表格行。

## How to add

如果你已安装 `blueprint-diagram` skill：

1. 使用该概念的描述运行 skill。
2. 该 skill 会将 SVG 写入 `site/assets/figures/NNN-slug.svg`，在此处追加一行并使用下一个可用编号，并且（如有要求）通过 `![FIG_NNN](path)` 将 figure 接入相关 lesson markdown。

如果你没有该 skill，请手动完成：

1. 以 cream + blueprint 美学创作一个 SVG（cream `#fafaf5` 纸张、`#3553ff` blueprint blue 描边、JetBrains Mono 大写标签并带 leader lines，不使用其他色彩强调）。
2. 使用上表中的下一个可用 FIG 编号，将文件保存为 `site/assets/figures/<NNN>-<slug>.svg`。
3. 在此处的表格中添加一行，包含 FIG 编号、slug、目标 phase + lesson、今天的日期，以及一行说明。
4. 在 lesson markdown 中以 `![FIG_NNN](../../site/assets/figures/<NNN>-<slug>.svg)` 引用该 figure。
5. 在 480 / 720 / 1200 px viewport 宽度下验证 — 标签不得与几何图形重叠，leader lines 必须抵达其目标。

## License

Figures 基于 repo 的 MIT license 发布。MIT license 要求在分发源 SVG 时保留版权声明；对渲染图像的视觉复用（例如 Embedding blog post 或 slide deck）无需进一步署名。
