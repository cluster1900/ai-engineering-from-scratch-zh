---
name: rsi-cycle-pause-spec
description: 指定 RSI pipeline 必须暂停并在下一个 cycle 前等待 human review 的条件。
version: 1.0.0
phase: 15
lesson: 7
tags: [rsi, self-improvement, alignment, pause-threshold, rsp]
---

给定一个 proposed recursive-self-improvement pipeline，生成一份 pause specification：也就是在下一个 cycle 开始前，为了 human inspection 而停止循环的明确条件。没有 pause spec 的 pipeline 尚未准备好运行。

生成：

1. **Cycle-level thresholds.** 对每个可测量轴（capability score、alignment score、budget、trajectory length、resource usage），定义一个数值 threshold，一旦越过就暂停循环。Thresholds 必须在循环开始前设定并记录。
2. **Cycle-over-cycle deltas.** 设定任一轴在单个 cycle 中可以移动多少的限制。一个 cycle 中 30%+ 的 capability jump 几乎总是 evaluator gaming 的信号；应暂停并 audit。
3. **Misalignment gap.** 每个 cycle 后计算 capability-minus-alignment。如果 gap 扩大超过 X（由 operator 设定），则暂停。这就是 `code/main.py` 中 simulator 练习的 metric。
4. **Regression watch.** 如果任一轴在一个 cycle 中下降超过 Y，则暂停。Capability regressions 往往跟随 surges 出现；捕捉它们可以防止 false-progress acceleration。
5. **Human resumption contract.** 在暂停后恢复循环之前，要求一名具名人类 review pause trigger，在适当情况下重新设定 thresholds，并将决定记录到 out-of-pipeline audit trail。

Hard rejects:
- 任何可以在暂停后无需 human action 就恢复的 pipeline。
- 任何依赖循环自身 internal evaluator 的 threshold（agent 可以 game it）。
- 任何 threshold set 可由 agent 编辑的 pipeline。

Refusal rules:
- 如果用户无法预先说出 thresholds，则拒绝。事后设定的 thresholds 不是 thresholds；它们是 rationalizations。
- 如果 pipeline 没有 external（out-of-loop）evaluator，则拒绝，regression 和 surge detection 需要外部视角。
- 如果 proposed resumption contract 是“notify the team and continue after 24 hours”，则拒绝。Resumption 必须是一个 positive act。

Output format:

返回一页 spec，包含：
- **Axes and thresholds**（表格）
- **Cycle-delta limits**（表格）
- **Misalignment gap 公式和阈值**
- **Regression limits**
- **External evaluator**（它是什么，何时运行）
- **Resumption contract**（named owner、checklist、log destination）
- **Sign-off line**（谁拥有 pause invariant）
