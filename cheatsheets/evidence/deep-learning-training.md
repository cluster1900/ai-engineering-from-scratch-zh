# Evidence: cheatsheets/deep-learning-training.md

Abbreviations: L03 = phases/03-deep-learning-core/03-backpropagation/docs/en.md, L06 = phases/03-deep-learning-core/06-optimizers/docs/en.md, L07 = phases/03-deep-learning-core/07-regularization/docs/en.md, L08 = phases/03-deep-learning-core/08-weight-initialization/docs/en.md, L09 = phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md, L13 = phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md.

## 一次 AdamW 更新 (architecture, 8 nodes)
- Loss node, forward pass output: L06:418
- loss.backward() node: L06:419
- clip_grad_norm_ max_norm=1.0: L06:420, L06:459
- first moment m_t, mean, beta1 0.9: L06:85, L06:107
- second moment v_t, variance, beta2 0.999: L06:86, L06:107
- bias correction 1 - beta^t: L06:92-95, L06:456
- Adam update lr · m̂ / (√v̂ + ε): L06:103-104
- decoupled decay lr · λ · w, edge AdamW: L06:115-119

## 训练步 (flow, 7)
- 1 zero_grad: L06:416
- 2 forward: L06:417
- 3 loss: L06:418
- 4 backward: L06:419
- 5 clip, optional: L06:420, L06:425
- 6 step: L06:421
- 7 scheduler.step() after optimizer.step(): L06:422, L06:425

## 使用 AdamW 与余弦调度的训练循环 (annotated-code, 13 lines)
- AdamW lr=3e-4 weight_decay=0.01: L06:411
- CosineAnnealingLR T_max=100: L06:413
- loop body zero_grad, forward, cross_entropy, backward, clip, step, scheduler.step: L06:415-422
- get_cosine_schedule_with_warmup num_warmup_steps=2000 num_training_steps=100000, HuggingFace: L09:381-390 (arguments joined onto one line)

## 关键公式 (concepts, 8)
- chain rule: L03:26
- Adam moments: L06:85-86
- bias correction: L06:94-95
- AdamW update: L06:118
- cosine decay: L09:56
- linear warmup: L09:72
- Kaiming and Xavier variance: L08:59, L08:83
- inverted dropout during training: L07:55

## 按情况选择 (command-table, 8)
- Transformer AdamW lr=1e-4 wd=0.01-0.1: L06:168
- CNN SGD + Momentum lr=0.1 momentum=0.9: L06:169
- GAN Adam lr=2e-4 beta1=0.5: L06:170
- Fine-tuning AdamW lr=2e-5 wd=0.01: L06:171
- not sure AdamW lr=3e-4 wd=0.01: L06:172
- sigmoid or tanh Xavier: L08:150
- ReLU, GELU, Swish Kaiming: L08:151-152
- transformer residual 1/sqrt(2N): L08:153

## 代码中的初始化、归一化与正则化 (task-table, 8)
- kaiming_normal_: L08:333
- xavier_uniform_: L08:329
- BatchNorm1d(256): L07:454
- LayerNorm(d_model): L07:480
- Dropout(0.3): L07:456
- CosineAnnealingLR T_max=1000 eta_min=1e-5: L09:374
- detect_anomaly: L13:611
- clip_grad_norm_ with float("inf") to measure: L13:633

## 优化器默认值 (defaults, 8)
- Adam lr 0.001, change lr first: L06:107
- beta1 0.9, almost never change: L06:107
- beta2 0.999, change second: L06:107
- epsilon 1e-8: L06:107 (10^{-8}), L06:217 (epsilon=1e-8)
- AdamW weight_decay 0.01, not scaled by adaptive rate: L06:121, L06:247
- SGD momentum 0.9, last 10 gradients: L06:56, L06:427
- SGD weight decay 1e-4 on CNNs, step or cosine: L06:427
- clip max_norm 1.0: L06:420

## 正则化与调度默认值 (defaults, 8)
- dropout transformers 0.1: L07:62, L07:497
- dropout MLPs 0.5: L07:47, L07:62
- BatchNorm momentum 0.1, 90% old 10% new: L07:101, L07:255
- BatchNorm eps 1e-5: L07:255
- warmup share 3-5%: L09:393
- cosine floor eta_min 1e-5: L09:374
- step decay factor 0.1: L09:420
- log clamp eps 1e-7: L13:81

## 故障排查 (8)
- loss stuck at -log(1/num_classes): L13:199
- loss NaN after a few steps, reduce lr 10x: L13:200
- loss NaN at once, log(0), clamp [eps, 1-eps]: L13:81, L13:201
- loss oscillates, zero_grad before backward: L13:186
- test accuracy varies, model.eval() and torch.no_grad(): L13:187
- train high test low, overfitting: L13:204
- gradients all zero, LeakyReLU, .requires_grad: L13:207
- early layers stop learning, sigmoid derivative 0.25: L03:84, L03:88; fix ReLU or GELU with Kaiming: L08:151-152

## 术语表 (8)
- SGD: L06:451
- AdamW: L06:455
- BatchNorm across mini-batch: L07:92, L07:101
- LayerNorm per sample: L07:120
- RMSNorm: L07:126 (LayerNorm without the mean subtraction)
- 1cycle: L09:421
- SGDR: L09:408
- LR range test: L09:422

## 问答 (5)
- AdamW vs Adam plus L2: L06:111-121
- warmup: L09:67-69
- bias correction 0.1 times gradient: L06:90
- LayerNorm in transformers: L07:120
- Kaiming for ReLU, 2/fan_in: L08:365, L08:151

## 提示 (6)
- overfit-one-batch, loss near zero: L13:151
- 3 learning rates 10x apart: L13:57
- tune the learning rate: L06:142
- print shapes after every operation: L13:188
- gradient sizes similar across layers: L13:131
- .to(device) on model and data: L13:189
