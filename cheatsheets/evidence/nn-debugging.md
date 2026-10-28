# Evidence: cheatsheets/nn-debugging.md

Abbreviations: L08 = phases/03-deep-learning-core/08-weight-initialization, L13 = phases/03-deep-learning-core/13-debugging-neural-networks, P12 = phases/00-setup-and-tooling/12-debugging-and-profiling, L45 = phases/19-capstone-projects/45-gradient-clipping-amp. d = docs/en.md. L13/c = L13/code/debug_neural_nets.py. P12/c = P12/code/debug_tools.py. L45/c = L45/code/main.py.

## 症状、原因、首选修复 (troubleshooting, 8)
- Loss stuck at -log(1/num_classes), uniform distribution, check pipeline and labels: L13/d:199
- Loss NaN after a few steps, LR too high, reduce LR by 10x: L13/d:200
- Loss NaN immediately, log(0) or division by zero, add epsilon: L13/d:201
- Loss oscillating wildly, LR too high or batch too small: L13/d:202
- Loss decreasing then plateaus, add cosine or step decay: L13/d:203
- Training acc high, test acc low, overfitting, dropout, weight decay, more data: L13/d:204
- Training acc = test acc = chance, run overfit-one-batch: L13/d:205
- Gradients all zero, dead ReLUs or detached graph, LeakyReLU, `.requires_grad`: L13/d:207

## 常见 PyTorch bug (troubleshooting, 8)
- Missing `optimizer.zero_grad()` before `loss.backward()`: L13/d:186
- Missing `model.eval()`, add `torch.no_grad()`: L13/d:187
- Silent broadcasting, print shapes: L13/d:188
- `RuntimeError: expected CUDA tensor`, `.to(device)` on model AND data: L13/d:189
- Not detaching, OOM, `.detach()` or `with torch.no_grad()`: L13/d:190
- `RuntimeError: modified by in-place operation`, `x = x + 1`: L13/d:191
- Data not normalized, random-chance loss, mean=0, std=1: L13/d:192
- Expects `Long`, got `Float`, `labels.long()`: L13/d:193

## 损失不下降：按此顺序检查 (flow, 7)
1. LR too high oscillates or explodes, too low barely moves: L13/d:39-42, 57
2. Three rates 10x apart, 1e-2, 1e-3, 1e-4: L13/d:57
3. All zeros, dead ReLUs or vanishing gradients: L13/d:43
4. NaN/Inf, exploding gradients: L13/d:44
5. Labels shuffled, random-chance accuracy: L13/d:46
6. Preprocessing bug, model learns noise: L13/d:47
7. Too small underfitting, too deep optimization difficulty: L13/d:48-50

## 诊断函数 (task-table, 8)
- `debug_print(name, tensor)`: P12/c:20, prints shape, dtype, device, has_nan: P12/d:48-53
- `check_shapes(model, sample_input)`: P12/c:42
- `detect_nan(model, loss, step)`: P12/c:64, NaN and Inf gradient prints: P12/d:262-272
- `check_devices(model, *tensors)`: P12/c:77
- `check_gradient_health(model)` total norm, > 100 large, == 0 zero: P12/c:85-97
- `overfit_one_batch(model, x_batch, y_batch, criterion, ...)`: L13/c:140
- `find_learning_rate(model, x_data, y_data, criterion, ...)`: L13/c:174-176
- `gradient_check(model, x, y, criterion, eps=1e-4)`: L13/c:235

## 把调试器挂进模型 (annotated-code, 6 lines)
- `debugger1 = NetworkDebugger(model1)`: L13/c:307. Hooks Linear, Conv2d, ReLU, LeakyReLU: L13/c:18
- `debugger1.record_loss(loss.item())` each step: L13/c:313
- `debugger1.print_report()` prints loss, activation and gradient checks: L13/c:316, 109-132
- `debugger1.remove_hooks()`: L13/c:317
- `with torch.autograd.detect_anomaly():` then `loss.backward()`: L13/d:611-614, 712

