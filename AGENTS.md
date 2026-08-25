# AGENTS.md

供参与此 repo 的贡献者和 AI Agent 使用的操作手册。提交 PR 前请先阅读。

这个 repo 是一套课程，而不是 SaaS 应用。课程内容就是产品。以下每条规则都是为了让 435 节课长期保持一致。

---

## 理念

435 节课，20 个阶段。在导入任何框架之前，先从基础数学出发构建每一种算法。你需要使用 Python、TypeScript、Rust 或 Julia 手动编写 Backpropagation、Tokenizer、Attention 和 Agent 循环。然后再通过生产级库执行相同操作，让框架不再是黑盒。“Build It / Use It”的划分是整个课程的主干。每节课都会交付一个可复用产物，你可以将其接入日常工作流。

---

## Repo 布局

```
phases/
  NN-phase-slug/
    NN-lesson-slug/
      docs/en.md              # 课程讲解
      code/                   # 实现 + 测试
      quiz.json               # 6 道题
      outputs/                # 可复用产物（skill / prompt / agent / MCP server）
README.md                     # 公开入口；课程数量自动同步
ROADMAP.md                    # 阶段/课程状态
glossary/terms.md             # 规范术语定义
site/
  build.js                    # 解析 README + ROADMAP + glossary -> data.js
  data.js                     # 生成文件；推送到 main 时由 CI 重新构建
certifications/claude/
  program.json                # 项目元数据、来源政策、官方链接
  tracks/*.json               # 考试蓝图、有序路线、学习计划
  lessons/NN-slug/            # 共享认证课程契约
  assessments/<exam-code>/    # 原创诊断测试和完整模拟考试
scripts/                      # 自动化
.github/workflows/
  curriculum.yml              # 不变量 + 自动同步工作流
```

---

## 硬性规则

1. **每个课程目录单独一个 commit。** 绝不能在一个 commit 中批量提交多节课。包含 10 节课的 PR 必须有 10 个 commit。
2. **Conventional commit 主题**不超过 72 个字符：`feat(phase-NN/MM): <slug>`。正文解释为什么，而不是做了什么。
3. 图表**只能使用 Mermaid 或 SVG**。不得使用 ASCII / Unicode 框线字符绘图。
4. **每个 fenced code block 都必须带有语言标签。** 根据情况使用 `text`、`json`、`python`、`typescript`、`rust`、`julia`、`bash`、`console`、`mermaid`、`yaml`。
5. **只允许原创实现。** 不要在文档、代码注释或 commit 文本中引用外部课程 repo。当 RFC、官方规范和学术论文是规范来源时，应引用它们。
6. **依赖 allowlist**（参见下方 `依赖`）。优先使用 stdlib。
7. **绝不提交生成文件**：`catalog.json` 已被 gitignore，`site/data.js` 会由 CI 重新构建，`package-lock.json` 永不跟踪。

---

## 依赖

| 语言       | 允许使用                                                                  |
|------------|--------------------------------------------------------------------------|
| Python     | `numpy`、`torch`、`h5py`、`zstandard`、`safetensors`、stdlib              |
| TypeScript | `hono`、`zod`、`ws`（仅在需要 WebSockets 时）、`@hono/node-server`、Node 20+ stdlib |
| Rust       | 仅 stdlib（单文件 `rustc --edition 2021`）                          |
| Julia      | `Random`、`Statistics`、`LinearAlgebra`、`Printf`（Julia stdlib）          |

如果某项发现建议使用被禁止的依赖，请跳过，并注明原因：“为保证教学清晰度，坚持 stdlib 优先。”

---

## 课程契约

### docs/en.md frontmatter

```markdown
# <Title>

> <One-line hook>

**Type:** <Learn | Build | Reference>
**Languages:** <comma-list matching the main.* files in code/>
**Prerequisites:** <comma-list of upstream lessons, or "None">
**Time:** ~<estimate in minutes>

## Learning Objectives
- <4-6 bullet points starting with a verb>
```

`**Languages:**` 字段必须与 `code/` 中存在 `main.*` 文件的语言一致。

### quiz.json schema

```json
{
  "lesson": "<dir-slug>",
  "title": "<Lesson Title>",
  "questions": [
    {"stage": "pre",   "question": "...", "options": ["a","b","c","d"], "correct": 0, "explanation": ""},
    {"stage": "check", "question": "...", "options": ["a","b","c","d"], "correct": 1, "explanation": ""},
    {"stage": "check", "question": "...", "options": ["a","b","c","d"], "correct": 2, "explanation": ""},
    {"stage": "check", "question": "...", "options": ["a","b","c","d"], "correct": 1, "explanation": ""},
    {"stage": "post",  "question": "...", "options": ["a","b","c","d"], "correct": 3, "explanation": ""},
    {"stage": "post",  "question": "...", "options": ["a","b","c","d"], "correct": 0, "explanation": ""}
  ]
}
```

