# Mission - Capstone：交付一个可复用的 Agent Workbench Pack

## 目标
把前 11 节课组装成一个带版本的 `outputs/agent-workbench-pack/` 目录，并提供一个 installer，可以幂等地把它铺设到任意目标 repo。

## 输入
- Lesson 32 到 40 的 schema、脚本与文档
- Pack 布局：`AGENTS.md`、`docs/`、`schemas/`、`scripts/`、`bin/`、`README.md`、`VERSION`

## 交付物
- 完整布局填充好的 `outputs/agent-workbench-pack/`
- `bin/install.sh`（或 `bin/install.py`），在没有 `--force` 时拒绝覆盖
- 一份 `VERSION` 文件以及一份 `README.md`，说明什么放进去、什么留在外面

## 验收
- `python3 code/main.py` 退出码为 0 并打印 pack 树
- 重跑 assembler 是幂等的
- 把 `bin/install.sh` 装进一个全新目标后，留下一个可工作的 workbench：state、board、rule、scope、init、runner、gate、reviewer、handoff 全部就位

## 范围之外
- 每个项目自身的任务内容。任务归目标 repo 的 board 所有，不放进 pack。
- 厂商 SDK 调用。Pack 在设计上与具体框架解耦。

## 参考
- `docs/en.md` - 完整课程
- `code/main.py` - 参考实现
- `outputs/skill-workbench-pack.md` - 抽取出的 skill
