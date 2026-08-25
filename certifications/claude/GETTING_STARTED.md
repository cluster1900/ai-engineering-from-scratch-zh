# 通过 GitHub 学习 Claude 认证

代码仓库和网站是同等重要的学习界面。网站提供交互式图示和浏览器进度记录。GitHub 则为你的 AI 编码工具提供课程源码、场景代码、测试、产物、测验、诊断测试和学习路径顺序，使其能够循序渐进地指导你学习。

## 从 AI 导师开始

克隆代码仓库，以便导师运行所有实验和测试：

```bash
git clone https://github.com/rohitg00/ai-engineering-from-scratch.git
cd ai-engineering-from-scratch
```

Claude Code 会自动发现代码仓库中的导师。使用以下命令开始：

```text
/claude-certification
```

对于 Codex、Cursor 或其他能够读取 `SKILL.md` 的本地 Agent，请安装可移植的课程 Skills：

```bash
npx skills add rohitg00/ai-engineering-from-scratch
```

然后调用 `/claude-certification`。对于 ChatGPT 或任何无法安装本地 Skills、也不支持斜杠命令的工具，请附加或打开此代码仓库，然后粘贴以下 Prompt：

```text
完整阅读 skills/claude-certification/SKILL.md。使用它帮助我选择
Claude 认证路径、创建学习计划，并通过此代码仓库中的真实实验、
产物、测验和补强内容，每次向我教授一节课。
```

导师会询问你的目标、经验、学习节奏，以及是否希望参加路径诊断测试。它会写入 `CLAUDE-CERTIFICATION.md`，并在后续会话中从该文件恢复进度。每节课都要求你：

1. 用自己的话解释该决策；
2. 预测并操作课程场景；
3. 运行代码仓库中已检入的实验和测试；
4. 构建或为自己的产物进行辩护；
5. 通过课程测验；
6. 在继续学习前补强薄弱的考试领域。

你的作业应放在 `learning-artifacts/claude/` 下，并与每节课中已经完成的参考产物分开。

## 选择一条路径

| 路径 | 最适合 | 学习路线 | 诊断测试 | 完整模拟考试 |
|-------|----------|-------|------------|-----------|
| CCAO-F | 知识工作、分析、验证和负责任地使用 Claude | [9 节课路线](tracks/ccao-f.json) | [16 道题](assessments/ccao-f/diagnostic.json) | [60 道题](assessments/ccao-f/mock-01.json) |
| CCDV-F | 构建并保护 Claude 应用的工程师 | [15 节课路线](tracks/ccdv-f.json) | [16 道题](assessments/ccdv-f/diagnostic.json) | [53 道题](assessments/ccdv-f/mock-01.json) |
| CCAR-F | 为 Claude Code、Agent SDK、API、MCP 和编排方案进行论证的构建者 | [21 节课路线](tracks/ccar-f.json) | [15 道题](assessments/ccar-f/diagnostic.json) | [60 道题](assessments/ccar-f/mock-01.json) |
| CCAR-P | 负责从需求发现到运营全过程的高级工程师和架构师 | [25 节课路线](tracks/ccar-p.json) | [14 道题](assessments/ccar-p/diagnostic.json) | [63 道题](assessments/ccar-p/mock-01.json) |

路径 JSON 是学习顺序、先修知识覆盖范围、领域权重、学习计划和评估路径的机器可读来源。导师会读取该文件，而不是根据通用学习计划进行猜测。

## 为 Associate 使用引导式无代码模式

CCAO-F 不要求软件开发经验。它的课程仍然提供 Python，因为确定性验证器能够让策略、证据、工作流和评审规则变得可测试。导师可以替你运行这些代码；你不需要亲自编写。

安装或打开导师后，粘贴以下内容：

```text
请让我以引导式无代码模式开始学习 CCAO-F。替我运行本地验证器，
以交互方式教授每个场景，并根据我的决策帮助我创建由学习者自己
拥有的工作流、策略、证据或评审产物。不要跳过实践任务或测验，
也不要要求我编写 Python。
```

