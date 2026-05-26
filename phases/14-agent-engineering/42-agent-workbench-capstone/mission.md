# 任务 - Capstone：交付可复用的 Agent Workbench Pack

## 目标
将前面十一课组装成一个带版本的 `outputs/agent-workbench-pack/` 目录，并提供一个 installer，能以幂等方式铺设到任意目标 repo 中。

## 输入
- 第 32 到 40 课中的 schemas、scripts 和 docs
- pack 布局：`AGENTS.md`、`docs/`、`schemas/`、`scripts/`、`bin/`、`README.md`、`VERSION`

## 交付物
- 填充完整布局的 `outputs/agent-workbench-pack/`
- 一个在没有 `--force` 时拒绝覆盖的 `bin/install.sh`（或 `bin/install.py`）
- `VERSION` 文件，以及一份说明保留内容和排除内容的 `README.md`

## 验收标准
- `python3 code/main.py` 以零退出并打印 pack tree
- 重新运行 assembler 是幂等的
- 将 `bin/install.sh` 运行到一个全新的目标中后，会留下一个可工作的 workbench：state、board、rules、scope、init、runner、gate、reviewer、handoff 全部就位

## 范围外
- 每个项目自己的 task 内容。task 属于目标 repo 的 board，而不是 pack。
- Vendor SDK 调用。该 pack 在设计上与 framework 无关。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-workbench-pack.md` - 提取出的 skill
