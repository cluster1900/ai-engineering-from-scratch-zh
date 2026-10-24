# 管道并行和气泡分析

> 张量并行性将矩阵乘法跨等级分割──管道并行性将模型跨等级分割,每个等级一个阶段──微批流经管道──开始和结束的空时间就是泡;最小化它是整个过程──

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 19 期 Track C 课程 42-49
**Time:** ~90 分钟

## Öğrenme hedefi

- Bir dizileme modeli N 个阶段 olarak ayırıp N 个等级 ön yönlü bir boru üzerinde oluşturur.
- GPipe kullanmak için bir boru düzenlemesi yapın.
- Megatron-LM ile PipeDream arasında kullanılan bir balonla karşılaştırma yapın.
- 捍卫阶段分配: her aşamasının fazlarındaki fazların sayısı her aşamasının fazlarındaki fazların sayısından daha önemlidir.

## 问题

fp16'daki 70B  параметр modeli sadece 140 GB  параметр gerektirir. Hiçbir tüketici GPU  bunu destekleyebilir. ZeRO-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            $\log(N)$︎ boru ve yollar farklı yollar kullanır: model N 个阶段 olarak kesilir ve her bir aşamada bir aşamada yerleştirir.︎ 1 aşamada 0 aşamada tamamlanır.︎ 1 aşamada ︎ 2 aşamada çalışılır.︎ 2 aşamada çalışılır.︎ 2 aşamada çalışılır.︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎

Buğdaylar, borunun başlangıcında (M) ve son aşama kadar ilk küçük topu beklerken ve son aşama kadar (M) ve son küçük topu beklerken, buğdayların sayısı (N-1) / M+N-1'dir. M=8、N=4'de, yani %27'de, M=64、N=4'de, %4.5'te.

## 概念

```mermaid
flowchart LR
  R0[rank 0: stage 0 / layer 0] --> R1[rank 1: stage 1 / layer 1]
  R1 --> R2[rank 2: stage 2 / layer 2]
  R2 --> R3[rank 3: stage 3 / loss]
  R3 -.backward.-> R2
  R2 -.backward.-> R1
  R1 -.backward.-> R0
```

### GPipe 时间表

Önceden herhangi bir sonraki işlem başlamadan önce, tüm M'leri kullanarak önde doldurma borusu; sonra da tersine döner. Her küçük bir süreci geriye kadar tutmak gerekir, böylece内存 M'nin doğrusal büyümesiyle birlikte ileride M+N-1'den daha fazla bir M+N-1'den daha fazla bir döngü gerektirir.

### 1F1B 时间表

交错: Bir kez küçük topuların ön tarafa doğru son aşamaya ulaştığında, geride bırakılmasına başlayın. Zaman çizelgesi her aşamada bir kez ileri ve bir kez geri dönüş yapılmalıdır. Buğmur hala N-1'dir, ancak küçük topu sayısının yerine, içe kaydedilen borunun derinliğini sınırlandırır.

### Neden her aşamada eşitlik hesaplaması önemlidir ?

Eğer aşama 0 50 ms gerektirirse, aşama 1 100 ms gerektirirse, her döngü aşamada 1  上门控。 diğer aşama her döngü boşluk 50 ms, bekleme aşama 1 释放。 aynı parametreler sayısı yanlış bir aksiyondur:Transformer'in hesaplaması öncelikle her aşama üzerinde dikkatle yapılır MLP yönlendirilir, yerleşim aşamasında ise çok fazla parametredir ama hesaplama miktarı çok azdır。 aşama dağılımı her aşama FLOP'sine eşit olmalıdır, her aşama üzerinde değil.

### Böğüt ve küçük toptan

