# Gradyent Kontrol Noktası ve Aktifleştirme Yeniden Hesaplama

> Arkaplanlama, her bir orta aktivasyon değerini koruyacaktır. 70B parametreleri ve 128K bağlamında, her bir sıra aktivasyon değeri 3 TB'ye kadar.

**Type:** Build
**语言:**Python, numpy, seçeneğiyle meşale ile)
**前置要求:**10 Eğitim Fase 04 (Eğitim öncesi Mini-GPT), 10 Eğitim Fase 05 (Skaling & Distributed)
**Time:** ~70 分钟

## 问题

訓練変形器 会為每一層保存後退 中需要求导的每op的输入:注意输入、Q/K/V projeksiyonları、softmax 输出、FFN 输入、norm 输出,以及残流──对隐藏的尺寸为`d`、 序列 uzunluğu 为 `L`Çöpler için`B`Bu her katın bir katı.`12 * B * L * d`- Evet.

- Evet .`d=8192, L=8192, B=1`Bu BF16'da aşağıda 800 MB/katayla var. 64 katlı model için aktivasyon değeri 51 GB'dir.`L^2`), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ),

Bu, iki taraflı hesaplama yöntemidir. BF16 ağırlıkları ve optimizer durumuna ek olarak 80GB'ye yerleştirilebilir, ancak etkinleştirme değeri sizi sınırdan çıkaracaktır.

朴實實實實時,checkpointing 每步大約會多花 33% 前進通過 FLOPs──實實實時,即即即即Kortikanti et al. 智能選項做選購檢查點,你可以在5% 开销下省 5x 記憶的以下 FLOP──而且在FP8 matmuls、FSDP offload、專家-parallel MoE 中,這點確實很重要:記憶和浪費的計算 你都承受不起──

## 概念

### Geriye doğru  gerçek ihtiyaç ne

`output = layer(input)`❖ Geriye dönmek  想要 `grad_input`和 `grad_params`❖ Onları hesaplamak için, gerektirir:

- `input`(Lineal seviyesinde hesaplama için kullanılır)`grad_params = input.T @ grad_output`)
- Bazı aktivasyonlar arasındaki değerlere göre

Önceden geçin 会在 autograd grafik 中自动保存这些内容──每个 `tensor.retain_grad()`Ve her bir giriş için bir alıntı vardır.

### 朴素 Tam Kontrol Noktası

Ağı söküp at .`N`个段――前面 期间, sadece her segmentin *input*¬ı kaydetmek için 个段――后面 需要中间量时,重新运行该段的前进通来物化它们,然后再求导――

Example:32-kataman transformatör 32 katman, her katman 1 katman olarak ayrılır.

- Hatıra:32 个 katman girişleri(小) karşılığı 32 *(per layer activation volume)
- 额外计算: her segment 额外 1 次前,也就是总前 FLOPs 约增加33%(因为后退是前的2x,完整步骤从1 + 2 = 3个单位变为1 + 1 + 2 = 4个单位) 

Bu ilk olarak Chen et al. 2016'daki programı:`sqrt(L)`Bir kontrol noktası, belleği ve hesaplamaları dengelemek için. L=64, 8 kontrol noktası.

### Seçimsel Kontrol Noktası (Korthikanti 2022)

Tüm etkinleştirme değerlerinin maliyeti aynı değil.`B*L*L*heads`,并随序列长度 *二次* 增长──FFN gizli etkinleştirme 是 `B*L*4d`, 線性增长──長序列,softmax 占主导──

Seçimsel kontrol noktası, depolama maliyetinin düşük aktif değerini tutmak, sadece pahalı kısımları yeniden hesaplamak, dikkat etmek, çok az FLOP kullanmak, ancak O(L^2) hafızayı tasarruf etmek.

Megatron-Core, bunu seçici bir şekilde yeniden hesaplama için gerçekleştirir. 2024'te sınır eğitimlerinin çoğu kullanılıyor.

### Çıkarım

