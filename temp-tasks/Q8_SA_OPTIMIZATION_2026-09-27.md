# 临时任务书：Qwen3.8-27B Q8_K_P 第一阶段性能优化（S/A 级）

日期：2026-09-27  
用途：临时施工任务，完成后可删除。  
执行环境：Windows，本地 Qwen3.8-27B Q8_K_P + llama.cpp + Open WebUI。  
注意：本文件与当前 Web Game 项目无关，**禁止修改本仓库任何游戏代码**；本仓库仅作为临时任务书存放位置。

执行前读取：
- 本仓库 `AGENTS.md`
- https://github.com/zcssr1998-art/AI-Development-Rules/blob/main/GLOBAL_AI_RULES.md

---

## 0. 执行角色约束

本任务的技术路线、优先级和停止条件已经确定。

执行 Worker / DeepSeek 的职责：

```text
检查当前真实配置
→ 建立 baseline
→ 按既定顺序逐项 A/B
→ 只保留有确定收益且无质量风险的改动
→ 固化启动参数
→ 真实重启验收
→ 汇报结果
```

**不要重新设计优化路线，不要自行扩展到 B/C 级，不要凭经验“顺手优化”。**

如果某一步遇到兼容性问题，先做最小诊断；超过 2 次同类失败仍无新证据时，停止该项并继续下一项，不允许长时间随机试参数。

---

## 1. 目标

当前模型已经可以正常运行：

`Qwen3.8-27B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf`

本任务目标：

1. 保持 Q8_K_P，不降低模型权重量化；
2. 保持 reasoning / thinking 能力；
3. 不通过缩短输出、降低推理强度、改 sampling 来制造“变快”；
4. 优先提升真实 Chat 的 Generation tok/s；
5. 同时降低 TTFT 和总响应时间；
6. 保持 Open WebUI、Web Search、中文回答和现有工具链正常；
7. 达到验收后立即停止。

### 硬件

- CPU：AMD Ryzen 7 7700X，8C/16T
- GPU：NVIDIA RTX 4070 Ti 12GB
- RAM：64GB，2×32GB DDR5-6000 CL30
- 主板：ASUS TUF B650M-PLUS
- 电源：鑫谷 GM850W
- 系统：Windows

### 核心瓶颈判断

Q8_K_P 权重约 31GB，RTX 4070 Ti 只有 12GB VRAM，因此当前推理必然是 GPU + 系统内存混合。

本轮优化的核心不是“让 GPU 算得更猛”，而是：

```text
减少不必要显存占用
→ 给 Q8 权重腾更多 VRAM
→ 增加 GPU offload
→ 减少 DDR5 ↔ GPU / CPU 侧参与
→ 提升 token generation
```

同时利用 Qwen3.8 原生 Embedded MTP，提高单次权重读取对应的有效 token 产出。

---

## 2. 本轮范围锁定

### S 级：必须做

1. Embedded MTP
2. Context 优化
3. GPU Offload 最大化

### A 级：必须做

4. 纯文本默认模式不加载 mmproj
5. Flash Attention 确认并启用
6. Ryzen 7700X generation threads 优化
7. 确认 DDR5 实际运行在 6000MT/s

### 本轮明确禁止

- Q8 → Q6/Q5/Q4
- KV Cache F16 → Q8/Q4
- batch / ubatch 优化
- FastMTP sidecar
- 第三方 speculative decoding
- 使用 7700X 核显负责桌面
- CPU/GPU/RAM 超频或降压
- BIOS 自动修改
- PBO / Curve Optimizer
- Windows 大规模系统调优
- 更换推理框架
- 重装 Open WebUI
- 重做 Web Search / RAG
- 修改 Jarvis
- 修改 sampling 参数来追 benchmark
- 关闭或弱化 reasoning/thinking
- 大规模 benchmark / 参数穷举

这些全部留到后续阶段。

---

## 3. 已知路径与保护要求

优先检查当前真实环境，不假设路径永远一致。

重点定位：

- Q8 GGUF 实际路径
- llama-server / llama.cpp 实际路径与版本
- 当前正式启动脚本
- Open WebUI 启动脚本
- 当前模型启动参数
- 当前 backend endpoint

优先检查已存在路径（若存在）：