你仍然需要预测结果、操作场景、为选择进行辩护、修改未通过的产物，并完成原创评估。变化的是交互方式，而不是证据标准。

## 手动学习一节课

每节认证课程都遵循相同的 GitHub 约定：

```text
certifications/claude/lessons/NN-lesson/
├── docs/en.md          完整课程和交互式实验推理
├── code/main.py        场景运行器、模拟器、评分器或验证器
├── code/tests/         确定性验证
├── outputs/            已完成的参考产物
└── quiz.json           六道基于课程内容且附有解释的问题
```

从所选路径中打开下一节课的路径。阅读 `docs/en.md`，预测场景结果，然后运行：

```bash
LESSON=certifications/claude/lessons/27-enterprise-governance-compliance-and-hitl
python3 "$LESSON/code/main.py"
python3 -m unittest discover -s "$LESSON/code/tests" -v
```

第 27 课是一个治理示例：其中的可运行实践会验证策略和人工评审材料包。它不会为了概念性主题而加入虚构的供应商代码。其他课程会提供威胁模型、ADR、审批流程、证据包、工具循环模拟器、RAG 报告、API 生命周期实验和 Capstone 验证器。

将 `outputs/` 作为已完成的示例。在 `learning-artifacts/claude/<exam-code>/<lesson-slug>/` 中创建你自己的版本，在支持时针对副本运行验证器，并将证据记录到 `CLAUDE-CERTIFICATION.md` 中。

## 运行完整的本地验证套件

在代码仓库根目录运行：

```bash
python3 scripts/audit_certifications.py

find certifications/claude/lessons -path '*/code/main.py' -print0 \
  | xargs -0 -n1 env -u ANTHROPIC_API_KEY -u ANTHROPIC_MODEL python3

find certifications/claude/lessons -path '*/code/tests/test_*.py' -print0 \
  | xargs -0 -n1 env -u ANTHROPIC_API_KEY -u ANTHROPIC_MODEL python3
```

除非明确提供凭据，否则第 30 课的实时 Messages API 测试会跳过。默认课程完全在本地运行且不需要凭据。对于可选的连线检查，只能使用环境变量，并遵循该课程的说明。绝不要把 API key 放入源代码、Prompt 或学习状态文件中。

## 通过 GitHub 参加评估

每条路径都声明了一个诊断测试和一个原创完整模拟考试。AI 导师可以读取 JSON，并逐题进行测试：

- 使用一个字母回答 `single` 问题；
- 使用完整的字母集合回答 `multiple` 问题；
- 使用精确集合评分，不给予部分分数；
- 提交前隐藏答案和解释；
- 报告原始百分比和各领域结果；
- 针对每道错题，按照内部课程引用进行补强。

练习百分比是课程分数。它们不是 Anthropic 量表分数、认证凭据，也不保证通过考试。

## 同时使用网站

同一套课程也可以在
[aiengineeringfromscratch.com/certifications.html](https://aiengineeringfromscratch.com/certifications.html)
上访问。你可以通过网站使用直接操作式图示、本地浏览器进度、计时器和可视化评估补强。当你希望 AI 导师运行代码、检查产物并保存详细学习计划时，GitHub 仍然是更合适的界面。

要在本地预览网站，请运行：

```bash
node site/build.js
python3 -m http.server 4173 --bind 127.0.0.1
```

打开 `http://127.0.0.1:4173/site/certifications.html`。

## 独立性和发布边界

这是一套独立的社区备考课程。它与 Anthropic 没有隶属关系，也未获得 Anthropic 的认可、赞助或授权。课程使用公开考试目标和原创场景，不包含真实考试题目，也不会颁发认证凭据或保证通过考试。报名之前，请查看当前的官方指南和资格规则。

认证内容通过 GitHub 和网站发布。它特意没有纳入代码仓库的 EPUB/PDF 图书工作流，因为实验、评估、路径状态和交互机制本身就是课程的一部分。
