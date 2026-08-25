# Scalable Oversight 与 Weak-to-Strong Generalization

> Burns et al.（OpenAI Superalignment，“Weak-to-Strong Generalization”，2023）提出了一个 superalignment 问题的代理任务：使用较弱模型生成的标签来 fine-tune 一个强模型。如果强模型能从不完美的弱监督中正确泛化，那么当前人类尺度的 alignment 方法也许可以扩展到超人类系统。Scalable oversight 和 W2SG 是互补的。Scalable oversight（debate、recursive reward modeling、task decomposition）提升监督者的有效能力，使其能够跟上被监督模型。W2SG 确保强模型能从监督者提供的任何不完美监督中正确泛化。Debate Helps W2SG（arXiv:2501.13124，2025 年 1 月）将二者结合起来。

**类型：** 学习
**语言：** Python（stdlib，W2SG gap simulator）
**先修：** Phase 18 · 01（instruction-following）、Phase 18 · 10（AI Control）、Phase 09（RL foundations）
**时间：** 约 60 分钟

## 学习目标

- 定义 scalable oversight 和 weak-to-strong generalization，并解释它们如何互补。
- 描述 Burns et al. 2023 的实验设置：使用来自 GPT-2 的标签来 fine-tune GPT-4。
- 解释 performance gap recovered（PGR）指标及其衡量内容。
- 说出三种主要 scalable-oversight 机制（debate、recursive reward modeling、task decomposition）以及各自的一个优势。

## 问题

到目前为止，Phase 18 中的每一种 alignment 技术都假设监督者能够评估模型行为。当模型达到超人类水平时，监督者就成了薄弱环节。superalignment 问题是：一个较弱的监督者能否可靠地产生一个更强且 aligned 的模型？

Burns et al. 将这个问题缩减为一个可操作化的经验设置：用弱模型监督强模型，衡量强模型有多少能力能在弱监督下保留下来。这不是 superalignment 的解决方案，而是一个让我们能够衡量进展的代理任务。

## 概念

### W2SG：Burns et al. 的设置

- 弱模型：GPT-2 级别。
- 强模型：GPT-4 级别。
- 目标：任务上强 GPT-4 的 ceiling。

流程：
1. 获取弱模型在某个任务上的 zero-shot 预测。
2. 在弱标签数据上 fine-tune 强模型。
3. 衡量 fine-tuned 强模型的准确率。

基线：弱模型自身的准确率、强模型在 gold labels 监督下的 ceiling。

Gap 指标：Performance Gap Recovered（PGR）= (fine-tuned - weak) / (ceiling - weak)。PGR 为 1.0 表示弱监督完全弥合了差距；PGR 为 0 表示弱监督没有帮助。

### Burns et al. 的经验发现

在 NLP、chess-puzzle 和 reward-modeling 任务中，PGR 始终为正：强模型泛化超出了弱监督者的错误。不同任务的 PGR 从约 20% 到约 80% 不等。强模型会从不完美标签中“理解”预期任务，并用其 pre-trained priors 进行补全。

Burns et al. 指出的局限：
- 这里的 weak-to-strong gap 是能力差距，不是 alignment 差距。弱模型是 aligned；真正的超人类模型也许可以由人类对齐，但能力差距会大得多。
- 强模型的泛化可能更多来自任务先验，而不是恢复 ground-truth intent。
- 引出强模型的 latent knowledge 才是真正的问题；PGR 衡量的是一种特定的操作化形式。

### Scalable oversight：三种机制

- **Debate（Irving et al. 2018）。** U 的两个实例为相反立场辩论；弱 judge 做出判断。其假设是：找到一个有说服力的真答案，比找到一个有说服力的假答案更容易。近期 2024-2025 年的工作（Khan et al.、Michael et al.）显示 debate 有时有帮助，有时没有，而它是否有帮助取决于任务结构。
- **Recursive Reward Modeling（Leike et al. 2018）。** U 帮助人类训练 U+1 的 reward model。监督者的有效能力随着模型能力增长。
- **Task Decomposition（Christiano, Shlegeris, Amodei 2018）。** 将困难任务递归分解为人类可以检查的子任务。假设任务可分解。

每种机制都对任务结构或中间组件的 alignment 做出了某种假设。

### 为什么 scalable oversight 和 W2SG 是互补的

