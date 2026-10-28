---
id: notebooks-data-profiling
title: Notebooks, Data Files and Profiling
code: ND
subtitle: 安全跑 notebook，加载并划分数据集，把大文件挡在 git 外，分析时间与内存，抓住静默 AI bug。
hue: 285
sources: phases/00-setup-and-tooling/05-jupyter-notebooks, phases/00-setup-and-tooling/09-data-management, phases/00-setup-and-tooling/12-debugging-and-profiling
source_hash: 51d70b9241509845
---

## Notebook 快捷键
type: command-table
from: phases/00-setup-and-tooling/05-jupyter-notebooks/docs/en.md

| 命令 | 作用 |
|---|---|
| `pip install jupyterlab` 然后 `jupyter lab` | 启动 JupyterLab |
| `Escape` / `Enter` | 命令模式 / 编辑模式 |
| `Shift+Enter` | 运行单元格，移到下一个 |
| `A` / `B` | 在上方 / 下方插入单元格 |
| `DD` | 删除单元格 |
| `M` / `Y` | 转为 markdown / 代码 |
| `Shift+Tab` | 显示函数签名 |
| `Ctrl+Shift+H` | 显示全部快捷键 |

## Magic 命令
type: command-table
from: phases/00-setup-and-tooling/05-jupyter-notebooks/docs/en.md, phases/00-setup-and-tooling/05-jupyter-notebooks/outputs/prompt-notebook-helper.md

| 命令 | 作用 |
|---|---|
| `%timeit np.random.randn(10000)` | 多次运行并取平均。微基准 |
| `%%time` | 单元格跑一次。训练运行 |
| `%matplotlib inline` | 图在 notebook 里渲染 |
| `!pip install scikit-learn` | `!` 运行任意 shell 命令 |
| `%env CUDA_VISIBLE_DEVICES` | 查看环境变量 |
| `%who` | 列出内存中的全部变量 |
| `!which python` | 检查内核环境 |

## Notebook 故障排查
type: troubleshooting
from: phases/00-setup-and-tooling/05-jupyter-notebooks/docs/en.md, phases/00-setup-and-tooling/05-jupyter-notebooks/outputs/prompt-notebook-helper.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 我这边能跑，别人那边挂 | 单元格乱序执行 | 分享前 Kernel > Restart & Run All |
| 干净 notebook 依赖已删单元格 | 内核里有隐藏状态 | 定期重启内核 |
| RAM 持续增长 | 变量跨单元格持久存在 | `del variable_name` 和 `gc.collect()` |
| 内核静默死亡 | UI 藏起了错误 | 看运行 Jupyter 的终端 |
| `print(df)` 显示文本 | 不是最后一个表达式 | 用 `df` 结束单元格 |
| pip install 后仍导入失败 | 包装在另一个 Python 里 | 在 notebook 里 `!pip install package` |
| 单元格一直跑 | 在等 `input()` 或死循环 | Kernel > Interrupt，或按两次 `I` |
| Colab 文件没了 | 免费会话闲置 90 分钟后结束 | `drive.mount('/content/drive')` |

## 数据管线
type: architecture
from: phases/00-setup-and-tooling/09-data-management/docs/en.md

```arch
node | hub | 1,1 | Hugging Face Hub | datasets and models | store
node | lib | 2,1 | datasets library | load or stream | process
node | cache | 3,1 | Local Cache | ~/.cache/huggingface/ | store
node | fmt | 2,2 | Format Conversion | CSV, JSON, Parquet, Arrow | process
node | split | 3,2 | Data Splits | train / val / test | process
node | train | 4,2 | Your Training Pipeline | | model
edge | hub | lib | download
edge | lib | cache | first load
edge | lib | fmt |
edge | fmt | split |
edge | split | train |
```

## 加载、流式、转换、划分
type: annotated-code
lang: python
from: phases/00-setup-and-tooling/09-data-management/docs/en.md, phases/00-setup-and-tooling/09-data-management/code/data_utils.py

```python
dataset = load_dataset("stanfordnlp/imdb", split="train")   # cached after first load
stream = load_dataset("wikimedia/wikipedia", "20231101.en", split="train", streaming=True)
dataset.to_parquet("imdb_train.parquet")                    # also to_csv, to_json
split = dataset.train_test_split(test_size=0.2, seed=42)
train_val = split["train"].train_test_split(test_size=0.125, seed=42)
train_ds, val_ds, test_ds = train_val["train"], train_val["test"], split["test"]
make_splits(ds, train_ratio=0.8, val_ratio=0.1, seed=42)    # data_utils helper
model_dir = snapshot_download("sentence-transformers/all-MiniLM-L6-v2")
```

