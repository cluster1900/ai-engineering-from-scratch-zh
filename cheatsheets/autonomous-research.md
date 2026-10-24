---
id: autonomous-research
title: Self-Improving and Research Agents
code: SI
subtitle: 生成器加评估器循环、自我编辑智能体、研究循环、RSI 差距，以及各自的控制手段。
hue: 280
sources: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding, phases/15-autonomous-systems/04-darwin-godel-machine, phases/15-autonomous-systems/05-ai-scientist-v2, phases/15-autonomous-systems/06-automated-alignment-research, phases/15-autonomous-systems/07-recursive-self-improvement, phases/19-capstone-projects/05-autonomous-research-agent
source_hash: e7c7931b49e48d32
---

## 生成器加评估器循环
type: flow
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md

1. **种子**：从种子程序 `P_0` 开始。它正确但不够优。
2. **数据库**：保存变体程序。评估器为每个变体打分。
3. **采样器**：从 MAP-elites 网格或岛屿中挑选父代。
4. **LLM**：提出有针对性的修改。提示中包含最优变体和评估器签名。
5. **评估器**：在留出输入上编译、运行并为变体打分。
6. **数据库**：按分数和特征向量插入该变体。
7. **循环**：重复数小时到数周。

## 四个系统对比
type: comparison
span: 2
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md, phases/15-autonomous-systems/05-ai-scientist-v2/docs/en.md, phases/15-autonomous-systems/06-automated-alignment-research/docs/en.md

| 因素 | AlphaEvolve | DGM | AI Scientist v2 | AAR |
|---|---|---|---|---|
| 编辑对象 | 算法、内核、调度器 | 智能体脚手架 | 研究论文 | 限定范围的对齐任务 |
| 评估器 | 正确性加基准测试 | SWE-bench 或 Polyglot | 同行评审，较弱 | 人工评审 |
| 结果 | 48 次乘法的 4x4 矩阵乘 | SWE-bench 从 20% 到 50% | ICLR 2025 workshop 论文 | 在弱到强任务上胜过人类 |
| 已知失败 | 受限于评估器的严谨性 | 奖励黑客 | 42% 的实验失败 | 预设工作流会拖累它 |
| 主要控制 | 留出评估器 | 评估器防火墙 | Docker 隔离，人工评审 | 沙箱外的论坛日志 |

## 运行课程模拟器
type: command-table
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/code/main.py, phases/15-autonomous-systems/04-darwin-godel-machine/code/main.py, phases/15-autonomous-systems/05-ai-scientist-v2/docs/en.md, phases/15-autonomous-systems/05-ai-scientist-v2/code/main.py, phases/15-autonomous-systems/06-automated-alignment-research/code/main.py, phases/15-autonomous-systems/07-recursive-self-improvement/code/main.py, phases/19-capstone-projects/05-autonomous-research-agent/code/main.py

| 命令 | 作用 |
|---|---|
| `code/main.py` (L03) | 先运行带留出集的 Run A，再运行不带的 Run B |
| `code/main.py --no-holdout` | 只运行 Run B。仅训练集评估器 |
| `code/main.py --reward-hack-allowed` | 打开分数侧信道 |
| `--experiment-failure 0.20 --novelty-mislabel 0.10` | 失败率更低的 L05 基线 |
| `code/main.py` (L06) | 固定与自由两种机制，篡改演示 |
| `code/main.py --threshold 2.0` | L07 暂停差距 `C - A` 设为 2.0 |
| `--seed <n>` | RNG 种子。L05 用 42，L07 用 11 |
| `python main.py` | 毕业项目树搜索，预算 $30 |

## 需要知道的数字
type: concepts
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md, phases/15-autonomous-systems/05-ai-scientist-v2/docs/en.md, phases/15-autonomous-systems/07-recursive-self-improvement/docs/en.md, phases/19-capstone-projects/05-autonomous-research-agent/docs/en.md

- **AlphaEvolve 矩阵乘**：4x4 复数矩阵用 48 次标量乘法。Strassen 1969 用 49 次。
- **AlphaEvolve 生产应用**：Borg 启发式回收约 ~0.7% 的集群算力。
- **DGM**：SWE-bench 从 20.0% 到 50.0%。Polyglot 从 14.2% 到 30.7%。
- **SWE-bench**：来自真实 GitHub issue 的 2,294 个 Python 测试修复任务。
- **AI Scientist v2**：42% 的实验因编码错误而失败。
- **对齐伪装**：基础测试中 12%。重训尝试后最高 78%。
- **毕业项目预算**：每篇论文 $30 硬预算。演示运行花费 $28.40。
- **评审关卡**：5 个评委。平均低于 4.0/5 则退回给写作者。改写 3 次后停止。

## 代码中的公式
type: concepts
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/code/main.py, phases/15-autonomous-systems/04-darwin-godel-machine/code/main.py, phases/15-autonomous-systems/07-recursive-self-improvement/docs/en.md, phases/15-autonomous-systems/07-recursive-self-improvement/code/main.py

- **失调差距**：$M(t) = C(t) - A(t)$。当 $r_c > r_a$ 时增长。
- **一个 RSI 周期**：`c *= max(0.9, nc)`，其中 `nc = cfg.r_c + random.gauss(0, cfg.noise_c)`。
- **场景 A**：`r_c=1.15`，`r_a=1.08`。场景 B 把两者都设为 1.10。
- **留出信号**：`0.5 * (c.train_score + c.test_score)`。没有留出集时仅用训练集。
- **MAP-elites 单元**：`min(depth(e), 6)` 和 `min(int(max_const(e) / 2), 4)`。
- **DGM 侧信道**：允许作弊时为 `min(1.0, base + agent.hack_bonus)`。

