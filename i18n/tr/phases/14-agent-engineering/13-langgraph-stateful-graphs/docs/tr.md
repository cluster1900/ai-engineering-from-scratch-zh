# LangGraph:Stateful Graphs ve Sürdürülebilir İcra

> LangGraph 2026 yılındaki düşük düzeyde devletli orkestrasyonun referans standartıdır. Ajan bir devlet makinesi; düğümler bir fonksiyon; kenarlar bir devlet transfer; devlet değişmez ve her adımdan sonra kontrol noktasıdır.

**类型：**Öğrenim + yapı
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 01 (Ajans Çapı), Fase 14 · 12 (İş akışı kalıpları)
**时间：**~ 75 dakika

## Öğrenme hedefi

- LangGraph'in çekirdek modeli:带有不变状态、函数节点、条件边和后步检点的状态机──
- Konu: "Durable execution"",streaming"",human-in-the-loop"",comprehensive memory"
- 解释 LangGraph 支持的三种管弦类型:supervisor、peer-to-peer (swarm)、hierarşik (nested subgraphs)。
- 实现一个stdlib状态图,包含不可变状态、条件边,以及检查点/再开始周期──

## 问题

Ajanlar ve iş akışları ortak bir sorunu var: Bir 40 adımlı çalışmanın 38. adımda başarısız olduğu zaman, baştan başlamak yerine 38. adımlı çalışmanın devamını yapmak istersin.

LangGraph'in tasarım cevabı: durum bir eşsiz tiplendirilmiş nesnedir, mutasyonlar açıkça görülür ve kontrol noktaları her düğümün ardından devam eder.`load_state(session_id)`- Evet.

## 概念

### grafik

Bir grafik aşağıdaki bölümden tanımlanır:

- **State type.**Bir tipli dikt ((( veya Pydantik model), her node şehirçe读取并修改它──
- **Nodes.**纯函数 `(state) -> state_update`❖ Güncelleştirmeler 会在返回后合并进状态──
- **Edges.**Kodular arasındaki koşullu veya doğrudan geçişler¬¬¬
- **Entry and exit.** `START`和 `END`Sentinel düğümleri 标记边界。

Örnek: bir içerir `classify`- Evet.`refund`- Evet.`bug`- Evet.`sales`- Evet.`done`düğümlerin ajanı, yani bir grafik 形式のルーティングワークフロー──

### Sürekli çalıştırma

Her düğüm  dönüş sonrası, çalıştırma süresi 会序列化状態,并将其写入检查点(SQLite、Postgres、Redis、自定义) ⋅ Eğer第 N 步失败, çalıştırma süresi olabilir`resume(session_id)`,并带着精确状态 从第 N+1 步继续──

LangGraph 文档 açıkça bu noktayı üretim kullanıcıları için önemini vurguladı:Klarna、Uber、J.P. Morgan。

### Akış

Her düğüm kısmi bir çıkış elde edebilir. Graf, düğüm delta olayları başına arama akışına gider. UI'nin grafın içinde 运行时更新.

### - İnsanlık.

Yapılan yöntem: Önemli düğümde öncesinde durup, durumu insana gösterir, değiştirmeyi kabul eder ve tekrar yapar.

### Hatıra

Kısa süreli (,) Bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (), bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) bir kez (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (,) (en (en (en (en (en

### Üç çeşit topoloji

1. **Supervisor.**Merkez yönlendirici LLM'yi uzman subgenlere dağıtır.`langgraph-supervisor`Orta `create_supervisor()`(LangChain 团队 in 2026 yılında, daha iyi bir bağlam kontrolü elde etmek için doğrudan araç çağrıları yoluyla yapılması önerilmektedir)
2. **Swarm / peer-to-peer.**Ajanlar ortak bir araç yüzeyi üzerinden doğrudan el ele geçirirler.
3. **Hierarchical.**Gözetmenler 管理 sub-supervisors,以 嵌套子图实现──

### Bu tür bir yol kolayca yanlış olur.

- **Checkpoints too small.**Sadece kontrol noktası konuşması döner 会让工具状态 和 記憶写得无法恢复──全状态 必须可序列化──
- **Non-deterministic nodes.**Resume 假设 node inputs 会产生相同的状态更新──随机种子、壁-clock、外部 API 们都必须被捕获──
- **Over-use of conditional edges.**Her kenar koşullu bir grafiktir, bir düşünülemez durum makinesi vardır.


```figure
langgraph-state
```

## Yapın onu.

`code/main.py`实现一个 stdlib状态图:

- `State`: bir dikte yazılmış, içerir `messages`- Evet.`step`- Evet.`route`- Evet.`output`- Evet.`human_approval`- Evet.
- `Node`:接收状态并返回更新 dict 的调用式──
- `StateGraph`:nodes + edges + conditional edges + run + resume。
- `SQLiteCheckpointer`(memory fake): her düğümün 后序列化 durumunda;`load(session_id)`                                                                                                                                                                                                                                                              
- Bir demo grafiği: sınıflandır -> şubesi(refund / hata / satış) -> insan kapısı -> göndermek。

- Yapma .

```
python3 code/main.py
```

Trace 会 ilk kez insan kapısında çalışmayı başarısızlıkla tamamladı, sonra devam etti ve son çıkışı üretti.

## Kullan

- **LangGraph**: reference realization,production-ready──使用 `create_react_agent`- Evet.`create_supervisor`Ya da kendi grafikini oluştur.
- **AutoGen v0.4**(Deneyim 14): Yüksek rekabet senaryolarına uygulanmış aktör modeli 替代方案。
- **Claude Agent SDK**(Deneyim 17): İçinde yerleştirilmiş oturum dükkanının yönetilen harnesleri
- **Custom**: Eğer durum şekli veya kontrol noktası arka uç için gerekli olduğunda  kesin kontrol kullanın

## - Söyle.

`outputs/skill-state-graph.md`Zaman içerisinde LangGraph şeklinde bir durum grafiği oluşturur ve kontrol noktasını yeniden başlatır.

## 练习

1. sınıflandırma güven 低于值时,从 `classify`添加一条 Şartlı kenar `end`❖ İnsan elini kullanırken`route`Son devamı:
2. SQLite'e benzer sahte bir SQLite kontrol noktası yerine gerçek SQLite kontrol noktası kullanmak.
3. 实现 paralel kenarlar: iki düğüm并发运行,并通过定制减速器 合并──Immutable state 在这里带来了什么?
4. Okuyucu`langgraph-supervisor`Referans:         `create_supervisor`❖ İz şekilleri ile karşılaştırmak
5. 添加流: Her düğüm, çalışma sırasında kısmi bir durum elde eder.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| State graph | “Agent 即状态机” | Typed state + nodes + edges + reducers |
| Checkpointer | “Persistence backend” | 在每个 node 后序列化 state；支持 resume |
| Reducer | “State merger” | 将当前 state 与 node update 组合起来的函数 |
| Conditional edge | “Branch” | 由 state 函数选择的 edge |
| Subgraph | “Nested graph” | 作为另一个 graph 中 node 使用的 graph |
| Durable execution | “从失败处 resume” | 使用精确 state 从最后一个成功 node 重启 |
| Supervisor | “Router LLM” | 面向 specialist subagents 的 central dispatcher |
| Swarm | “P2P agents” | Agents 通过 shared tools hand off；没有 central router |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Referans belgeleri
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) Gözetmenlik örneği API
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) Oyuncu-Model 替代方案
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Sessiyon mağazası ve alt üyeler
