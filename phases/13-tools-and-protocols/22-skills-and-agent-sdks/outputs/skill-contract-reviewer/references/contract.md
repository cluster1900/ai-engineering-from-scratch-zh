# 可移植契约检查清单

- bundle 是一个包含常规 `SKILL.md` 文件的目录。
- frontmatter 从第一行开始，并包含结束分隔符。
- `name` 必须存在、长度不超过 64 个字符，并且仅使用小写字母、数字和单个连字符。
- `name` 与 bundle 目录名称一致。
- `description` 必须存在、长度不超过 1024 个字符，并说明该 Skill 适用的场景。
- 可选的 `compatibility` 在存在时包含 1 到 500 个字符。
- 可选的 `metadata` 将字符串 key 映射到字符串 value。
- 可选的实验性 `allowed-tools` 是一个非空的、以空格分隔的字符串，其行为已在目标 host 中得到验证。
- 未知的运行时字段与可移植 package 契约分离，并由显式 adapter 处理。
- Markdown 正文包含操作流程。
- 可选的可移植 metadata 与特定于 host 的扩展保持可区分。

通过此检查清单意味着 package 在结构上可被加载，但并不授予文件系统、网络、secret、subprocess 或 Tool 权限。
