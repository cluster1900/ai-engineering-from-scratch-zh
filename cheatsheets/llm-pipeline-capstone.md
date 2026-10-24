---
id: llm-pipeline-capstone
title: End-to-End LLM and Fine-Tuning Pipeline
code: EE
subtitle: 规划、运行并把关一个带哈希的阶段 DAG。顶点项目中的换头、SFT 损失掩码与 DPO 损失，附默认值。
hue: 215
sources: phases/10-llms-from-scratch/13-building-complete-llm-pipeline, phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline, phases/19-capstone-projects/38-classifier-finetuning, phases/19-capstone-projects/39-instruction-tuning-sft, phases/19-capstone-projects/40-dpo-from-scratch
source_hash: 2d1fd91ad69bc1db
---

## 命令
type: command-table
from: phases/10-llms-from-scratch/13-building-complete-llm-pipeline/docs/en.md, phases/10-llms-from-scratch/13-building-complete-llm-pipeline/code/main.py, phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline/docs/en.md, phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline/code/main.py, phases/19-capstone-projects/38-classifier-finetuning/code/main.py, phases/19-capstone-projects/39-instruction-tuning-sft/code/main.py, phases/19-capstone-projects/40-dpo-from-scratch/code/main.py

| 命令 | 作用 |
|---|---|
| `python code/main.py plan` | 校验 manifest，打印 DAG 和关卡 |
| `python code/main.py run` | 运行各阶段，打印 manifest JSON |
| `python code/main.py gate` | 应用评测关卡。打印 `SHIP` 或 `HOLD` |
| `python code/main.py` | 演示：规划、运行、一个通过和一个失败的关卡 |
| `./pipeline.sh config/llama3.3-8b-domainX.yaml` | 顶点项目 07：从数据到模型卡 |
| `run_demo()` | 顶点项目 38 到 40。成功时以零退出 |

## 十二阶段 DAG
type: architecture
span: 2
from: phases/10-llms-from-scratch/13-building-complete-llm-pipeline/docs/en.md, phases/10-llms-from-scratch/13-building-complete-llm-pipeline/code/main.py

```arch
node | tok | 1,1 | 01-02 Tokenizer | vocab, merges | store
node | data | 2,1 | 03 Dataset | sharded | store
node | base | 3,1 | 04-05 Checkpoint | pre-train, scale | gpu
node | sft | 4,1 | 06 SFT model | checkpoint + recipe | gpu
node | ppo | 4,2 | 07 Reward + PPO | policy | gpu
node | dpo | 3,2 | 08 DPO | policy | gpu
node | cai | 2,2 | 09 CAI / GRPO | refined policy | gpu
node | eval | 1,2 | 10 Eval report | scores, diffs | process
node | quant | 2,3 | 11 Quantized | weights + delta | store
node | srv | 3,3 | 12 Server spec | endpoint | process
node | gate | 1,3 | Ship gate | SHIP or HOLD | client
edge | tok | data |
edge | data | base |
edge | base | sft |
edge | sft | ppo |
edge | sft | dpo |
edge | ppo | cai |
edge | dpo | cai |
edge | cai | eval |
edge | cai | quant |
edge | quant | srv |
edge | eval | gate |
edge | srv | gate |
```

## 编排器做什么
type: flow
from: phases/10-llms-from-scratch/13-building-complete-llm-pipeline/docs/en.md, phases/10-llms-from-scratch/13-building-complete-llm-pipeline/code/main.py

1. **编排器**：从 manifest 解析出 DAG。
2. **编排器**：若某阶段的输出已以正确哈希存在，则跳过该阶段。
3. **阶段**：运行。编排器测量墙钟时间和成本。
4. **编排器**：把输出哈希与下一阶段的输入哈希比对。
5. **CostTracker**：总成本超出预算时以 `halted_over_budget` 停止。
6. **失败时**：写出部分 manifest 并以非零状态退出。

## Manifest 与关卡
type: annotated-code
lang: yaml
from: phases/10-llms-from-scratch/13-building-complete-llm-pipeline/docs/en.md

```yaml
pipeline_version: 1.2.3
seed: 42
git_commit: a1b2c3d4
stages:
  01_tokenizer:
    input_hash: sha256:...  # output hash of the stage before
    output_hash: sha256:...  # input hash of the next stage
gates:
  mmlu:      >= baseline + 0.5   # no regression
  humaneval: >= baseline + 1.0
  safety_refusal_rate: <= 0.05
  kl_from_reference: <= 25.0  # KL budget gate
  cost_total_usd: <= 50000
```

## main.py 中的关卡默认值
type: defaults
from: phases/10-llms-from-scratch/13-building-complete-llm-pipeline/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `mmlu` | 65.0 | 运算符 `>=` |
| `humaneval` | 40.0 | 运算符 `>=` |
| `truthfulqa` | 50.0 | 运算符 `>=` |
| `safety_refusal_rate` | 0.05 | 运算符 `<=` |
| `kl_from_reference` | 25.0 | 运算符 `<=` |
| `cost_total_usd` | 50000.0 | 运算符 `<=` |
| `budget_usd` | 50000.0 | 超过即停止运行 |
| `seed` | 42 | 在 `Manifest` 中 |

## 三个顶点项目并列对比
type: comparison
span: 2
from: phases/19-capstone-projects/38-classifier-finetuning, phases/19-capstone-projects/39-instruction-tuning-sft, phases/19-capstone-projects/40-dpo-from-scratch

