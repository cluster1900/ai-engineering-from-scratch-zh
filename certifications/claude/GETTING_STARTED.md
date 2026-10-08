# 从 GitHub 学习 Claude 认证备考体系

GitHub 仓库与在线网站是同等核心的学习载体。网站提供了可交互的机制原理图和浏览器进度管理；而 GitHub 仓库则为你的 AI 编码 Agent 提供了完整的课程源码、场景代码、单元测试、交付产物、随堂测验、诊断试卷以及循序渐进的备考路线。

## 开启 AI 导师伴学

克隆本仓库，使你的 AI 导师能够本地运行每一个实验与测试：

```bash
git clone https://github.com/cluster1900/ai-engineering-from-scratch-zh.git
cd ai-engineering-from-scratch-zh
```

Claude Code 会自动发现仓库内置的导师技能。直接输入：

```text
/claude-certification
```

对于 Codex、Cursor 或其他支持读取 `SKILL.md` 的本地 Agent，安装便携的课程技能：

```bash
npx skills add cluster1900/ai-engineering-from-scratch-zh
```

随后调用 `/claude-certification`。对于 ChatGPT 或任何无法安装本地技能/不支持斜杠命令的环境，将本仓库附加或打开，并粘贴以下 Prompt：

```text
请完整阅读 skills/claude-certification/SKILL.md。使用它为我选择最合适的 Claude 认证路线，制定个性化学习计划，并利用本仓库中真实的实验、交付产物、测验和弱项强化环节，逐课带我深入学习。
```

AI 导师会询问你的目标、技术背景、学习节奏，以及是否需要先进行摸底诊断。它会在本地生成 `CLAUDE-CERTIFICATION.md`，并在以后的学习中从此文件继续。每节课都要求你：

1. 用自己的话解释架构与设计取舍；
2. 预测并操纵课程场景中的变量与行为；
3. 运行本地检出的实验与测试套件；
4. 构建并捍卫你自己的交付物；
5. 通过课后测验（6 道精准题目）；
6. 在进入下一课前，针对薄弱考点知识域进行专项强化。

你的练习产物应存放在 `learning-artifacts/claude/` 目录下，与每节课内置的标准参考产物保持隔离。

## 选择认证路线

| 认证代号 | 适合人群 | 研读路线 | 摸底诊断卷 | 完整模拟卷 |
|---|---|---|---|---|
| CCAO-F | 知识工作者、业务分析、数据校验与负责任的 Claude 实践者 | [9 课通关路线](tracks/ccao-f.json) | [16 题诊断卷](assessments/ccao-f/diagnostic.json) | [60 题模拟卷](assessments/ccao-f/mock-01.json) |
| CCDV-F | 负责构建与加固 Claude 应用程序的工程师 | [15 课通关路线](tracks/ccdv-f.json) | [16 题诊断卷](assessments/ccdv-f/diagnostic.json) | [53 题模拟卷](assessments/ccdv-f/mock-01.json) |
| CCAR-F | 负责 Claude Code、Agent SDK、API、MCP 及编排架构选型的开发者 | [21 课通关路线](tracks/ccar-f.json) | [15 题诊断卷](assessments/ccar-f/diagnostic.json) | [60 题模拟卷](assessments/ccar-f/mock-01.json) |
| CCAR-P | 负责从技术调研到生产运维全生命周期的资深工程师与架构师 | [25 课通关路线](tracks/ccar-p.json) | [14 题诊断卷](assessments/ccar-p/diagnostic.json) | [63 题模拟卷](assessments/ccar-p/mock-01.json) |

各认证路线的 JSON 文件是学习顺序、先修知识覆盖、知识域考点权重、学习计划及考核路径的机器可读权威定义。AI 导师直接读取该配置，而不是依靠泛化的提示词猜测。

## 面向 Associate（助理）认证的无代码交互引导模式

CCAO-F 认证不要求具备软件开发经验。尽管其课程附带 Python 代码，但这纯粹是为了使用确定性的校验器对安全策略、合规凭证、工作流规范和人工审核标准进行自动化测试。AI 导师会替你运行这些校验代码，你不必亲自编写 Python。

安装或唤醒导师后，粘贴如下指令即可开启：

```text
请以“无代码交互引导模式”带我学习 CCAO-F。替我运行本地校验器，以互动问答的方式带我理解每个业务场景，并协助我根据业务决策生成学习者专有的工作流、策略、审计凭证或审核产物。不要跳过实战环节与测验，且无需我编写 Python 代码。
```

