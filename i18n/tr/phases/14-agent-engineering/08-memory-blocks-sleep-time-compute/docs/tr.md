# Hatıra blokları ve Uyku Zamanı Bilgisayarı (Letta)

> MemGPT 2024 yılında Letta olarak gerçekleşecek. 2026 yılında gelişen iki fikirle birlikte: model doğrudan düzenlenebilir olan dağılmış işlevsel hafıza blokları, ve ana ajanı 空時異步統合記憶の睡眠時間エージェント.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## Öğrenme hedefi
- Letta kullanımı üç katlı anıların yanı sıra her katlılığın rolü.
- 解释 memory-block pattern:Human block、Persona block,以及作为一等类型类对象的用户定义的块──
- Uyku zamanı hesaplaması nedir, neden kritik yolun dışında yer almaktadır ve neden birincil ajanın daha güçlü bir modeli ile çalışabilmektedir.
-  bir ikili ajanın gerçekleşmesi  birliğin gerçekleşmesi  birli ajan  birli ajan  cevap veren  uyku zamanı ajan                                                                                                                                                                                                                                             

## 问题
MemGPT ((07 ders) sanal hafıza kontrol akışını çözdü.

1. **Latency.**Her bellek işleminin kritik bir yol üzerinde olması gerekir. Eğer bir ajan kullanıcı beklerken kesmek zorunda kalırsa, bir sonraki gecikme hızı hızla artacaktır.
2. **Memory rot.**写入会不断累积――被矛盾推翻的事实会留下――检索会被陈旧内容淹没――
3. **Structure loss.**平的档案库 无法表达Human block 总是在提示中;Persona block 总是在提示中;Task block 按会议 交换──

Letta (letta.com) is 2026 yılın重写版── bellek blokları 让结构显式化; uyku zaman hesaplama 将整合移出关键路──

## 概念
### Üç kat

| Tier | Scope | Where it lives | Written by |
|------|-------|----------------|------------|
| Core | 始终可见 | 在 main prompt 内 | Agent tool call + sleep-time rewrites |
| Recall | 对话历史 | 可检索 | 自动轮次日志 |
| Archival | 任意事实 | Vector + KV + graph | Agent tool call + sleep-time ingest |

Anahtar MemGPT'dir. Anıtlama, konuşma tamponu ve onun çıkarıldığı son bölümdür. Arşiv, dış depo.

### Hatırlama blokları

Block is core tier middle of a typed、persistent、editable ∞ original MemGPT kağıdı  definiye iki:

- **Human block** 关于用户的事实(姓名、角色、偏好、目标)
- **Persona block** ajanın kendi kavramı(身份、语气、约束)

Letta , kullanıcının belirlediği herhangi bir blok olarak genelleştirir:`Task`blok, kod tabanı için gerçekler`Project`blok, sert bağ için kullanılır `Safety`Her blokta var.`id`- Evet.`label`- Evet.`value`- Evet.`limit`(字符上限)`description`(Let the model know how to edit it)

Bloks kullanılabilir araç yüzeyi 编辑:

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)`                                                                                                                                                                                                                                                              

### Uyku zamanı hesaplama

2025年 Letta'nın yeni gelişimi: 后台运行第二个代理,位于关键路外──睡眠时间代理 处理对话转录和代码库文本,将 `learned_context`写入共有ブロック,并整合或作废档案记录──

Bu özelliklerden elde edilir:

- **No latency cost.**İlk cevaplar ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇
- **Stronger model allowed.**Uyku zamanı ajanı daha pahalı ve daha yavaş bir model olabilir çünkü gecikme sınırları yoktur.
- **Natural consolidation window.**Kullanıcı beklemiyorsa, tekrar tekrar yapın, sonuçlar çıkartın.

Bu biçim insan iş biçimine uyuyor: görevleri tamamlıyor, uykuda uykuda, uzun süreli hafızada geceyi sarıvererek.

### Letta V1 ve doğuştan akıl yürütme

Letta V1 (`letta_v1_agent`, 2026) 弃用 `send_message`Kalp atışları ve iç çizgiler`Thought:`Bu nedenle, bu yöntemin kullanımı ve kullanımı, birleştirilme ve kullanımı ile ilgili olarak, bir diğer yönlendirmenin yanıtı olarak, bir diğer yönlendirmenin yanıtı olarak, bir diğer yönlendirmenin yanıtı olarak, bir diğer yönlendirmenin yanıtı olarak, bir diğer yönlendirmenin yanıtı olarak, bir diğer yönlendirmenin yanıtı olarak, bir diğer yönlendirmenin yanıtı olarak, bir diğer yönlendirmenin yanıtı olarak, bir diğer yönlendirmenin yanıtı olarak, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir diğer yönlendirmenin yanı sıra, bir yönlendirmenin yanı sıra, bir yönlendirmenin yanı sıra, bir yönlendirmenin yanı sıra, bir yönlendirmenin yanı sıra, bir yönlendirmenin yanı sıra, bir yönlendirmenin yanı sıra, bir yönlendirmenin yanı sıra, bir yönlendirmenin yanı sıra, bir yönlendirmenin yanı, bir yönlendirmenin yanı, bir yönlendirmenin yanı, bir yönlendirmenin yanı, bir yönlendirmenin yanı, bir yönlendirmenin yanı, bir yönlendirmenin yanı, bir yönlendirmenin yanı, bir yönlendirme ve yönlendirmenin yanı, bir yönlendirmenin yanı, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendirme ile, bir yönlendme, bir yönlendme, bir yönlendme, bir yönlendme, bir yönlendme, bir yönlendme, bir yönlendme, bir yönde, bir yönde, bir etme, bir etme, bir etme, bir etme, bir etme, bir etme, bir etme, bir etme, bir etme, bir etme

### Bu yol kolayca yanlış bir yerde

- **Block bloat.**无限 `block_append`Çıktı. Çıktı. Çıktı. Çıktı.
- **Silent drift.**Uyku zamanı ajanı yeniden blok yazıyor, ve ana ajanı görmediğinden.
- **Poisoned consolidation.**Uyku zamanı ajanı saldırganın çekirdeğe ulaşabilen içeriği işleyecek. Ders 27. Uyku zamanı yüzeyine de uygulanacak.


```figure
memory-blocks
```

## Yapın onu.
`code/main.py`实现了:

- `Block` id、etiket、değer、 sınır、 açıklama¬
- `BlockStore` CRUD + `near_limit(label)`Yardımcı.
- İki yazıçı ajanı`PrimaryAgent`Bir seferinde,`SleepTimeAgent`Bu arada bir araya geliyoruz.
- Bir blok yazıyor, bir blok yazıyor, bir uyku zamanı geçiyor, bir blok topluyor ve bir eski gerçeği yok ediyor.

运行:

```
python3 code/main.py
```

Transkript                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

## Kullan
- **Letta**(letta.com) 作为参考实现──可自主托管或使用管理云──
- **Claude Agent SDK skills**Bilgi blok şeklinde bir bilgi olarak  yetenek bir özellik 带版本 检索可检索的指示块,代理 可按需加载──
- **Custom builds**适用于希望控制存储后端的团队──使用Letta API合同,以便后续迁移──

## - Söyle.
`outputs/skill-memory-blocks.md`İsterseniz çalıştırın. Letta şeklinde bir blok sistemi oluşturacak.

## 练习
1. Bir ekle.`block_summarize`araç:当 `near_limit`返回 true 时, model üretilen özetle 替换块值──哪个触发值能同时最小化总结调用和块溢出?
2. Arşivde uyku zamanının çıkarılması: iki kayıtın metni bir üzerinde yığıldığında %90'lık bir tokene sahip.
3. Bu yüzden, her yazılı kayıt eski değer ve farkı ortaya çıkarıyor.`block_history(label)`Operatörlerin kontrol edebilmesi için, ajanın neden X'i unuttuğunu öğrenmek için.
4. Uyku zamanı ajanlarını 视为不信的作家──当它们碰到人格或安全区块──提交前要求第二代理评论──
5. Letta API kullanımı için örnek nakliye (`letta_v1_agent`Blok şeması ne değişim, yerli düşünce nasıl iz şeklini değiştirebilir?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Memory block | “可编辑的 prompt section” | Core memory 中 typed、persistent、LLM-editable 的 segment |
| Human block | “用户记忆” | 关于用户的事实，固定在 core 中 |
| Persona block | “Agent 身份” | Self-concept、语气、约束，固定在 core 中 |
| Sleep-time compute | “异步记忆工作” | 第二个 agent 在 critical path 之外执行整合 |
| Core / Recall / Archival | “层级” | 三层记忆拆分：始终可见 / 对话 / external |
| Block limit | “上限” | 每个 block 的字符限制；迫使进行 summarization |
| Native reasoning | “Thinking channel” | Provider-level reasoning output，而不是 prompt-level `Thought:` |
| Learned context | “Sleep output” | Sleep-time agent 写入 shared blocks 的事实 |

## 延伸阅读
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Blok örneği
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) 异步整合
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) 原生 akıl yürütme 重写
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 起源