重新计算的替代方案:在前和后期 之间把激活值传到CPU RAM──它需要PCIe带宽;当空带宽的收益高于重现化 成本时很有用──混合策略很常见: bazı katmanlar kontrol noktası, diğerleri atload──

FSDP2  olarak bir seçeneği olarak  olarak yüklenir  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak  olarak 

### Ücret Modelini Yeniden Hesapla

Her gün`k`Bir kere, bir bütün.`L`层时,朴素 kontrol noktası'nın adım adım FLOPs:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

Seçkin kontrol noktası kullanırken, tüm katman yerine sadece dikkat çekirdekini yeniden hesaplarsınız:

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### Hatıra Kaydetme Modülü

Her kattaki etkinleştirme hacmi:`A` için `L`层,总 etkinleştirme hafızası:`L * A`- Evet.

Tam kontrol noktası ((sektör boyutu 1):只保存 `L * input_volume`(standard transformatör için 约为 `L * 1/10 A`)―节省约 `9 * L * A * 1/10`- Evet.

Her gün`k`层 kontrol noktası 一次:保存 `L/k * A`, tekrar aktif segmentlere eklenir`k-1`- Yüzelim.

- Evet .`k = sqrt(L)`Zaman, hafıza ve yeniden hesaplama maliyeti`sqrt(L)`缩放, bu, bir yandan maliyet katmanlarının en iyi ölçüsüdür.

### Ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne zaman ne ne ne zaman ne zaman ne zaman ne ne ne ne zaman ne ne zaman ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne zaman ne zaman ne ne ne ne ne ne ne ne ne ne ne ne zaman ne zaman ne ne ne ne ne ne ne zaman ne ne ne ne ne ne ne ne ne ne ne ne zaman ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne ne

- Bu, uçuşta bulunan en iç katmanların arasında gerçekleşmiş.
- Eğer ilk ve son katmanlar bu aşama hesaplamalarını yönlendirirse, transformörlerde çok az görülebilir.
- Flash Attention'ın dikkat çekirdeklerini kullanmış: Flash 已会快速重新计算 softmax, bu nedenle ekstra katman seviyesinde kontrol noktası 叠加收益很小──

### Uygulama Şekilleri

1. **Function wrapper：**Kullan .`torch.utils.checkpoint.checkpoint(fn, input)`Bir bölümünü toplayıp...`input`, n geriye dönerken tüm diğer şeyleri yeniden hesaplamak.

2. **Decorator-based：**Sınıfları kontrol edilebilir olarak işaretleyeceğiz; eğitmen hangi bölümleri topladığını belirleyecek.

3. **Manual explicit recompute：**Özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş, özönlü geçiş`recompute_forward`, using save's input  kopyalanma ileride

Üçüncü: Verilen fonksiyonel sonuçlar

### TP / PP / FP8 ile iletişim

- **Tensor parallel：**Kontrol noktası girişleri yeniden hesaplanırken toplanmalı veya kurtarılmalıdır; iletişim maliyetini işleme ihtiyacı vardır。
- **Pipeline parallel：**Tipik model ise kontrol noktası. Her boru hattı aşamasının ileriye doğru ilerlemesi.
- **FP8 recompute：**Bu nedenle, bu süreçte, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yenileme yapılması gereken bir sistem olarak, yeni bir sistem olarak, yenileme yapılmış bir sistem olarak, yeni bir sistem olarak, yenileme yapılmış bir sistem olarak, yapılmış bir sistem olarak, yapılmış bir şekilde yapılmış bir sistem olarak, yapılmış bir şekilde yapılmış bir şekilde yapılmış bir şekilde yapılmış.


```figure
activation-recompute
```

## Yapın onu.

### 步骤 1:带 Segments'ın Oyuncak Modülü

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### 步骤 2: tüm aktivasyonların gerekliliği

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### 步骤 3: Checkpoint-Every-k Hatırlama

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### 步骤 4:Kost Modülü

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### 步骤 5: Hatıra Tahminici

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### 步骤 6: Optimal Segment Boyutu

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### 步骤 7: Seçimçi Kontrol Noktası Kararı

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## Kullan

- **torch.utils.checkpoint**- ...`from torch.utils.checkpoint import checkpoint`,PyTorch 中的规范包装──它包裹一个函数;只保存输入,然后倒后重新计算──
- **Megatron-Core activation recomputation**: support `selective`- Evet.`full`和 `block`Modes── is 2024+ sınır eğitiminin standart uygulaması──
- **FSDP2 offload**: FSDP2 中中 `module.to_empty(device="cpu")`配合 `offload_policy`, yeniden hesaplama yerine CPU'ya aktivasyonları parçalayacak.
- **DeepSpeed ZeRO-Offload**: Optimizer durumları ve etkinleştirmeler için CPU yükü, kontrol noktaları 互补──

## - Söyle.

本课会产 出 `outputs/prompt-activation-recompute-policy.md`, bu bir istek: model yapılandırmalarını alır (sınıflar, gizlenmiş, sekim, parti) ve kullanılabilir GPU belleği,并输出逐层重计算政策 (bir / seçici / tam / boş yüklenme)

## 练习

1. 验证正确性──运行 `model_forward`+ `model_backward`(tamamlı etkinleştirmeler)`model_forward_checkpointed`+ `model_backward_checkpointed`(seçimleri) ◊ Parametre gradiyenti ⋅ makine hassasiyeti ⋅ tamamen uyumlu olmalıdır

2. 扫描 segment boyutu `k`1 ' den 1 ' e kadar .`L`❖ FLOP üzerinde resim yapıp hafıza oluşturmak ❖ kurşunın köşesini bulmak

3. 实现选择性检查点:保存注意模块输入,但不保存其中间量──对 seq=8192 的32 katmanlı modeli,测量对全层检查点的 FLOP overhead──

4. 添加脱载──把段入口 保存到一个模拟的 CPU缓冲((一个单独的列表)──将 PCIe bant genişliği 作为字节/时间 测量,并找出脱载与重计算 之间的破解点──

5. Benchmark 一个真实的 PyTorch变压器,分别使用和不使用 `torch.utils.checkpoint`◊ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ `torch.cuda.max_memory_allocated`) ve adım zamanı

## 关键术语
| Term | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| Gradient checkpointing | “通过重做 forward 节省 memory” | 只存储 segment inputs；在 backward 期间重新计算中间量，以获得支持 Gradient 的 tensors |
| Activation recomputation | “和 checkpointing 一样” | 同一技术在 HPC 语境下的名称 |
| Segment size (k) | “每个 checkpoint 包含多少层” | 其中间量被丢弃并一起 rematerialized 的层数 |
| Selective checkpointing | “Korthikanti 的技巧” | 只重新计算存储成本高的激活值（attention softmax）；保留低成本的部分 |
| Full checkpointing | “朴素版本” | 在每个 segment 中重新计算每层的中间量 |
| Block checkpointing | “Coarse-grained” | Checkpoint 整个 transformer blocks；粒度最大 |
| FLOP overhead | “compute 税” | 每 step 额外 FLOPs = (recompute FLOPs) / (fwd + bwd FLOPs)；朴素方案 33%，selective 方案 5% |
| Activation offload | “传到 CPU” | 在 forward->backward 之间把 activations 移到 CPU RAM；是 recompute 的替代方案 |
| sqrt-L rule | “经典最优解” | 对于 uniform-cost layers，最优 checkpoint spacing 是 sqrt(L) 层 |
| Attention-softmax volume | “O(L^2) 问题” | L^2 * heads * batch 个浮点数；在长 context 下主导 activation memory |

## 延伸阅读
- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174)-- İlk olarak biçimlendirilmiş gradient kontrol noktası
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198)-- seçici etkinleştirme yeniden hesaplama ve biçimsel maliyet analizi
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645)--                                                                                                                                                                                                                                                               
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840)-- ölçek aşağıdaki etkinleştirme yükünü kaldır
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html)-- 标准 API
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html)-- seçkin 、full 和 blok modları
