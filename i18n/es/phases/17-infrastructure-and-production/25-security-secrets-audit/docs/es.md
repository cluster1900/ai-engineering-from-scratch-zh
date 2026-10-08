# Seguridad  Secrets、API Key 轮换、Audit Logs、Guardrails

> 通過集中式 vault(HashiCorp Vault、AWS Secrets Manager、Azure Key Vault) eliminar Secrets 蔓延──绝不要把凭证存放在配置文件、VCS 中的 env files、表表里──优先使用IAM角色,而不是静态密钥;CI/CD 使用OIDC──AI-gateway pattern 是 2026年关系的解决方案:app → gateway → model provider,gateway 在行行时从 vault 拉取证凭──在库中轮换后,所有应用程序会在几分钟内获取更新,也不需要部署,也不需要在 Slack里有新承诺──使用轮换政策 ≤90天;每次都在使用TrumpleHog /GBA /GBA /GPC的服务器扫描;Vero-Vero-O:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:`api.openai.com`¿Qué es esto?`api.anthropic.com`Para evitar que se produzcan otras fuentes de ventas. Fatos impulsores del incidente de 2026: Ataque de la cadena de suministro de Versailles, a través de la invasión de las credenciales de CI / CD, ha revelado miles de despliegues de clientes.

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- 列举四种秘密管理反模式(VCS Config files,hardcoded env,spreadsheets,static keys),并说出它们的替代方案──
- Explicar el patrón de tirones de la puerta de entrada de la IA. ¿Por qué es el estándar de producción de 2026?
- 实现 una con tokenización consistente (same value → same placeholder) de la limpieza de PII,让语义得以保留──
- Explicar el incidente de la cadena de suministro de Vercel de 2026, así como sus lecciones sobre la higiene de credenciales de CI/CD.

##  problemas
Un estudiante ha presentado las claves de API.`.env` Ellos rápidamente lo eliminaron. Pero estas claves  ya han entrado en el historial de git.  GitGuardian scan  capturó, y su proceso de rotación es  en Slack  notificar al equipo   actualizar 40 archivos de configuración  redistribuir todos los servicios ◦ 8 horas después, la mitad de los servicios  ya está en línea, la otra mitad todavía está esperando a desplegar las ventanas ◦

Además, las instrucciones del usuario contienen mi SSN es 123-45-6789.

Además, el módulo de LLM de tu grupo EKS puede acceder a cualquier host de Internet. Alguien puede buscar datos en DNS y exfillarlos a un dominio controlado por el atacante.

La seguridad de los servicios de LLM 必须处理这三类矢量──Vault-backed credentials──PII scrubbing──Network exit filtering──Audit logs──

## 概念
### 集中式 vault + IAM-role pull

**Vault**: HashiCorp Vault, gerente de secretos de AWS, Azure Key Vault, gerente secreto de GCP.

**IAM role**: aplicación/puerta de entrada a través de su identidad IAM  realizar la certificación, en lugar de la clave estática―Vault en el token  ciclo de vida  retornar secreto―

**The AI-gateway pattern**Por la puerta en la demanda de la bóveda .`OPENAI_API_KEY`△ en la bóveda 中轮换; 下一次请求拿到新钥──无需重新部署──

### Política de rotación ≤ 90 días

Todas las claves de API, tokens de raíz de la bóveda, credenciales de CI/CD, como sea posible, rotación automática, rotación manual, registro y seguimiento.

### Escaneo secreto

- **TruffleHog** 对 commits hacer regex + entropía 检测。
- **GitGuardian** comercial, 准确率高──
- **Gitleaks** OSS, en el centro de operaciones CI

Cada vez que se compromete, se ejecuta. Si se detecta un nuevo secreto, se detiene la PR.

### Posición de cero confianza

