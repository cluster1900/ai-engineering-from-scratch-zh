# Evidence: cheatsheets/neural-net-basics.md

Abbreviations: P = phases/03-deep-learning-core. L01 = P/01-the-perceptron, L02 = P/02-multi-layer-networks, L03 = P/03-backpropagation, L05 = P/05-loss-functions, L10 = P/10-mini-framework. d = docs/en.md, c = code/main.py.

## 两层网络的前向与反向
- Input x, no computation: L02/d:33
- Hidden layer a1 = sigmoid(W1 x + b1): L03/d:107-108
- Output layer a2 = sigmoid(W2 a1 + b2): L03/d:109-110
- Loss L = (a2 - y)^2: L03/d:111
- dL/dz2 = 2(a2 - y) a2 (1 - a2): L03/d:120
- dL/dW2 = dL/dz2 a1, dL/da1 = dL/dz2 W2: L03/d:121, 123
- dL/dz1 = dL/da1 a1 (1 - a1): L03/d:124-125
- dL/dW1 = dL/dz1 x, dL/db1 = dL/dz1: L03/d:126-127
- forward left to right, backward right to left: L03/d:45, 47

## 一次训练步骤
1. DataLoader yields batches, shuffles each epoch: L10/d:53, 102
2. Forward pass layer by layer, stores values: L10/d:103, L03/d:70
3. Loss computes one scalar: L10/d:104-105
4. optimizer.zero_grad() resets gradients: L10/d:661, 706
5. loss.backward() gradients right to left: L10/d:664, L03/d:47
6. optimizer.step(), SGD param -= lr * grad: L10/d:49, 665
7. model.eval() before test, inference forward only: L10/d:667, L03/d:430

## 公式
- Step function: L01/d:38-42
- Perceptron rule w_i = w_i + learning_rate * error * x_i, error = y_true - y_pred: L01/d:72, 75
- Sigmoid range (0, 1): L02/d:79, 82. Derivative a(1 - a): L03/d:84
- Layer z = W x + b, a = sigmoid(z): L02/d:102-107
- MSE and its gradient: L05/d:33-35, 43-45
- BCE: L05/d:55-57
- CCE, only the true class contributes: L05/d:75-79
- Softmax + CE gradient: L05/d:261

## 代码中的任务
- p_and = Perceptron(2), p_and.train(and_data): L01/d:171-172
- Network([hidden, output]): L02/d:245
- net = Network([2, 4, 1]): L03/d:308
- total_loss.backward(): L03/d:328
- F.cross_entropy(logits, labels): L05/d:413
- label_smoothing=0.1: L05/d:414
- Adam(model.parameters(), lr=0.01): L10/d:581
- DataLoader(train_data, batch_size=16, shuffle=True): L10/d:588

## 带反向的 Value 节点
- add Value and both grads += out.grad: L03/c:18, 21-22
- mul Value and swapped grads: L03/c:32, 35-36
- sigmoid backward reuses s: L03/c:56, L03/d:210
- build_topo(self), self.grad = 1.0, reversed(topo), v._backward(): L03/c:72-75, L03/d:242

## 迷你框架训练循环
- Sequential of Linear(2, 16) ... Sigmoid(): L10/d:569-578
- criterion = BCELoss(), Adam(model.parameters(), lr=0.01): L10/c:394-395
- model.train(): L10/c:404, train mode turns on dropout and batch stats: L10/d:704
- loop over batches and samples, forward, criterion: L10/c:411-414
- zero_grad, criterion.backward(), model.backward(grad), step: L10/c:417-420
- model.eval(): L10/c:433, running stats, no dropout: L10/d:705
- backward goes right to left: L10/d:383

## 选哪种损失
- F.mse_loss: L05/d:408, regression penalizes outliers: L05/d:37, 163
- MAE / Huber robust to outliers: L05/d:164
- F.binary_cross_entropy: L05/d:166, 409
- F.cross_entropy, log-softmax and NLL in one: L05/d:417
- Label smoothing when overconfident: L05/d:169
- Focal Loss for imbalanced, down-weights easy: L05/d:141, 168
- Triplet Loss anchor positive negative margin: L05/d:131-137, 172
- InfoNCE for large batch self-supervised: L05/d:173

## 课程代码中的默认值
- Perceptron learning_rate=0.1, epochs=100: L01/d:121, 131
- Adam lr=0.001, beta1=0.9, beta2=0.999, eps=1e-8: L10/d:485
- SGD lr=0.01, param -= lr * grad: L10/d:49, 465
- Dropout p=0.5, scale 1/(1-p): L10/d:280, 284
- BatchNorm momentum=0.1, eps=1e-5, running stats in eval: L10/d:303, 307
- BCE eps=1e-15: L05/d:222. BCELoss eps = 1e-7: L10/d:440
- alpha 0.1, target 0.91 with 10 classes: L05/d:109, 266
- temperature=0.07, SimCLR default: L05/d:127, 290

## 要记住的数字
- Sigmoid derivative max 0.25 at a = 0.5: L03/d:84
- 0.25^10 = 0.000001: L03/d:84, 95
- MSE predicting 0.5 on 50/50 gives 0.25: L05/d:23
- -log(0.5) = 0.693, -log(0.99) = 0.01: L05/d:23
- -log(0.01) = 4.6: L05/d:61
- -log(0.1) = 2.3 for 10 classes: L05/d:79
- Focal gamma 2, easy 0.01, hard 0.81: L05/d:147-150
- One backward pass vs one forward pass per weight: L03/d:17-21

## 故障排查
- XOR never converges, not linearly separable, add layers: L01/d:94, 107-109, 208
- MSE classifier predicts 0.5, use cross-entropy: L05/d:19, 23
- Early layers barely learn, vanishing gradient, ReLU in Lesson 04: L03/d:88, 98. Scaled init sqrt(2/n_inputs): L03/d:302
- log(0) = -inf, clipping: L05/d:217, 226
- math.exp(1000) is infinity, clamp to [-500, 500]: L02/d:170
- Reused Value needs +=: L03/d:190
- zero_grad resets gradients before the next batch: L10/d:706
- Dropout active in training, eval disables it: L10/d:45, 705

## 问答
- W shape rows current layer, columns previous layer: L02/d:123
- Sigmoid is smooth so gradients exist: L01/d:319, L02/d:82
- Backward needs stored activations, memory for speed: L03/d:70
- Topological sort accumulates gradient first: L03/d:222, 458
- F.cross_entropy is numerically stable: L05/d:417
- train() and eval() toggle dropout and BatchNorm: L10/d:45
- zero_grad separate because grads accumulate with +=: L10/d:25, 216-218, 706