```text
D:\AI\qwen38\
D:\AI\qwen38\start-qwen38.ps1
D:\AI\qwen38\start-qwen38-4k.ps1
D:\AI\qwen38\start-openwebui.ps1
D:\AI\qwen38\stop-openwebui.ps1
D:\AI\qwen38\stop-qwen38.ps1
```

现有 Q8 是已验证基础。

任何正式脚本修改前，先保留原可工作版本，确保可以快速回滚。

不要删除旧脚本、旧 llama.cpp runtime 或 Q8 模型。

---

## 4. 测试方法必须统一

所有 A/B 必须使用同一个模型、同一组 prompts、同样最大输出长度和 sampling。

固定三组测试：

### Test A：短中文 Chat
用途：TTFT + 日常对话生成速度。

要求：
- 简短中文问题
- 目标输出约 200~300 tokens
- 不使用联网

### Test B：中等复杂度技术推理
用途：长一点的 reasoning / generation。

要求：
- 中文技术分析问题
- 目标输出约 500~800 tokens
- reasoning/thinking 保持当前正常模式
- 不人为要求短答

### Test C：长 Prompt
用途：Prompt Processing + TTFT。

要求：
- 使用约 8K~10K tokens 输入
- 输出约 300~500 tokens
- 内容固定

每轮至少记录：

```text
TTFT
Prompt Processing tok/s
Generation tok/s
总耗时
VRAM used
RAM used
GPU utilization
是否 OOM
是否有 CUDA error
中文是否正常
reasoning/thinking 是否正常
```

不要为了漂亮数字换 prompt。

---

## 5. Baseline

### 5.1 先只读，不修改

读取当前真实配置：

- llama.cpp / llama-server 版本
- 完整启动命令
- context size
- GPU layers / n_gpu_layers
- Flash Attention
- KV type
- threads
- threads-batch
- batch
- ubatch
- parallel
- mmap / mlock
- mmproj 是否加载
- MTP 是否启用
- reasoning / jinja 状态
- CUDA backend 是否真正启用

### 5.2 跑 Test A/B/C

生成 baseline 结果。

如果当前环境本身不能稳定完成三组测试，不进入优化；先修复到原有可用状态。

---

## 6. A：Flash Attention

这是低风险必检项。

### 决策

- 如果已经实际启用：保持，不改。
- 如果参数写了但日志未生效：查真实原因。
- 如果未启用：开启，并做 Test A/B/C。

要求从启动日志确认 CUDA Flash Attention 实际生效，不接受仅看脚本参数。

### 保留标准

开启后必须：
- 无 CUDA error；
- 无输出异常；
- 无 reasoning 异常；
- 性能不下降；
- VRAM 行为正常。

如果出现兼容性问题，恢复 baseline，不继续围绕它反复折腾。

---

## 7. A：mmproj

### 决策

先检查默认纯文本 Chat 是否加载视觉 projector / mmproj。

如果当前 Text Chat 一直加载 mmproj：

- 默认 Text profile 移除 mmproj；
- 不删除 projector 文件；
- 不破坏以后独立 Vision profile；
- 重新测 VRAM；
- 重新测可 offload 的层数。

如果当前没有加载 mmproj：PASS，不改。

### 原因

4070 Ti 只有 12GB VRAM。纯文本场景不应该常驻近 1GB 级别的视觉 projector 来挤占权重空间。

### 验收

Text Chat：
- 正常启动；
- 中文正常；
- reasoning 正常；
- VRAM 不增；
- GPU offload 有机会增加；
- 不影响 Open WebUI 日常纯文本使用。

---

## 8. S：Context

### 决策原则

不降低模型权重量化，不改 KV 精度。

先读取当前 context：

- 若当前 >64K：测试 32K 与 64K；
- 若当前 =64K：测试 32K；
- 若当前 <=32K：本项原则上不再降低。

### 默认目标

日常 Chat profile 优先 32K。

如果用户确实需要更长上下文，可保留 64K profile，但本任务的性能基线以日常 32K 为主。

### 重要解释

降低“最大 Context 上限”不是降低模型智力。

只要实际会话没有超过 32K，Q8 模型权重和推理能力没有因此变成 Q6/Q5。

