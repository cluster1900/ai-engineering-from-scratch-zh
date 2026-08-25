# Threat Model

请独立审查以下边界：

- 权限：指令不能改写 host 权限。
- 文件系统：解析目标，并确保其位于 workspace root 内；拒绝通过 symlink 逃逸。
- 命令：接受 argv 数组，拒绝 shell 元字符和破坏性可执行文件，并要求配置可执行文件 allowlist。
- 网络：要求使用 HTTPS 和精确的 origin allowlist。规范化实际端口，使 `https://api.example.test` 与 `https://api.example.test:443` 能够匹配，而端口 `8443` 需要单独的条目。不要接受 URL userinfo 中的凭据。
- 外部内容：将检索到的文本视为数据，绝不能将其视为 policy 或 approval。
- Secrets：检测可能包含 secret 的 payload，但不要记录其值。
- 破坏性操作：根据 host policy 拒绝操作，或要求提供已记录的人工 approval。

`allow` verdict 仅表示模拟请求满足所提供的 policy。此 bundle 不会执行任何操作。
