# 权限、--safety 和 hook

> 拒绝、允许和询问模式，然后是安全模式，然后是 hook，共同决定一次工具调用是否执行，文档说它们都不是安全边界。

你的智能体在 CI 里以 `--exec` 运行，没有人看着终端。你想让 `echo` 运行、`rm` 永不运行，其他每次调用在标签不是 `safe` 时默认拒绝。智能体文件和一个标志就能表达这一点，但只对经过 `docker-agent` 的调用有效。

读完本节后，你能编写 `permissions` 模式、为无人值守运行挑选 `--safety` 模式，并预测 `pre_tool_use` hook 会改变什么。

```rule
label: 权限不是什么
source: docs-agent Permissions
---
客户端强制执行权限。它们能阻止误操作，但对你不信任的智能体并不是安全边界。
```

同一页说 `restricted` 模式是防止不想要的工具调用的额外一层，不是安全边界 {{docs-agent Permissions}}。要隔离，把智能体放在沙箱里运行，如 [docker-agent run --sandbox](#s-docker-agent-run-sandbox-end-to-end) 所示。

## 受守护的智能体 {#s-permissions-safety-and-hooks-the-guarded-agent}

```listing
title: 一个 shell toolset、一个 hook 和两条模式
source: capture/fixtures/agents/guarded.yaml
lang: yaml
note: models 块已删节。
---
version: "16"

agents:
  root:
    model: local
    description: Runs shell commands under a permission list and a hook.
    instruction: |
      Run exactly the shell commands the user lists, one tool call per
      command, in the given order. Then report each command and its
      result or refusal in one line each.
    max_iterations: 8
    toolsets:
      - type: shell
    hooks:
      pre_tool_use:
        - matcher: shell
          preempt_yolo: true
          hooks:
            - type: command
              command: ./fixtures/hooks/log-hook.sh
              env:
                M101_HOOK_LOG: ./work/hook-stdin.jsonl

permissions:
  allow:
    - "shell:cmd=echo*"
  deny:
    - "shell:cmd=rm*"
…
```

**权限模式：** 带可选参数条件的工具名 glob，例如 `shell:cmd=rm*`，出现在 `allow`、`ask` 或 `deny` 列表中。智能体文件中的模式与用户配置里 `settings.permissions` 的模式合并，任一方的 deny 都会胜出 {{docs-agent Permissions}}。

**安全模式：** 运行时对没有权限模式匹配的调用做什么。它读取调用的标签 `safe`、`destructive` 或 `unknown`，由安全模式决定 {{docs-agent Permissions}}：

| 模式 | `safe` | `destructive` | `unknown` |
|---|---|---|---|
| `strict` | ask | ask | ask |
| `balanced` | allow | ask | ask |
| `restricted` | allow | deny | deny |
| `autonomous` | allow | allow | allow |

`--yolo` 与 `--safety autonomous` 相同 {{help-agent docker-agent run}}。从未选择安全模式的会话保持旧默认：只读工具不提示就运行，其他每个工具都会询问 {{docs-agent Permissions}}。这就是为什么 [run、new 和 doctor](#s-docker-agent-run-new-and-doctor) 中的 `wc -l` 调用虽然标签是 `safe` 仍会询问，因为 `shell` 带有 `readOnlyHint: false`。

## 两种模式下的三次调用 {#s-permissions-safety-and-hooks-three-calls-in-two-modes}

kit 在 `--safety strict` 和 `--safety restricted` 下发送了相同的三条消息，每条消息一个命令，没有终端来回答提示。

| 命令 | 由什么决定 | `strict` | `restricted` |
|---|---|---|---|
| `echo m101-ok` | `allow: shell:cmd=echo*` | 已运行，`m101-ok` | 已运行，`m101-ok` |
| `pwd` | 无匹配模式，标签 `safe` | 询问，随后 "The user rejected the tool call." | 已运行，`$CAPTURE` |
| `rm -rf work/m101-nothing` | `deny: shell:cmd=rm*` | 报错 "Tool 'shell' is denied by permissions configuration." | 同样的拒绝 |

权限模式在两种安全模式下行为相同，只有未匹配的 `pwd` 变了。在 `restricted` 下，该安全模式允许了 `safe` 标签。在 `strict` 下，运行时抛出 `tool_call_confirmation`，空终端把它变成了拒绝（`20-strict.txt`、`20-restricted.txt`）。

## 顺序，以及 hook 能改变什么 {#s-permissions-safety-and-hooks-the-order-and-what-a-hook-can-change}

文档为每次调用给出一个顺序 {{docs-agent Permissions}}：

1. `preempt_yolo` 的 `pre_tool_use` hook 先运行，没有任何安全模式或允许规则能绕过它们的 deny 或 ask。
2. `deny` 模式阻断该调用。
3. `allow` 模式批准它。
4. `ask` 模式提示用户。
5. 没有匹配时，安全模式作用于调用的标签。
6. 在安全模式询问时，默认 `pre_tool_use` hook 可以 allow、deny 或 ask。
7. 没有决定时，询问用户。

**Hook：** 在命名事件上运行的 `command`、`builtin`、`model` 或 `evaluator` 条目 {{schema HookDefinition}}。`command` hook 从 stdin 读取一个 JSON 对象，可以用 stdout 上的 JSON 回答。退出码 2 会阻断，默认超时是 60 秒 {{docs-agent Hooks}}。

```listing
title: hook 为 rm 调用收到的内容
source: capture/out/20-hook-stdin.jsonl
lang: jsonl
note: 三行中的第三行，restricted 运行的每次调用一行。
---
{"agent_name": "root", "cwd": "$CAPTURE", "hook_event_name": "pre_tool_use", "safety_policy": "restricted", "session_id": "<uuid>", "tool_input": {"cmd": "rm -rf work/m101-nothing"}, "tool_name": "shell", "tool_use_id": "<call-id>"}
```

`log-hook.sh` 把那一行追加到文件，并打印 `"permission_decision":"allow"`。流把它显示为 `pre_tool_use_pre_yolo`，三次调用都带 `"allowed": true`，但 `rm` 仍被拒绝，strict 仍为 `pwd` 询问。对抢占 hook 来说，allow 裁决只是建议 {{schema HookMatcherConfig}}。它的 deny 或 ask 会结束该调用。

每次调用还有两个 hook 运行：`tool_input_transform` 和 `tool_response_transform` 出现在每个流中，尽管没有任何文件声明它们。`redact_secrets` 默认为 `true`，会在这些事件上安装一个 builtin {{schema AgentConfig}}。hook 也可以一次运行多次。当一条消息要求三个命令时，hook 一次运行了三次。两次运行一起追加到日志文件（[kit 说明](manuals/docker-sandboxes-101/capture/README.md)）。每条记录用一次写入完成。

```figure
id: fig-5-5
kind: decision
title: 三次 shell 调用穿过批准顺序
claim: 抢占 hook 对每次调用的允许只是建议，权限模式决定 `rm` 和 `echo`，安全模式单独决定 `pwd`.
caption: 从上往下读。每个问题框是顺序中的一个阶段，它右边的框是 capture 在该阶段看到的内容。玫瑰色是拒绝或回绝，橄榄色是已运行的命令。 From capture/fixtures/agents/guarded.yaml, capture/out/20-strict.ndjson, 20-restricted.ndjson, and 20-hook-stdin.jsonl.
```

```takeaways
- 无人值守的智能体用 `--safety restricted` 运行，这样不匹配且不安全的调用会默认拒绝。
- 把破坏性命令放进 `deny`，因为没有任何安全模式、也没有任何 hook 的 allow 能覆盖 deny。
- 用 `preempt_yolo` hook 来 deny 或 ask，绝不要用来批准。
- 不信任智能体时把它放在沙箱里运行，因为权限在客户端执行。
```

Sources: docs-agent Permissions, Hooks (research/sources/docs-docker-agent.md, pages configuration/permissions, configuration/hooks); schema AgentConfig, HookMatcherConfig, HookDefinition (research/sources/agent-schema.json); help-agent docker-agent run (research/sources/help-docker-agent.md); capture/README.md; capture/fixtures/agents/guarded.yaml; capture/fixtures/hooks/log-hook.sh; capture/out/18-transcript.txt, 20-strict.txt, 20-strict.ndjson, 20-restricted.txt, 20-restricted.ndjson, 20-hook-stdin.jsonl
