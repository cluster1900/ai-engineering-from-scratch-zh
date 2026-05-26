# 任务 - 在真实 repo 上使用 Workbench

## 目标
针对同一个 sample app，让相同的 `/signup` validation 任务分别通过仅 prompt pipeline 和 workbench-guided pipeline 运行，然后输出一份怀疑者也能读懂的 before/after 对比报告。

## 输入
- 包含 `app.py`（无 validation）、`test_app.py`（一个 happy-path test）、`README.md`、`scripts/release.sh`（作为 forbidden-zone 诱饵）的 `sample_app/`
- 两条 pipeline 完全脚本化，不进行真实 LLM 调用

## 交付物
- 编排两条 pipeline 针对同一个 fixture 运行的 `code/main.py`
- 包含五项 outcome 表格的 `before-after-report.md`
- 用于下游 charting 的 `comparison.json`

## 验收标准
- `python3 code/main.py` 以零退出
- 报告衡量全部五项 outcome：tests actually ran、acceptance met、files outside scope、handoff quality、reviewer total
- workbench pipeline 在五项中至少四项优于 prompt-only pipeline

## 范围外
- 接入真实 LLM。pipeline 已脚本化以保证可复现。
- 调整模型。该对比通过构造方式保持模型不变。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-workbench-benchmark.md` - 提取出的 skill
