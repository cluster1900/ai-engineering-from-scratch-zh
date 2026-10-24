---
id: ai-tutor-learning-tools
title: AI Tutors and Learning Tools
code: AL
subtitle: 追踪掌握程度，让每张卡片都有出处，规划学习路径与物料，并从你自己的语料中联想词语。
hue: 280
sources: phases/19-capstone-projects/17-personal-ai-tutor, projects/source-grounded-study-coach, projects/community-learning-path-finder, projects/vocabulary-autocomplete-pad, projects/workshop-materials-planner
source_hash: a4fbfc69c50084ba
---

## 每个项目构建什么
type: comparison
span: 2
from: projects/source-grounded-study-coach/README.md, projects/community-learning-path-finder/README.md, projects/vocabulary-autocomplete-pad/README.md, projects/workshop-materials-planner/README.md, projects/vocabulary-autocomplete-pad/solution/cli.ts, projects/vocabulary-autocomplete-pad/solution/main.ts

| 维度 | 学习教练 | 路径规划器 | 自动补全写字板 | 物料规划器 |
|---|---|---|---|---|
| 构建 | 带复习日期的练习页 | 可行的学习路径 | 本地写字板 | 打包清单与短缺项 |
| 运行时 | Node.js 22.18 | Python 3.10+ | Node 22.18 | Python 3.10+ |
| 输入 | 卡组 JSON 与作答事件 | 资源、目标、预算 | 由 id 和 text 组成的语料 | 参与者、物料、库存 |
| 输出 | index.html, progress.json | learning-map.html, path.json | report.html, vocabulary-model.json | packing-list.csv, shortages.json |
| 复盘回路 | 下载作答记录 JSON | `--decisions decisions.json` | 下载 vocabulary-model.json | `--decisions decisions.json` |
| 限制 | 只做答案精确匹配 | 进度靠自报 | 只预测下一个 token，上下文两个词 | 同时只能有一个会话 |

## 运行与评分
type: command-table
span: 2
from: projects/source-grounded-study-coach/README.md, projects/community-learning-path-finder/README.md, projects/vocabulary-autocomplete-pad/README.md, projects/workshop-materials-planner/README.md, phases/19-capstone-projects/17-personal-ai-tutor/code/main.py, phases/19-capstone-projects/17-personal-ai-tutor/code/ts/README.md

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py <project> --init <workspace>` | 创建工作区。第一阶段会失败 |
| `python3 scripts/project_test.py <project> --stage 1 --path <workspace> --strict` | 评分一个阶段 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 检查参考答案 |
| `node --experimental-strip-types main.ts --deck ./fixtures/deck.json --attempts ./fixtures/attempts.json --initial-date 2026-09-01 --date 2026-09-03 --out ./study-output` | 构建练习页和复习计划 |
| `python3 cli.py samples/input.json --output demo-output` | 运行路径规划器或物料规划器 |
| `node cli.ts sample.json output` | 训练写字板并写出 output/report.html |
| `python main.py` | 运行模拟的导师效果研究 |
| `npm run serve` | 导师 Web 应用，端口 :8090 |

## 导师的一轮
type: flow
from: phases/19-capstone-projects/17-personal-ai-tutor/code/main.py, phases/19-capstone-projects/17-personal-ai-tutor/docs/en.md

1. **next_concept**：遍历 DAG。选第一个低于 0.85、且所有前置概念都已掌握的概念。
2. **难度**：0.3，每个前置概念再加 0.1。
3. **上一个动作**：前置脚手架减 0.15，提示减 0.08。
4. **学习者作答**：答对概率为 sigmoid（知识减难度）。
5. **socratic_policy**：答对且高于 0.8 时给出 `celebrate_and_advance`。
6. **socratic_policy**：答对给出 `reinforce_and_next_question`。答错但高于 0.5 给出 `hint`。
7. **socratic_policy**：答错且不高于 0.5 给出 `scaffold_from_prereq`。
8. **bkt_update**：更新掌握度，然后加上学习步。

## BKT 更新
type: annotated-code
lang: python
from: phases/19-capstone-projects/17-personal-ai-tutor/code/main.py

```python
p = BKTParams()                          # p_init, p_learn, p_slip, p_guess
if correct:
    num = mastery * (1 - p.p_slip)
    denom = num + (1 - mastery) * p.p_guess
else:
    num = mastery * p.p_slip
    denom = num + (1 - mastery) * (1 - p.p_guess)
