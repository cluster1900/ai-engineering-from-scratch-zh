# Evidence: cheatsheets/a2a-and-agent-messaging.md

Abbreviations: L19 = phases/13-tools-and-protocols/19-a2a-protocol, F02 = phases/16-multi-agent-and-swarms/02-fipa-acl-heritage, C03 = phases/16-multi-agent-and-swarms/03-communication-protocols, A12 = phases/16-multi-agent-and-swarms/12-a2a-protocol. d = docs/en.md, c = code/main.py.

## 四种协议并排对比 (comparison, 8 rows)
- Primary use: C03/d:561
- Spec format: C03/d:560
- Discovery: C03/d:562
- Identity: C03/d:563
- Audit trail: C03/d:564
- Streaming: C03/d:566
- Unique feature: C03/d:567
- Status: C03/d:569

## 何时选用 (concepts, 7)
- MCP to invoke a specific tool: L19/d:167
- A2A to delegate a whole task: L19/d:167
- A2A + ACP trajectory patterns for audit trails: C03/d:1460-1461
- ANP + A2A when outside your org with no shared infrastructure: C03/d:1462-1466
- A2A + message broker with shared infrastructure: C03/d:1464-1465
- Direct RPC for latency-sensitive micro-calls, lifecycle is async: A12/d:119
- No protocol when agents do not talk: C03/d:1458-1459

## 通过 HTTP+JSON 调用 A2A (architecture, 5 nodes, 4 edges)
- Client sends A2A-Version: 1.0: A12/d:92, A12/c:174
- Agent Card at /.well-known/agent-card.json: A12/d:82-83, A12/c:136-137
- POST /message:send with returnImmediately: A12/d:84, A12/c:186-195
- TaskStore holds state and artifacts: A12/c:49-71, 87-93
- GET /tasks/{id} until a terminal state: A12/d:86-89, A12/c:199-206

## 带暂停的任务生命周期 (flow, 7 steps)
1. SendMessage with no taskId, server creates task: L19/d:85, L19/c:81-93
2. SUBMITTED then WORKING: L19/c:88, 95
3. missing data gives INPUT_REQUIRED with ROLE_AGENT message: L19/c:96-100
4. client sends same taskId and data part: L19/d:82, L19/c:157-162
5. back to WORKING, artifact added: L19/c:95, 109-113
6. COMPLETED, terminal immutable: L19/c:114, C03/d:209
7. follow-up creates new task in same contextId: C03/d:209

## 线上的 A2A 任务 (task-table, 8)
- GET /.well-known/agent-card.json: A12/d:23, 192
- "method": "SendMessage": L19/d:141
- POST /message:send with configuration.returnImmediately: A12/d:92
- GetTask or GET /tasks/{id}: L19/d:85, 128
- SendStreamingMessage or POST /message:stream: L19/d:85, A12/d:94
- SubscribeToTask or /tasks/{id}:subscribe: L19/d:85, A12/d:94
- CancelTask, ListTasks: L19/d:126
- python3 code/main.py: A12/d:156

## Agent Card 与 Message 的结构 (annotated-code, 12 lines)
- name, version, supportedInterfaces url/protocolBinding/protocolVersion: L19/d:37-46
- pick the first supportedInterfaces binding you speak: L19/d:67
- capabilities streaming, pushNotifications: L19/d:47
- securitySchemes bearer httpAuthSecurityScheme: L19/d:48-50
- securityRequirements: L19/d:51
- defaultInputModes, modes are media types: L19/d:52, 67
- skills id summarize_paper, tags: L19/d:54-59
- messageId, role ROLE_USER or ROLE_AGENT: L19/d:89, 100-101
- Part with exactly one content field, text/raw/url/data: L19/d:89-94, 103-105
- no kind field: L19/d:89

## 默认值与数字 (defaults, 6)
- A2A_VERSION "1.0", send A2A-Version: 1.0: L19/c:23, A12/c:21, L19/d:130
- no header read as version 0.3: L19/d:130
- returnImmediately default False, SendMessage blocks: A12/c:157, A12/d:92
- A2A_MEDIA_TYPE "application/a2a+json": A12/c:22
- PORT 8765: A12/c:23
- ANP negotiation max 10 rounds, then timeout: C03/d:548, 551

## FIPA-ACL 渊源 (comparison, 5 rows)
- MCP tools/call to request: F02/d:138
- MCP resources/read to query-ref: F02/d:139
- A2A Task lifecycle to contract-net + request-when: F02/d:140
- A2A streaming events to subscribe/notify: F02/d:141
- NLIP to natural-language content: F02/d:143

## 故障排查 (troubleshooting, 8)
- -32009 Version not supported: L19/c:119-120
- -32601 Method not found, PascalCase names: L19/c:121-122, L19/d:126
- HTTP 400 VERSION_NOT_SUPPORTED: A12/c:128-132
- HTTP 404 TASK_NOT_FOUND: A12/c:143-146
- updates after terminal state dropped, check terminal state: C03/d:1432
- schema drift, version skills and output schemas: C03/d:1430
- semantic drift, JSON Schema on content, typed artifacts: F02/d:126-131
- 50 agents query GET /agents, cache Agent Cards with TTL: C03/d:1438

## 缩写 (glossary, 8)
- A2A Agent2Agent: L19/d:3, C03/d:1498
- ACP with TrajectoryMetadata: C03/d:1499
- ANP did:wba, HPKE E2EE: C03/d:1500
- DID W3C identity on own domain: C03/d:1502
- NLIP Ecma Natural Language Interaction Protocol: A12/d:129
- FIPA standardized ACL in 2000: F02/d:196
- ACL performative + content + metadata: F02/d:197
- KQML 1993, FIPA's predecessor: F02/d:199

## 问答 (qa, 6)
- caller sees task state and artifacts, internals opaque: L19/d:154
- deduplicate on messageId: A12/d:170
- JWS in signatures over RFC 8785 canonical JSON without signatures: L19/d:71
- ACP tool_name, tool_input, tool_output metadata: C03/d:375-389
- fail closed with principle of least trust: C03/d:1434
- Contract Net, Subscribe/Notify, Request-When worth porting: F02/d:116-120
