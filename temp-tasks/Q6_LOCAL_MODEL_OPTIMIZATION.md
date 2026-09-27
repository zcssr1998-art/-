# Q6 Local Model Install + Optimization

## Goal
Add the HauhauCS Qwen3.8-27B Uncensored Aggressive **Q6_K_P** model beside the existing Q8 setup, keep Q6/Q8 independently optimized, and switch between them without loading both at once.

## Requirements
- Download the exact HauhauCS `Qwen3.8-27B-Uncensored-HauhauCS-Aggressive-Q6_K_P.gguf`; do not substitute another author/quant.
- Keep the existing Q8 intact and do not overwrite its validated preset.
- Reuse the current llama.cpp + Open WebUI stack: Open WebUI `:3000`, llama-server/backend `:8080`.
- Q6 and Q8 must appear as separate selectable models, but only one 27B model may be resident in RAM/VRAM at a time.
- Give Q6 its own runtime preset. Use the successful Q8 direction as the starting point: 32K context, Flash Attention ON, KV q8_0, MTP ON, and ~1GB VRAM safety margin.
- Do **not** blindly copy Q8 GPU layers. Re-fit Q6 for the highest stable GPU offload and best real generation speed. Start with MTP `n=3`; only test alternatives if needed.
- Keep Q8 unchanged.
- Add one shared/global system prompt so Q6 and Q8 default to Simplified Chinese unless the user explicitly requests another language. Code, commands, logs, filenames, APIs and necessary English technical terms remain unchanged.
- Do not modify Jarvis, BIOS/EXPO, unrelated Windows settings, or build a second WebUI/backend stack.

## Verification
PASS only if:
- Q6 loads and answers normally at 32K context.
- Q6→Q8 and Q8→Q6 switching works and the previous 27B model unloads.
- No OOM/CUDA errors.
- Q6 is measurably faster than its unoptimized baseline.
- The global Chinese prompt works for normal chat and technical questions.
- Q8 behavior remains unchanged.

Stop once the above passes. Record final Q6 preset, TG, TTFT, VRAM use, and switching result.
