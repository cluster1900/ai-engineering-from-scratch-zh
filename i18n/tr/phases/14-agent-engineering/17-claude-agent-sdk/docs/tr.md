# Claude Agent SDK:Subagents 和 Session Store

> Claude Agent SDK, Claude Code harness 库形态──eğlence izolesiyonunun alt kısımları, hakları, W3C iz yayımı, seans depoları eşitliği──Claude Yönetilen ajanlar, uzun süreli asink işlerin barındırılmış alternatifleri için kullanılır──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## Öğrenme hedefi
- Antropik Client SDK (Hem API) ve Claude Agent SDK (Harmness Shape) arasındaki farkı açıklayın.
- 描述 subagents:parallelization 和 context isolation,以及何时使用它们──
- Python SDK'nin seans depo yüzeyini anlatın`append`- Evet .`load`- Evet .`list_sessions`- Evet .`delete`- Evet .`list_subkeys`) ve `--session-mirror`Etkisi:
- 实现一个stdlib harness,包含内置工具、带隔离的背景的 subagent spawning、生命周期 hooks 和 session store──

## 问题
Raw LLM API sadece bir kez geri dönüş sağlar. Prodüksiyon ajanı  araç yürütülmesi, MCP sunucular, yaşam döngüsü hakları, subagent doğurma, oturum devamlılığı, iz yayılması.

## 概念
### Müşteri SDK vs. Ajan SDK

- **Client SDK (`anthropic`).**Raw Messages API──你自己负责循环、工具 和状态──
- **Agent SDK (`claude-agent-sdk`).**Ekipleşmiş araç yürütme、MCP bağlantıları、haklar、subagent spawning、session store──也就是作为库提供的Claude Code loop──

### İçinde yerleştirilmiş araçlar

SDK 开箱附附10+ araç:file read/write、shell、grep、glob、web fetch 等──Kustom araçlar 通过标准工具-schema接口注册──

### Altınlık

Antropik iki kullanımını kaydetti:

1. **Parallelization.**并发运行独立工作──Bu 20 modülün her biri için test dosyasını bul  是 20 个 paralel alt görev──
2. **Context isolation.**Subagents kendi bağlam penceresini kullanır; sadece sonuçlar orkestrata geri döner.

Python SDK'nin yakın dönem yeni gelişmeleri:`list_subagents()`- Evet.`get_subagent_messages()`, subagent transkriptleri okumak için kullanılır.

### Oturum mağazası

TypeScript'in protokol paritesi:

- `append(session_id, message)`Bir dönüş ekle.
- `load(session_id)`Konuşmayı yeniden başlatmak.
- `list_sessions()`- Evet.
- `delete(session_id)` 带有对 subagent seansların kaskadesi
- `list_subkeys(session_id)` 列出 subagent anahtarları。

`--session-mirror`(CLI bayrağı) Transkript akışı sırasında dış dosyalara ayna olacak, debugging için kolaylaştırılmıştır.

### Çakmaklar

Kaydetmek için hayat döngüsü hakları:

- `PreToolUse`- Evet .`PostToolUse` kapı veya denetim aracı çağrıları。
- `SessionStart`- Evet .`SessionEnd` kurmak ve yıkmak.
- `UserPromptSubmit`                                                                                                                                                                                                                                                              
- `PreCompact` 在 之前运行──
- `Stop`- Ajan çıkışı temizlik.
- `Notification` Yan kanal uyarıları。

Haklar pro-iş akışıdır (Fase 14 ders referansı) ve benzer sistemler ek çapraz davranış biçimi olarak.

### W3C izleme bağlamı

调用方上活跃的OTel spans 会通过W3C 追踪文本头条 传播到CLI alt işlem。 Tüm çok süreçli 追踪 会在你的后台中显示为一个追踪。

### Claude Ajanları Yönetti

Hosted 替代方案(beta başlığı `managed-agents-2026-04-01`)― Uzun süreli asynk çalışması―binyoluna hazır hızlı önbelleğe­binyoluna hazır kompaktleşme―kontrolü­le 换取管理基础设施―

### Bu örneği kolayca yanılıyor.

- **Subagent over-spawn.**100 küçük görevden 100 altıncı oluşur.
- **Hook creep.**Her takımda bir tane hakka eklenir. Başlama zamanı 膨胀── her sezon inceleme hakkaları──
- **Session bloat.**Sessiyonlar 持续累积;size 增长──使用 `list_sessions`+ Sonlama politikası


```figure
ae-subagent-isolation
```

## Yapın onu.
`code/main.py`Uddlib 实现 SDK biçimi:

- `Tool`- Evet .`ToolRegistry`, içerir .`read_file`- Evet .`write_file`- Evet .`list_dir`- Evet.
- `Subagent` özel bağlam, izole çalıştırma, sonuçları geri göndermek.
- `SessionStore` ekleme, yükleme, list, silme list_subkey'leri
- `Hooks` `pre_tool_use`- Evet .`post_tool_use`- Evet .`session_start`- Evet .`session_end`- Evet.
- Bir demo: ana ajan paralel doğurur 3 个 subagent( herkes ayrı), sonuçları toplar,并持续 sessiyona

运行:

```
python3 code/main.py
```

Trace 会 gösterir alt bağlam izolesiyon(orkester ortamı boyutu 保持 bounded) 、hak yürütme 和 seans kalıcılığı。

## Kullan
- **Claude Agent SDK**Claude Code harness şeklini isteyen Claude-first ürünleri kullanmak için.
- **Claude Managed Agents**Uzun süreli asinkron çalışmaları kullanılmıştır.
- **OpenAI Agents SDK**(Disim 16) OpenAI-birincil eşleri için kullanılır.
- **LangGraph + custom tools**Eğer grafik şeklinde bir devlet makinesi istiyorsan...

## - Söyle.
`outputs/skill-claude-agent-scaffold.md`Çatırma bir Claude Agent SDK uygulaması, alt parçalar, haklar, oturum mağazası, MCP sunucu ekleme ve W3C iz yayılması içerir.

## 练习
1. 添加一个子弹生机,把20 个任务批 成每组 5 个平行子弹──衡量乐队员语境大小与一个任务的对比──
2. 实现一个 `PreToolUse`Hak,对 `write_file`Çağrılar  hız sınırı yapılır  Her seansı Her dakika 5 kez 
3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `list_subkeys`- Ne gibi görünüyor? - Ne gibi?
4. Bu oyuncak portunu gerçekleştireceğim.`claude-agent-sdk`Python paketi. Araç kayıtında ne değişecek?
5. Claude Yönetimli Ajanlar doktorları... ne zaman kendi kendine konukseverlikten yönetilenlere geçeceksin?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | “Claude Code as a library” | Harness shape：tools、MCP、hooks、subagents、session store |
| Subagent | “Child agent” | Separate context、own budget；results bubble up |
| Session store | “Conversation DB” | Persist、load、list、delete turns，并带 subagent cascade |
| Hook | “Lifecycle callback” | Pre/post tool、session、prompt submit、compact、stop |
| W3C trace context | “Cross-process trace” | Parent span propagates into CLI subprocess |
| Managed Agents | “Hosted harness” | Anthropic-hosted long-running async work |
| `--session-mirror` | “Transcript mirror” | 在 session turns streaming 时将它们写入外部文件 |
| MCP server | “Tool surface” | 附加到 agent 的外部 tool/resource source |

## 延伸阅读
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Code'nın kitlesinin şekli
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 生产模式
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) ev sahipliği yapılmış 替代方案
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) karşılama
