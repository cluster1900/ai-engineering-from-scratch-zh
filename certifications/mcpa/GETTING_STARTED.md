# 从 GitHub 学习 MCPA 认证备考体系

GitHub 仓库与在线网站是同等核心的学习载体。网站提供了可交互的机制原理图和浏览器进度管理；而 GitHub 仓库则为你的 AI 编码 Agent 提供了完整的课程源码、场景代码、单元测试、交付产物、随堂测验、诊断试卷以及循序渐进的备考路线。

## 开启 AI 导师伴学

克隆本仓库，使你的 AI 导师能够本地运行每一个实验与测试：

```bash
git clone https://github.com/cluster1900/ai-engineering-from-scratch-zh.git
cd ai-engineering-from-scratch-zh
```

Claude Code 会自动发现仓库内置的导师技能。直接输入：

```text
/mcpa-certification
```

对于 Codex、Cursor 或其他支持读取 `SKILL.md` 的本地 Agent，安装便携的课程技能：

```bash
npx skills add cluster1900/ai-engineering-from-scratch-zh
```

随后调用 `/mcpa-certification`。对于 ChatGPT 或任何无法安装本地技能/不支持斜杠命令的环境，将本仓库附加或打开，并粘贴以下 Prompt：

```text
请完整阅读 skills/mcpa-certification/SKILL.md。使用它为我备考 MCPA（Model Context Protocol Associate）认证，制定个性化学习计划，并利用本仓库中真实的实验、交付产物、测验和弱项强化环节，逐课带我深入学习。
```

AI 导师会询问你的 MCP 实践经验、学习节奏，以及是否现在就需要进行摸底诊断。它会在本地生成 `MCPA-CERTIFICATION.md`，并在以后的学习中从此文件继续。每节课都要求你：

1. 用自己的话解释架构与协议设计决策；
2. 预测并操纵课程场景中的协议交互与报文；
3. 运行本地检出的实验与测试套件；
4. 构建并捍卫你自己的交付物；
5. 通过课后测验（6 道精准题目）；
6. 在进入下一课前，针对薄弱考点知识域进行专项强化。

你的练习产物应存放在 `learning-artifacts/mcpa/` 目录下，与每节课内置的标准参考产物保持隔离。

## 认证路线概览

MCPA 是一条专注且系统的认证路线，而非零散的选择菜单：

| 字段 | 内容 |
|---|---|
| 考试代号 | MCPA |
| 认证名称 | Model Context Protocol Associate（MCP 助理工程师） |
| 认证机构 | Agentic AI Foundation，通过 Linux Foundation Training and Certification 颁发 |
| 适用等级 | 初学者，中立厂商中立标准 |
| 协议规范版本 | 2026-07-28，无状态核心（stateless core），详见附带源码引用的[协议综述报告](research/mcp-2026-07-28-brief.md) |
| 研读路线 | [34 课通关路线](tracks/mcpa-f.json) |
| 摸底诊断卷 | 位于 `assessments/mcpa-f/diagnostic.json` 的 30 题诊断卷 |
| 全真模拟卷 | 位于 `assessments/mcpa-f/` 的三套 60 题原创模拟卷：`mock-01.json`、`mock-02.json` 和 `mock-03.json` |

路线 JSON 是学习顺序、知识域权重分配及考核试卷路径的机器可读权威定义。AI 导师直接读取该配置，而不是依靠泛化的提示词猜测。

## 面向 MCPA 认证的无代码交互引导模式

MCPA 侧重于协议机制与架构理解，不强制要求软件开发背景。尽管课程附带 Python 代码，但这纯粹是为了使用确定性的 Mock 和校验器，让协议行为、JSON-RPC Schema、生命周期与授权同意标准具备可测试性。AI 导师会替你运行这些校验代码，你不必亲自编写 Python。

安装或唤醒导师后，粘贴如下指令即可开启：

```text
请以“无代码交互引导模式”带我备考 MCPA。替我运行本地 Mock 与校验器，以互动问答的方式带我理解每个协议场景，并协助我根据业务决策生成学习者专有的交付产物。不要跳过实战环节与测验，且无需我编写 Python 代码。
```

你依然需要预测协议结果、调整交互参数、阐明选型理由、重构不符合规范的产物并参加原创测验。交互形式变了，但高质量的证据标准分毫不差。

## 手动学习单节课程

每个认证专题课程在 GitHub 上都遵循一致的工程规范：