Scalable oversight 提高监督者的有效信号质量。
W2SG 弥合监督者能够提供的任何不完美信号所带来的差距。

Lang et al. — Debate Helps Weak-to-Strong Generalization（arXiv:2501.13124）将二者结合：debate 协议提供更好的弱标签，强模型在这些标签上训练。报告显示 NLP 任务上的 PGR 有所提升。

### 组织层面的变化

OpenAI 的 Superalignment 团队在 Jan Leike 于 2024 年 5 月离职加入 Anthropic 后解散。该议程（scalable oversight、W2SG、automated alignment research）在 Anthropic 和学术实验室继续推进，包括 MATS（Lesson 28）、Redwood（Lesson 10）、Apollo（Lesson 8）、METR（Lesson 28）。组织结构变了；研究问题没有变。

### 它在 Phase 18 中的位置

Lessons 6-10 描述了在假设 U 不可信的前提下的威胁与防御范式。Lesson 11 是进攻范式：让监督者足够强，以验证 U 的 alignment。Lessons 12-16 随后转向 adversarial evaluation 的实用工具。

```figure
scalable-oversight
```

## 使用它

`code/main.py` 在一个合成任务上模拟 W2SG fine-tune。弱 labeler 准确率为 70%，并带有结构化错误；强模型在 gold labels 上的 ceiling 为 95%。你会在弱标签上 fine-tune 强模型，衡量 PGR，并与 strong-on-gold 和 weak-alone 比较。

## 交付它

本课会生成 `outputs/skill-w2sg-pgr.md`。给定一个 oversight 设置描述，它会识别弱监督者、强模型、监督质量，并计算（或请求）PGR。它会标记该主张是“weak can supervise strong”还是“weak + oversight mechanism can supervise strong”。

## 练习

1. 运行 `code/main.py`。报告 weak_accuracy = 0.60、0.70、0.80 时的 PGR。解释 PGR 曲线的形状。

2. 修改弱 labeler，使其具有结构化错误（例如，在某个特定输入类别上总是错误）。PGR 会增加、降低，还是保持不变？请解释。

3. 阅读 Burns et al. 2023 Section 4.3（NLP tasks）。复现“confidence auxiliary loss”的直觉：当强模型比弱标签更有信心时，谁会胜出？

4. 为一个 software-engineering 任务设计一个结合 debate 和 task decomposition 的 scalable-oversight 协议。说出每个组件的一种 failure mode，并解释这种组合如何处理或无法处理这些 failure mode。

5. 说明什么证据会证伪“weak-to-strong generalization 是通往 superalignment 的可行路径”这一主张。请具体说明你需要看到的经验信号。

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------|----------|
| Scalable oversight | “让监督者更强” | 提高监督者评估更强模型能力的机制 |
| W2SG | “弱监督强” | 在弱标签上 fine-tuning 强模型，并衡量恢复的能力 |
| PGR | “performance gap recovered” | (fine-tuned - weak) / (ceiling - weak)；1.0 = 完全弥合，0 = 无帮助 |
| Debate | “两个 U 实例辩论” | 一种 scalable oversight 机制，其中弱 judge 在两个 U defenders 之间做选择 |
| RRM | “recursive reward modeling” | U 帮助训练 U+1 的 reward model；监督者能力跟随 U |
| Task decomposition | “人类检查子任务” | 将困难任务递归拆解为人类可以验证的子任务 |
| Superalignment | “对齐超人类 AI” | 关注对齐人类无法直接评估的模型的研究议程 |

## 延伸阅读

- [Burns et al. — Weak-to-Strong Generalization (OpenAI 2023)](https://openai.com/index/weak-to-strong-generalization/) — W2SG 论文
- [Irving, Christiano, Amodei — AI safety via debate (arXiv:1805.00899)](https://arxiv.org/abs/1805.00899) — debate 机制
- [Leike et al. — Scalable agent alignment via reward modeling (arXiv:1811.07871)](https://arxiv.org/abs/1811.07871) — recursive reward modeling
- [Khan et al. — Debating with More Persuasive LLMs Leads to More Truthful Answers (arXiv:2402.06782)](https://arxiv.org/abs/2402.06782) — 2024 年关于更强 debaters 的 debate 经验研究
- [Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124)](https://arxiv.org/abs/2501.13124) — 2025 年 debate + W2SG 的组合
