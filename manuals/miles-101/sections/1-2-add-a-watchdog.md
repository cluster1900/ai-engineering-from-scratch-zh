# 放手让训练运行之前，先加一个 watchdog

> rollout 引擎挂掉时，Miles 训练不会失败，所以必须用一个小脚本替你停掉它。

我们让一次训练自己运行了一个小时。回来时，GPU 处于空闲状态，日志已增长到 147 MB。rollout 引擎在启动阶段就挂掉了，此后训练一直在向它发送请求。

读完本节后，你能认出引擎已经挂掉的训练。你还能启动一个 watchdog，在几分钟内停掉这样的训练。

**我们的结果：** 一次引擎挂掉的训练在 63 分钟内记录了 200,533 条 HTTP 503 错误，却从未失败。在针对同一错误的测试中，watchdog 在 183 s 内停掉了训练。重放一次健康训练的结果表明，连续六次检查太少，所以脚本会等到连续十次。

## 引擎挂掉是什么样子 {#s-add-a-watchdog-what-a-dead-engine-looks-like}

下面这次训练使用了这块 GPU 无法运行的设置。rollout 引擎在启动阶段停止了。训练器没有停止，并且在 63 分钟里一直向引擎发送请求：

```listing
title: an engine that died, and a run that did not notice
source: capture/gpu/out-gb10/engine-died-503.log
lang: text
note: The first three lines are the engine failure. The last two are the first and the last error from the trainer side, 63 minutes apart.
---
[2026-10-17 21:03:03] Enable deterministic inference because of legacy rl_on_policy_target.
AssertionError: FlashAttention v3 Backend requires SM>=80 and SM<=90. Please use `--attention-backend flashinfer`.
[2026-10-17 21:03:24] Received sigquit from a child process. It usually means the child failed.
[2026-10-17 21:03:30.637 rollout_executor] http_utils.py:241 - Error: Server error '503 Service Unavailable' for url 'http://172.17.0.3:20035/generate'
[2026-10-17 22:06:46.137 rollout_executor] http_utils.py:241 - Error: Server error '503 Service Unavailable' for url 'http://172.17.0.3:20035/generate'
```

```listing
title: how many errors the run wrote
source: capture/gpu/out-gb10/engine-died-count.txt
lang: text
note: One grep over the full log of that run.
---
$ grep -c "503 Service Unavailable" true-on-policy-fa3.log
200533
```

这次训练写下了 200,533 行错误，却从未报告失败。

