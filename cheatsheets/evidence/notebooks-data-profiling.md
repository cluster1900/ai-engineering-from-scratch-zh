# Evidence: cheatsheets/notebooks-data-profiling.md

Abbreviations: P0 = phases/00-setup-and-tooling. J = P0/05-jupyter-notebooks/docs/en.md, NH = P0/05-jupyter-notebooks/outputs/prompt-notebook-helper.md, D9 = P0/09-data-management/docs/en.md, DU = P0/09-data-management/code/data_utils.py, D12 = P0/12-debugging-and-profiling/docs/en.md, PD = P0/12-debugging-and-profiling/outputs/prompt-debug-ai-code.md.

## Notebook 快捷键
- pip install jupyterlab, jupyter lab: J:58, 65-66
- Escape command mode, Enter edit mode: J:71
- Shift+Enter run cell, move to next: J:77
- A / B insert above / below: J:78-79
- DD delete cell: J:80
- M / Y convert to markdown / code: J:81-82
- Shift+Tab function signature: J:91
- Ctrl+Shift+H all shortcuts: J:84

## Magic 命令
- %timeit runs many times and averages, microbenchmarks: J:117, 129
- %%time runs once, training runs: J:123, 129
- %matplotlib inline: J:134, 137
- !pip install scikit-learn, ! runs any shell command: J:142, 145
- %env CUDA_VISIBLE_DEVICES: J:150
- %who lists variables: NH:24
- !which python: NH:31

## Notebook 故障排查
- Out-of-order execution, Kernel > Restart & Run All: J:226, NH:29
- Hidden state, restart the kernel regularly: J:228
- Memory leaks, del variable_name and gc.collect(): J:230, NH:24
- Kernel dies silently, check the terminal: NH:15
- print(df) gives text, df gives the rich table: NH:19
- Import errors after pip install, !pip install package: NH:31
- Cell runs forever, input(), Kernel > Interrupt or I twice: NH:30
- Colab 90 minutes inactivity, drive.mount('/content/drive'): J:200-201, NH:34-36

## 数据管线
- Hugging Face Hub node: D9:21
- datasets library node, load or stream: D9:22-23
- Local Cache ~/.cache/huggingface/: D9:24
- Format Conversion CSV, JSON, Parquet, Arrow: D9:25
- Data Splits train / val / test: D9:26
- Your Training Pipeline: D9:27
- Cache after the first download: D9:54

## 加载、流式、转换、划分
- load_dataset("stanfordnlp/imdb", split="train"), cached: D9:54, 76
- streaming=True wikipedia: D9:61
- to_parquet, to_csv, to_json: D9:78-80
- train_test_split(test_size=0.2, seed=42) then test_size=0.125: D9:107-108
- train_ds, val_ds, test_ds: D9:110-112
- make_splits(ds, train_ratio=0.8, val_ratio=0.1, seed=42): DU:80, 173
- snapshot_download("sentence-transformers/all-MiniLM-L6-v2"): D9:132

## 文件格式
- CSV Large, Slow, human readability: D9:87
- JSON Large, Slow, APIs, nested data: D9:88
- Parquet Small, Fast, best storage format: D9:89, 92
- Arrow Small, Fastest, in-memory, datasets uses it: D9:90
- 80% train, 10% validation, 10% test: D9:98-100
- ~/.cache/huggingface/datasets/ and ~/.cache/huggingface/hub/: D9:54, 136

## 把大文件挡在 git 外
- .gitignore patterns *.safetensors, *.pt, data/*.parquet, models/: D9:144-152
- git lfs track "*.safetensors": D9:159
- git add .gitattributes: D9:160
- dvc init: D9:169
- dvc add data/training_set.parquet: D9:170
- git add data/training_set.parquet.dvc data/.gitignore: D9:171
- dvc remote add -d myremote s3://my-bucket/dvc-store, dvc push: D9:203-204

## 调试与分析工具
- conditional breakpoint on loss.item() > 100 or isnan: D12:68-69
- p outputs.shape, p loss.item(), c, q: D12:77-81
- python -m cProfile -s cumtime train.py: D12:145
- @profile and kernprof -l -v train.py: D12:155, 162
- python -m memory_profiler your_script.py: D12:200
- tracemalloc.take_snapshot(), statistics("lineno"): D12:178-179
- torch.cuda.memory_allocated(), memory_reserved(): D12:210-211
- SummaryWriter("runs/experiment_1"), tensorboard --logdir=runs: D12:316, 336

## 调试工作流
1. check_shapes with a sample batch: D12:376
2. debug_print for the first 10 steps: D12:377
3. log loss, learning rate, gradient norms, TensorBoard: D12:378
4. breakpoint() at the failure point: D12:379
5. time data loading vs forward vs backward, memory near OOM: D12:380

## 静默 AI bug
- NaN after a few steps, reduce by 10x, clipping: PD:58
- NaN immediately, torch.log(x + 1e-8): PD:59
- Loss stuck at ln(num_classes), accidental .detach(): PD:61
- 99% test accuracy, data leakage, check_data_leakage: PD:65, D12:277-280
- OOM, reduce batch size, torch.cuda.empty_cache(): D12:216-217, PD:66
- OOM during backward, optimizer.zero_grad(): PD:67
- Slow training, low GPU use, num_workers=4, pin_memory=True: PD:69
- Wrong device, check_devices(model, *tensors): D12:294-297

## 读曲线
- Loss not decreasing: D12:341
- Loss oscillating wildly: D12:342
- Train down, val up, overfitting: D12:344
- Weight histograms collapsing, vanishing gradients: D12:345
- Gradient histograms exploding, clipping: D12:346

## 提示
- Explore in notebooks, ship in scripts: J:216
- %timeit vs %%time: J:129
- Always set a seed: D9:117
- Streaming for datasets too large for disk: D9:58
- Data loading 60% of time, num_workers > 0: D12:138