| 因素 | 38 分类头替换 | 39 指令 SFT | 40 DPO |
|---|---|---|---|
| 构建 | 主体 + 均值池化 + 二分类头 | 在回答 token 上训练的 `TinyGPT` | 以冻结参考模型为基准的策略 |
| 数据 | 800 条 SMS，640 训练，160 测试 | 200 对，160 训练，40 测试 | 12 个 (prompt, chosen, rejected) 三元组 |
| 模型 | hidden 64，4 头，2 块，max 32 | hidden 96，2 块 | hidden 64，2 块 |
| 训练 | 只训头 20 epoch，全量 20 | 20 epoch，lr 5e-4 | 30 epoch，beta 0.2，lr 1e-3 |
| 指标 | 精确率、召回率、F1、混淆矩阵 | 按类别的精确匹配 | chosen 减 rejected 的间隔 |
| 检查 | 只训头与全量都要报告 | 精确匹配随 epoch 上升 | 损失下降，间隔增大 |

## 顶点项目中的关键调用
type: task-table
span: 2
from: phases/19-capstone-projects/38-classifier-finetuning/code/main.py, phases/19-capstone-projects/39-instruction-tuning-sft/code/main.py, phases/19-capstone-projects/40-dpo-from-scratch/code/main.py

| 任务 | 代码 |
|---|---|
| 冻结主体，只训练头 | `freeze_body(model)` |
| 用掩码池化隐藏状态 | `mean_pool(h, mask)` |
| 填充 batch 并用 -100 掩盖标签 | `sft_collate(batch)` |
| 回答 token 上的因果损失 | `shifted_loss(logits, labels)` |
| 在模型下为补全打分 | `sequence_log_prob(...)` |
| DPO 损失与隐式奖励间隔 | `dpo_loss(lp_w_pol, lp_l_pol, lp_w_ref, lp_l_ref, beta=cfg.beta)` |
| 从参考模型初始化策略 | `policy.load_state_dict(reference.state_dict())` |

## DPO 损失
type: annotated-code
lang: python
from: phases/19-capstone-projects/40-dpo-from-scratch/code/main.py

```python
diff_w = logp_w_pol - logp_w_ref  # chosen log-ratio
diff_l = logp_l_pol - logp_l_ref  # rejected log-ratio
margin = diff_w - diff_l  # implicit reward difference
z = beta * margin
loss = -F.logsigmoid(z)  # numerically stable
for p in reference.parameters():
    p.requires_grad = False  # reference never trains
reference.eval()
```

## 顶点项目 07 的日志行
type: command-table
from: phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline/docs/en.md

| 命令 | 作用 |
|---|---|
| `280k accepted (seed=7)` | 数据阶段保留的行数 |
| `val loss 1.42 -> 1.03` | SFT，在 8xH100 上 3 个 epoch |
| `1 epoch, beta=0.08, 4xH100` | DPO 运行 |
| `GPTQ-INT4 4.6 GB, AWQ-INT4 4.8 GB` | 量化后的大小 |
| `EAGLE-3 acceptance 0.74` | 投机解码检查 |
| `p99 126ms @ bs=8` | batch 8 时的尾延迟 |
| `MMLU-Pro +3.2, MT-Bench-v2 +0.41` | 相对基座的评测提升 |

## 故障排查
type: troubleshooting
from: phases/10-llms-from-scratch/13-building-complete-llm-pipeline/docs/en.md, phases/10-llms-from-scratch/13-building-complete-llm-pipeline/code/main.py, phases/19-capstone-projects/39-instruction-tuning-sft/docs/en.md, phases/19-capstone-projects/38-classifier-finetuning/docs/en.md, phases/19-capstone-projects/40-dpo-from-scratch/docs/en.md, phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `HOLD: missing metric <metric>` | 评测报告没有该值 | 把该指标加入评测阶段 |
| `input hash missing for stage` | 上游产物不在存储中 | 重新运行上游阶段 |
| `halted_over_budget` | 总成本超过 `budget_usd` | 在规划时修正成本估计 |
| DPO 模型被送进 SFT 路径 | 产物没有类型 | 带类型的产物与阶段签名 |
| 模型学会预测指令 | 没有损失掩码 | 对指令、pad、边界使用 `-100` |
| 全量微调在 800 个样本上过拟合 | 小数据冲掉了主体 | 只训练头 |
| MMLU-Pro 准确率暴涨 | 训练数据被污染 | MinHash 检查，拒绝任何重叠 |
| DPO 偏好短补全 | 长度偏差 | 用补全长度除 log-prob |

## 回滚与提示
type: tips
from: phases/10-llms-from-scratch/13-building-complete-llm-pipeline/docs/en.md, phases/19-capstone-projects/40-dpo-from-scratch/docs/en.md

- 每次都先运行 `plan`。它免费，`run` 很贵。
- 重跑代价低：tokenizer、评测、量化、推理服务。
- 中等：SFT、DPO、CAI。保留基座模型。
- 代价高：预训练。使用最后一个良好的检查点。
- 阶段 06 失败会使 06 到 12 失效。阶段 11 失败只影响 11 和 12。
- 按哈希寻址产物。`latest.pt` 这样的文件名是坑。
- 预训练 FLOPs：6 x 参数量 x token 数。

## 问答
type: qa
from: phases/10-llms-from-scratch/13-building-complete-llm-pipeline/docs/en.md, phases/19-capstone-projects/40-dpo-from-scratch/docs/en.md, phases/19-capstone-projects/39-instruction-tuning-sft/docs/en.md

- **哪两个关卡能拦下大多数灾难？** 回退关卡和 KL 预算关卡。
- **可复现还是确定性？** 可复现。浮点数在 1e-5 量级上不同。
- **为什么 log Z(x) 在 DPO 中被消掉？** 它对 chosen 和 rejected 相同。
- **为什么精确匹配用贪心解码？** 温度会让指标带有随机性。
