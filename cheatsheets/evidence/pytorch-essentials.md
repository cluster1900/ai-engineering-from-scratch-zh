# Evidence: cheatsheets/pytorch-essentials.md

Abbreviations: P = phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, D = phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, G = phases/00-setup-and-tooling/03-gpu-setup-and-cloud/docs/en.md, X = phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md.

## 任务 (task-table, 8)
- device = torch.device("cuda" if ... else "cpu"): P:64, 242, G:97
- torch.randn(3, 4, device=device): P:65
- model = model.to(device): P:243, recursive move P:246
- sum(p.numel() for p in model.parameters()): P:426
- torch.save(model.state_dict(), "model.pt"): P:471
- model.load_state_dict(torch.load("model.pt", weights_only=True)): P:474
- model.eval() then torch.no_grad(): P:382-387, 399
- torch.cuda.get_device_name(0): G:63, 83

## 训练步骤 (flow, 7)
1. DataLoader yields batch: P:189, 203
2. inputs.to(device), targets.to(device): P:204
3. optimizer.zero_grad(): P:205
4. outputs = model(inputs): P:206
5. criterion(outputs, targets): P:207
6. loss.backward() replays the tape in reverse: P:100, 208
7. optimizer.step(): P:209

## 训练流水线 (architecture, 6 nodes)
- Dataset __len__, __getitem__: P:216
- DataLoader batch, shuffle, workers: P:216, 232
- nn.Module forward(), parameters(): P:25, 118, 137
- Loss fn logits and targets: P:161, 191
- Autograd loss.backward(): P:85, 100, 192
- Optimizer step(), zero_grad(): P:193-194
- edges: sequence P:183-195

## 训练与评估 (annotated-code, 14 lines)
- nn.CrossEntropyLoss(), raw logits: P:423, 166
- torch.optim.Adam(model.parameters(), lr=1e-3): P:424
- loop lines: P:201-209
- model.eval() / torch.no_grad() / outputs = model(images): P:383, 387, 390
- train mode for dropout and batch norm: D:187

## 数据与混合精度 (annotated-code, 14 lines)
- MNISTDataset __len__ / __getitem__: P:221-230
- DataLoader(dataset, batch_size=64, shuffle=True, num_workers=4): P:232
- GradScaler from torch.amp, autocast(device_type="cuda"), scaler.scale/step/update, zero_grad: P:255-265
- float16 forward: P:252

## 张量运算 (command-table, 8)
- x.view(2, 12), contiguous: P:76
- x.reshape(6, 4), works always: P:77
- x.permute(2, 0, 1): P:78
- x.unsqueeze(0), (1, 2, 3, 4): P:79
- x.squeeze(), removes size 1 dimensions: P:80
- x.to("cuda") / x.cpu(): P:66-67
- .detach(): D:190
- labels.long(): D:193

## 模块 (command-table, 8)
- nn.Linear(in, out), Wx + b, in*out + out: P:143
- nn.Conv2d(in_ch, out_ch, k), 2D convolution: P:144
- nn.BatchNorm1d(features), 2 * features: P:145
- nn.LayerNorm(dim), 2 * dim: P:150
- nn.Dropout(p), 0 parameters: P:146
- nn.ReLU(): P:147
- nn.Embedding(vocab, dim), vocab * dim: P:149
- nn.Sequential runs modules in order: P:340-348, 458

## 默认值与数字 (defaults, 8)
- float32 default training: P:56
- bfloat16 LLM training, float32 range: P:58
- Adam 1e-3: P:173, D:57
- SGD 1e-2 or 1e-1: D:57
- batch_size 64: P:232, 416
- num_workers 4: P:232, 235
- Dropout 0.2: P:343, 346
- fp16 bytes per parameter 2, margin: G:135

## 关键概念 (concepts, 8)
- Tensor shape, dtype, device: P:40
- same device rule: P:70
- Autograd tape: P:85, 100
- leaf requires_grad=True: P:112
- accumulation, zero_grad: P:113
- registration nn.Parameter in __init__, parameters(): P:137
- state_dict portable: P:478, 516
- mixed precision float16 plus float32 master weights: P:252, 520

## 排障 (troubleshooting, 8)
- RuntimeError: expected CUDA tensor, .to(device): D:189
- RuntimeError: modified by in-place operation, x += 1: D:191
- no zero_grad, loss oscillates: D:186
- no model.eval(), test accuracy varies: D:187
- OOM, graph not freed, detach or no_grad: D:190, 208
- labels Float, labels.long(): D:193
- softmax into CrossEntropyLoss, wrong gradients silently: P:166
- NaN from exploding gradients, clip_grad_norm_ or lower LR: D:63

## 调试探针 (task-table, 4)
- torch.autograd.detect_anomaly(): D:611
- torch.isnan(loss): X:68, 263
- clip_grad_norm_(model.parameters(), float("inf")) as grad norm reader: D:633
- torch.cuda.memory_allocated() / 1e9: X:210

## 提示 (tips, 6)
- overfit-one-batch first: D:660, 701
- 3 learning rates 10x apart: D:57
- print shapes, silent broadcasting: D:188
- normalize mean 0 std 1: D:192
- loss at -log(1/num_classes) means uniform: D:199
- num_workers can double speed on disk bound data: P:235