### 验收

Context 调整后记录：

- KV / VRAM 变化；
- 可增加的 GPU offload；
- TTFT；
- TG tok/s；
- 是否有稳定性变化。

如果 32K 相比当前配置无实际资源收益且用户现有长上下文更重要，则保留原值。

---

## 9. S：GPU Offload

这是本机的核心性能项之一。

### 策略

在 Context/mmproj 稳定后，再调 GPU offload。

目标：

```text
尽可能多的 Q8 权重放进 4070 Ti
但必须留下 Windows + CUDA 的稳定余量
```

### 安全边界

不要追求 12GB 满载。

目标保留约：

```text
0.8 ~ 1.2 GB VRAM 安全余量
```

实际以稳定为准。

禁止：
- OOM；
- Windows 明显卡顿；
- Chrome/Open WebUI 崩溃；
- CUDA allocation failed；
- 为多一层 offload 牺牲稳定性。

### 测试范围

从当前 n_gpu_layers / offload 开始，在附近逐步提高。

最多做少量合理增量测试，不穷举所有 layer 数。

每个候选必须至少跑 Test A 和 B。

### 选择标准

优先：
1. Generation tok/s；
2. 总耗时；
3. 稳定性。

不要只按“offload 层数最多”选。

---

## 10. A：Ryzen 7700X threads

7700X = 8 个物理核心 / 16 逻辑线程。

### 决策

Generation 阶段重点对比：

```text
当前 threads
vs
threads = 8
```

如果当前已是 8，直接保持。

本轮不做复杂线程矩阵。

`threads-batch` 不做系统优化，保持当前配置；只有当前明显异常才允许做最小修正。

### 原则

不要默认 16 SMT threads 一定更快。混合 GGUF generation 常常更依赖物理核心与内存带宽，过多线程可能造成调度/带宽竞争。

### 选择

用 Test A/B 的 TG + 总耗时决定。

---

## 11. A：DDR5-6000 状态检查

只检查，不修改 BIOS。

确认 Windows 报告的实际内存速率约为 6000 MT/s。

如果是：
- 6000 左右：PASS。
- 4800/5200 或明显低：记录“EXPO / 内存频率可能未正确生效”。

本任务不自动进入 BIOS，不改 EXPO。

原因：Q8 很大一部分权重驻留系统内存，内存带宽对 generation 有实际影响；但 BIOS 修改属于另一风险层级。

---

## 12. S：Embedded MTP

这是本阶段最后做、但潜在收益最大的项目。

### 为什么最后做

先稳定：
- Flash Attention；
- mmproj；
- Context；
- GPU offload；
- threads。

然后测试 MTP，避免显存布局变化污染结果。

### 实现原则

只使用当前/upstream llama.cpp 对 Qwen3.8 原生 Embedded MTP 的正式支持。

先运行：

```text
llama-server --help
```

并根据当前 binary 的真实参数确定用法。

不要凭旧教程猜参数。

### 版本问题

如果当前 llama.cpp 太旧，不支持 Qwen3.8 Embedded MTP：

1. 不直接覆盖现有 runtime；
2. side-by-side 放一份当前官方 CUDA build；
3. 先用同一个 Q8、同一 baseline 参数跑 Test A/B；
4. 确认新版不回归；
5. 再测试 MTP。

如果升级 runtime 本身造成 Q8 行为/性能回归，恢复旧 runtime，MTP 本轮记为 blocker。

### A/B

必须做：

```text
MTP OFF
vs
Embedded MTP ON
```

如果当前实现支持 `n-max` 一类参数：

- 第一个候选使用保守值，例如 2；
- 只有确实有收益且稳定时，最多再测一个合理候选；
- 禁止大规模搜索。

### 记录

- TG tok/s
- TTFT
- 总耗时
- VRAM
- draft acceptance（若工具提供）
- reasoning 输出
- 中文输出
- 稳定性

### 保留标准

满足：
- 综合真实性能有清晰改善；
- 输出行为正常；
- 不降低 reasoning；
- 无额外不稳定。

则开启。

如果 MTP：
- 变慢；
- 卡顿；
- 输出异常；
- CUDA/兼容问题；

恢复 OFF，本轮结束该项。