```text
certifications/mcpa/lessons/NN-lesson/
├── docs/en.md          完整课程内容与交互式实验思路推演
├── code/main.py        场景运行器、模拟器、评分器或校验器
├── code/tests/         确定性的自动化测试套件
├── outputs/            制作完成的标准参考产物
└── quiz.json           6 道紧扣考点与协议实践的自测题及解析
```

从路线中打开下一课。阅读 `docs/en.md`，预测场景运行结果，然后执行：

```bash
LESSON=certifications/mcpa/lessons/14-multi-round-trip-requests-and-elicitation
python3 "$LESSON/code/main.py"
python3 -m unittest discover -s "$LESSON/code/tests" -v
```

例如 Lesson 14 是多往返请求的典型代表：一个发布部署工具返回 `input_required`，通过引导机制（elicitation）要求人类确认，并且仅在重试请求携带新的请求 ID 且完整原样回传服务端的 `requestState` 时才真正执行部署。其测试脚本还展示了防篡改、防过期、防重放和防越权指向的拒绝拦截机制。其他课程则涵盖 Schema 校验器、发现与缓存运行器、错误通道与生命周期 Mock、OAuth 授权流模型、审计链校验器以及端到端 Capstone 报文交换验证器。

将 `outputs/` 作为完成范例。在 `learning-artifacts/mcpa/<lesson-slug>/` 下构建你自己的版本，在支持的地方运行校验器进行验证，并将掌握证据记录在 `MCPA-CERTIFICATION.md` 中。

## 运行本地完整验证套件

在仓库根目录下运行：

```bash
python3 scripts/audit_certifications.py

find certifications/mcpa/lessons -path '*/code/main.py' -print0 \
  | xargs -0 -n1 python3

find certifications/mcpa/lessons -path '*/code/tests/test_*.py' -print0 \
  | xargs -0 -n1 python3

python3 scripts/check_mcpa_wire.py
```

报文线缆检查器（wire checker）会导入每一课的通信转录本，并标记任何不符合 2026-07-28 规范的报文：缺少协议版本和客户端能力的请求、缺少 `resultType` 的结果、将旧版废弃方法（如旧版 `initialize`）视为当前标准、或使用了规范未定义的错误码。

MCPA 的每一个实验都是离线的标准库 Mock，无需任何网络 API 或凭证 Key。全套套件设计为 100% 本地化且零外部凭据依赖。

## 在 GitHub 中参加测验与全真模拟

`mcpa-f` 路线声明了一套摸底诊断卷和三套原创全真模拟卷。每套模拟卷各有侧重：运维真实场景、线缆层协议报文细节、架构设计与安全权衡。AI 导师可以读取对应 JSON，逐题向你提问：

- `single`（单选题）回复单个字母选项；
- `multiple`（多选题）回复全部匹配的字母集合；
- 采用完全匹配判分，无部分得分；
- 在提交答案前，正确选项与解析严格保密；
- 测验结束后输出总百分比得分与分知识域得分；
- 针对每一道错题，均提供定位至具体课程的内链复习指引。

练习得分仅代表对本课程掌握程度的量化，并非 MCPA 官方的最终成绩凭据，亦不代表通过考试的保证。官方题量与及格线属于厂商机密，练习成绩不可用于机械预测官方结果。

## 结合网站在线学习

完整的认证体系在 [ai-learn.agent-buy.com/certification?id=mcpa-f](https://ai-learn.agent-buy.com/certification?id=mcpa-f) 同步开放。你可以使用网页进行直观的参数调演图示、本地浏览器进度记录、测验计时以及可视化错题靶向复习。而当你需要 AI 导师实时运行代码、审查产物并跟踪详尽学习计划时，GitHub 则是更强大的工程工作台。

本地预览网站：

```bash
node site/build.js
python3 -m http.server 4173 --bind 127.0.0.1
```

在浏览器中打开 `http://127.0.0.1:4173/site/certification.html?id=mcpa-f`。

## 独立声明与版权边界

本项目为独立的开源社区备考资料，与 Agentic AI Foundation 或 Linux Foundation 无任何隶属、认可、赞助或授权关系。本课程根据官方公开的知识域、能力点要求以及 MCP 协议规范编写原创场景与习题，绝不收录泄密真题，亦不发放官方证书或作出包过承诺。在正式报名考证前，请务必核实官方最新说明。

认证专题内容通过 GitHub 与在线网站发布。由于动手实验、场景诊断、路线追踪和交互机制才是这门课的灵魂所在，因此认证模块刻意未被打包到仓库的静态电子书中。
