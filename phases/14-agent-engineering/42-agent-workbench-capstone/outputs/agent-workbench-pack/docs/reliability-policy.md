# 可靠性策略

workbench 会吸收行业中反复出现的五类失败模式：

1. 幻觉式 action —— 由规则集 + verification gate 捕获。
2. 范围蔓延 —— 由 scope contract diff 检查捕获。
3. 级联错误 —— 由 feedback records + refuse-on-null-exit 捕获。
4. 上下文丢失 —— 由 repo memory 吸收；chat 不是事实来源。
5. 工具误用 —— 由 reviewer rubric 的 verification 维度捕获。

该策略由 verification gate 执行。override 路径会被签名
并审计；agent 不能自行 override。