## 文件格式
type: defaults
from: phases/00-setup-and-tooling/09-data-management/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| CSV | 慢 | Large. 人类可读，电子表格 |
| JSON | 慢 | Large. API、嵌套数据 |
| Parquet | 快 | Small. AI 工作的最佳存储格式 |
| Arrow | 最快 | Small. 内存中，在 `datasets` 内部 |
| Train split | 80% | 验证 10%，测试 10% |
| Dataset cache | `~/.cache/huggingface/datasets/` | 模型缓存是 `~/.cache/huggingface/hub/` |

## 把大文件挡在 git 外
type: task-table
from: phases/00-setup-and-tooling/09-data-management/docs/en.md
span: 2

| 任务 | 代码 |
|---|---|
| 忽略权重和数据 | `*.safetensors`, `*.pt`, `data/*.parquet`, `models/` |
| 用 Git LFS 跟踪 | `git lfs track "*.safetensors"` |
| 提交 LFS 规则 | `git add .gitattributes` |
| 启动 DVC | `dvc init` |
| 用 DVC 跟踪数据 | `dvc add data/training_set.parquet` |
| 提交指针 | `git add data/training_set.parquet.dvc data/.gitignore` |
| 推数据到 S3 | `dvc remote add -d myremote s3://my-bucket/dvc-store` 然后 `dvc push` |

## 调试与分析工具
type: task-table
from: phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md
span: 2

| 任务 | 代码 |
|---|---|
| 只在坏损失时停下 | `if loss.item() > 100 or torch.isnan(loss): breakpoint()` |
| 在 pdb 里检查 | `p outputs.shape`，`p loss.item()`，然后 `c` 或 `q` |
| 分析函数 | `python -m cProfile -s cumtime train.py` |
| 分析行 | `@profile`，然后 `kernprof -l -v train.py` |
| 按行看内存 | `python -m memory_profiler your_script.py` |
| 最大分配 | `tracemalloc.take_snapshot().statistics("lineno")` |
| GPU 内存 | `torch.cuda.memory_allocated()`，`torch.cuda.memory_reserved()` |
| 训练曲线 | `SummaryWriter("runs/experiment_1")`，然后 `tensorboard --logdir=runs` |

## 调试工作流
type: flow
from: phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md

1. **训练前**：用一个样本 batch 跑 `check_shapes`。
2. **前 10 步**：`debug_print` 损失、输出和梯度。没有 NaN。
3. **训练中**：把损失、学习率和梯度范数记到 TensorBoard。
4. **出问题时**：在失败点放下 `breakpoint()`。
5. **为了速度**：给数据加载、前向和反向计时。接近 OOM 时分析内存。

## 静默 AI bug
type: troubleshooting
from: phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md, phases/00-setup-and-tooling/12-debugging-and-profiling/outputs/prompt-debug-ai-code.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 几步后出现 NaN | 学习率过高 | 降 10 倍。加梯度裁剪 |
| 立刻出现 NaN | 对零或负数取 log | `torch.log(x + 1e-8)` |
| 损失停在 ln(num_classes) | 没有梯度流 | 去掉误加的 `.detach()` |
| 测试准确率 99% | 数据泄漏 | `check_data_leakage(train_set, test_set)` |
| OOM | Batch 过大 | 把 batch 减半。`torch.cuda.empty_cache()` |
| 反向时 OOM | 梯度未清零 | 每步 `optimizer.zero_grad()` |
| 慢，GPU 利用率低 | 数据加载瓶颈 | `num_workers=4` 和 `pin_memory=True` |
| 张量在错误设备上 | CPU 张量、GPU 模型 | `check_devices(model, *tensors)` |

## 读曲线
type: qa
from: phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md

- **损失不下降？** 学习率过低，或架构有问题。
- **损失剧烈振荡？** 学习率过高。
- **训练损失下降、验证损失上升？** 过拟合。
- **权重直方图塌到零？** 梯度消失。
- **梯度直方图爆炸？** 加梯度裁剪。

## 提示
type: tips
from: phases/00-setup-and-tooling/05-jupyter-notebooks/docs/en.md, phases/00-setup-and-tooling/09-data-management/docs/en.md, phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md

- 在 notebook 里探索，用脚本交付。
- 微基准用 `%timeit`，训练运行用 `%%time`。
- 总是设种子。同一种子给出同一划分。
- 数据集装不下磁盘时用流式。
- 数据加载常占训练时间的 60%。设 `num_workers > 0`。