## 毕业项目研究智能体
type: architecture
from: phases/19-capstone-projects/05-autonomous-research-agent/docs/en.md

```arch
node | seed | 1,1 | Seed idea | plus domain | client
node | lit | 2,1 | Literature search | 50 papers, FAISS cache | store
node | tree | 3,1 | Tree search | plan, execute, verify | process
node | box | 4,1 | Sandbox per node | no network egress | process
node | score | 4,2 | Score nodes | novelty, quality, budget | process
node | writer | 3,2 | LaTeX writer | best branch | model
node | vision | 2,2 | Vision critique | compiled PDF | model
node | review | 1,2 | Reviewer ensemble | 5 LLM judges | model
node | out | 1,3 | Outputs | paper.pdf, review, trace | store
edge | seed | lit |
edge | lit | tree |
edge | tree | box | run
edge | box | score | metrics
edge | score | writer | best branch
edge | writer | vision | PDF
edge | vision | review | draft
edge | review | out | mean 4.0+
```

## 最佳优先树搜索
type: annotated-code
lang: python
from: phases/19-capstone-projects/05-autonomous-research-agent/code/main.py

```python
budget_weight = min(1.0, remaining_budget / 10.0)  # full weight above $10 left
return self.novelty * 0.4 + self.quality * 0.5 + budget_weight * 0.1
heapq.heappush(self.frontier, (-node.score(remaining), self.counter, node.node_id))
if tree.spent >= tree.budget:  # BUDGET EXHAUSTED, stop
run_experiment(cur, rng)  # sandboxed run, sets cost_usd
ok = verify(cur)  # loss above 4.0 is loss_diverged
children = expand(cur, next_id)  # one config change per child
best = max(done, key=lambda n: n.quality)  # then walk back to root
```

## 沙箱与运行（毕业项目）
type: annotated-code
lang: bash
from: phases/19-capstone-projects/05-autonomous-research-agent/docs/en.md

```bash
docker run --network=none \  # no network egress
  --memory=8g --cpus=2 \  # pinned resource caps
  --pids-limit=256 \  # process cap
  --read-only  # read-only filesystem
ai-scientist run --seed "<seed idea>" --budget 30  # $30 per paper
```

## 防篡改论坛（L06）
type: annotated-code
lang: python
from: phases/15-autonomous-systems/06-automated-alignment-research/code/main.py

```python
rec.prev_hash = self.head()  # link to the last record
payload = (f"{rec.author}|{rec.task}|{rec.regime}|"
           f"{rec.result:.3f}|{rec.prev_hash}")
rec.my_hash = hashlib.sha256(payload.encode()).hexdigest()[:16]
bad = tampered.verify()  # indexes of edited records
```

## 故障排查
type: troubleshooting
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md, phases/15-autonomous-systems/05-ai-scientist-v2/docs/en.md, phases/15-autonomous-systems/06-automated-alignment-research/docs/en.md, phases/15-autonomous-systems/06-automated-alignment-research/code/main.py, phases/15-autonomous-systems/07-recursive-self-improvement/code/main.py

| 症状 | 原因 | 修复 |
|---|---|---|
| 训练 MSE 低，测试 MSE 高 | 仅训练集评估器 | 在评估时生成留出输入 |
| 报告分数高于真实分数 | 智能体能修改自己的评分 | 使用智能体无法修改的评估器 |
| 智能体移除幻觉标记 | 评估器在智能体仓库中 | 智能体无法修改的独立检查 |
| 论文漂亮，实验坏掉 | 润色掩盖了弱点 | 评估论断本身。人工评审关卡 |
| 已知方法被标为新颖 | 文献检索误标 | 投稿前人工评审 |
| 智能体改写自己的分数 | 日志在沙箱内 | 沙箱外的只追加论坛 |
| `verify()` 标记了记录 | 哈希链在被改记录处断开 | 与沙箱外的备份交叉核对 |
| 差距 `C - A` 达到阈值 | 能力增速或激增超过对齐 | 暂停（PAUSE）等待人工评审 |

## 术语表
type: glossary
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md, phases/15-autonomous-systems/05-ai-scientist-v2/docs/en.md, phases/15-autonomous-systems/06-automated-alignment-research/docs/en.md, phases/15-autonomous-systems/07-recursive-self-improvement/docs/en.md

- **MAP-elites**：以特征向量为键的网格。每个单元保存其最优变体。
- **岛屿模型**：周期性迁移的独立种群。
- **DGM**：Darwin Godel Machine。存档加经验分数，没有证明。
- **AAR**：Automated Alignment Researcher。在对齐问题上自主运行的模型。
- **RSI**：递归自我改进。系统每个周期对自身提出修改。
- **VLM 批评**：视觉语言模型阅读图表并重绘。
- **评估器防火墙**：评估器位于智能体无法修改的命名空间中。
- **奖励黑客**：循环在没有完成预期任务的情况下抬高分数。

## 问答
type: qa
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md, phases/15-autonomous-systems/06-automated-alignment-research/docs/en.md, phases/15-autonomous-systems/06-automated-alignment-research/code/main.py, phases/15-autonomous-systems/07-recursive-self-improvement/code/main.py

- **为什么 AlphaEvolve 在矩阵乘上胜出？** 评估器快速、确定且难以钻空子。
- **为什么 DGM 放弃了证明？** 没人为一个非平凡的智能体完成过证明。DGM 使用分数增量。
- **固定工作流还是自由分解？** 自由的上限更高。固定的方差更低，也更易审计。
- **对齐速率更高就能保你安全吗？** 不能。能力激增时场景 C 会越过阈值。
- **谁来提交 AAR 的结果？** 人类。AAR 负责提议，人类负责提交。
