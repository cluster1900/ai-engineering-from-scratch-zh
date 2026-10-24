# 证据：cheatsheets/a2a.md

缩写：A = manuals/a2a-101/sections，C = manuals/a2a-101/capture/out。

## 协议架构（architecture，6 个节点）
- planner，读取 cards 的 client： A/1-1-what-a2a-standardizes.md:9
- 位于 /.well-known/agent-card.json 的 AgentCard： A/2-2-discovery-and-supported-interfaces.md:20
- 位于 /a2a/jsonrpc 的 JSON-RPC： A/2-1-agentcard-fields.md:40-44
- handler，先检查再交给 executor： A/7-2-a-server.md:14
- 位于 /a2a/rest 的 HTTP+JSON： A/5-2-http-json.md:12
- task store，每个 task 的记录： A/3-4-task-and-task-state.md:10

## 发送并读取 task（task-table，5 行）
- 用 GET 读取 card： A/2-2-discovery-and-supported-interfaces.md:22-26
- SendMessage method： A/5-1-json-rpc.md:38
- A2A-Version header： A/5-4-version-and-extension-headers.md:24
- configuration 中的 returnImmediately： A/4-1-send-message.md:24
- SendStreamingMessage method： A/4-5-streaming-and-subscribe-to-task.md:12

## HTTP+JSON 上的命令（command-table，4 行）
- POST /a2a/rest/message:send： A/5-2-http-json.md:14, C/16-rest-binding.http:1
- POST /a2a/rest/tasks/<task id>:cancel： A/4-4-cancel-task-and-terminal-states.md:30, C/16-rest-binding.http:20
- GET /.well-known/agent-card.json： A/2-2-discovery-and-supported-interfaces.md:22
- 取消 terminal task 会返回 task error： A/5-5-errors.md:70-74

## 设置与默认值（defaults，5 行）
- returnImmediately 默认 false： A/4-1-send-message.md:24
- historyLength 未设置时由 server 决定，0 表示不返回： A/4-3-get-task-and-list-tasks.md:17-21
- pageSize 50，最大 100： A/4-3-get-task-and-list-tasks.md:60-62
- includeArtifacts false： A/4-3-get-task-and-list-tasks.md:64
- 每个请求都带 A2A-Version 1.0： A/5-4-version-and-extension-headers.md:20

## 比较三种 bindings（comparison，5 行）
- 操作由 method、route 或 rpc 命名： A/5-1-json-rpc.md:20, A/5-2-http-json.md:10, A/5-3-grpc.md:14
- 发送位置： A/5-1-json-rpc.md:30, A/5-3-grpc.md:12
- 各 binding 中的 stream frame 形态： A/5-1-json-rpc.md:60, A/5-2-http-json.md:50, A/5-3-grpc.md:40
- TaskNotFoundError 错误码： A/5-5-errors.md:20-26
- gRPC 的版本 metadata key： A/5-4-version-and-extension-headers.md:14

## Task 状态（concepts，4 条）
- active 状态： A/3-4-task-and-task-state.md:40-46
- interrupted 状态： A/4-2-input-required-and-auth-required.md:12
- terminal 状态： A/4-4-cancel-task-and-terminal-states.md:10
- 从不发送 TASK_STATE_UNSPECIFIED： A/3-4-task-and-task-state.md:52

## 一个 task 的完整步骤（flow，6 步）
- send 会阻塞，client 只生成 messageId： A/4-1-send-message.md:18, A/1-1-what-a2a-standardizes.md:37
- server 生成 taskId 和 contextId： A/3-1-message.md:31
- 阻塞调用返回处于 TASK_STATE_INPUT_REQUIRED 的 task 及其提问： A/4-2-input-required-and-auth-required.md:13, 17
- client 用带相同 ids 的新 SendMessage 作答： A/4-2-input-required-and-auth-required.md:44
- 第二次回复返回已完成的同一 task 及其 artifact： A/4-2-input-required-and-auth-required.md:44
- GetTask 接收 task id 并返回已存储的 task： A/4-3-get-task-and-list-tasks.md:11

## JSON-RPC 请求（annotated-code，10 行）
- POST 到唯一 URL： C/02-message-reply.http:2, A/5-1-json-rpc.md:5
- JSON 请求体： C/02-message-reply.http:4
- 每个请求都带 A2A-Version： C/02-message-reply.http:5, A/5-4-version-and-extension-headers.md:17
- jsonrpc 始终为 2.0，回复会重复 id： C/02-message-reply.http:8-9, A/5-1-json-rpc.md:13-15
- method 保存操作名： C/02-message-reply.http:10, A/5-1-json-rpc.md:13
- messageId、role 和 parts 为必填： C/02-message-reply.http:13-19, A/3-1-message.md:11

## 故障排查（troubleshooting，6 行）
- 缺少版本 header 时返回 -32009： A/5-4-version-and-extension-headers.md:50-62
- 使用 message/send 时返回 -32601： C/11-errors.http:60-70, A/7-4-from-0-3-to-1-0.md:22
- 对已完成 task 返回 -32004，改用 referenceTaskIds： A/4-4-cancel-task-and-terminal-states.md:70, A/3-5-context-id.md:40
- -32003 不支持 push config： A/2-2-discovery-and-supported-interfaces.md:60-66
- messageId 缺失导致 -32602 BadRequest： A/5-5-errors.md:40-56
- 未知 task 返回 -32001 或 404： A/5-5-errors.md:14, A/5-5-errors.md:72

## 问答（qa，3 条）
- returnImmediately 默认为 false： A/4-1-send-message.md:24
- 结果放在 artifacts 中： A/3-3-artifact-and-chunks.md:10
- 其他调用者的 task 返回 TaskNotFoundError： A/6-1-security-schemes-and-in-task-authorization.md:40

## 提示（tips，4 条）
- 每条 message 生成新的 messageId： A/3-1-message.md:12, A/3-1-message.md:40
- client 用 ROLE_USER，server 用 ROLE_AGENT： A/3-1-message.md:20
- 状态检查时用 historyLength 0： A/4-3-get-task-and-list-tasks.md:14-18
- 调用可选功能前读取 card 并检查 capability flags： A/2-2-discovery-and-supported-interfaces.md:60