管道运行 M 个微批次,每个微批次的大小为 B。有效批次大小为 M*B。管道步骤结束时的梯度是组合 M*B示例的梯度。气泡分数取决于 M;优化器看到的是 M*B。调整 M 意思是将泡(M 值较低) 与每微批次内存(GPipe'in激活内存值较高,M 值较高) 进行交易。


```figure
cd-pipeline-bubble
```

## Yapın onu.

`code/main.py`实现:

- `PipelineStage`Bir küçük .`nn.Module`, bir aşama için parametreyi kaydetmek ve açıklamak`forward(activation)`- Evet.
- `Pipeline(stages, num_microbatches)`: her aşamada kullanılan simgelik saatleri simgelik aşamada düzenlemek GPipe 时间表。
- `bubble_fraction(num_stages, num_microbatches)`Bu, bir diğer deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir de bir deyişle, bir de bir deyişle, bir de bir deyişle, bir de, bir deyişle, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de, bir de
- 4 aşama gösterisi, her küçük bölümün gösterilerini ve ölçümün buhur sayısını yazdırmak

- Yapma .

```bash
python3 code/main.py
```

输出: aşama aşama küçük miktarlar ve kapalı tahminler ile karşılaştırıldığında 气泡百分比

## 野外生产模式

Üç farklı modü, boruların düzlüğünü taşımacılığa yeterli hale getirir.

**激活检查点与管道配对。**GPipe 上运行 M 个微批次时, aktive内存 bir mikro批次 M 倍──;                                                                                                                                                                                                                                                  

**阶段平衡是测量出来的，而不是假设的。**生产团队运行一个分析过程,测量目标硬件上实际每层计算(FLOP 和挂钟), sonra bu ölçüm sonuçlarına göre ayrıştırılmıştır.`--num-layers-per-stage`标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标志 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标 标

**发送-接收调度必须避免死锁。**Standart Repair is a Sissor:偶数级阶段先发送,然后接收,奇数级阶段先接收,然后发送―― sınıf düzenlemesi açık sıralama, böylece model görebilir.

## Kullan

生产模式:

- **Megatron-LM。**Büyük ölçekli boru paralellik referansı, 1F1B, destek张量+管道+数据并行组合──
- **DeepSpeed Pipeline。**ZeRO'nun en büyük açık modelinin ortak bir parçası olan ZeRO-1 + boruları.
- **PyTorch Pipe。**PyTorch 原生管道包装器, bazlı `torch.distributed.pipeline.sync.Pipe`Yapımcılık.

## Gönderi

Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 82. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 81. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 1. Bölüm 1. Bölüm 82. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2.

## 练习

1. 实现 1F1B 并验证气泡分数与GPipe 匹配,但激活内存有限──
2. Daha derin bir model üzerinde gerçekin her aşamasını analiz ederek, ölçümün asılılığındaki yeniden dengeleme aşamasını geçirir.
3. Tüpler arası küçük döngülerin dereceliğini toplayın ve dereceliğin tüm döngülerin önüne doğru dereceliğine eşit olup olmadığını kontrol edin.
4. Bu nedenle, bu işlemin yapılması için gerekli olan işlemlerin yapılması ve yapılması gerekmektedir.
5. Bu, bir tür türden bir sistem oluşturur.

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|----------------|------------------------|
|管道| “模型沿深度平行” |每个等级一个阶段，激活逐级流动|
|泡泡| “管道空闲时间”|开始+结束时的 (N-1) 个步骤，其中某些阶段没有工作 |
|微批次| “批次切片”|前进/后退各1个；随着 M 的增大，气泡会缩小 |
| G管道| “填充然后排水” |所有 M 都在任何后退之前前进；高激活记忆|
| 1F1B | “交错时间表” |每级一前一后；有界激活记忆|

## 进一步阅读

- [Huang 等人，GPipe：巨型神经网络的高效训练](https://arxiv.org/abs/1811.06965)
- [Narayanan 等人，PipeDream：DNN 训练的广义管道并行性](https://arxiv.org/abs/1806.03377)
- [Megatron-LM 管道并行文档](https://github.com/NVIDIA/Megatron-LM)
- 第19 阶段 第76 课 - 调度使用的发送/接收原语
- 第19 阶段 第78 课 - ZeRO , bir boru ile düzenli olarak iletişim kurar ve düzenli olarak bir araya gelir
