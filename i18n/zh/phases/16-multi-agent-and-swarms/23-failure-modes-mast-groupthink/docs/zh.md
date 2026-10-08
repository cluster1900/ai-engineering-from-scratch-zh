# 失效模式  MAST、群体思维、单元文化、断错误

> 2026年参考类别是**MAST**据悉,该公司的数据来源于7个最新的开源MAS的1642条执行追踪,显示出**41–86.7% 的失败率**△三根类别:**Specification Problems**角色歧义、任务定义不清;**Coordination Failures**通信中断、状态脱节;**Verification Gaps**缺少质量检查.**Groupthink**家族(arXiv:2508.05687) 补充:单元文化崩(同样的基础模型 → 相关失败) 规范偏见(代理人相互强化彼此的错误) 缺陷的思想理论、混合动力动力动态、化可靠性失败──级联示例:退休风暴,其中一次支付失败 触发回购,进而触发库存回购,最终压库存服务,几秒内 10倍负载 需要断路) ⋅记忆中毒:一个代理的幻觉 进入共享记忆,下游代理将准确其当事率下降;确实逐渐,使根源诊断变得痛苦────**STRATUS**通过专门的检测/诊断/验证代理,减轻成功 提升1.5倍.

**Type:** 学习
**Languages:** Python (stdlib)
**前置要求:**16 · 13阶段 (共享记忆), 16 · 14阶段 (共识和BFT), 16 · 15阶段 (投票和辩论拓)
**Time:** ~75 分钟

## 问题

多代理系统在真实任务中失败率为41-86.7% ((Cemri et al. 2025 在7个开源MAS上测得) ⋅这不是靠只添加更多代理就能调试的问题──这些失败有结构性原因──MAST分类类类给出了类别──本课将每个类别映射到一个具体的检测,诊断和缓解模式,让这些数字不再任意显现──

2026年生产实践是把失败模式当作设计输入.你的建筑只能指向每个MAST类别并说出已部署的减轻.

## 概念

### 类

**Specification Problems（41.77% 的失败）。**代理的任务定义不够严格.

- 两位代理人认为自己是评论员.
- 任务被说明了:用户想要特定的角度,但只说了概括这一点.
- 成功标准隐含:代理人无法判断自己是否成功.

减轻:
- 编写明确的角色合同. 每个代理的提示都说明它做什么,以及不做什么.
- 每个任务配接受测试. 在代理开始前,定义完成看起来像X──
- 飞行前规格检查:一个单独的代理在发射前审查任务定义.

**Coordination Failures（36.94%）。**通信或状态中断.

示例:
- 两个代理人在没有同步的情况下更新共享状态.
- 代理人之间的消息丢失了
- 国家漂移:Agent A 认为任务已完成;B Agent 仍在执行.

减轻:
- 带版本的共享状态,使用乐观的同时.
- 对于关键信息做出显然的确认,直到被执行.
- 定期的国家同步检查站;尽早检测漂移――

**Verification Gaps（21.30%）。**没有独立检查.

示例:
- 一个代理人声称成功;无人验证.
- 一串的代理都信任前一个的输出.
- 对新兴复合行为缺乏测试覆盖.

减轻:
- 独立验证代理 (独立验证代理) 课13:
- 显式交付合同:A 的输出必须通过检查C,B 才能开始
- 为后期分析记录结果记录.

### 集团思维家族 (arXiv:2508.05687)

当代理人同质化或模仿彼此时,会出现五类相关失败:

**Monoculture collapse。**相同的基础模型或培训数据 → 相关错误. 当三位代理人共享一个LLM时,他们也共享其幻觉.

**Conformity bias。**代理人向最响亮或最自信的同行,即使它是错误的.

**Deficient ToM。**代理人无法模仿彼此的信念;协调崩 (教训18)

**Mixed-motive dynamics。**具有部分一致的激励的代理人 漂移到折中中间态,结果谁都不满足.

**Cascading reliability failures。**一组件的错误模式 触发依赖组件中的错误模式

###        

经典的2026事件模式:

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

修复方式是经典的做法:**circuit breakers**时下游错误率 超过门 时,使用缓存或默认结果 短路──再加上每个请求的限量重试预算──

断路器是少数可以直接从分布式系统中使用且无需修改的多代理故障减缓措施之一.

### 记忆中毒

根据MAST的说法,这是共享记忆层的验证差距.

症状是准确率逐渐下降. 你不会发生崩. 你很难得到原因的缓慢漂移.

减轻:仅添加日志,来源,不可写的验证器.

### 斯特拉图斯  专业的故障检测剂

据悉,当你部署以下角色时,减轻成功率提升了1.5倍:

- **Detection agent。**监视症状模式高分歧,退缩,准确性漂移)
- **Diagnosis agent。**给定症状,从 MAST类别推断可能的根本原因.
- **Validation agent。**在缓解后,检查症状是否清除.