必须恰好包含 6 道题：1 道 pre + 3 道 check + 2 道 post。`correct` 使用从零开始的索引。站点渲染器只理解这种结构，旧版 `q/choices/answer` schema 会无提示地崩溃。

### Claude 认证契约

`certifications/claude/lessons/` 下的认证课程遵循与阶段课程相同的
文档、测验、图表、依赖以及每节课单独一个 commit 的规则。
每节认证课程都需要一个可运行的 main 文件，以及至少五个确定性测试。
Track 引用稳定的课程路径，使一节课能够服务于多个认证，而无需重复内容。
概念类课程仍然需要实践工作：使用场景运行器、政策评分器、产物
验证器、审批模拟器、威胁模型检查器或证据评分器，而不是虚构的
供应商 API 代码。Track 也可以引用现有的 `phases/` 课程作为可选的深入学习内容。

具备完整一致性的认证课程采用与最完善的阶段课程相同的讲解、操作、构建、
交付和验证循环。每节认证课程都必须包含名称完全一致的 `Interactive Lab`、
`Practice Lab`、`Shipped Artifact`、`Verify It` 和 `Capstone Connection`
章节；Embedding已注册的 `figure` 机制；在 `outputs/` 下交付至少一个文件；
并提供带测试的可运行场景、模拟器、评分器或产物验证器。概念类课程中的
代码必须实际检验本课所教授的判断能力。不要仅为满足可运行要求而添加虚假的
API 集成。治理类课程可以使用模拟事件、政策评分器、威胁模型检查、
ADR 验证、审批工作流或证据包评分器。

`program.json` 负责独立课程免责声明、验证日期和官方链接。
`prerequisites.json` 负责机器可读的认证课程依赖图。每条必修 Track 路线
都必须在使用某节课之前包含该课程的内部先修课程。`tracks/` 中的每个文件
分别负责一个公开考试蓝图、准确的领域权重、有序课程路线、评估声明和学习计划。
考试事实必须来自当前官方指南。产品和模型的详细信息必须标注日期，
并根据当前官方文档进行核验。

诊断测试和模拟考试使用独立的评估 schema，因为它们支持
多选回答题：

```json
{
  "id": "claude-ccar-f-diagnostic",
  "version": 1,
  "track": "claude-ccar-f",
  "kind": "diagnostic",
  "title": "架构师基础诊断测试",
  "timeLimitMinutes": 30,
  "questions": [
    {
      "id": "ccar-f-agent-001",
      "domain": "agentic-architecture-orchestration",
      "objective": "choose-an-orchestration-pattern",
      "type": "single",
      "prompt": "一个独立完整的原创场景……",
      "options": ["a", "b", "c", "d"],
      "correct": [1],
      "explanation": "说明为什么该决策合适，以及其他选项为什么不合适。",
      "references": ["certifications/claude/lessons/16-multi-agent-orchestration-and-delegation"]
    }
  ]
}
```

`correct` 始终是数组。`single` 项恰好包含一个索引；
`multiple` 项至少包含两个索引。题目必须原创、映射到公开目标、
包含实质性解释，并且绝不能复制或试图重建机密考试内容。
练习百分比是原始分数，而不是 Anthropic 的换算分数，并且本课程
绝不保证通过考试。公开认证页面和课程上下文还必须声明：这是一套
独立的社区课程，与 Anthropic 不存在从属关系，也未获得 Anthropic
的认可、赞助或授权。

### AI-native 认证学习者模式

当用户请求选择、开始、继续、学习、练习或评估 Claude 认证时，
必须在教学前阅读并遵循 `skills/claude-certification/SKILL.md`。
这适用于 Codex 以及任何读取 `AGENTS.md` 的其他工具；
Claude Code 也会发现 `.claude/skills/` 下对应的 wrapper。

在学习者模式下，将此 repository 视为交互式导师。读取所选 Track manifest，
每次教授路线中的一节课，运行其真实场景和测试，要求学习者在
`learning-artifacts/` 下创建归其所有的产物，对已存储的测验或评估进行评分，
并将进度保存在 `CLAUDE-CERTIFICATION.md` 中。不要将已提交的参考产物
修改为学习者作业。认证课程通过 GitHub 和网站提供，并且有意独立于图书生成
Pipeline。它仍然只提供英文版本，也有意独立于机器翻译 Pipeline。

