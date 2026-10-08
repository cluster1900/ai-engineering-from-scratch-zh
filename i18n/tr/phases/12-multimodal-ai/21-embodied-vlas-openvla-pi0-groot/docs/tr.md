# İçeriye yerleştirilmiş VLA:RT-2, OpenVLA, π0, GR00T

> İlk defa model tarafından web sitesinden yemek okumayı ve mutfak makinelerinde uygulanması, RT-2 ((Google DeepMind,2023 yıl 7 月) ⋅RT-2 olacak hareketi metin olarak ayırır Token, web verileri ile robot eylem verileri üzerinde VLM'e birlikte ince ayarlama yaparak ve web ölçekli görme dili Bilgi'nin makinelerin kontrolüne geçebileceğini kanıtlamak için WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB

**Type:** 学习
**语言：**Python(stdlib,action Tokenizer + VLA 推理骨架)
**Prerequisites:** Phase 12 · 05（LLaVA），Phase 15（Autonomous Systems，已引用）
**Time:** ~180 分钟

## Öğrenme hedefi

- 描述行动标记化:离散 bin 编码(RT-2)、FAST 高效行动 Token、连续 流匹配行动(π0)。
- Web + robot verilerinde neden co-fine-tuning yapıldığını açıklayın, yeni görevlere genel bilgi aktarımını koruyabilirsiniz.
- Bu nedenle, bu sistemin en iyi yönü, bu sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin en iyi yönü olan sistemin.
- Açık X-Bodiment veri kümesi ve RT-X eğitim korpusunun rolü

## 问题

能根据自然语言指令做家务的机器人, 1970'lerden beri çalışma hedefi olmuştur. 2020'lerin yanıtları: vizyon dili-hareketi(VLA) modeli.

VLA'nın Özel Çabası:

1. 动作空间是连续的(joint angles、forces),并且高维(7-DOF kolu + 3-DOF tutku = 30 Hz'de 10 dims)
2. 机器人专专训数据稀缺──Open X-Embodiment yaklaşık 1M yol var; web metin görüntü 5B+──
3. Kontrol frekansı çok önemlidir. 30 Hz kontrol döngüsü, her hareketin sadece 33 ms olduğunu gösteriyor.
4. Güvenlik. Hatalar, cihazı bozabilir.

## 概念

### Eylem simgesi ((RT-2)

RT-2 teknikleri: Her ortak hedefi bir ölçümlü sonrası metin Token olarak göstermek.

PaLM-X VLM'e karışık veriler üzerinde birlikte ince ayarlama yapılır:

- Web görüntü-metin çiftleri(başlıklandırma、VQA)。
- Robot gösterileri, eylem gösterisi Token için

模型看 pick up the red cube(language)→ image(vision)→ 10-Token action sequence(discretized joint targets)。Web pretraining 保留 genel bilgi aktarımı:

RT-2 论文中的推理为 3-5 Hz, VLM autoregressive decode'ye sınırlıdır.

### OpenVLA  开放的 7B 参考实现

OpenVLA(Kim et al.,2024 yıl 6 月) is open权重的 RT-2 等价物──7B Llama omurgası,DINOv2 + SigLIP 双视觉编码器, 256 kutuların aksiyon tokenizasyonu üzerine kurulmuştur──

Açık X-Bodiment Üstü eğitimde (Yüzünde 22 个机器人 970k)  附带 LoRA ince ayarlama 支持,用于适配新机器人

İndirim: A100'de 4 Hz'e kadar, ama yüksek frekanslı kontrol için uygun değil.

### Hızlı Tokenizer  更快的行動解码

Pertsch et al. (Discret-bin tokenizasyon 效率不高,因为大多数动作集中在bin-space 的小区域内──FAST (FAST)

Bir 30 adımlı eylem tarzı  300 ayrı-bin Token yerine yaklaşık 10 DATA Token haline gelmektedir.

### π0 和 akış eşleşme eylemleri

Fiziksel Zekilik  π0(Black et al.,2024 年 10 月) 替代离散 aksiyon uzmanı ile akış eşleşimi Token:

- Bir küçük eylem transformatörü VLM'nin gizli durumlarını okuyor ve düzeltilmiş akış yoluyla 50 adımlı eylem dizisini çıkartıyor.
- Hareket başı  訓練  VLM öncesi eğitim 保持不变。
- İndirim: Tam bir eylem dizisi, yaklaşık 5 个 denetleme adımları içinde output, pratik olarak 50 Hz 控制 ∞

π0 的主张: geniş bir işletim görev koleksiyonunda yenmek OpenVLA 和 Octo── devamlı eylem ifade ayrıştırmayı korudu 会破坏的平滑性──

π0.5 和 π0-FAST is increment upgrade──π0-FAST will FAST tokenization with flow matching 结合──

### GR00T N1  面向人形的双系统

NVIDIA'nın GR00T N1(2025 yıl 3 月) Face towards humanoid robots(>30 DOF, full body) yapı:

- Sistem 2: Büyük VLM 读取场景 + 指令,并以约1 Hz 产生高水平的子目标──
- Sistem 1: Küçük eylem başı transformatörü, alt hedeflere göre  düşük seviye 50-100 Hz ortak komutları üretmek

Kahneman'ın hızlı düşüncesi ile yavaş düşüncesi arasındaki bu ayrım:Sistem 2  planlama,Sistem 1  yürütme.

GR00T N1.7 ((2025 yıl sonu) geliştirilmiştir veri ölçekleme──GR00T Omniverse'den sim-to-real verileri kullanmak  ince ayarlama yapmak──

### Açık X-Body

訓練資料──RT-X(2023年 10月) 汇集了22 数据集,覆盖了22 机器人上1M轨迹──Open X-Embodiment是所有人使用的体:

- ALOHA / Köprü V2 / Droid / RT-2 Mutfağı / Dil Masası。
- Her örnek: ((robot durumu, kamera görüntüleri, talimatlar, eylem sırası))
- 訓練卫生: 统一行動空間、归一化 合同範囲、调整相機尺寸──

OpenVLA ve π0 都在Open X-Embodiment上训练──到任意特定机器人域空隙,可通过在100-1000 条任务专用演示上进行LoRA精细调来弥合──

### Sadece robotla birlikte düzenlenme

Web VQA verilerini robot yolları ile birlikte düzenlemeyi iyileştirmek 混合──比例很重要:VQA 太多,模型会忘记动作;robot data 太多,模型会丢失通用知识──

RT-2 oranı: yaklaşık 1:1──OpenVLA:web-to-robot ∼0.5:1──π0: analogo──精确比例是需要根据数据集大小调整的超参数──

Robot-yalnız 训练会产生任务专用模型,遇到out-of-distribution 指令就会失败。Co-fine-tuning 的差异在于,模型不仅能处理 拾起红立方块(在演示中) ,还能处理 拾起左边第三大物体(novel phrasing) 。

### Güvenlik ve eylem sınırları

Her üretim sınıfı VLA'sı:

- 硬 joint limitleri (((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((
- Hız sınırı (sıcak kesim)
- İş alanının sınırları (en-efektor, masaüstüden ayrılmak mümkün değil)
- Yeni görevler için insanlık kullanımı onaylaması

Bunlar kontrol katman kontrolleri olarak VLA dışı bölümünde yer almaktadır.


```figure
mm-action-tokens
```

## Kullan

`code/main.py`- ...

- 256-bin eylem tokenizasyonu ve tokenizasyonunu gerçekleştirmek.
- DCT + kuantitasyon üzerine kurulu 草拟 FAST tokenizer。
- Bıqqın,Diskret-bin,FAST,continuous-flow) on each action step
- 打印 RT-2 → OpenVLA → π0 → GR00T 的谱系摘要──

## - Söyle.

本课产 出 `outputs/skill-vla-action-format-picker.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                          

## 练习

1. 10 DOF kolu, 30 Hz kontrol frekansıyla çalıştırılıyor. 256 kutuyu ayırt edici bir tokenizasyonla her saniye kaç tane token gönderiliyor?

2. Hızlı tokenizasyon 30 adımlık yoldur  ≈10 Token ≈ Eğer yoldur ≈ yüksek frekanslı hareketler ≈ örneğin davul çalma ≈ varsa, kullanıcı ne kaybeder?

3. π0'un akış eşleşme başlığı yaklaşık 5 aşamada denosiyona göre                                                                                                                                                                                                                                                      

4. GR00T'nin Sistem 1 / Sistem 2 拆分对应 Kahneman── farklı bir parça ayrımı önerdi.

5. Açık X-Bodiment Bölüm 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|----------|
| VLA | "Vision-language-action" | 接收 image + instruction 并输出 action commands 的模型 |
| Action tokenization | "Discrete bins" | 将连续 joint targets 量化为每个 dim 256 个 bin，每个 bin 是一个 vocab ID |
| FAST tokenizer | "Frequency action tokens" | DCT + quantize，将 30-step trajectories 压缩到约 10 个 Token |
| Co-fine-tune | "Mix web + robot" | 在 robot demos 旁边同时使用 web VQA data 训练，以保留通用知识 |
| Flow-matching action head | "π0 continuous output" | 小型 transformer，通过 rectified flow 输出 50-step action sequence |
| System 1 / System 2 | "Dual-system control" | 大型 VLM 慢速规划，小型 action head 快速行动；GR00T 模式 |
| Open X-Embodiment | "RT-X dataset" | 1M-trajectory 跨机器人 dataset；training corpus |

## 延伸阅读

- [Brohan et al. — RT-2 (arXiv:2307.15818)](https://arxiv.org/abs/2307.15818)
- [Kim et al. — OpenVLA (arXiv:2406.09246)](https://arxiv.org/abs/2406.09246)
- [Black et al. — π0 (arXiv:2410.24164)](https://arxiv.org/abs/2410.24164)
- [NVIDIA — GR00T N1 (arXiv:2503.14734)](https://arxiv.org/abs/2503.14734)
- [Open X-Embodiment Collab — RT-X (arXiv:2310.08864)](https://arxiv.org/abs/2310.08864)