你依然需要预测业务结果、调整场景参数、阐明选型理由、重构不合规产物并参加原创测验。交互形式变了，但高质量的证据标准分毫不差。

## 手动学习单节课程

每个认证专题课程在 GitHub 上都遵循一致的工程规范：

```text
certifications/claude/lessons/NN-lesson/
├── docs/en.md          完整课程内容与交互式实验思路推演
├── code/main.py        场景运行器、模拟器、评分器或校验器
├── code/tests/         确定性的自动化测试套件
├── outputs/            制作完成的标准参考产物
└── quiz.json           6 道紧扣考点与工程实践的自测题及解析
```

从你选定的路线中打开下一课。阅读 `docs/en.md`，预测场景运行结果，然后执行：

```bash
LESSON=certifications/claude/lessons/27-enterprise-governance-compliance-and-hitl
python3 "$LESSON/code/main.py"
python3 -m unittest discover -s "$LESSON/code/tests" -v
```

例如 Lesson 27 是企业级治理的典范：其可运行代码负责校验安全策略与人工复核数据包，绝不在纯概念性主题上强行堆砌花哨的虚假 API 调用。其他课程则涵盖威胁建模、架构决策记录（ADR）、审批工作流、证据链数据包、工具循环模拟器、RAG 评测报告、API 生命周期实验及综合验证器。

将 `outputs/` 作为完成范例。在 `learning-artifacts/claude/<exam-code>/<lesson-slug>/` 下构建你自己的版本，在支持的地方运行校验器进行验证，并将掌握证据记录在 `CLAUDE-CERTIFICATION.md` 中。

## 运行本地完整验证套件

在仓库根目录下运行：

```bash
python3 scripts/audit_certifications.py

find certifications/claude/lessons -path '*/code/main.py' -print0 \
  | xargs -0 -n1 env -u ANTHROPIC_API_KEY -u ANTHROPIC_MODEL python3

find certifications/claude/lessons -path '*/code/tests/test_*.py' -print0 \
  | xargs -0 -n1 env -u ANTHROPIC_API_KEY -u ANTHROPIC_MODEL python3
```

Lesson 30 的在线 Messages API 测试在未显式提供 API 凭据时会自动跳过。本课程体系默认完全离线且无需任何 API Key。如需进行可选的真实网络线缆检查（wire check），仅通过环境变量配置，并遵循该课程的具体指引。切勿将 API Key 硬编码在源码、Prompt 或进度状态文件中。

## 在 GitHub 中参加测验与全真模拟

每条路线都包含一份摸底诊断卷和一份原创全真模拟卷。AI 导师可以读取对应 JSON，逐题向你提问：

- `single`（单选题）回复单个字母选项；
- `multiple`（多选题）回复全部匹配的字母集合；
- 采用完全匹配判分，无部分得分；
- 在提交答案前，正确选项与解析严格保密；
- 测验结束后输出总百分比得分与分知识域得分；
- 针对每一道错题，均提供定位至具体课程的内链复习指引。

练习得分仅代表对本课程掌握程度的量化，并非 Anthropic 官方的折算量表分，亦不代表通过考试的保证。

## 结合网站在线学习

完整的认证体系在 [ai-learn.agent-buy.com/certifications.html](https://ai-learn.agent-buy.com/certifications.html) 同步开放。你可以使用网页进行直观的参数调演图示、本地浏览器进度记录、测验计时以及可视化错题靶向复习。而当你需要 AI 导师实时运行代码、审查产物并跟踪详尽学习计划时，GitHub 则是更强大的工程工作台。

本地预览网站：

```bash
node site/build.js
python3 -m http.server 4173 --bind 127.0.0.1
```

在浏览器中打开 `http://127.0.0.1:4173/site/certifications.html`。

## 独立声明与版权边界（Independence and Publishing Boundary）

本项目为独立的开源社区备考资料，与 Anthropic 官方无任何隶属、认可、赞助或授权关系（This is independent community preparation; not affiliated with Anthropic）。本课程依据公开考纲编写原创场景与习题，绝不收录泄密真题，亦不发放官方证书或作出包过承诺。在正式报名考证前，请务必核实 Anthropic 官方发布的最新大纲与报名资格。

认证专题内容通过 GitHub 与在线网站发布。由于动手实验、场景诊断、路线追踪和交互机制才是这门课的灵魂所在，因此认证模块刻意未被打包到仓库的静态电子书中（Certification content is intentionally not included in the repository's EPUB/PDF book workflow because the labs, assessments, route state, and interactive mechanisms are the course）。
