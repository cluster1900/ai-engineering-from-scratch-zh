# Artifact 与分块

> 任务以 artifact 的形式返回结果，长 artifact 以分块的形式到达，你按 `artifactId` 拼接它们，直到 `lastChunk` 标出结尾。

`test-runner` 在测试套件运行时写日志。你的 planner 想在日志增长时显示它，并在运行结束后保留结论。在流上，日志以一个名为 `test-log.txt` 的 artifact 的五个分块到达。第二个 artifact `summary.json` 一次性到达，其中是 planner 据以行动的计数。

读完本节后，你能重建一个分块的 artifact，说出规范没有规定的部分，并知道该信任哪一份副本。

## 结果就是 artifact {#s-artifact-and-chunks-results-are-artifacts}

**Artifact：** agent 作为任务结果产生的输出，由 part 组成。它可以是文档、图像或结构化数据 {{spec §2.2}}。有两个字段是 REQUIRED：`artifactId`，它在任务内必须唯一；以及 `parts`，它必须至少包含一个 part {{proto Artifact}}。可选字段是 `name`、`description`、`metadata` 和 `extensions`。

结果放在 artifact 中，交谈放在消息中，这是[核心规则](#s-what-a2a-standardizes)之一：消息不应承载任务的输出 {{spec §3.7}}。

## 流上的分块 {#s-artifact-and-chunks-chunks-on-the-stream}

在流上，artifact 放在 `artifactUpdate` 事件中传输。每个 `TaskArtifactUpdateEvent` 都带有 `taskId`、`contextId` 和 `artifact`，全部是 REQUIRED，另有两个可选标志 {{proto TaskArtifactUpdateEvent}}。`append` 为 true 时，内容属于之前到达的同一 id 的 artifact 的末尾。`lastChunk` 为 true 时，事件带有该 artifact 的最后一个分块 {{proto TaskArtifactUpdateEvent}}。

```listing
title: four of the six artifact frames
source: capture/out/05-streaming.http
lang: sse
note: Frames 3, 4, 7, and 8 of the stream. Each frame loses its JSON-RPC envelope, taskId, and contextId. Frames 5 and 6 are cut whole, and so is the failure list in summary.json.
---
data: {…"artifactUpdate": {…"artifact": {"artifactId": "test-log", "name": "test-log.txt", "parts": [{"text": "collected 12 items\n"}]}}}}

data: {…"artifactUpdate": {…"artifact": {"artifactId": "test-log", "parts": [{"text": "tests/test_charges.py ........  [ 66%]\n"}]}, "append": true}}}

…

data: {…"artifactUpdate": {…"artifact": {"artifactId": "test-log", "parts": [{"text": "1 failed, 11 passed in 4.21s\n"}]}, "append": true, "lastChunk": true}}}

data: {…"artifactUpdate": {…"artifact": {"artifactId": "summary", "name": "summary.json", "parts": [{"data": {"passed": 11, "failed": 1, …}, "mediaType": "application/json"}]}, "lastChunk": true}}}
```

[图](#fig-artifact-chunks)把这次运行的全部九帧与每个 artifact 帧对存储的任务所做的事对应起来。

```figure
id: fig-artifact-chunks
kind: structure
title: five chunks become one stored artifact
claim: The five chunks of `test-log.txt` become five parts of one stored artifact in frame order, and `lastChunk` ends that artifact while the stream continues.
caption: Top, the nine frames of the streaming capture on the kit clock. Frames 1, 2, and 9 sit at their timestamps, and frames 3 to 8 are spaced evenly between. Middle, what frames 3 to 8 carry and what each does to the stored task. Bottom, the stored test-log.txt as GetTask returns it in the polling capture. Parts 1 and 2 are the progress lines of the two test files, given in full in the capture.
```

`lastChunk` 只结束一个 artifact，不结束别的：在这个流上，它之后还有两帧。artifact 事件没有时间戳字段，所以分块之间唯一的顺序就是流的顺序，每种绑定都必须保持这个顺序 {{spec §3.5.2}}。

## 拼接分块 {#s-artifact-and-chunks-joining-the-chunks}

kit 和参考 SDK 用同样的方式重建 artifact。它们找到具有相同 `artifactId` 的已存储 artifact，如果 `append` 为 true，就把新的 part 加到它的 `parts` 中。如果没有 `append`，它们会替换整个 artifact，或者在 id 是新的时添加它（[kit 的服务器代码](manuals/a2a-101/capture/a2a_ref.py) {{sdk src/a2a/server/tasks/task_manager.py}}）。五行日志仍是五个 `text` part，所以按顺序拼接它们的文本就得到文件。

规范没有说明 `append` 对一个服务器从未见过的 id 意味着什么，各实现的做法也不一致：

| 实现 | 对未知 `artifactId` 的 `append: true` | 是否读取 `lastChunk` |
|---|---|---|
| a2a-python | 抛出 `InvalidAgentResponseError` {{sdk src/a2a/server/tasks/task_manager.py}} | 否 |
| a2a-go | 报错，任务以 `TASK_STATE_FAILED` 结束且没有原因 {{sdk-go a2aevent/event.go at v2.6.0}} | 否 |
| a2a-java | 丢弃该分块，记录一条警告，任务保持不变 {{sdk-java sdk/spec/util/Utils.java at v1.4.0.Final}} | 否 |
| a2a-js | 把该分块存为一个新的 artifact {{sdk-js src/server/result_manager.ts at v1.3.0}} | 否 |
| a2a-dotnet | 把该分块存为一个新的 artifact {{sdk-dotnet src/A2A/Server/TaskProjection.cs at v1.0.0-preview2}} | 否 |
| a2a-rs | 返回 `InvalidAgentResponseError`，任务保持它的上一个状态 {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}} | 否 |
| kit | 开始一个新的 artifact（[kit 说明](manuals/a2a-101/capture/README.md)） | 否 |

所以同一个分块可能让任务失败、消失，或者变成一个新的 artifact。每个 artifact 的第一个分块都不带 `append` 发送。规范也没有说明之后的 metadata 是合并还是替换。

不要从迁移指南中取字段名（[冲突 D9 和 D10](#s-ref-sources)）。它把事件包装为 `taskArtifactUpdate`，并给它一个 `index` 字段 {{docs whats-new-v1}}。proto 把这个包装命名为 `artifactUpdate` {{proto StreamResponse}}，它的事件也没有 `index` 字段 {{proto TaskArtifactUpdateEvent}}。[PR #2056](https://github.com/a2aproject/A2A/pull/2056) 在 main 上修正了包装名，但保留了关于 `index` 的说法，目前还没有 release 包含这个修复。

## 信任存储的副本 {#s-artifact-and-chunks-trust-the-stored-copy}

`GetTask` 返回带有全部五个 part 的 `test-log.txt`，如[图](#fig-artifact-chunks)底部所示，阻塞的 `SendMessage` 也返回同样合并后的 artifact {{spec §3.2.2}}。

连接断开后，错过的分块永远不会重放。`SubscribeToTask` 转而以一个已经包含它们的 `Task` 快照开始 {{spec §3.1.6}}。在应用新的分块之前，先用快照中的 artifact 替换你的副本，[SendStreamingMessage 与 SubscribeToTask](#s-streaming-and-subscribe-to-task) 一节展示了这一点。

artifact 也可能没有最后一个分块就结束：`10-cancel.http` 中被取消的运行存储了日志的两个 part，而 `lastChunk` 始终没有到达。存储的 `Artifact` 没有表示它已完整的字段，所以要根据任务的状态来判断。

```takeaways
- 以带有稳定 `artifactId` 值的 artifact 返回结果，把状态消息留给人看。
- 按 `artifactId` 重建：遇到不带 `append` 的分块就替换，遇到带 `append` 的分块就添加 part。
- 一个 artifact 的第一个分块不带 `append` 发送，因为各服务器对未知 id 的处理不一致。
- 重新连接后，在应用新的分块之前，先从 `Task` 快照取得每个 artifact。
```

Sources: spec §2.2, §3.1.6, §3.2.2, §3.5.2, §3.7 (research/sources/specification.md); proto Artifact, TaskArtifactUpdateEvent, StreamResponse (research/sources/a2a.proto); docs docs/whats-new-v1.md at v1.0.1; sdk src/a2a/server/tasks/task_manager.py at a2a-python 1.2.2; sdk-go a2aevent/event.go and internal/taskupdate/manager.go at v2.6.0; sdk-java spec/src/main/java/org/a2aproject/sdk/spec/util/Utils.java at v1.4.0.Final; sdk-js src/server/result_manager.ts at v1.3.0; sdk-dotnet src/A2A/Server/TaskProjection.cs at v1.0.0-preview2; sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1; capture/out/04-polling.http, 05-streaming.http, 05-streaming.events.json, 10-cancel.http, 14-resubscribe.http, 14-resubscribe.events.json; capture/a2a_ref.py, capture/planner.py, capture/README.md
