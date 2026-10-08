# 检查点和回车

> 每次图形状态 转换都会持续化――当工人崩时,租会过期,另一个工人会从最新的检查点接接接――Cloudflare 耐用物体会跨数小时或数周保存状态――建议-然后承诺――15课) 规划――每次行动定义反弹.

**Type:** 学习
**Languages:** Python（stdlib，checkpoint 与 rollback state machine）
**Prerequisites:** Phase 15 · 12（Durable execution），Phase 15 · 15（Propose-then-commit）
**Time:** ~60 分钟

## 问题

持续执行 (※12课) 让崩的代理可以恢复. 提出后承诺.

实际系统将以不同的方式连接到这个机制:

- **LangGraph**工作者 崩时,租会释放,另一个工作者会从最新的检查点恢复.`interrupt()`处暂停,而它本身也会被持久化.
- **Cloudflare Durable Objects**会跨数小时或数周保存按关键分类状态.
- **Microsoft Agent Framework**在工作流 API 中暴露`Checkpoint`复制加无能 覆盖重试――

无论哪种情况,真正有效的组合都是:免除关键 (idempotency key) 防止重复执行 (prevent repeat execution) + 预先条件检查 (precondition check)

## 概念

### 每次转换都会持续

转换是从一个命名状态移动到另一个命名状态的任何步骤. 简单实现只在特定的承诺点持久化;生产实现将持久化每次转换. 成本. 几次写入.

### 租回收

当工人崩时,工作流程不会丢失;租;;一个短期声明,表示该工人正在执行这个运行) 只是过期.

### 无能能力加上先决条件

只有自由还不够. 考虑这种情况:一个工作流程被批准执行当余额 >$1000 时，从 A 向 B 转账 $转账将运行一次 (正确) .但考虑到在崩和恢复之间,A 的余额通过另一个工作流 降至500美元.

每个有后果的动作都需要两个:

- **Idempotency key**防止重复执行.
- **Precondition check**确认状态与已批准动作保持一致.

### 动作后验证

工具 返回 200 不是验证. 实际验证会重新读取目标状态,并确认副作用确实发生.

- 数据库更新:`UPDATE ... RETURNING *`后断定回归的行与预期状态匹配.
- 邮件发送:提交后在发送文件中检查消息ID──
- 文件写:读回文件并计算哈希──
-  API调用:对目标资源 执行后续 `GET`,我知道.

如果验证失败,工作流程就处于已知坏状态.

### 翻车计划

建议后承诺 (?? 课 15) 中的每一个有后果动作都带有反弹计划.

- **In-band rollback**直接反转副作用`INSERT`后`DELETE`发送后`Send-correction-email`
- **Compensating transaction**为了抵消原动作,一个新的动作.
- **Out-of-band rollback**提醒人类,暂停工作流程,保留坏状态,进行调查.

没有推翻的动作需要在承诺时更强的HITL (课15挑战和反应) 

### 欧盟人工智能法第14条操作性解读

要求高风险系统具备有效的人类监督. 在操作层面,实施者通常将其解读为:

- 检查点可由审计师查询.
- 滚动已经练过了 (至少终结到终结测试一次)
- 审计轨迹 能在部署后继续存在
- 失败的验证会触发警报,而不是被静默记录到日志.

如果在中途崩、恢复中进行工作,然后在没有验证+反弹路径的情况下完成副作用,就无法通过第14条测试――

### 尖失效模式:重复执行

在这个领域最常见的生产事故是:

1. 动作已批准,自由权关键为 k.
2. 承诺开始执行返回200
3. 工作流程在持续化 承诺 状态之前崩.
4. 工作流程恢复;看到已批准但未承诺;重新执行
5. 副作用 触发两次.

缓解方式:在执行前持久化一个 在飞行意图,使用无效关键 执行,然后只有在动作后验证成功时才标记为 承诺──如果动作触发但状态写入失败,你就知道需要验证,并且在必要时重新触发──如果状态写入成功但动作失败,你会验证,并通过恢复路径 精确触发一次────


```figure
checkpoint-replay
```

## 使用它

`code/main.py`实现一个带检查点的工作流程,包含无能,先决条件,验证和反弹.

## 交付它

`outputs/skill-rollback-rehearsal.md`为拟议的工作流程 设计反弹试验,并审计检查点后台 是否具有审计轨迹持久性――

## 练习

1. 运行`code/main.py`◎验证四个场景──对于机发生事故时的场景,确认动作在多次重试中只触发一次──

2. 修改 标记先做,然后做 模式,让状态写在动作后触发.

3. 为一个具体的生产动作设计反弹计划 (例如,发到Slack频道) .将归类为带内,补偿或带外.说明你的选择理由.

4. 选择一个你熟悉的工作流程――识别每个状态转换――为每个转换标记耐用性要求(持续/不持续)――统计你当前还没有持续的数量――

5. 试验:设计一个端到端测试,运行真实工作流程,让它崩,并确认滚动路径被触发.

## 关键术语

| Term | 人们的说法 | 它真正的含义 |
|---|---|---|
| Checkpoint | “保存点” | 每一次 graph-state 转换都会持久化到 durable store |
| Lease | “Worker 声明” | 短期声明，表示某个 worker 正在执行一个 run；崩溃时过期 |
| Precondition | “状态关卡” | 断言状态仍与已批准动作保持一致 |
| Post-action verify | “重新读取检查” | 确认 side effect 确实在目标系统中发生 |
| In-band rollback | “直接撤销” | 用逆向操作反转 side effect |
| Compensating transaction | “SAGA 撤销” | 一个新的动作，用来抵消原动作 |
| Mark-as-done-first | “状态写入顺序” | 在从 commit 返回前持久化 committed 状态 |
| Article 14 | “EU AI Act 人类监督” | 操作性含义：可查询 checkpoint、已演练 rollback、可审计 trail |

## 延伸阅读

- [Microsoft Agent Framework — Checkpointing and HITL](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop)检查点原始和租回收.
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) 耐用物体 作为状态基底──
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 监管基线――
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)长远工作流程的可靠性框架――
- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) 克劳德代码常规工作流程 形态。
