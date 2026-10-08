# 子中的人:提出,然后承诺

> 2026年关于HITL的共识是具体的.它不是代理发问,用户点击 批准.它是提出-然后-承诺:拟议行动会连接与无权关键 持久化到持久的存储;以意图,数据谱系、许可触摸,爆炸射线和滚动计划 呈现给评论家;只有在明确确认后才承诺;执行后再验证,确认副作用 确实发生.`interrupt()`加 PostgreSQL 检查点,微软代理框架的`RequestInfoEvent`云的`waitForApproval()`通过了 没有经过审查就被点击了 文档化缓解是带明确的检查清单的挑战和反应

**Type:** 学习
**Languages:** Python (stdlib，带 idempotency 的 propose-then-commit state machine)
**前置要求：**阶段15·12 (可持续执行),阶段15·14 (三线)
**Time:** ~60 分钟

## 问题

代理执行一个行动.用户必须决定:批准还是不批准. 如果决策是瞬间的,它很可能不是审查. 如果决策是结构化的,它会更慢,但可信.

代理想发送电子邮件给X,有机体 Y  批准? 用户点击 批准.每个人都觉得系统是安全的.

2026年的模式,也就是提出然后承诺,把HITL 移到可持续的基板上,附加结构化元数据,并要求积极承诺.每个管理代理SDK都提供了某个版本:长图.`interrupt()`、微软代理框架`RequestInfoEvent`云`waitForApproval()`△API 名称不同;形态相同.

## 概念

### 提出,然后承诺的国家机器

1. **Propose.**代理生成一个拟议的行动――它被持久化成可存储的存储器――PostgreSQL、Redis、Durable Object) ─包括:
   - 意图(代理为什么要这样做)
   - 数据谱 (哪个来源导致了这个建议)
   - 权限触摸了(哪些范围 / 文件 / 终点)
   - 爆炸射线是什么最坏情况
   - 如果承诺,我们如何撤销)
   - 免费信息的关键 (每个提案唯一;重复提交返回同一条记录)
2. **Surface.**评论员 看到包含全部元数据的建议――评论员 是人(不是代理 自己审查自己) ――
3. **Commit.**明确肯定确认――行动 执行――
4. **Verify.**执行后,读取并确认副作用──如果验证步骤失败,系统处于已知坏状态,并触发警告──

### 无能性关键

没有无效率关键 时,过渡失败 后的重试可能重复执行已批准的行动――具体例:用户批准从A转移100美元到B──网络短暂动──网络工作流重新尝试──用户只批准一次,但转移 执行了两次──无效率关键将批准 绑定到单个单个副作用;第二次执行是无效──

这与使用Stripe和AWSAPI的无权模式相似.

### 持久性:为什么批准能长于进程存活

通过等待室是一个不归代理所有状态的. 工作流被暂停了.`interrupt()`通过 PostgreSQL 检查点 配对,而不是仅仅使用内存状态:两天后的批准 仍然可以找到完整的工作流程.

### 印批准与挑战和响应减轻

通过/拒绝按) 将产生快速批准,但没有真正的审查,文档化缓解:挑战和反应检查列表,要求在批准按启动之前,对具体问题给出明确肯定答案,具体形态:

- 你知道这个操作会触及哪个资源吗?
- 你确认爆炸射线可以接受吗?
- 如果失败,你有没有反弹计划吗?

这不是为了流程而流程,而是一种强迫功能.不能勾选这些框的评论员 要么请求澄清,要么拒绝,要么拒绝.

### 什么是后果

不是每一个行动都需要提出,然后承诺.

- **Consequential actions**金融交易,外出通信,生产数据库的变化,破坏性文件系统操作.
- **Reversible actions**(有时 HITL):对本地文件的编辑,阶段化变化,带清晰的滚动可逆写.
- **Reads and inspections**读取文件列出资源调用仅阅读API

### 行动后的验证

提交运行 不等于 副作用发生──网络分区和竞赛条件可能让工作流以为自己成功,而后端实际上没有持续──检查步骤 会在提交后重新阅读目标资源以确认──这与使用`RETURNING`条款的数据库交易,或`PutObject`后执行 AWS `GetObject`是同样的模式.

### 欧盟人工智能法第14条

监管语言明确排除印格式――微软代理管理工具包合规文件中,带挑战-然后-答案的建议-然后-承诺是能经受14条审查的形态――


```figure
mx-propose-then-commit
```

## 使用它

`code/main.py`用Stdlib Python 实现一个建议然后承诺状态机器──可持续存储是JSON文件──无效密钥── (thread_id, action_signature) 的哈希──驱动程序 模拟三种情况:干净的批准流、过渡失败 后复试(必须不能双重执行),以及印默认与挑战-响应流的对比──

## 交付它

`outputs/skill-hitl-design.md`会审查一个拟议的HITL工作流程是否具有建议-然后-承诺 形态,并标记缺失的元数据、自由性、验证或挑战和响应层――

## 练习

1. 运行`code/main.py`△确认批准的提案 再试 会使用持久记录,不会再执行――然后把免权密钥 改成包含时间,展示再试 会双重执行――

2. 使用 `rollback`扩展提案记录――模拟一次验证步骤 失败的执行――展示滚动 会自动触发――

3. 阅读微软代理框架的`RequestInfoEvent`文件――找出API 包含但玩具机器 缺失一个元数据字段――添加它,并解释它防护风险――

4. 为具体行动 (例如,在公共Twitter帐户上发布) 设计挑战和答案检查清单.

5. 选择一个同步 批准?快速 足够的场景(不需要持久的商店) ――解释原因,并说明你接受的风险类型――

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Propose-then-commit | “Two-phase approval” | 持久化 proposal + positive commit + verify |
| Idempotency key | “Retry-safe token” | 每个 proposal 唯一；第二次 execution 为 no-op |
| Data lineage | “Where it came from” | 导致 proposal 的具体 source content |
| Blast radius | “Worst case” | action 出错时的影响范围 |
| Rubber-stamp | “Fast approval” | 没有真正 review 就点击 “Approve” |
| Challenge-and-response | “Forcing checklist” | Reviewer 必须明确确认具体问题 |
| RequestInfoEvent | “MS Agent Framework primitive” | 带结构化 metadata 的 durable HITL request |
| `interrupt()` / `waitForApproval()` | “Framework primitives” | 同一形态的 LangGraph / Cloudflare 等价物 |

## 延伸阅读
- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) `RequestInfoEvent`持久批准
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) `waitForApproval()`和耐用物体――
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)作为长期风险的缓解.
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 高风险系统的监管基线――
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 围绕监督的宪法框架.
