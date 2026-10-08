# ASCII Sanatı ve Görsel Hapishane Çıkışları

> Jiang, Xu, Niu, Xiang, Ramasubramanian, Li, Poovendran, "ArtPrompt: ASCII Art Based Jailbreak Attacks against Aligned LLMs" (ACL 2024, arXiv:2402.11753)  zararlı isteklerde güvenlik ile ilgili belirtileri gizle, aynı harflerle ASCII-art 染 değiştir, sonra bu taklit sonrası istek gönder.

**类型：**Yapım
**语言：**Python (stdlib, ArtPrompt token maskesi harnes)
**前置要求：**18 · 12 aşaması (PAIR), 18 · 13 aşaması (MSJ)
**时间：**60 dakika kadar .

## Öğrenme hedefi

- 描述 ArtPrompt 攻击:word-identification 步骤、ASCII-art 替换、最终伪装后的提示──
- 解释为什么标准防御(PPL、Paraphrase、Retokenization) 会在ArtPrompt 上失败。
- 定義 ViTC,并描述它衡量什么──
- 将 StructuralSleight 描述为向任意不常见文本编码结构的泛化.

## 问题

通過表述和角色扮演(Lesson 12) 以及通过长文文文面的攻击,作用于文本层面的模式──ArtPrompt 作用于识别层面:模型没有解析被禁止的代码──它解析的是由字符染出的图像──安全过器看到的是无害的标点──模型看到的是一个词──

## 概念

### ArtPrompt,两步

Adım 1. Sözcük Tanıması. Bir zararlı istek belirlenir. Saldırıcı bir LLM kullanarak güvenlik ile ilgili kelimeleri tanımlar.

Adım 2. Gizli Çabuk Nesil. Her tanımlanmış kelimeyi ASCII sanatı 染 için değiştirir.

Sonuç:GPT-4、Gemini、Claude、Llama-2、GPT-3.5 全部失败──

### Neden standart savunma başarısız oldu ?

- **PPL（perplexity filter）。**ASCII sanatı  yüksek karmaşıklığa sahiptir, ancak tüm yeni  girişler de öyle.
- **Paraphrase。**Bu nedenle, bu yöntemler, bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre daha bir süre daha bir süre daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha
- **Retokenization。**Gösteri tanımlama, modelin harf şeklini farklı bir şekilde ayırırken değişmez.

根本问题在于,安全过器处于Token 或语义层面;ArtPrompt 作用于视觉识别层面──

### ViTC referans değerini

识别非语义视觉提示──衡量模型读取 ASCII-art、wingdings 和其他非文本语义视觉内容的能力──ArtPrompt'in etkinliği ve ViTC doğruluğu 相关:模型越擅长读取视觉文本,ArtPrompt在它上越有效──

### YapısalSleight

泛化 ArtPrompt:Ucommon Text-Encoded Structures(UTES) ――树、图、嵌套 JSON、CSV-in-JSON、diff-style code blocks── Eğer bir yapı güvenlik eğitimi verilerinde nadir görülürse, ancak model tarafından çözülebilirse, zararlı içeriği gizleyebilir──

防御含义: güvenlik çözülebilir bir model olarak genel hale getirilebilir.

### Görüntü-modallik 类比

Görsel LLMs ((GPT-5.2、Gemini 3 Pro、Claude Opus 4.5、Grok 4.1) saldırı yüzünü genişletti.

### 18'inci aşamada yer alıyor.

Ders 12-14  üç çeşit正交攻撃を記述したベクター:代精錬(PAIR) 、文脈長(MSJ) 及びエンコーディング(ArtPrompt/StructuralSleight) ・ Ders 15 モデル中心的攻撃转向システム边界攻撃〜間接提示注射〜


```figure
al-ascii-cloak
```

## Kullan

`code/main.py`Construct a toy ArtPrompt──You can use ASCII-art glyphs 伪装有害 query 中的特定词,验证伪装后的字符串能通过关键字过器,并且(可选) 简单识别器将伪装后的字符串解码回来──

## - Söyle.

本课会产 出 `outputs/skill-encoding-audit.md`❖ Bir hapishane-savunma raporu belirleyerek, bu rakamın kodlama saldırı ailesini kapsayan bir rakam oluşturur.

## 练习

1. 运行  İşlem`code/main.py`◊ Test fake ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒     ⇒ ⇒  ⇒ ⇒ ⇒    ⇒ ⇒       ⇒      ⇒ ⇒      ⇒            ⇒                                                                                                                                                                                             

2. 实现第二种编码:对同一个目标词使用基础64──比较它对 ArtPrompt的过器绕行率 和恢复难度──

3. 阅读江 et al. 2024 Bölüm 4.3 ((五模型结果) 』, bir neden ortaya koydu, neden Claude'un aynı referanslamada ArtPrompt-resistance'den Gemini'ye yüksek olduğunu açıkladı.

4. 設計一個前代 防御,用于检测 prompt 中 ASCII-art-shaped 区域──在合法代码、表格和数学记号上衡量虚假阳性率──

5. StructuralSleight 10 çeşit kodlama yapısını listedeyor. Tüm 10 çeşit yapıların genelleştirilmesini halledebilen bir yapı tasarlıyor ve her korunma süretinin hesaplama maliyetini tahmin ediyor.

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|------------------------|
| ArtPrompt | "ASCII-art attack" | 使用 ASCII-art 渲染遮蔽安全词的两步 jailbreak |
| Cloaking | "隐藏这个词" | 用模型能读取但过滤器读不到的视觉表示替换被禁止的 Token |
| UTES | "不常见结构" | Uncommon Text-Encoded Structure — 树、图、嵌套 JSON 等，用于夹带内容 |
| ViTC | "visual-text capability" | 衡量模型读取非语义视觉编码能力的 benchmark |
| Perplexity filter | "PPL defense" | 拒绝高 perplexity 的 prompt；会失败，因为合法结构化输入也会得到高分 |
| Retokenization | "tokenizer shift defense" | 用不同的 Tokenizer 预处理 prompt；会失败，因为识别是视觉层面的 |
| Homoglyph | "外观相似字符" | 看起来与拉丁字母相同的 Unicode 字符；绕过 substring 检查 |

## 延伸阅读

- [Jiang et al. — ArtPrompt (ACL 2024, arXiv:2402.11753)](https://arxiv.org/abs/2402.11753) ASCII-art jailbreak 论文
- [Li et al. — StructuralSleight (arXiv:2406.08754)](https://arxiv.org/abs/2406.08754) UTES 泛化
- [Chao et al. — PAIR (Lesson 12, arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) 互补的代攻击
- [Anil et al. — Many-shot Jailbreaking (Lesson 13)](https://www.anthropic.com/research/many-shot-jailbreaking) 互补的长度攻击
