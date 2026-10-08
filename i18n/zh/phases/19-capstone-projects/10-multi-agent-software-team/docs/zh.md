#                                                                                                                                                                                                                                                               

> 工厂架构、MetaGPT的角色基础提示、AutoGen 0.4的类型演员图、认知的Devin,以及工厂的Droids,都在2026年收到了同样的形态:建筑师负责规划,编码人员在并行工作树中工作,评论员负责门口,测试员负责验证──将墙钟转换为输出共享状态和交付协议 成为失败表面──这个顶点的目标是构建这个团队,在SWE-bench上评估,并报告哪些交付将失败率以及失败率.

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**Time:** 40 小时

## 问题
单个代理编码器在大型任务上会碰到上限.原因不是任何单个代理 很弱,而是200k-Token 环境 无法同时容纳架构计划,四个并行代码基础片段,评论员评论和测试输出.多代理工厂会分开问题:建筑师负责计划,编码器在并行工作树中负责实现,评论员负责门口,测试员负责验证.

考试者批准了一个幻觉的解决方案.测试者与仍在写入的编码者发生了竞赛.你将构建这样一个团队,在50个SWE-bench Pro问题上运行它,跟踪每一次的交换,并发布死后检测.

## 概念
角色是类型的代理人.**Architect**读取问题,编写计划,并将其分为带有显式接口的子任务.**Coders**(Claude Sonnet 4.7,N 个并行实例,每个实例在一个`git worktree`独立实现子任务──**Reviewer**读取合并后的差异,并批准或要求具体修改.**Tester**在隔离环境中运行测试套件,并使用文物 报告通过/失败.

通信通过共享任务板 (共享任务板) 完成.每个角色 消费它被允许处理的任务. 交付是A2A协议类型的消息.

标记放大是隐藏成本.每个角色界限都会增加总结提示和交付背景.一个40轮单代理运行将变成跨四个角色的160个总轮换.

## 架构
```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## 技术
- 编排: 具有共享状态+每个代理子图的LangGraph
- 信息传输:为打字的代理间信息的A2A协议 (Google 2025)
- 模型:Opus 4.7 (建筑师),Sonnet 4.7 (编码器),GPT-5.4 (评论员),Gemini 2.5 Pro (测试员)
- 工作树隔离: `git worktree add`每个编码器+戴顿沙箱
- 合并协调员:定制三方合并+通过LLM调解冲突
- 标准:SWE-bench Pro (50个版本),SWE-AF场景,HumanEval++用于单元测试
- 可观察性:具有角色标签范围的长,每代理代币会计
- 部署:K8s,每个角色 一个独立部署,并基于后期 配置 HPA


```figure
ce-team-handoff
```

## 构建它
1. **Task board.**文件支持的JSONL,包含输入的消息:`plan_request`,我知道.`subtask`,我知道.`diff_ready`,我知道.`review_needed`,我知道.`test_needed`,我知道.`approved`,我知道.`rejected`,我知道.`replan_needed`△代理 订阅标签

2. **Architect.**读取 GitHub 版本,使用带有计划模板的 Opus 4.7,要求显式的子任务接口(触及文件、公共函数、测试影响) 发出包含子任务 DAG 的`plan_request`,我知道.

3. **Coders.**员工,每个员工从董事会中要求一个子任务.`git worktree add`发出带有补丁+测试分区的`diff_ready`,我知道.

4. **Merge coordinator.**当所有编码器完成后,将通过三向合并到阶段分支.

5. **Reviewer.**读取合并后的差异.不能批准它自己编写的差异.发出`approved`没有开放或带有具体的变更请求`review_feedback`没有什么可做.

6. **Tester.**双子座 2.5 专业的沙箱 中运行测试套件.`test_passed`或`test_failed`△失败测试循环回归到具有失败子任务的编码器.

7. **Handoff accounting.**每条跨越角色界限的信息都会在Langfuse中获得一个跨度,记录有效载荷大小和使用的模型――计算每个子任务的代码放大(coder_tokens + review_tokens + tester_tokens + architect_share / coder_tokens) ⋅

8. **Eval.**在50个SWE-bench Pro问题上运行――将通过@1 和 $-per-solved-issue 与单代理基线 (一个 Sonnet 4.7,在单个工作树中) 相比.

9. **Post-mortem.**对于每一个失败的问题,识别出失败的交付,

## 使用它
```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## 交付它
`outputs/skill-multi-agent-team.md`团队将生成一个准备好合并的 PR,并提供每个角色的代币会计.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50-issue subset，pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | injected-bug probe 上的 false-approval rate |
| 20 | Token efficiency | 每个 solved issue 的 total tokens vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution、handoff-failure histogram |
| **100** | | |

## 练习
1. 在运行中途向差异注入一个明显的错误`return None`调优评审员提示,直到错误批准低于5%──

2. 减少到两个编码器 (建筑师+编码器+审核器+测试器,编码器 顺序运行两个子任务) ――相比较墙钟和通过率――

3. 用单字符限制 替换合并协调器(子任务 触及不相交的文件集) 量构架构师的规划负担――

4. 将审查者从GPT-5.4 换为Claude Opus 4.7 量度错误批准率 和代币成本德尔塔

5. 添加第五个角色:文档工作者 (海库4.5) 评论 之后,它会产生变更日志输入 衡量文档质量 是否值得额外的代币支出

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "隔离分支" | `git worktree add` 为每个 coder 生成一个新的 working tree |
| Task board | "共享 message bus" | 存储 typed messages 的 File 或 Redis store，agents 会订阅它 |
| Handoff | "Role boundary" | 从一个 role 的 context 跨到另一个 role 的任何 message |
| Token amplification | "Multi-agent overhead" | 同一任务下跨 roles 的 total tokens / single-agent tokens |
| A2A protocol | "Agent-to-agent" | Google 2025 年用于 typed inter-agent messages 的 spec |
| Merge coordinator | "Integrator" | 运行 three-way merge 并调解 conflicts 的组件 |
| False approval | "Reviewer hallucination" | Reviewer 批准带有已知 bugs 的 diff |

## 延伸阅读
- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) 2026多代理工厂的参考实现
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) 基于角色的多代理框架
- [AutoGen v0.4](https://github.com/microsoft/autogen)微软的类型演员框架
- [Cognition AI (Devin)](https://cognition.ai) 参考产品
- [Factory Droids](https://www.factory.ai) 其他参考产品
- [Google A2A protocol](https://developers.google.com/agent-to-agent) 代理间信息信息规范
- [git worktree documentation](https://git-scm.com/docs/git-worktree)隔离基板
- [SWE-bench Pro](https://www.swebench.com)评估目标