posterior = num / max(denom, 1e-6)
return posterior + (1 - posterior) * p.p_learn   # learn transition
```

## 学习教练循环
type: architecture
from: projects/source-grounded-study-coach/solution/main.ts, projects/source-grounded-study-coach/README.md

```arch
node | deck | 1,1 | deck.json | sources and cards | store
node | att | 1,2 | attempts.json | dated answers | store
node | val | 2,1 | validateDeck | offsets hold the answer | process
node | prog | 2,2 | buildProgress | box and due per card | process
node | exp | 3,1 | exportPractice | writes the outputs | process
node | page | 4,1 | index.html | reveal and record | client
node | json | 3,2 | progress.json | due cards | store
edge | deck | val |
edge | val | exp |
edge | att | prog | replay
edge | prog | exp |
edge | exp | page |
edge | exp | json |
edge | page | att | download
```

## 项目函数
type: task-table
from: projects/source-grounded-study-coach/solution/main.ts, projects/community-learning-path-finder/API.md, projects/vocabulary-autocomplete-pad/README.md, projects/workshop-materials-planner/API.md

| 任务 | 代码 |
|---|---|
| 评分一个输入的答案 | `gradeAnswer(deck, cardId, response)` |
| 列出到期卡片 | `dueCards(progress, date)` |
| 排序前置条件 | `path_for(index, target, completed=None)` |
| 在预算内给路径排名 | `rank_paths(index, goals, budget, completed=None)` |
| 联想下一个词 | `suggest(model: Model, prefix: string, history?: string[], limit?: number)` |
| 加载已保存的模型 | `importModel(value: unknown)` |
| 按规模换算物料 | `scale(model, participants=None)` |
| 找出短缺项 | `shortages(model, participants=None)` |

## 代码中的规则
type: concepts
from: projects/source-grounded-study-coach/solution/main.ts, projects/community-learning-path-finder/API.md, projects/vocabulary-autocomplete-pad/solution/main.ts, projects/workshop-materials-planner/API.md

- **答案匹配**：NFKC、转小写、去首尾空白、去掉末尾标点，然后精确匹配。
- **盒子**：答对加 1，最多到 5。答错重置为 0。
- **间隔**：答对时 `2 ** (state.box - 1)` 天。答错时 1 天。
- **路径排名**：覆盖目标最多者优先，其次分钟数最少，再按 ID。
- **联想得分**：`order * 1000000 + count`。历史越长者胜出。
- **消耗品**：`quantity*participants`。
- **共用设备**：`quantity*ceil(participants/share)`。
- **库存未知**：无法换算的库存会让短缺量变为未知。

## 默认值与数字
type: defaults
from: phases/19-capstone-projects/17-personal-ai-tutor/code/main.py, projects/community-learning-path-finder/API.md, projects/vocabulary-autocomplete-pad/solution/main.ts, projects/workshop-materials-planner/solution/cli.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `p_init` | 0.2 | 先验知识 |
| `p_learn` | 0.12 | 每次练习的学习率 |
| `p_slip`, `p_guess` | 0.10 | 猜测概率为 0.15 |
| `master_threshold` | 0.85 | 已掌握的概念会被跳过 |
| 目录大小 | 18 | 精确规划器的上限 |
| `suggest` 上限 | 5 | 允许范围 0..50 |
| 规划器 `compare` | [8, 12] | 用于比较的参与人数 |
| 研究 `n_turns` | 60 | 每组 10 名学习者 |

## 错误与修复
type: troubleshooting
from: projects/source-grounded-study-coach/solution/main.ts, projects/community-learning-path-finder/solution/main.py, projects/vocabulary-autocomplete-pad/solution/main.ts, projects/workshop-materials-planner/solution/main.py

| 现象 | 原因 | 解决 |
|---|---|---|
| "Canonical answer must occur in the evidence quote" | 偏移量没对准答案 | 以 UTF-16 单位修正 `start` 和 `end` |
| "Conflicting duplicate attempt ID" | 同一个 id，内容不同 | 为每次作答分配新 id |
| "Proposal lacks verbatim answer evidence" | 模型引用的话不在原文中 | 拒绝它。保持卡组不变 |
| "prerequisite cycle" | 资源互为前置 | 删除一条前置边 |
| "stale progress" | 导出后输入发生了变化 | 重新运行，再编辑新的决策 |
| "complete prerequisites first" | 进度跳过了某一步 | 先把前置项标记为完成 |
| "inconsistent conversion cycle" | 两条单位换算路径结果不一致 | 修正换算系数 |
| "Unsupported model schema" | `schemaVersion` 不是 1 | 加载 schema 版本为 1 的模型 |

## 缩写
type: glossary
from: phases/19-capstone-projects/17-personal-ai-tutor/docs/en.md, phases/19-capstone-projects/17-personal-ai-tutor/code/ts/README.md

- **BKT**：Bayesian knowledge tracing（贝叶斯知识追踪）。每个概念的掌握概率。
- **FSRS**：Free Spaced Repetition Scheduler。优于 SM-2。
- **DAG**：带前置边的概念图。
- **COPPA**：限制收集 13 岁以下儿童数据的美国法律。
- **OER**：挂在每个课程节点上的开放内容。

## 问答
type: qa
from: phases/19-capstone-projects/17-personal-ai-tutor/docs/en.md, projects/source-grounded-study-coach/README.md, projects/workshop-materials-planner/API.md

- **被要求直接给答案时，导师怎么做？** 它会提一个引导性问题。
- **用什么证明导师有效？** 10 名学习者在两周内的前测/后测差值。
- **学习教练会批改作文吗？** 不会。它使用编写好的题目和精确匹配。
- **模型生成的卡片会进入卡组吗？** 不会。它进入 card-proposal.json 等待审核。
- **规划器会估算胶水用量吗？** 不会。它从不推断密度或包装规格。

## 提示
type: tips
from: phases/19-capstone-projects/17-personal-ai-tutor/docs/en.md, projects/source-grounded-study-coach/README.md, projects/community-learning-path-finder/README.md

- 构建一个包含 50-150 个概念节点的课程图。
- 在相同内容上与非自适应基线对比。
- 1 年后自动删除记忆。按学习者 ID 划定范围。
- 把页面上的复习日期传给 `--date`。
- 另留一组示例用于评估。
- 下载前重新加载练习页会丢弃新的作答记录。
