---
id: research-agent-writing
title: Paper Writer, Critic and Iteration
code: PW
subtitle: 用 UCB 调度实验，用五维评审迭代草稿，并输出 LaTeX、BibTeX 与 manifest。
hue: 280
sources: phases/19-capstone-projects/54-paper-writer, phases/19-capstone-projects/55-critic-loop, phases/19-capstone-projects/56-iteration-scheduler, phases/19-capstone-projects/57-end-to-end-research-demo
source_hash: 68a4188a61fb9e49
---

## 端到端研究演示
type: architecture
from: phases/19-capstone-projects/57-end-to-end-research-demo/docs/en.md, phases/19-capstone-projects/57-end-to-end-research-demo/code/main.py, phases/19-capstone-projects/56-iteration-scheduler/docs/en.md

```arch
node | seed | 1,1 | Seed hypotheses | alpha, beta, gamma | client
node | sched | 2,1 | IterationScheduler | UCB picker | process
node | slots | 3,1 | 3 parallel slots | asyncio tasks | process
node | bus | 4,1 | Result bus | reward per branch | queue
node | pick | 4,2 | pick_best_branch | highest mean reward | process
node | critic | 3,2 | CriticLoop | five scores per round | model
node | writer | 2,2 | PaperWriter | tex, bib, manifest | process
node | report | 1,2 | DemoReport | stop_reason | store
edge | seed | sched |
edge | sched | slots | dispatch
edge | slots | bus | Result
edge | bus | sched | UCB stats
edge | bus | pick | paper.trigger
edge | pick | critic | MiniPaper
edge | critic | writer | mini_to_full_paper
edge | writer | report | manifest
```

## 运行课程
type: command-table
span: 2
from: phases/19-capstone-projects/54-paper-writer/code/main.py, phases/19-capstone-projects/55-critic-loop/code/main.py, phases/19-capstone-projects/56-iteration-scheduler/code/main.py, phases/19-capstone-projects/57-end-to-end-research-demo/code/main.py

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` (54) | 把 paper.tex、references.bib、manifest.json 写到临时目录 |
| `python3 code/main.py` (55) | 打印评审循环结果与每轮轨迹 |
| `python3 code/main.py` (56) | 打印 stop_reason、论文触发与分支统计 |
| `python3 code/main.py` (57) | 打印最佳分支、评审状态与论文各节 |

## 代码中的调用
type: task-table
span: 2
from: phases/19-capstone-projects/54-paper-writer/code/main.py, phases/19-capstone-projects/55-critic-loop/code/main.py, phases/19-capstone-projects/56-iteration-scheduler/code/main.py, phases/19-capstone-projects/57-end-to-end-research-demo/code/main.py

| 任务 | 代码 |
|---|---|
| 从实验输出做图 | `figs = read_experiment_manifest(experiments, out_dir)` |
| 只渲染 LaTeX | `render_latex(paper)` |
| 填入正文并写出三个文件 | `manifest = PaperWriter(prose=prose).write(paper, out_dir)` |
| 配对评审与修订 | `critic, reviser = make_deterministic_critic_pair()` |
| 迭代一份草稿 | `CriticLoop(critic=critic, reviser=reviser, max_rounds=6, target_score=8.0)` |
| 模拟实验 | `make_deterministic_runner(base_rewards, noise=0.04, delay_ms=2.0, seed=seed)` |
| 调度并等待 | `report = await sched.run(seed)` |
| 挑选并提升 | `pick_best_branch(sched_report)`，然后 `mini_to_full_paper(critic_result.paper, branch)` |

## 声明论文骨架
type: annotated-code
lang: python
from: phases/19-capstone-projects/54-paper-writer/code/main.py, phases/19-capstone-projects/54-paper-writer/docs/en.md

```python
paper = Paper(
    title="<title>", authors=["Lab Bot"], abstract="<abstract>",
    sections=[
        Section(id="method", title="Method", cites=["jones2021"],
                figure_refs=[figs[0].id]),     # label sec:method
    ],
    figures=figs,                              # label fig:<id>
    bibliography=[
        BibEntry(key="jones2021", entry_type="article",
                 fields={"title": "On loops", "author": "Jones", "year": "2021"}),
    ],
)
prose = MockProseGenerator(outlines={"method": "<outline>"})
writer = PaperWriter(prose=prose)              # gates run before any file
```

## 运行 UCB 调度器
type: annotated-code
lang: python
from: phases/19-capstone-projects/56-iteration-scheduler/code/main.py

```python
seed = [Hypothesis(id="h-a-1", branch="branch-a"),
        Hypothesis(id="h-b-1", branch="branch-b")]