**禁止转去 FastMTP。FastMTP 属于后续 C 级任务。**

---

## 13. 智力/质量保护线

任何性能优化都必须满足以下质量不变原则：

### 不允许改变

- Q8_K_P 模型文件
- reasoning / thinking 模式
- sampler 逻辑（除非修复明显错误）
- System Prompt 内容
- Chat Template（除非确认当前配置错误并且修复是必要兼容项）
- 最大输出 token 以伪造速度
- prompt 内容
- benchmark 输出长度

### 允许改变

仅限本任务范围中的：
- Flash Attention
- 是否加载 mmproj
- Context 上限
- GPU offload
- CPU generation threads
- Embedded MTP
- 启动脚本中上述参数的固化

### 质量异常即回滚

出现：
- reasoning 明显缺失；
- 输出截断；
- 模型角色/模板异常；
- 中文指令遵循显著下降；
- 同一 prompt 结果结构异常；
- 工具链失效；

则对应优化不得保留。

---

## 14. 结果判定

单个优化项：

- **<5% 且增加明显复杂度**：不保留；
- **5~10% 且零/低复杂度**：可保留；
- **>=10% 且无副作用**：保留；
- **>=20%**：高价值。

最终不是追求某一个 benchmark 最大值，而是综合：

1. TG tok/s；
2. TTFT；
3. 总响应时间；
4. 稳定性；
5. Q8 质量不变。

---

## 15. 正式固化

只有最终组合全部通过后，才修改正式启动入口。

用户日常仍然只能需要一个启动入口。

不要让用户手动记：
- ctx
- GPU layers
- threads
- MTP 参数
- flash-attn 参数

最终参数固化到当前正式启动流程。

保留最小回滚版本。

---

## 16. 最终验收

完整停止模型与 Open WebUI，再从日常入口重新启动。

必须通过：

```text
Q8 backend          PASS
Open WebUI          PASS
中文 Chat           PASS
技术推理            PASS
reasoning/thinking  PASS
Web Search          PASS
多轮聊天            PASS
无 OOM              PASS
无 CUDA error       PASS
```

再跑一次完全相同的 Test A/B/C，对比 baseline。

最终必须明确给出：

```text
baseline:
TTFT
PP tok/s
TG tok/s
VRAM
RAM

optimized:
TTFT
PP tok/s
TG tok/s
VRAM
RAM

gain:
TG %
TTFT %
total-time %
```

---

## 17. 时间预算与停止策略

### 正常时间预算

如果现有 llama.cpp 已支持 Qwen3.8 Embedded MTP：

```text
预计 45~90 分钟
```

构成大致为：
- baseline / 配置检查：10~15 分钟
- Flash/mmproj/context/offload/threads：20~35 分钟
- MTP A/B：10~20 分钟
- 最终重启验收：10~15 分钟

### 如果需要 side-by-side 更新 llama.cpp

预计：

```text
1.5~3 小时
```

取决于：
- 下载/构建速度；
- Windows CUDA binary 兼容性；
- MTP 参数是否直接可用。

### 硬性限制

如果总时间超过约 3 小时，仍未解决 MTP/runtime 兼容问题：

**停止继续消耗时间。**

保留已经验证有效的 Flash/mmproj/context/offload/threads 优化，MTP 标记 blocker，最终汇报。

不要为了追 MTP 无限调试。

---

## 18. 最终汇报格式

只返回：

```text
PASS / FAIL

baseline:
TTFT:
PP:
TG:
VRAM:

optimized:
TTFT:
PP:
TG:
VRAM:

gain:
TG:
TTFT:
total:

final:
ctx:
gpu_layers:
threads:
flash_attention:
mmproj:
embedded_mtp:

DDR5:
6000MT/s PASS / abnormal

tests:
Q8 chat:
reasoning:
web:
restart:
OOM:

commit:
<sha or none>

blocker:
none / <one key blocker>
```

不要在聊天里复述施工过程。

---

## 19. 完成即停止

S/A 项验收通过后立即停止。

不要继续：
- KV Q8；
- batch / ubatch；
- FastMTP；
- Q6；
- 核显桌面；
- BIOS/PBO；
- 其它“顺手优化”。

这些全部留给下一阶段单独决策。