- Todas las cuentas deben activarse en MFA.
-                                                                                                                                                                                                                                                               
- RBAC (basado en el papel) o ABAC (basado en el atributo) para el acceso a granos finos.
- Tokens de corta duración ((以小时计, en lugar de天)
- Posición del dispositivo   sólo permite activar el cifrado del disco de los dispositivos corporales。

### El uso de la limpieza PII/PHI

En cuanto a su infra:

1. Reconocimiento de la entidad (spacy NER、Presidio、comercial)
2. 屏蔽匹配到的实体:`"My SSN is 123-45-6789"`¿ Qué es esto ?`"My SSN is [SSN_TOKEN_A3F]"`¿Qué es eso?
3. Tokenización consistente (Mesh approach):el mismo valor 映射到同一位holder,让LLM保留关系──
4. 可选: hacer un mapa inverso de la respuesta del LLM.

Los filtros de regex estáticos pueden capturar patrones básicos; NER puede capturar más.

### Barrancas de entrada y salida

Entrada: bloquear los jailbreaks ya conocidos, temas prohibidos, hacer un límite de velocidad según el usuario.

Resultado: us regex scrub 泄露的秘密(API key patterns、refusal contexts 中的电子邮件 patterns), us classifier 检测 policy violations──

### Lista blanca de salida de red

Servicios de LLM  位于 subred especializada:
- Lista blanca:`api.openai.com`¿Qué es esto?`api.anthropic.com`、puntos finales de DB vectorial、puntos finales de bóveda。
- Todo lo demás: gota.
- DNS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### Registro de auditoría

Cada llamada de LLM de registro inmutable, incluye:
- Estampilla de tiempo.
- Usuario / inquilino
- Hacienda rápida, por privacidad, no registran la solicitud en bruto.
- Modelo + versión
- El número de tokens se cuenta.
- Costo:
- Respuesta hash.
-  cualquier viaje de barandillas

按法规保留(SOC 2 1 año,HIPAA 6 años)

### El incidente de Vercel de 2026

Ataque de cadena de suministro: fuertemente destruido, las credenciales de CI/CD se filtraron en miles de clientes.

### Debes recordar el número

- Política de rotación:≤ 90 días¬
- Cada vez más cometas: TruffleHog / GitGuardian / Gitleaks
- Vercel 2026:CI/CD 凭据被泄露 → 数千个客户环境 泄露──
- Retención del registro de auditoría: SOC 2 = 1 año, HIPAA = 6 años。


```figure
i4-vault-rotation
```

## Usalo
`code/main.py`实现 una borracha de PII de juguete con tokenización consistente, así como un registro de auditoría solo para apéndices.

##  entregarlo
本课生成                       `outputs/skill-llm-security-plan.md` De acuerdo con el ámbito normativo y el estado actual, la migración de las bóvedas, el deslizamiento, la entrada y el registro de auditoría.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Enviar dos citas de la misma SSN  confirmar que ambos obtienen el mismo titular de lugar 
2. Para utilizar OpenAI + Anthropic + Weaviate para el despliegue de vLLM-on-EKS diseñar una política de salida de red.
3. Usted encontró una clave en la historia de la git (en inglés)  2 años ago 
4. Tu registro de auditoría Cada día aumenta 10 GB.
5. 论证 Reverse-tokenization (把真实值替换回 LLM response) ¿vale la pena su complejidad, o hace que los titulares de puestos se vean mejor?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Vault | "secrets store" | 集中式 credential management service |
| IAM role | "identity-based auth" | app assume 的 role；返回 short-lived creds |
| OIDC for CI/CD | "cloud-issued tokens" | CI 中没有 static keys — 通过 OIDC 建立 identity |
| TruffleHog / GitGuardian / Gitleaks | "secret scanners" | commit-time secret detection |
| RBAC / ABAC | "access control" | Role-based vs attribute-based |
| PII scrubbing | "data masking" | 移除敏感 entities 或对其 tokenization |
| Consistent tokenization | "stable placeholders" | Same value → same token each time |
| Mesh approach | "Mesh tokenization" | 保留语义的 tokenization pattern |
| Egress whitelist | "outbound allowlist" | 只有允许的 domains 可访问 |
| Audit log | "immutable history" | 用于 compliance 的 append-only record |

## 延伸阅读
- [Doppler — Advanced LLM Security](https://www.doppler.com/blog/advanced-llm-security)
- [Portkey — Manage LLM API keys with secret references](https://portkey.ai/blog/secret-references-ai-api-key-management/)
- [Datadog — LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)
- [JumpServer — Secrets Management Best Practices 2026](https://www.jumpserver.com/blog/secret-management-best-practices-2026)
- [Microsoft Presidio](https://github.com/microsoft/presidio) Detección y anonimización de PII。
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
