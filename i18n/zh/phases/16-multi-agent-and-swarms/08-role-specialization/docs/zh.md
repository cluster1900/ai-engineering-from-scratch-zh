# 角色专业化 规划者,批评者,执行者,验证者

> 2026年最常见的多代理分解:一个代理负责规划,执行,批评或验证.`Code = SOP(Team)`通过"聊天链"串联设计师,程序员,评论员,测试员并使用"沟通幻觉" (agents 明确请求缺失细节) 验证者是承担重角色:Cemri等. (MAST, arXiv:2503.13657) 表明,每个多代理失败都可以追溯到缺失或损坏的验证.

**类型：**学习+建设
**语言：**字符串 (stdlib)
**先修：**阶段16 · 04 (原始模式),阶段16 · 05 (监督员)
**时间：**时间60分钟

## 问题

通过多代理系统将产生通用输出. 群中三个编码器将写出三种相同的平代码.

修复方法不是更多的代理,而是*不同的*代理. 分配不同的角色. 给评论家 配备计划者 没有工具.

## 概念

### 四个法典角色

**Planner.**阅读目标,产出步骤列表或规范.

**Executor.**一次读取一个计划步骤,产出文物――工具:实际工作工具(代码编译器、、API客户端) ――输出:文物――

**Critic.**根据规划者的意图审阅执行者的输出――工具:对文物的仅读访问、静态分析――输出:接受/拒绝,并给出原因――

**Verifier.**读取文物并运行确定性检查――工具:测试运行员、类型检查器、方案验证器──输出:通过/失败,并附证据──

批评者是主观的,通常基于LLM. 验证者是客观的,通常基于代码.

### 基因基因的SOP模式

编码为角色提示:

- **Product Manager**编写 PRD──
- **Architect**产出系统设计――
- **Project Manager**拆分任务.
- **Engineer**实现.
- **QA Engineer**运行测试.

每个角色都有严格的输入/输出方案.`Code = SOP(Team)`这一表述意味着:确定性SOP将把一组LLM变成一个可预测的管道.

### 聊天Dev的沟通性幻觉

聊天Dev 增加了一个关键动作:当执行者需要计划中没有具体细节时,它会在继续之前明确询问设计师.

实现方式:角色提示 包含当你需要未提供具体信息时,在产出输出之前按名称询问相关角色

### 为什么验证器最重要

塞姆里等人 (MAST) 追踪了1642次多代理执行失败.其中21.3%是验证漏洞. 系统交付了一个没有人检查的答案. 其余79%通常也可以追溯到一个检查.

据PwC报告称,在2025年,加入了结构化验证循环,准确率从10%升至70%――一个角色带来了7倍升.

### 批评者与验证者

- 批评者是审阅艺术品质量的 LLM──主观──可能被看作合理的散文欺骗──
- 验证器是运行在文物上的确定性程序.

两者都需要用──批判性能捕捉验证器无法表达的品味问题──验证器能捕捉到批判性看不到的错误,因为这些错误只会在运行时间出现──

### 反模式

系统中的每个角色都是LLM,并且每个角色的输出都是"看起来很好. "这是经典的MAST失败模式.

### 框架映射

- **CrewAI** `Agent(role, goal, backstory)`是典型的专业化表面.
- **LangGraph**节点可以有专业提示;边缘强制执行管道。
- **AutoGen** 在集团聊天中使用带单词名称的角色特定的可交谈的代理人──
- **OpenAI Agents SDK** 在角色专业的代理人之间使用交付工具.


```figure
swarm-roles
```

## 构建

`code/main.py`实现一个用于构建简单的Python函数的4个角色管道:

- **Planner**产出规则
- **Executor**发达代码字符串.
- **Critic**标记明显问题:
- **Verifier**在沙盒中`exec`) 中对测试案例运行生成的代码.

演示运行两次:一次执行者 产出正确代码(批评者 +验证者 都通过),一次执行者 产出偏离规范的代码(批评者 漏掉错误,因为它看起来合理;验证者 捕获到错误,因为测试 失败) 。

运行:

```
python3 code/main.py
```

## 使用

`outputs/skill-role-designer.md`接收一个任务,并产出角色列表 (三到五个角色) 、每个角色的输入/输出方案,以及验证器检查――在把代理 接入框架 之前使用它――

## 交付

检查列表:

- **至少一个确定性 Verifier。**绝不要全是法学士.
- **每个 role 都有明确 I/O schema。**规划者回归规格,而不是散文;执行者读取该方案.
- **Communicative dehallucination。**当信息缺失时,执行官必须询问规划者;绝不编造.
- **Critic/verifier 顺序。**先运行 批评 (便宜,捕捉设计问题),再运行 验证器 (较慢,捕捉错误) 
- **Loop budget。**在升级给人类之前,最多2轮批评执行者修订.

## 练习

1. 运行`code/main.py`观察验证器 如何捕获批评漏掉的错误――添加一个静态分析检查(统计`return`作为额外验证器,它能捕捉到运行时间测试漏掉的问题.
2. 添加第5个角色:"需求分析师",把用户愿望转换为规划器准备的规范.
3. 阅读MetaGPT第3节 ("代理人") ――列出MetaGPT中每个角色的输入/输出方案五个角色――
4. 阅读ChatDev的聊天链图片 (图3) 识别沟通性幻觉在哪里打断一个本来会无限持续的循环――
5. 据悉,在此次测试中, 查询是否正确, 确定性检查是不可能的, 成本高到无法接受.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Role specialization | "Different agents, different jobs" | 针对 Planner/Executor/Critic/Verifier roles 调优的不同 system prompts。 |
| SOP pattern | "Encoded standard operating procedure" | MetaGPT 的 framing：每个 role 的严格 I/O schemas 将 team 转换为 pipeline。 |
| Communicative dehallucination | "Ask before inventing" | ChatDev pattern：当细节缺失时，Executor 会询问 Planner，而不是自行编造。 |
| Critic | "LLM reviewer" | 主观、有观点的 reviewer。捕捉品味问题。可能被看似合理的 prose 欺骗。 |
| Verifier | "Deterministic check" | 基于 code 的 pass/fail。Test runner、type checker、schema validator。不会被欺骗。 |
| Verification gap | "No one checked" | MAST failures 的 21.3%。答案在没有能捕捉 bug 的 check 的情况下被交付。 |
| Revision loop | "Critic sends it back" | Critic rejection 会触发 Executor 带 feedback 重新运行。需要 budget。 |
| All-LLM anti-pattern | "Looks good to me" | 每个 role 都是 LLM，没有确定性 check。经典 MAST failure。 |

## 延伸阅读
- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) 作为角色的SOP 参考论文
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924)聊天链 + 沟通性幻觉
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST分类;验证缺陷占失的21.3%
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction)生产角色规范表面