## 检查项使用的阈值 (defaults, 8)
- `fraction_zero` > 0.5: L13/c:73. LeakyReLU or lower LR: L13/d:59
- `std` < 1e-6 collapsed: L13/c:81-83
- `abs_mean` < 1e-7 vanishing: L13/c:92-94
- `abs_mean` > 100 exploding: L13/c:96-98
- first/last ratio > 100: L13/c:103-105
- `rel_diff` < 1e-5 pass, > 1e-3 bug: L13/d:103, L13/c:288-293
- `final_loss` > 0.1 FAIL: L13/c:164
- `start_lr=1e-7`, `end_lr=10`: L13/c:175

## 按激活函数初始化 (concepts, 8)
- Zero init, identical neurons, 1 effective neuron: L08/d:17, 109-111
- Var(z) = fan_in Var(w) Var(x): L08/d:45
- Xavier 2/(fan_in + fan_out) for sigmoid and tanh: L08/d:59, 150
- Kaiming 2/fan_in for ReLU, Leaky ReLU, GELU, Swish: L08/d:83, 151-152
- Residual scaling 1/sqrt(2N): L08/d:102, 153
- N(0,1) explodes by layer 5, N(0,0.01) vanishes by layer 10: L08/d:137-138
- Magnitudes between 0.5 and 2.0: L08/d:155
- `nn.Linear(512, 256)` defaults to Kaiming uniform: L08/d:338

## 裁剪与缩放的步骤顺序 (architecture, 8 nodes, 7 edges)
- Forward in autocast, loss in FP32: L45/d:29
- isfinite loss check before backward, skip: L45/d:55
- scaler.scale loss, backward FP16 grads: L45/d:30-31, 23
- scaler.unscale optimizer: L45/d:32, 23
- NaN or Inf check, skip, update halves: L45/d:34-35
- clip_grad_norm_ to max_norm 1.0: L45/d:23, 36, 90
- scaler.step optimizer: L45/d:37
- scaler.update doubles or halves: L45/d:38

## 一次 AMP 训练步骤 (annotated-code, 13 lines)
- `zero_grad(set_to_none=True)`: L45/c:207
- autocast with device_type and amp_dtype: L45/c:209
- `torch.isfinite(loss).all().item()` skip without update: L45/c:213-215
- `scaler.scale(loss).backward()`: L45/c:224
- `scaler.unscale_(self.optimizer)`: L45/c:227, before clip: L45/d:23
- `has_non_finite_grad` then `scaler.update()`: L45/c:229-231, halves: L45/d:94
- `clip_global_l2_norm(...)`: L45/c:255
- `scaler.step`, `scaler.update()`: L45/c:257-258, every step: L45/d:94
- `get_scale()` logged next to lr and norm: L45/c:267, L45/d:59

## 分析与检查 (command-table, 8)
- `python -m cProfile -s cumtime train.py`: P12/d:145-148
- `kernprof -l -v train.py` with `@profile`: P12/d:155, 162
- `python -m memory_profiler your_script.py`: P12/d:200
- `tracemalloc.take_snapshot()` after `tracemalloc.start()`: P12/d:172-178, 406
- `torch.cuda.memory_summary()`: P12/d:208
- `tensorboard --logdir=runs`: P12/d:336
- `breakpoint()`, `p outputs.shape`, `c`, `q`: P12/d:60, 77, 81
- `python3 code/main.py`, at least one `SKIP` row: L45/d:79, 82

## 要盯住的数字 (qa, 7)
- Scale climbs in powers of two near 2^17 or 2^18: L45/d:59
- Skip-rate alert above 5 percent, 1,000-step window: L45/d:88
- Scale never changes, update forgotten on skip: L45/d:94
- Data loading 60%, `num_workers > 0`: P12/d:138
- OOM, reduce batch size first, `torch.cuda.empty_cache()`: P12/d:216-217
- 99% test accuracy is a bug: P12/d:277. Split first, preprocess second: L13/d:71
- Train loss down, val loss up, overfitting: P12/d:344

## 全量训练前的检查清单 (tips, 7)
- Overfit-one-batch, stop if it fails: L13/d:660
- Model summary, parameter count: L13/d:661
- Single forward pass, output shape: L13/d:662
- 5 epochs, loss decreases: L13/d:663
- Activation statistics and gradient flow: L13/d:664-665
- 5 random samples with labels: L13/d:666
- Log loss, learning rate and gradient norms: P12/d:378
