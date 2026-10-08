# 浏览器代理与长时程 Web 任务

> 聊天GPT代理 (ChatGPT agent) 将运营商和深度研究 合并为一个浏览器/终端代理,并在BrowseComp上以68.9% 创立SOTA.OpenAI 于2025年8月31日关闭运营商这是产品层次整合.

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**先修要求：**阶段15·10 (许可模式),阶段15·01 (长视线剂)
**Time:** ~45 minutes

## 问题

浏览器代理是一个长视野代理:它会读取不受信任的内容,并执行后果操作. 访问的每个页面都是用户未编写的输入. 每页上的每个表单都是潜在的命令通道. 2025年到2026年的攻击语料表明,这不是假设: 污染记忆 让攻击者通过精心构建的页面,将恶意指令绑定到代理的记忆中.

防御图景不舒服.OpenAI的准备 负责人把隐含的事实说出来:间接提示注射不是一个可以完全修复的错误.原因在于攻击发生在代理的阅读和行动边界,而这个边界在架构上是模糊的模型阅读的每个代币,原则上都可能被读成一个指令.

本课会命名这个攻击面,命名基准图 版图 覽Comp、OSWorld、WebArena-Verified),并建模一个最小的间接即时注射场景,让你推测14和18中的真实防御──

## 概念

### 关于"每一个系统"的文章

**ChatGPT agent (OpenAI).**2025年7月发布──统一了运营商(浏览) 和深度研究(多小时研究)──2025年8月31日关闭独立运营商──在BrowseComp上达到68.9%的SOTA;在OSWorld和WebArena-verified上也有强成绩──

**Claude Sonnet + Vercept (Anthropic).**类型: 收购 专注于计算机使用能力 上.将 克劳德·索内特 在 OSWorld 上的成绩从<15% 提升到72.5% 克劳德 计算机使用 作为工具 API 发布.

**Gemini 3 Pro with Browser Use (DeepMind).**浏览器使用集成 发布计算机使用控制;FSF v3(2026年4月,课 20) 专门跟踪 ML R&D 领域的自主性──

