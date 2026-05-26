# Figure 索引

下面列出了 `site/assets/figures/` 下随仓库发布的每一张 figure。FIG 编号是全局的、单调递增的，并且永不复用。

视觉风格记录在 `blueprint-diagram` Claude Code skill 中，该 skill 按本项目“仓库中不放 vendor/tooling artifacts”的规则独立于本 repo 分发。安装后，skill 源码位于 `~/.claude/skills/blueprint-diagram/`；请向 maintainer 询问安装路径，或按照下面的 [How to add](#how-to-add) 部分使用无需该 skill 的手动工作流。

| FIG | slug | phase | lesson | added | notes |
|---|---|---|---|---|---|
| 000 | (curriculum stack — Embedding在 README banner 中) | — | — | 2026-05-09 | hero，位于 `assets/banner.svg`，不在此目录 |
| 001 | exploded-view-floppy | — | — | 2026-05-09 | 该 skill 的参考示例，位于 `~/.claude/skills/blueprint-diagram/references/examples/` |
| 001.A | prompts | — | — | 2026-05-13 | README “每节课都会交付一些东西”卡片 — prompt artifact icon |
| 001.B | skills | — | — | 2026-05-13 | README 卡片 — SKILL.md drop-in icon |
| 001.C | agents | — | — | 2026-05-13 | README 卡片 — ReAct-style agent loop icon |
| 001.D | mcp-servers | — | — | 2026-05-13 | README 卡片 — 带 tools/resources/prompts icon 的 MCP server rack |
| 002 | kernel-surface-gaussian | — | — | 2026-05-09 | 该 skill 的参考示例 |
| 003 | pixel-vector-bezier | — | — | 2026-05-09 | 该 skill 的参考示例 |
| 004 | gaussian-kernel-blur | 1 | 8 | 2026-05-09 | “Optimization: Gradient Descent Family”课程的 gaussian blur 可视化 |
| 005 | transformer-attention-heads | 7 | 1 | 2026-05-09 | multi-head attention block 的 exploded view |

## Numbering

- `001`–`099`：预留给早期课程 figure（Phases 0–7）。
- `100`+：按创作顺序分配。
- Sub-figures 使用字母后缀：`004.A`、`004.B`。它们共享父项的表格行。

## How to add

如果你已经安装了 `blueprint-diagram` skill：

1. 用概念描述运行该 skill。
2. 该 skill 会把 SVG 写入 `site/assets/figures/NNN-slug.svg`，在这里追加一行并使用下一个可用编号，并且（如有要求）通过 `![FIG_NNN](path)` 将 figure 接入相关 lesson markdown。

如果你没有该 skill，请手动完成：

1. 以 cream + blueprint 风格创作 SVG（cream `#fafaf5` 纸张、`#3553ff` blueprint blue 线条、JetBrains Mono 大写标签和 leader lines，不使用其他 chromatic accents）。
2. 使用上表中的下一个可用 FIG 编号，保存为 `site/assets/figures/<NNN>-<slug>.svg`。
3. 在这里向表格添加一行，包含 FIG 编号、slug、目标 phase + lesson、今天的日期，以及一条单行说明。
4. 在 lesson markdown 中以 `![FIG_NNN](../../site/assets/figures/<NNN>-<slug>.svg)` 引用该 figure。
5. 在 480 / 720 / 1200 px viewport widths 下验证 — 标签不得与几何图形重叠，leader lines 必须到达目标。

## License

Figures 根据本 repo 的 MIT license 发布。MIT license 要求在 source SVG 的分发中保留 copyright notice；对渲染图像的视觉复用（例如Embedding blog post 或 slide deck）无需进一步署名。
