# Bomba ile paralel boru hattı  analiz

> Tenzor paralelliği, Rektör çarpma biçimini bir dizi sıralara ayırmak, boru paralelliği, modelini bir dizi sıralara ayırmak, her bir sıra bir aşama, mikrobatçın boru hattını geçmesi, boşluk zamanının bir kabarcık olması, onu basmak, tüm bir işlev biçimidir.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 分钟

## Öğrenme hedefi

- Bir sırayla model N' aşamalara ayırıp N' sıralamasına yukarı doğru bir boru hattı oluşturmak.
- GPipe 调度(先只做前填满,再回覆) M 个微洗管 过管,并计算泡 比如──
- Megatron-LM、PipeDream 调度比较泡
- 论证 stage 分配: her aşama 算力相等, her aşama 参数相等'den daha önemlidir.

## 问题

Fp16 下的 70B 参数模型,光参数 140 GB ⋅ hiçbir tüketim seviyesinde GPU 装备下──ZeRO-3 参数 parçalarını her sıralara ayırır, ama her ileri adım  hala her sıra toplanmalı  tamamı bir katman, her katman ödemesi $\log(N)$跳──管道平行 换一条路:把模型切成 N 个阶段,每个级别 放一个── 1 层的前进 在级别 0 做完,把激活张量交付给级别 1;级别 1 跑层 2 再交付给级别 2;以此类推──后向反向流回──内存近似线性下降,因为每个级别只有一阶段;计算是串行的,这就是泡泡 问题──

Bubble is a pipeline 开头的空(等第一个微巴赫到最后阶段) 和结尾的空(等最后一个微巴赫 回抽) ⋅M个微巴赫、N个阶段 时,每个阶段的泡 例如是$(N-1)/(M+N-1)$M=8、N=4 时是27%; M=64、N=4 时是4.5%── her adımın mikropçası 越多,泡越小, bu her mikropçanın parti boyutunu ifade eder 更小

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

### GPipe 调度

Önceden tüm M 个微巴ッチ, önce doldur, sonra geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geriye geri$(N-1)/(M+N-1)$M'yi N'den çok daha büyük bir şekilde elde edebilmek için bir balon toplayabiliriz.

### 1F1B 调度

交错: Bir mikrobatçın ileriye, bir son aşamasına kadar, hemen geriye başlayın ve geriye doğru akın etmesini sağlayın. Her aşama bir kez ileriye, bir kez geriye dönsün.

### Neden her aşama 算力等 çok önemlidir

Eğer aşama 0 50 ms ̊ aşama 1 ̊ 100 ms, her döngü 1 aşamada kalır ̊ diğer aşama ̊ 50 ms ̊ aşama 1 ̊ bırakır ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊                                                                       

### Mikrobatç ve parti

Pipeline 跑 M 个、每个大小为 B 的微洗──有效批量是 $M \cdot B$◊ Bir boru hattı adım  结束时的梯度,对合并后 $M \cdot B$个样本的梯度──Bubble 比例取决于M;优化器看到的是$M \cdot B$△调 M,就是在泡 (B) △ M 大则更低) 与每微包内存 (GPipe 下 M 大则激活内存更高) △ M

```figure
cd-pipeline-bubble
```

## Yapın onu.

`code/main.py`实现:

- `PipelineStage`Bir küçük.`nn.Module`, bir aşama var                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `forward(activation)`- Evet.
- `Pipeline(stages, num_microbatches)`Bu nedenle, bu konularda, bir dizi farklı yönlerden söz edilir.
- `bubble_fraction(num_stages, num_microbatches)`: closed式公式 $(N-1)/(M+N-1)$- Evet.
- Bir 4 aşamalı gösterim: mikrobatçın rotasına göre basın, ayrıca test edilen balon örneği

运行:

```bash
python3 code/main.py
```

输出: aşama×mikrobatch'in Gantt çizelgesi ve % % %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %   %                                                                                                                                                                

## 生产环境中的实践

Üç farklı modüyle boru hattı, aynı derecede sertleşebilir.

**Activation checkpointing 与 pipeline 搭配。**GPipe 上有M 个微巴奇 在飞时,激活内存是单个微巴奇的M 倍――Activation checkpointing 在后期 重算前期,算力换内存; 两者结合,长序列上的管道才可行──

**Stage 均衡靠测量，不靠假设。**Üretim ekibi önce bir sıra profil oluşturur, hedef硬件 üzerinde gerçekli bir hesaplama yaparak, yeniden ölçüm sonuçlarını bölgeye göre ölçer. Megatron-LM'nin `--num-layers-per-stage`List kabul edin, böylece her aşamada her aşamada farklı maliyetler kullanılırken 

**Send/recv 调度必须避免死锁。**Eğer her aşama önce tekrar gönderirsen, online meeting locks. standart düzeni de yanlıştır.

## Kullan

生产中的使用法:

- **Megatron-LM。**Büyük ölçekli boru hattı paralelinin referans gerçekleştirilmesi, 1F1B kullanımı,并支持 Tensor + Pipeline + Data Parallel 组合──
- **DeepSpeed Pipeline。**ZeRO-1 + boru hattı, birçok büyük açık kaynak modeli için bir ortak noktasıdır.
- **PyTorch Pipe。**PyTorch 原生的 পাইpeline 包装, bazlı `torch.distributed.pipeline.sync.Pipe`- Evet.

## - Söyle.

Bölüm 81. Bölüm 81. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 82. Bölüm 1. Bölüm 1. Bölüm 1. Bölüm 1. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Bölüm 2. Böl

## 练习

1. 实现 1F1B,验证泡 比例与GPipe 一致,但激活内存有上界──
2. Daha derin bir model üzerinde gerçekleri analiz ederken her aşamada zaman, ve ölçülmüş duvar saatleri yeniden dengeleme aşamasını oluşturur.
3.  pipeline mikrobatç yapım 梯度累积,检查梯度等等等价全批前的梯度──
4. 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配上 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配 配   配 配    配 配   配
5. Bu nedenle, bu süreçte, her bir boru hattının sırası, bir dizi metin ve bir dizi metin ile birleştirilmiştir.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Pipeline | “沿深度的模型并行” | 每个 rank 一个 stage，激活逐 stage 流动 |
| Bubble | “Pipeline 空闲时间” | 首尾各 (N-1) 步，部分 stage 没有工作 |
| Microbatch | “Batch 的切片” | 一次 forward/backward 单元；M 增大则 bubble 缩小 |
| GPipe | “先填满再排空” | M 次 forward 全部完成后再 backward；激活内存高 |
| 1F1B | “交错调度” | 每 stage 一次 forward 一次 backward；激活内存有界 |

## 延伸阅读

- [Huang et al, GPipe: Efficient Training of Giant Neural Networks](https://arxiv.org/abs/1811.06965)
- [Narayanan et al, PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377)
- [Megatron-LM pipeline parallel docs](https://github.com/NVIDIA/Megatron-LM)
- Eğitim 76 - programda kullanılan gönderme/içleme primitifleri
- 19 Fase Ders 78 - ZeRO, boru hattına ortogonal ve sıklıkla birleştirilmiştir.