**WebArena-Verified (ServiceNow, ICLR 2026).**修复一个有充分记录的问题:原始WebArena 约有11.3%的错误负率(任务被标记为失败,但实际上已经解决) ―― 验证发布 使用人工整理的成功标准重新评分,并加入了258任务硬子集 ((ICLR 2026 论文,openreview.net/forum?id=94tlGxmqkN) 』

### 浏览Comp VS OS世界 VS WebArena

| Benchmark | 衡量什么 | Horizon |
|---|---|---|
| BrowseComp | 在时间压力下，在开放 Web 上查找特定事实 | 分钟级 |
| OSWorld | Agent 操作完整 desktop（mouse、keyboard、shell） | 数十分钟 |
| WebArena-Verified | 模拟网站中的事务型 Web 任务 | 分钟级 |
| Hard subset | 带有多页面状态转换的 WebArena-Verified 任务 | 数十分钟 |

轴线不同──高浏览Comp 分数说明代理 能找到事实;它不说明代理 能预订航班──OSWorld 分数更接近它不能在我的桌面上工作──WebArena-Verified 更接近它不能完成一个流程──任何生产决策都需要选择与任务分布匹配的基准──

### 攻击面,命名如下

1. **Indirect prompt injection.**不信任的页面内容包含指令. 代理 读取它们. 代理 执行它们. 公开示例:2024 Kai Greshake等人.
2. **URL fragment / query injection.**被抓取的URL`#fragment`或查询字符串包含命令.它们从未被可见染染;但仍然存在代理的背景中.
3. **Memory-binding attacks.**页面指示代理 写入一个条持续内存(12课 涵盖持久状态) ・ 下一次会议中,该内存在没有可见触发器的情况下触发有效载荷――
4. **Authenticated sessions 上的 CSRF-shaped attacks.**污染记忆类:代理 已登录某处;攻击者页面发出状态变更请求,代理使用用户的cookies 执行这些请求。
5. **One-click hijack.**一个视觉无害的按承载代理会跟随的有效载荷.
6. **Agent host surface 中的 Content-Security-Policy holes.**转载和工具层 本身也可能成为攻击 矢量;浏览器-在浏览器-代理堆 很宽──

### 为什么不能完全修复

攻击与代理的能力和构建. 代理必须阅读不可信任的内容才能完成工作. 代理阅读的任何内容都可能包含指令. 代理遵循的任何指令都可能与用户的真实要求不一致. 防御.

这与洛布定理相似:代理无法证明下一个代币是安全的;它只能构建一个系统,让不安全的代币更容易被检测出来.

### 真正能上线的防御姿态

- **Read / write boundary.**读取永远不会产生后果.写入. 提交表单,发布内容,调用有副作用的工具.
- **Tool allowlist per task.**代理可以浏览;除非一个工具已被明确启用,否则它不能发起电话转账.
- **Session isolation.**浏览器代理会议只使用范围的凭证运行. 没有制作作者,没有个人电子邮件.
- **Content sanitizer.**带来的HTML在拼接进模型背景前,会剥离已知坏模式――(减少容易的攻击;无法阻止复杂的有效载荷――)
- **对 consequential actions 使用 HITL。**提出,然后承诺的模式 (课 15)
- **Canary tokens on memory.**如果一个记忆录输入触发,用户会看到它.


```figure
injection-boundary
```

## 使用它

`code/main.py`建模一个小浏览器代理运行,目标是三个合成页面――一个页面是良性的,一个在可见文本中有直接提示注射,一个有URL碎片注射(不可见,但位于代理的背景中) ・脚本展示了 (a) 无明的代理会做什么,(b) 读/写界限会捕获什么,(c) 净化器会捕获什么,(d) 二者都捕获不了什么――

## 交付它

`outputs/skill-browser-agent-trust-boundary.md`界定一个拟议的浏览器代理部署:它达到哪些信任区,它被授权写入什么,以及首次运行前必须就位哪些防御.

## 练习

1. 运行`code/main.py`找出消毒剂 能捕获但读/写的边界 不能捕获攻击,以及只有读/写的边界 能捕获攻击.

2. 扩展消毒剂,使用它检测一类HashJack式URL片段注射──在带有合法片段的良性URL上测量虚假阳性率──

3. 选择一个你知道的真实浏览器代理工作流程,例如,预订飞行) ――列出每次阅读和每次写.

4. 阅读WebArena-verified ICLR 2026论文──找出一个原始的WebArena 评分不可靠的任务类别,并解释验证子集 如何解决它──

5. 为了浏览器代理设置 设计一个内存卡. 你会存储什么,存在哪里,什么会触发警报?

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|---|---|---|
| Indirect prompt injection | “坏页面文本” | Agent 读取的页面中有不受信任内容，其中包含 agent 会执行的指令 |
| Tainted Memories | “Memory attack” | Agent 将攻击者提供的指令写入 durable memory；下一次 session 触发 |
| HashJack | “URL fragment attack” | 隐藏在 URL fragment / query string 中的 payload 位于 agent 的 context 中，但不会被可见渲染 |
| One-click hijack | “坏按钮” | 可见 affordance 承载 agent 会执行的后续 payload |
| BrowseComp | “Web search benchmark” | 在开放 Web 上查找特定事实；分钟级 horizon |
| OSWorld | “Desktop benchmark” | 完整 OS control；多步骤 GUI tasks |
| WebArena-Verified | “修复后的 web-task benchmark” | ServiceNow 重新评分的 WebArena，带 Hard subset |
| Read/write boundary | “Side-effect gate” | 读取永远不产生后果；如果内容来自 trust 外部，写入需要新的批准 |

## 延伸阅读

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/)运营商和深度研究的合并;BrowseComp SOTA。
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/)运营商的后代,以及后来成为ChatGPT代理的架构.
- [Zhou et al. — WebArena](https://webarena.dev/) 原始基准
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN)ICLR 2026固定子集纸
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 包含计算机使用代理的攻击表面讨论.