runner = make_deterministic_runner(
    base_rewards={"branch-a": 0.85, "branch-b": 0.55},
    seed=7, delay_ms=2.0,
)                                              # reward is base + N(0, noise)
sched = IterationScheduler(
    runner=runner, slots=3, max_experiments=20,
    paper_threshold=0.7, prune_floor=0.25, prune_after_runs=3,
    expander=deterministic_expander,           # two follow-ups per high reward
)
report = asyncio.run(sched.run(seed))          # SchedulerReport
report.to_dict()                               # stop_reason, paper_triggers
```

## 评审轮次与停止规则
type: flow
from: phases/19-capstone-projects/55-critic-loop/docs/en.md, phases/19-capstone-projects/55-critic-loop/code/main.py

1. **Critic**：给 clarity、novelty、evidence、methodology 与 related_work 打 0 到 10 分。
2. **Critic**：对每个低于 8.0 的维度发出一条建议。
3. **Harness**：五个都处于或高于 `target_score` 时以 reason target 停止。
4. **Harness**：2 轮的平均增益至多为 `plateau_epsilon` 时以 plateau 停止。
5. **Reviser**：应用每条编辑，例如 `expand-body` 或 `add-method-section`。
6. **Harness**：经过 `max_rounds` 后状态是 stopped，reason 为 budget。
7. **Order**：target 胜过 plateau。plateau 胜过 budget。

## 公式与分数
type: concepts
from: phases/19-capstone-projects/56-iteration-scheduler/docs/en.md, phases/19-capstone-projects/56-iteration-scheduler/code/main.py, phases/19-capstone-projects/55-critic-loop/code/main.py, phases/19-capstone-projects/57-end-to-end-research-demo/code/main.py

- **UCB1**：平均奖励 + c 乘以 sqrt(ln(total_runs) / runs)。
- **未试过的分支**：`ucb_score` 返回 `float("inf")`，所以它先跑。
- **剪枝**：`prune_after_runs` 次试验后均值低于 `prune_floor`。
- **论文触发**：分支均值处于或高于 `paper_threshold`，每个分支一次。
- **Clarity**：`min(10.0, 3.0 + avg_body / 50.0)`。
- **Evidence**：`min(10.0, 2.0 + 2.0 * fig_refs + 1.5 * cites)`。
- **Novelty**：`originality_tag` 为 high 时 9.0，medium 时 6.0，low 时 3.0。
- **演示原创性**：奖励 0.8 或以上为 high，0.6 或以上为 medium。

## 循环默认值
type: defaults
from: phases/19-capstone-projects/55-critic-loop/code/main.py, phases/19-capstone-projects/55-critic-loop/docs/en.md, phases/19-capstone-projects/56-iteration-scheduler/code/main.py, phases/19-capstone-projects/56-iteration-scheduler/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_rounds` | 5 | 评审预算。低于 1 会抛 ValueError |
| `target_score` | 8.0 | 每个维度，不是均值 |
| `plateau_epsilon` | 0.1 | 对应 `plateau_window` 2 轮 |
| `slots` | 3 | 并行 asyncio 任务 |
| `max_experiments` | 50 | `max_seconds` 是 30.0 |
| `exploration_c` | sqrt(2) | UCB 探索权重 |
| `paper_threshold` | 0.7 | 触发 `paper.trigger` |
| `prune_floor` | 0.2 | 在 `prune_after_runs` 3 次试验之后 |

## 错误与修复
type: troubleshooting
from: phases/19-capstone-projects/54-paper-writer/code/main.py, phases/19-capstone-projects/55-critic-loop/docs/en.md, phases/19-capstone-projects/56-iteration-scheduler/code/main.py, phases/19-capstone-projects/57-end-to-end-research-demo/code/main.py, phases/19-capstone-projects/57-end-to-end-research-demo/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `PaperValidationError`：引用未知 bibliography 键 | 节引用没有 `BibEntry` | 把条目加到 `bibliography` |
| `PaperValidationError`：引用未知 figure id | `figure_refs` 点名了缺失的图 | 先加这张图 |
| `NoTriggerError` | 没有分支达到 `paper_threshold` | 对照阈值检查分支奖励 |
| 五轮持平，裁决为 budget | 建议从未抬高分数 | 修评审，不是草稿 |
| 分支再也没被调度 | 分支被剪掉 | 检查 `prune_floor` 与 `prune_after_runs` |
| 轨迹事件 kind 为 error | Runner 任务抛出 | 在轨迹里读异常的 `repr` |

## 问题
type: qa
span: 2
from: phases/19-capstone-projects/54-paper-writer/docs/en.md, phases/19-capstone-projects/55-critic-loop/docs/en.md, phases/19-capstone-projects/56-iteration-scheduler/docs/en.md, phases/19-capstone-projects/57-end-to-end-research-demo/docs/en.md

- **为什么先骨架？** 闸门在写任何正文之前检查图、引用与各节。
- **评审读什么？** `manifest.json`。它不解析 LaTeX。
- **为什么用 UCB？** 贪心从不探索。均匀从不利用。
- **为什么导入而不是复制？** 演示调整 `sys.path` 并组合前面的课。