这种角色都能被应用到代理系统的SRE式事件响应.

### 失败模式审计

2026年最佳做法是每年或每次主要发布) 进行一次失败模式审计:

1. **Trace sample。**收集约1000条真实执行痕迹.
2. **Categorize。**对于每条的失败,映射到 MAST+群体思维类别.
3. **Compute failure-by-category rate。**哪些类别主导你的系统?
4. **Rank mitigations。**哪个解决方案能消除最多的失败?
5. **Pick 2-3 mitigations。**实现;下季度重新审计.

纪律比具体选择更重要. 没有审计,失败会混入噪音,永远不到系统处理.

### 当系统默默失败时

最危险的失败类别是沉默正确性失败――一个大声失败的系统 ([[崩]],例外、警报) 可以监控――一个产生可信但错误的输出系统无法通过例外日志检查――这就是为什么验证差距虽然数量仅占21.30%,但每次失败的成本看起来是最昂贵的类别――

投资于:
- 基于样本的人类审查.
- 黄金数据集回归测试――
- 对重要输出进行跨代理交叉检查.

### 失败与缓慢失败

有些失败是即时的;有些是缓慢的.

2026 年的工程动作:工具缓慢故障代理,这样你能在漂移中 变成可见错误之前捕获它――协议率,退休率,输出长度分布以及连续代理版本之间的编辑距离都是有用的代理――


```figure
a5-retry-cascade
```

## 构建它

`code/main.py`实现:

- `FailureTaxonomy`将模拟事件 分类为 MAST + 群体思维类别
- `CircuitBreaker` 经典模式;当错误率超过门时打开.
- `RetryStormSimulator` 展示断失败;切换电路断电器启动/关闭──
- `DetectionAgent`编写的STRATUS类型的症状匹配器──

运行:

```
python3 code/main.py
```

预期输出:
- 没有断路的重试风暴:库存错误 爆炸式增长 (模拟) ⋅
- 有断路器:在门处封顶;提供降低模式的响应──
- 检测剂标记该模式并命名为 MAST类别.

## 使用它

`outputs/skill-mast-auditor.md`对多代理系统运行MAST类型的故障模式审计――痕迹 →分类 →减缓排名――

## 发布它

生产中的失败模式纪律:

- **每季度 MAST audit。**不是每年. 类别随着系统的增长而变化.
- **到处部署 circuit breakers。**默认开放门为5-10%的错误率.
- **Golden datasets。**周末对其进行回归测试.
- **STRATUS trio。**检测+诊断+验证剂 监控生产――先只从检测剂 开始;当症状杂时再添加诊断――
- **Failure budget。**根据类别 统计失败率 设定显著的SLO──超出预算 会触发停运对话──

## 练习

1. 运行`code/main.py`△确认断路器 限制了重试风暴――调整失败门 并观察交易――
2. 实现一个**slow-failure proxy**通过逐渐关联的代理输出来模拟单种植漂移.
3. 阅读Cemri et al.(arXiv:2503.13657) ―― 选择了他们7个MAS系统中的一个,并映射了其前3个失败类别――它们与MAST的预测相比如何?
4. 阅读 集团思考论文 ((arXiv:2508.05687) 』识别五种模式 中哪一种在生产中最难检测――提出一个代理测量――
5. 为你了解某种具体的多代理系统 设计一个STRATUS式检测-诊断-验证三组.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MAST | “2026 taxonomy” | Cemri 2025；3 个根类别 + 14 个 failure sub-types。 |
| Specification Problem | “Role ambiguity” | 任务或角色定义不足；agents 不知道该做什么。 |
| Coordination Failure | “State drift” | agents 之间的通信或同步中断。 |
| Verification Gap | “No one checked” | 输出在没有独立验证的情况下被接受。 |
| Groupthink family | “Homogeneity failures” | Monoculture、conformity、deficient ToM、mixed-motive、cascading。 |
| Monoculture collapse | “Same model, same hallucinations” | 来自共享 base model 或 training data 的相关错误。 |
| Retry storm | “Cascading error amplification” | 一次 failure 触发 retries，进而放大下游 load。 |
| Circuit breaker | “Fail fast on error rate” | 当 error rate 超过 threshold 时打开；用 default 短路。 |
| STRATUS | “Incident response trio” | Detection + diagnosis + validation agents。1.5x mitigation success。 |
| Memory poisoning | “Hallucinations propagate” | Shared-memory fact 被污染；下游 agents 基于 poison 推理。 |

## 延伸阅读
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST分类,NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687)单种植,符合性以及五家族分类
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) NeurIPS 2025 程序的入口(检测+诊断+验证)
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) 经典电路断电器 参考
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) 生产失败模式的说明