**Router（路由器）：** 一个小服务，把每个 rollout 请求转发给一个引擎。[第 8.6 节](#s-which-router-to-use)解释了它。

**503 Service Unavailable：** 没有 rollout 引擎能接受请求时，router 返回的 HTTP 状态码。

```figure
id: fig-1-2
kind: timeline
title: A dead engine does not stop the job
claim: Without a watchdog, a dead engine left the job running for 63 minutes with an idle GPU.
caption: The top track is our failed run. The bottom track is the watchdog test on a container that writes the same error.
```

## 为什么 watchdog 要等十次检查 {#s-add-a-watchdog-why-the-watchdog-waits-for-ten-checks}

在我们 17 次正常结束的训练中，日志里完全没有 `503 Service Unavailable` 行。我们在[第 3.1 节](#s-train-math-on-gsm8k)中每个 prompt 16 个回答的训练记录了 22,357 条这样的行。它们成批出现，每批最长约 60 s，一分钟内最多 2,209 条。客户端重试了每个请求，训练完成了所有步。

在失败的训练中，错误从未停止。63 分钟里，每一整分钟都至少有 2,669 条。

只看数量无法区分这两次训练，但看时间可以。watchdog 每 30 s 统计一次最近 60 s 内的错误。只有在连续设定次数的检查中这个数都超过 100 时，它才停掉训练。

```listing
title: the watchdog rule replayed on a healthy run
source: capture/gpu/out-gb10/503-bursts.txt
lang: text
note: The real error times of the 16-answer run, for each of the 30 start times of the checks. The last column is a dead engine that never stops writing the error.
---
$ python3 watchdog_replay.py out-gb10/e2-n16-503-per-second.txt
healthy run: 22357 errors from 2026-10-22 07:16:29, checks every 30 s over the last 60 s, limit 100
checks  healthy offsets stopped  most checks in a row  dead engine stopped after
     6  17 of 30                    6                     153 to 182 s
     8   0 of 30                    6                     213 to 242 s
    10   0 of 30                    6                     273 to 302 s
```

**我们测量了**这条规则在那次健康训练的真实错误时间上的表现。用 6 次检查时，30 种情况中有 17 种停掉了训练，因为有两批错误相隔仅 45 s。没有任何情况连续超过 6 次检查。用 10 次检查时，没有任何情况停掉这次健康训练，而引擎挂掉的训练大约五分钟就会被停掉。

## 启动 watchdog {#s-add-a-watchdog-start-the-watchdog}

脚本每 30 秒读取一次容器日志的最近 60 秒。当连续设定次数的检查中计数都超过上限时，它停掉容器。

如果 Docker 本身出错，脚本会说明。无法列出容器时，它以 2 退出。日志读取失败不算作一次检查。上限或检查次数无效时，脚本也以 2 退出：无效指不是整数的值，或者 0 次检查。

第三个值是连续检查的次数。它的默认值是 10，在我们的重放中健康训练从未达到这个次数：

```bash
#!/bin/sh
name=${1:-miles-plain}
limit=${2:-100}
checks=${3:-10}
for value in "$limit" "$checks"; do
  case $value in
    ''|*[!0-9]*|??????????*) echo "limit and checks must be whole numbers below one billion"; exit 2;;
  esac
done
if [ "$checks" -lt 1 ]; then
  echo "checks must be 1 or more"
  exit 2
fi
strikes=0
while :; do
  if ! running=$(docker ps -q --filter "name=^${name}$"); then
    echo "$(date -u +%FT%TZ) $name: docker ps failed, the watchdog cannot see the run and stops"
    exit 2
  fi
  [ -n "$running" ] || break
  if logs=$(docker logs --since 60s "$name" 2>&1); then
    errors=$(printf '%s\n' "$logs" | grep -c "503 Service Unavailable")
    if [ "$errors" -gt "$limit" ]; then
      strikes=$((strikes + 1))
    else
      strikes=0
    fi
  else
    echo "$(date -u +%FT%TZ) $name: docker logs failed, this check does not count"
  fi
  if [ "$strikes" -ge "$checks" ]; then
    echo "$(date -u +%FT%TZ) $name: more than $limit errors from the rollout engine in each of $checks checks, last $errors in 60 s, stopping the run"
    docker stop "$name"
    exit 1
  fi
  sleep 30
done
echo "$(date -u +%FT%TZ) $name: the run ended"
```

把它保存为 `~/miles-lab/watchdog.sh`，或者下载同一个脚本：

```bash
curl -fsSL -o ~/miles-lab/watchdog.sh https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/manuals/miles-101/capture/gpu/watchdog.sh
```

训练启动后立即在第二个终端里启动它，并使用[第 1.1 节](#s-run-grpo-on-one-gpu)中的容器名：

```bash
sh ~/miles-lab/watchdog.sh miles-plain 100 10
```

## 先测试 watchdog {#s-add-a-watchdog-test-the-watchdog-first}

在两个故意打印该错误的容器上测试它。它们不需要 GPU。第一个每秒打印十行错误，永不停止，就像挂掉的引擎：

```listing
title: the watchdog stops a container that never stops printing the error
source: capture/gpu/out-gb10/watchdog-test.txt
lang: text
note: The container prints ten error lines each second.
---
$ sh capture/gpu/watchdog.sh wd-dead 100
2026-10-22T15:41:09Z wd-dead: more than 100 errors from the rollout engine in each of 6 checks, last 578 in 60 s, stopping the run
wd-dead
$ echo $?
1
```

watchdog 在容器启动 183 s 后停掉了它，并以 1 退出。我们在把默认值提高到 10 之前做了这个测试，所以它用的是 6 次检查。用 10 次检查时，同样的规则还需要四次检查，所以大约晚两分钟才停止。一个接连启动多次训练的脚本可以读取这个退出码，跳到下一次训练。退出码 2 表示 watchdog 失去了与 Docker 的连接，训练没有保护。

第二个容器打印错误 60 s，然后安静两分钟。它这样重复三次，就像繁忙引擎的错误批次。watchdog 让它一直运行到 541 s 后结束，并以 0 退出。它两分钟的安静间隔比真实的 45 s 间隔更长，所以也要用上面的重放来测试。

## 保护 GPU 温度 {#s-add-a-watchdog-guard-the-gpu-heat}

我们的 GB10 在数小时的负载下一次又一次达到 84 C。[前言](#s-front-how-we-tested-it)中的 heat guard 在五天里暂停了我们的训练 1,005 次。在 GB10 上，或者在任何让训练独自运行数小时会发热的 GPU 上运行它。只有几步的短训练不需要它。

下载我们运行的脚本，在主机上（而不是容器里）的第三个终端中启动它。`rm` 部分会删除早先会话可能遗留的停止文件，因为该文件存在时脚本会立即退出。只有当你没有任何队列在用这个文件来停止 guard 时才删除它。这些命令遇到第一个失败就会停止，所以下载失败时不会启动旧副本：

```bash
curl -fsSL -o ~/miles-lab/heat-guard.sh https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/manuals/miles-101/capture/gpu/heat-guard.sh \
  && rm -f ~/miles-lab/queue2.done \
  && sh ~/miles-lab/heat-guard.sh
```

脚本每 5 s 用 `nvidia-smi` 读取一次 GPU 温度。达到 84 C 时，它暂停 `radixark/miles:latest` 镜像的第一个运行中的容器。温度降到 74 C 或以下且至少经过 45 s 后，或者最多 120 s 后，它恢复该容器。每次暂停和恢复都写入 `~/miles-lab/runs/thermostat.log`。

用 Ctrl+C 停止脚本。它在退出前会恢复它暂停过的容器，所以不会有训练一直处于暂停状态。在我们的检查中，暂停期间按 Ctrl+C 会在 5 s 内恢复训练。文件 `~/miles-lab/queue2.done` 存在时它也会停止，我们的训练队列就是这样停止它的。

比较耗时时要读暂停日志。与暂停重叠的步耗时更长，原因并不是工作量。[第 5.3 节](#s-repeat-a-run)介绍如何只为干净步计时。

watchdog 只负责停掉训练。要查明引擎为什么挂掉，读第一条错误上方的引擎日志行。[第 7.1 节](#s-troubleshoot-by-symptom)列出了我们遇到的原因。

```takeaways
- 每次让训练独自运行时，都在第二个终端里启动 watchdog。
- 用 10 次检查运行 watchdog，因为健康训练的错误批次可能相隔仅 45 s。
- 先在一个假容器上测试 watchdog，再信任它。
- 在会发热的 GPU 上运行 heat guard，并保留它的暂停日志。
- 读第一条 503 错误上方的引擎日志行来找原因。
```

Sources: capture/gpu/watchdog.sh; capture/gpu/heat-guard.sh; capture/gpu/out-gb10/thermostat.log; capture/gpu/watchdog_replay.py; capture/gpu/out-gb10/503-bursts.txt; capture/gpu/out-gb10/e2-n16-503-per-second.txt; capture/gpu/out-gb10/engine-died-503.log; capture/gpu/out-gb10/engine-died-count.txt; capture/gpu/out-gb10/watchdog-test.txt; capture/gpu/summary/miles-gb10-lab.json (excluded runs); Miles rollout client at main 08752a12.
