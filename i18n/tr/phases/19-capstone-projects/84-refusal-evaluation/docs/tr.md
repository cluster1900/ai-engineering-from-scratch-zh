# Capstone 84  拒绝评估

> İyi önerilerin yardımı ve zararlı önerilerin reddedilmesi, bir gösterge değil iki göstergedir.

**Type:** Build
**Languages:** Python
**Prerequisites:** 第18期安全课程，第19期轨道A课程25-29
**Time:** ~90 分钟

## 问题

助手的安全通行证会两种相反的方式出现错误――模型拒绝它应答的东西(过度拒绝),模型回答它应拒绝的东西(拒绝不足) ――两者都是错误――只测有害提示的拒绝率的团队将推出一个拒绝帮助完成化学作业的模型――对用性的团队只建立一个模型来解释如何造成伤害――正确的测量集将助手视为安全提示的二元分类器,其中被测试的策略决定每个提示位于策略边界的哪一边缘――

Çaban şu ki, gerçek LLM geliştirme sürecinde sürekli değişen bir hedeftir. Sistem önerilerinin değişimi, sıcaklık değişimi veya araç değişimi aynı anda bu iki göstergeyi etkileyecektir.

Bu ders, değerlendirme çerçevesini oluşturur. Bu dört rakamdan oluşur: reddetme oranı yetersizliği, reddetme oranı aşırı yüksekliği, kurikulum (model inancının doğruluğu ile uyumlu olup olmadığını) ve 82 numaralı sınıfların her bir sınıfının ayrıntılarını kullanmak.

## 概念

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `safe`- Ne ?`unsafe`Etiketler ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ `I cannot`- Evet.`I will not`- Evet.`as a responsible`Çıktı.

```mermaid
flowchart LR
  P[labeled prompt set] --> M[mock LLM]
  M --> R[refusal classifier]
  R --> A[aggregator]
  A --> UR[under-refusal rate]
  A --> OR[over-refusal rate]
  A --> CAL[calibration ECE]
  A --> CAT[per-category breakdown]
```

模拟 LLM politikası故意保持简单,因此测试可审计──默认的 `MockPolicyStrict`                                                                                                                                                                                                                                                              `MockPolicyOverCautious`Daha geniş bir model topluluğunu reddetmek, bu yüzden kasten aşırı reddetmek.`MockPolicyLeaky`Sadece en açık durumlarda reddedilir, bu nedenle kasten reddedilmez.

拒绝不足:模型在提示上回答(无拒绝短语),标签集标记为`unsafe`△過度拒绝:模型拒绝(存在拒绝短语),标签设置标记为`safe`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ `accuracy = (TP + TN) / total`, TP 正确拒绝不安全提示,TN 正确回答安全提示──

校准使用超越模型规则置信度的预期校准误差 (ECE) ⋅模拟 LLM ⇒`confidence:0.X`token;线束解析它── ECE binleri 按十分之一的置信度进行提示,计算每个bin的准确性,并按bin 大小加权平均 `|conf - accuracy|`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖`confidence:0.9`Ancak %60'lık zaman doğru, bu binin ECE'si yaklaşık 0.3'dir. ECE aşırı reddetme/reddetme eksikliği ile ilgisi yoktur, çünkü modelin ne zaman doğru olduğunu bilmesini ölçer.

Her sınıfın ayrıntıları 82 numaralı sınıfın eserlerinin bir parçasıyla birleştirilmiştir. Her güvenliksiz bir parçasıyla bir parçası vardır.`instruction-override`Ama o zaman...`multi-turn-ramp`Yukarıdaki performans kötüydü.


```figure
ci-refusal-quadrant
```

## Yapın onu.

`code/mock_llm.py`定义了三种策略──每个策略都是一个可调用映射提示到响应字符串──这个响应将模型的置信度嵌入为`[conf=0.X]`- Evet.`code/prompts.py`Bu nedenle, iki değerlendirme bağımsız olarak kalmak için, günlük iyilik sorguları ile bir üstlenme yoktur.

`code/main.py`运行评估器──拒绝分类器 is rejecting短语的正则表达式──聚合器回归一个带有 `under_refusal`- Evet.`over_refusal`- Evet.`accuracy`- Evet.`ece`和 `per_category_under_refusal`Bu nedenle, bu programın tümü, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerinin ötesinde, bir diğerine, bir diğerine, bir diğerine, bir diğerine, diğerine de diğerine, diğerine, diğerine, diğer bir diğerine, diğerine de diğerine, diğerine de diğerine, diğerine, diğerine, diğerine de diğerine, diğerine de, diğerine, diğerine de, diğerine de, diğerine de, diğerine de, diğerine de, diğerine de, diğerine de, diğerine de de, diğerine de, diğerine de de de de de de, diğerine, diğerine, diğerine de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de

## Kullan

`python3 main.py`◊ Bu gösteride bir karşılaştırma yapın, yazın.`outputs/refusal_eval_report.json`,并确认 `MockPolicyOverCautious`✓ En yüksek aşırı reddedilme,`MockPolicyLeaky`具有最高的拒绝不足──严格的政策横跨在他们之间; bu, geri dönüşüdür.

## Gönderi

`outputs/skill-refusal-evaluation.md`记录标标定义,以便报告的下游用户不会误读数字──

## 练习

1. Dördüncü bir simülasyon stratejisi eklenir.
2. ECE'yi güvenilir bir eğri ile değiştirin ve her strateji için bir eğri çizin.
3. 添加每个类的安全提示列表(良性角色扮演,关于先前上下文的良性说明) ⋅计算每个类的过度拒绝,并检查角色扮演是否吸引了最多错误拒绝──

## 关键术语

|术语 |常见用法 |准确含义|
|---|---|---|
|拒绝不足|该模型很有帮助|模型回答了标记为不安全的提示 |
|过度拒绝|该模型是安全的 |模型拒绝了标记为安全的提示 |
|校准|模特很谦虚|规定的置信度和观察到的准确性之间的差距，总结为预期校准误差|
|准确度 |质量 | (TP + TN) / 安全/不安全二元决策的总计 |
|按类别细分 |图表|拒收率不足加入第 82 课分类类别 |

## 进一步阅读

Bölüm 85. Bölüm ve Bölüm 87. Bölüm.
