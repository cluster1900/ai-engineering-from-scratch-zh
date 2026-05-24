# 变更日志

课程中的新增内容。最新内容在前。

格式大致遵循 [Keep a Changelog](https://keepachangelog.com/)。每条记录都会注明 phase、lesson 和变更内容，方便学习者直接跳到差异部分。

## [Unreleased]

### Added
- `scripts/scaffold-lesson.sh` — scaffolder，会用完整文件夹结构和一个从 `LESSON_TEMPLATE.md` 预填充的 `docs/en.md` skeleton 创建 `phases/NN-phase/NN-lesson/`。
- `.github/PULL_REQUEST_TEMPLATE.md` — 贡献者 checklist（code 可运行、无 code comments、先从零构建、按 lesson 原子化 commit、ROADMAP 行使用 markdown link）。
- `.github/ISSUE_TEMPLATE/bug_report.md` 和 `new_lesson_proposal.md` — 用于 bug reports 和 lesson pitches 的结构化接收模板。
- 本 `CHANGELOG.md`。

## 2026-04 — Phase 4: Computer Vision 已完成

### Added
- 全部 28 个 Phase 4 lessons，覆盖从 image fundamentals 到 multi-modal vision（VLMs、3D、video、self-supervised）。
- `ROADMAP.md` 中的 Phase 4 行已作为 markdown 链接指向 lesson 文件夹，因此 website 可以展示它们。

### Fixed
- Phase 4 对 15+ 个 lessons 的精度修订：
  - `phase-4/02`：shape calculator 明确了 adaptive pool、flatten 和 linear 的 RF/stride 处理。
  - `phase-4/03`：backbone selector 描述列出所有覆盖的 families；为 OCR、medical、industrial 添加 head guidance。
  - `phase-4/04`：classification diagnostics 针对每种 failure mode 使用 quantitative thresholds；对未定义 metrics 声明 `n/a`；为少于 3 个 classes 的情况添加 guard。
  - `phase-4/06`：detection metric reader 使用 `AP@0.5`（不是 `mAP@0.5`）；per-class recall 声明为 optional；anchor designer 澄清 stride truncation 和 single-anchor-per-level 路径。
  - `phase-4/10`：sampler picker 声明 `unet_forward_ms` 是 input；ControlNet guard 提升为 rule 0。
  - `phase-4/14`：ViT inspector 与 refusal rule 对齐 — port attempts 会被 audit，而不是 endorse。
  - `phase-4/24`：open-vocab stack picker 具有明确的 rule precedence 和 license-filter semantics；concept designer 解决 step-5/rule-80 冲突。
  - `phase-4/25`：VLM docs `_merge` 在 placeholder mismatch 时抛出描述性 `ValueError`；CMER 在内部 normalises。
  - `phase-4/27`：`synthetic_frames` 将 GT boxes clip 到 frame H/W。
  - `phase-4/28`：`rope_3d` 验证 dim split；从 DiT block 示例中删除未使用的 `F` import。

## 2026-Q1 and earlier

### Added
- Phase 0 (Setup & Tooling)：全部 12 个 lessons。
- Phase 1 (Math Foundations)：全部 22 个 lessons。
- Phase 2 (ML Fundamentals)：全部 18 个 lessons。
- Phase 3 (Deep Learning Core)：涵盖 perceptron、backprop、optimizers 的核心 lessons。
- 内置 Claude Code skills：`find-your-level`（placement quiz）和 `check-understanding`（per-phase quiz）。
- Website 位于 `aiengineeringfromscratch.com`：catalog、per-lesson pages、roadmap、277-term glossary。
- 所有 20 个 phases 的初始 scaffolding（从 `phases/00-*` 到 `phases/19-*`）。
- `LESSON_TEMPLATE.md`、`CONTRIBUTING.md`、`ROADMAP.md`、`README.md`。

[Unreleased]: https://github.com/rohitg00/ai-engineering-from-scratch/compare/HEAD...HEAD
