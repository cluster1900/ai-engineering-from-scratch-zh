# 按用途分类的参数

> 本手册使用的 Miles 参数，按它们的用途分组。

取值一列给出我们实验运行中设置过的值。短横线表示我们的运行没有设置该参数。

## 模型和数据 {#s-ref-flags-by-job-model-and-data}

| 参数 | 我们的取值 | 它设置什么 |
|---|---|---|
| `--hf-checkpoint` | Qwen3-0.6B 文件夹 | 引擎和 FSDP 训练器加载的模型 |
| `--prompt-data` | GSM8K 训练文件 | 提示 |
| `--input-key`, `--label-key` | `messages`, `label` | 每个数据行的字段 |
| `--apply-chat-template` | 开启 | 用模型的聊天模板包装每个提示 |
| `--rollout-shuffle` | 开启 | 打乱提示顺序 |

## Rollout {#s-ref-flags-by-job-rollout}

| 参数 | 我们的取值 | 它设置什么 |
|---|---|---|
| `--num-rollout` | 12、24 或 48，模型规模运行中为 4 | 步数 |
| `--rollout-batch-size` | 32 | 每步的提示数 |
| `--n-samples-per-prompt` | 8 | 每个提示的回答数 |
| `--rollout-max-response-len` | 1024，模型规模运行中为 256 | 以 token 计的回答上限 |
| `--rollout-temperature` | 1 | 采样温度 |
| `--rollout-top-p`, `--rollout-top-k` | 一次运行中为 0.95、64 | 采样器，设置时还启用采样重放 |
| `--rollout-num-gpus-per-engine` | 1 | 每个引擎的 GPU 数 |
| `--rollout-seed` | 运行的种子 | 采样种子 |
| `--partial-rollout` | - | 在之后的步中继续长回答 |
| `--over-sampling-batch-size` | - | 已完成的组不够时新提示的批次 |
| `--dynamic-sampling-filter-path` | - | 组过滤器 |

## 奖励和损失 {#s-ref-flags-by-job-reward-and-loss}

| 参数 | 我们的取值 | 它设置什么 |
|---|---|---|
| `--rm-type` | `math` | 内置奖励 |
| `--custom-rm-path` | - | 你自己的奖励函数 |
| `--advantage-estimator` | `grpo` | 优势计算方法 |
| `--global-batch-size` | 256 | 每个优化器步的样本数 |
| `--eps-clip`, `--eps-clip-high` | 0.2, 0.28 | 更新的裁剪范围 |
| `--kl-loss-coef`, `--kl-coef`, `--entropy-coef` | 0 | KL 项和熵项 |
| `--lr` | 1e-6 | 学习率，恒定 |
| `--use-tis`, `--tis-clip` | - | 截断重要性采样 |
| `--use-rollout-routing-replay` | - | MoE 模型的路由重放 |

## 布局和内存 {#s-ref-flags-by-job-placement-and-memory}

| 参数 | 我们的取值 | 它设置什么 |
|---|---|---|
| `--colocate` | 开启 | 训练器和引擎在同一块 GPU 上，并启用卸载 |
| `--train-backend` | `fsdp` | 训练器 |
| `--actor-num-nodes`, `--actor-num-gpus-per-node` | 1, 1 | 训练器 GPU |
| `--sglang-mem-fraction-static` | 0.4，三次运行中为 0.25，一次 4B 运行中为 0.2 | 引擎占用的 GPU 内存比例 |
| `--offload-rollout-level` | 默认，一次运行中为 `kv_cache` | 引擎在阶段之间交还什么 |
| `--no-offload-rollout`, `--no-offload-train` | 分别在两次运行和一次运行中 | 让一边保持加载 |
| `--update-weight-buffer-size` | 536870912 | 权重更新的桶大小，以字节计 |
| `--update-weight-transfer-mode` | - | 拆分布局中的权重传输方法 |

## 引擎 {#s-ref-flags-by-job-engine}

| 参数 | 我们的取值 | 它设置什么 |
|---|---|---|
| `--sglang-attention-backend` | 默认，或 `triton`、`flashinfer` | 引擎的注意力 kernel |
| `--sglang-enable-deterministic-inference` | 在三次运行中 | 确定性的引擎 kernel |
| `--sglang-enable-metrics` | 开启 | 引擎指标 |
| `--use-session-server` | - | 面向 agent 的 token 进、token 出会话 |
| `--use-miles-router` | - | 用 Python 路由器代替默认路由器 |

## 检查和调试 {#s-ref-flags-by-job-checks-and-debugging}

| 参数 | 我们的取值 | 它设置什么 |
|---|---|---|
| `--seed` | 运行的种子 | 训练器种子 |
| `--save-debug-event-data` | 每次运行一个文件夹 | 每一步的事件 |
| `--save-debug-rollout-data`, `--load-debug-rollout-data` | - | 保存并重放 rollout 样本 |
| `--debug-train-only`, `--debug-rollout-only` | - | 单独运行一边 |
| `--check-weight-update-equal` | - | 第一次更新后比较引擎和训练器的权重 |
| `--use-fault-tolerance`, `--ft-components` | - | 容错 |
| `--save`, `--save-interval`, `--load` | - | 检查点 |

Sources: capture/gpu/miles_grpo.py; capture/gpu/out-gb10/engine-settings.txt; Miles arguments at main 08752a12.
