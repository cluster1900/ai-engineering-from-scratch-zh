# Mission - 把 Workbench 用在真实 repo 上

## 目标
对同一个 sample app，把同一个 `/signup` 校验任务分别跑一遍 prompt-only pipeline 与 workbench 引导的 pipeline，并产出一份连怀疑论者都能读懂的 before/after 对比报告。

## 输入
- `sample_app/`，包含 `app.py`（没有 validation）、`test_app.py`（一个 happy-path 测试）、`README.md`，以及 `scripts/release.sh` 作为 forbidden-zone 诱饵
- 两条 pipeline 全部脚本化，不调用真实 LLM

## 交付物
- `code/main.py`，对同一个 fixture 编排两条 pipeline
- `before-after-report.md`，含五项结果的对比表
- `comparison.json`，供下游绘图使用

## 验收
- `python3 code/main.py` 退出码为 0
- 报告衡量全部五项结果：tests actually ran、acceptance met、files outside scope、handoff quality、reviewer total
- Workbench pipeline 在五项中至少有四项胜过 prompt-only pipeline

## 范围之外
- 接入真实 LLM。两条 pipeline 为了可复现而脚本化。
- 调模型。比较通过构造方式让 model 保持不变。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-workbench-benchmark.md` - 抽取出的 skill