### code/

- 使用该语言的规范命令完整运行，并以状态码 0 退出。
- Demo 必须自行终止。不得包含无限 stdin 循环，不得因缺少 API key 而挂起。
- 包含 4-6 行头部注释，引用课程的 `docs/en.md` 路径以及所有规范或 RFC 来源。

### code/tests/

- 至少包含 5 个单元测试。
- 通过该语言的 stdlib runner 运行（`python3 -m unittest discover`、`npx tsx --test`、Rust/Julia 内联测试）。

---

## 每个 PR 的验证

推送前在本地运行：

```bash
python3 scripts/audit_lessons.py
python3 scripts/audit_certifications.py
python3 scripts/check_readme_counts.py        # 提示性质——CI 会在合并时修复

# 对每节被修改的课程执行：
cd phases/NN-phase/MM-lesson/code
python3 main.py && python3 -m unittest discover tests -v   # 或对应语言的等效命令
```

CI 关卡（`.github/workflows/curriculum.yml`）：

| Job                              | 触发条件      | 行为                                              |
|----------------------------------|--------------|-------------------------------------------------------|
| `audit`                          | push + PR    | 运行 `audit_lessons.py`。阻断性检查。                    |
| `readme-counts-sync`（仅 main） | push 到 main | 重新构建 catalog + 自动修复 README 计数。         |
| `site-rebuild`（仅 main）       | push 到 main | 重新运行 `node site/build.js`，提交 `site/data.js`。 |
| `readme-counts-drift`            | PR           | 仅提示——main 会在合并时自行修复。             |

---

## 自动化契约

**由 CI 自动处理——不要在 PR 中修改：**

| Surface              | Bot                            | 时机                |
|----------------------|--------------------------------|---------------------|
| `catalog.json`       | 按需重新构建（已 gitignore） | 每个 CI job        |
| `README.md` 计数   | `readme-counts-sync`           | push 到 main 时     |
| `site/data.js`       | `site-rebuild`                 | push 到 main 时     |

**由你处理：**

| Surface                       | 时机                                                             |
|-------------------------------|------------------------------------------------------------------|
| `README.md` 课程链接行  | 添加新课程时——链接为 `[Title](phases/NN-phase/MM-lesson/)` |
| `ROADMAP.md` 状态           | 将课程标记为完成或 WIP 时                            |
| `glossary/terms.md`           | 引入会在多节课程中使用的术语时             |

**常见 bug**：如果合并后 `grep -c 'tree/main/phases/NN-' site/data.js` 的结果为 0，说明 Phase NN 的 README 行是纯文本，缺少 `[Title](phases/NN-...)` Markdown 链接。`site/build.js` 会从该链接派生 URL。

---

## 冲突解决

```bash
git fetch origin main
git merge --no-edit origin/main

# Catalog 冲突（仅限旧分支——catalog.json 现在已被 gitignore）：
git rm catalog.json
git commit --no-edit

# README 计数冲突：
git checkout --theirs README.md
python3 scripts/build_catalog.py
python3 scripts/check_readme_counts.py --fix
git add README.md && git commit --no-edit

# site/data.js 冲突：
git checkout --theirs site/data.js
node site/build.js
git add site/data.js && git commit --no-edit

git push origin <your-branch>
```

避免对存在未处理 review comment 的分支执行 `git push --force`。Force-push 会使这些 comment 与代码脱离关联。

---

## 新课程接入

```bash
mkdir -p phases/NN-phase-slug/MM-new-lesson/{docs,code/tests,outputs}

# 1. 使用上述 frontmatter 编写 docs/en.md。
# 2. 编写带有 4-6 行头部注释的 code/main.<lang>。
# 3. 编写包含至少 5 个测试的 code/tests/test_main.*。
# 4. 使用上述 schema 编写 quiz.json。
# 5.（可选）如果课程交付 skill，则添加 outputs/skill-<slug>.md。

# 6. 添加到 README.md：
#    | MM | [Lesson Title](phases/NN-phase-slug/MM-new-lesson/) | Type | Lang |

# 7. 更新 ROADMAP.md 状态行。

# 8. 在本地验证。

# 9. 原子 commit：
git add phases/NN-phase-slug/MM-new-lesson README.md ROADMAP.md
git commit -m "feat(phase-NN/MM): add <slug>"
git push -u origin <your-branch>
gh pr create --title "feat(phase-NN/MM): add <slug>" --body "<5-line summary>"
```

`site/data.js` 会在合并时重新生成——交给 CI 处理。

---

最后审核：2026-05-27。
