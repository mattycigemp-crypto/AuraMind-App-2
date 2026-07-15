# Qwen2.5 Coder 14B — AuraMind Domain Training Guide

Custom-trained AI model for the AuraMind learning platform — an in-app AI study companion.

---

## 1. Model Architecture Overview

| Spec | Value |
|------|-------|
| **Base Model** | Qwen/Qwen2.5-Coder-14B-Instruct |
| **Parameters** | 14.7B total, 13.1B non-embedding |
| **Architecture** | Transformers with RoPE, SwiGLU, RMSNorm, Attention QKV bias |
| **Layers** | 48 |
| **Attention Heads** | 40 for Q, 8 for KV (GQA) |
| **Context Length** | 131,072 tokens (128K effective with YaRN) |
| **Training Tokens** | 5.5 trillion (code + text-code grounding + synthetic) |
| **Base License** | Apache 2.0 |
| **Knowledge Cutoff** | September 2024 (base) |
| **Fine-tuning Strategy** | LoRA / QLoRA for efficiency |
| **Target Platform** | In-browser via WebLLM (`@mlc-ai/web-llm`) on WebGPU |

**Strengths for AuraMind:**
- Strong reasoning and instruction-following for Socratic tutoring
- Code generation for flashcard/quiz creation with structured JSON output
- Long context window for entire documents (PDFs, PowerPoints)
- Good multilingual support for diverse study content

---

## 2. Fine-Tuning Strategy

### Recommended Approach: QLoRA (4-bit + LoRA)

Runs on a single GPU (RTX 3090/4090, A10, T4 via Colab, or Mac Studio M2 Ultra).

```python
from unsloth import FastLanguageModel
import torch

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-Coder-14B-bnb-4bit",
    max_seq_length=8192,
    dtype=None,
    load_in_4bit=True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
    use_rslora=False,
    loftq_config=None,
)
```

### Hyperparameter Reference

| Parameter | Recommended | Notes |
|-----------|-------------|-------|
| LoRA Rank (r) | 16–64 | Higher = more capacity but more VRAM |
| LoRA Alpha | 16–32 | Usually 2x rank |
| LoRA Dropout | 0–0.05 | 0 for deterministic, 0.05 for regularization |
| Learning Rate | 2e-4 (LoRA), 1e-5 (full) | Cosine scheduler preferred |
| Batch Size | 1–4 | Per device, adjust with gradient accumulation |
| Gradient Accumulation | 4–16 | Effective BS = batch x accum |
| Max Seq Length | 2048–8192 | Shorter = faster, longer = better for PDF processing |
| Epochs | 2–5 | Monitor validation loss to avoid overfitting |
| Optimizer | AdamW (paged for 4-bit) | paged_adamw_32bit for QLoRA |
| LR Scheduler | Cosine | Warmup ratio 0.03–0.1 |
| Weight Decay | 0.01 | Standard |

### Training Script (Unsloth + TRL)

```python
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        max_steps=200,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=42,
        output_dir="outputs",
    ),
)
trainer.train()
```

**Unsloth Colab notebook (base, swap dataset):** [Qwen 2.5 Coder (14B)](https://colab.research.google.com/drive/18sN803sU23XuJV9Q8On2xgqHSer6UZF?usp=sharing)

---

## 3. Dataset Preparation — AuraMind Domain

For generating study content, tutoring responses, and app-specific interactions, structure your training data as instruction-response pairs in Alpaca-style format.

### 3.1 Dataset Format

```json
{
  "instruction": "Generate 10 flashcards about the JavaScript event loop. Include questions about microtasks, macrotasks, and async/await. Difficulty: medium.",
  "output": "{\n  \"cards\": [\n    {\n      \"question\": \"What is the JavaScript event loop?\",\n      \"answer\": \"The event loop is a mechanism that continuously checks the call stack and message queue. It processes macrotasks from the queue only when the call stack is empty, and processes all microtasks between macrotasks.\",\n      \"difficulty\": \"medium\",\n      \"topic\": \"JavaScript\"\n    },\n    {\n      \"question\": \"What is the execution order of microtasks vs macrotasks?\",\n      \"answer\": \"After each macrotask, the event loop processes all microtasks before moving to the next macrotask. Microtasks (Promise.then, queueMicrotask) have higher priority than macrotasks (setTimeout, setInterval, I/O).\",\n      \"difficulty\": \"medium\"\n    }\n  ]\n}"
}
```

### 3.2 Training Categories & Data Sources

| # | Category | Weight | Description | Data Sources |
|---|----------|--------|-------------|--------------|
| 1 | **Flashcard Generation** | 25% | Generate question-answer pairs from topics, documents, URLs | Existing decks in DB, `premadeContent.ts`, manual educator-written pairs |
| 2 | **Quiz Generation** | 15% | Create multiple-choice questions with distractors and explanations | Existing quiz content, `QuizPage.tsx` patterns |
| 3 | **Socratic Tutoring** | 15% | Guide students to answers through questions, not direct answers | `STUDY_AGENT_SYSTEM_PROMPT` in `auraAiService.ts`, educational dialogues |
| 4 | **Concept Explanation** | 15% | Explain concepts with analogies, examples, and key points | Learning paths content (`learningPathsData.ts`, 86 lessons) |
| 5 | **Document Summarization** | 10% | Extract key points from PDFs, PPTX, TXT for card generation | Import pipeline logic, document parsing flows |
| 6 | **Study Content Enhancement** | 8% | Improve existing cards, adjust difficulty, expand answers | DB card content with before/after examples |
| 7 | **App Navigation (Tool Use)** | 7% | Recognize intent and output JSON action structures (go to section, etc.) | `app_action` tool definition in system prompt |
| 8 | **Spaced Repetition Advice** | 5% | Suggest study schedules, review strategies, explain SRS algorithm | SM-2/FSRS algorithm code in `srs.test.ts`, study session logic |

### 3.3 Synthetic Dataset Generation

Use the current AuraMind AI (Groq/Llama-3.3-70B) as a teacher model to generate high-quality training pairs:

```python
import json
import random
from openai import OpenAI

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key="gsk_your_key"
)

DOMAIN_SYSTEM_PROMPT = """You are an expert educational content creator for the AuraMind learning platform.
Generate realistic instruction-response pairs for training an AI study companion.

The AI companion ("Aura") must:
1. Generate flashcards (JSON output with question/answer/difficulty)
2. Generate quizzes (JSON output with multiple choice + explanations)
3. Explain concepts using the Socratic method
4. Summarize documents for study content
5. Recognize user intent and output tool actions
6. Follow the AuraMind system prompt rules strictly

The response should be natural, helpful, and match the Aura personality."""

def generate_training_pairs(category: str, num_pairs: int = 20):
    prompt = f"""Generate {num_pairs} diverse instruction-response pairs for training 
a Qwen2.5-Coder-14B model to act as the AuraMind AI study companion.

Category: {category}

For each pair:
- Instruction: A realistic user message (what a student would type in the chat)
- Response: The ideal Aura response following these rules:
  * For flashcard/quiz generation: output ONLY valid JSON with the tool structure
  * For teaching: use Socratic method, ask guiding questions
  * For navigation: output ONLY the app_action JSON
  * For concept explanations: provide clear, structured explanations

Include a variety of difficulty levels, subjects, and interaction types.

Return as JSON array: [{{"instruction": "...", "output": "..."}}]"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": DOMAIN_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.8,
    )
    return json.loads(response.choices[0].message.content)
```

### 3.4 Real Data Extraction from Codebase

Extract existing high-quality examples from the AuraMind codebase:

```
# From premadeContent.ts — 20+ pre-written flashcard decks
# From learningPathsData.ts — 86 lessons with educational content
# From auraAiService.ts STUDY_AGENT_SYSTEM_PROMPT — the full Aura persona definition
# From srs.test.ts — spaced repetition algorithm explanations
# From dbService.test.ts — real API usage patterns
# From existing chat conversations — real user-AI interactions
```

### 3.5 Dataset Structure Directory

```
training-data/
├── flashcards/          # Flashcard generation pairs
│   ├── topics.jsonl     # Topic → card generation
│   ├── documents.jsonl  # Document → card extraction
│   └── improvement.jsonl # Card enhancement pairs
├── quizzes/             # Quiz generation pairs
│   ├── mcq.jsonl        # Multiple-choice question generation
│   └── review.jsonl     # Quiz review and feedback
├── tutoring/            # Socratic method dialogues
│   ├── follow-ups.jsonl # Follow-up question chains
│   ├── corrections.jsonl # Misconception correction
│   └── explanations.jsonl # Concept explanations by difficulty
├── tool-use/            # Intent recognition + JSON tool output
│   ├── navigation.jsonl # "Go to generator" → JSON app_action
│   └── generation.jsonl # "Make a deck" → JSON flashcard tool
├── domain-knowledge/    # AuraMind-specific Q&A
│   ├── features.jsonl   # "What is the Generator?" type questions
│   ├── srs.jsonl        # Spaced repetition explanations
│   └── limits.jsonl     # "Can you do X?" → correct boundary responses
└── system-prompt/       # System prompt adherence training
    └── persona.jsonl    # Enforcing Aura personality, avoiding model name leaks
```

---

## 4. Prompt Engineering for AuraMind

### 4.1 System Prompt (Matches Production `STUDY_AGENT_SYSTEM_PROMPT`)

```
You are Aura, the AI study companion of **AuraMind** — a full-stack learning platform.
You help students understand concepts, think critically, and navigate the app.

## About AuraMind
AuraMind is a complete study application with these features and pages:
- **Dashboard** (/dashboard) — Study stats, XP, streaks, recent activity, retention charts
- **Generator** (/dashboard/generator) — Create flashcards, quizzes, decks from topics, URLs, videos, or uploaded documents
- **Cards** (/dashboard/cards) — Browse, search, filter, manage flashcard decks. Study mode with SM-2/FSRS spaced repetition.
- **Chat** (/dashboard/chat) — Current AI chat. Study help, concept explanation, Socratic Q&A. Also source-grounded answers from uploaded documents.
- **Lessons** (/dashboard/lessons) — Structured lessons that combine explanations with embedded quizzes and flashcards.
- **Settings** (/dashboard/settings) — Profile, preferences, theme, account management.
- **Landing Page** (/) — Public homepage about AuraMind.

## Teaching Philosophy: Socratic Method First
1. Ask guiding questions that lead students to discover answers themselves
2. Break complex topics into smaller, manageable steps
3. Use analogies and real-world examples relevant to their level
4. Encourage them to explain their reasoning
5. Provide hints before answers — only give direct answers after they've attempted
6. Praise correct reasoning and gently correct misconceptions

## Your Capabilities — Tool JSON Output
When a user requests an action, output ONLY the JSON structure. No conversational filler.

### explain_concept
{"tool": "explain_concept", "data": {"concept": "...", "explanation": "...", "examples": [...], "keyPoints": [...]}}

### app_action (Navigate app — require user confirmation first)
{"tool": "app_action", "data": {"action": "go_to_section", "args": {"section": "generator|cards|chat|lessons|dashboard|settings"}}}

## Boundaries
You CANNOT create flashcards, quizzes, decks, or study content. Redirect to Generator page at /dashboard/generator.

## Core Rules
1. Tool request → output ONLY raw JSON. No preamble, no postscript.
2. General question → friendly academic text response.
3. Always respond as Aura. Be accurate, concise, academic.
4. Never mention "Groq", "OpenAI", "DeepSeek", "Model", or internal providers.
5. Never propose destructive actions.
6. Adapt to student's level — simpler for beginners, deeper for advanced.
7. If asked about identity: "I'm Aura, built for AuraMind."
```

### 4.2 Inference-Time Prompt Templates

**Flashcard Generation:**
```
Generate {count} flashcards about {topic} at {difficulty} difficulty.
Output ONLY valid JSON: {{"cards": [{{"question": "...", "answer": "...", "difficulty": "easy|medium|hard"}}]}}
```

**Quiz Generation:**
```
Create a {count}-question multiple-choice quiz about {topic} at {difficulty} difficulty.
Output ONLY valid JSON: {{"quiz": [{{"question": "...", "options": [...], "correctIndex": N, "explanation": "..."}}]}}
```

**Socratic Teaching:**
```
Explain {concept} using the Socratic method. Ask me guiding questions to help me discover the answer.
Do NOT give me the direct answer. Start with a question.
```

**Document Summary for Study:**
```
Summarize the following text and extract 5 key concepts that could be turned into flashcards.
Output ONLY valid JSON: {{"summary": "...", "keyConcepts": [{{"concept": "...", "details": "..."}}]}}
```

---

## 5. Inference & Deployment — In-App via WebLLM

The fine-tuned model runs **inside the browser** using `@mlc-ai/web-llm` — no server needed after download.

### 5.1 How AuraMind Loads Models

The existing `localInferenceService.ts` handles all model management:

```typescript
// GPU tier detection (auto)
const tier = await LocalInferenceService.detectGPUTier();
// tier 1 (integrated) → 360M model
// tier 2 (low-end) → 1.1B model
// tier 3 (mid-range) → 2B model
// tier 4 (Apple Silicon) → 8B model — target for fine-tuned Qwen 14B
```

### 5.2 Converting Your Fine-Tuned Model for WebLLM

WebLLM uses MLC format (compiled for WebGPU). Steps to convert:

```bash
# 1. Merge LoRA adapters into base model
python -m peft merge_and_save \
  --model_name_or_path Qwen/Qwen2.5-Coder-14B-Instruct \
  --peft_path ./outputs/checkpoint-200 \
  --output_dir ./merged-qwen-auramind

# 2. Compile for WebLLM using MLC-LLM
# Install: pip install mlc-llm-nightly
mlc_llm gen_config ./merged-qwen-auramind \
  --target webgpu \
  --quantization q4f16_1 \
  --conv-template qwen2_instruct \
  --output ./dist/qwen-auramind

mlc_llm compile ./dist/qwen-auramind \
  --target webgpu \
  --output ./dist/qwen-auramind/qwen-auramind.wasm

# 3. Upload to Hugging Face or CDN
# The model is loaded via:
```

### 5.3 Registering the Model in AuraMind

Add your fine-tuned model to `localInferenceService.ts`:

```typescript
export const AVAILABLE_MODELS: ModelInfo[] = [
  // ... existing models
  { id: 'Qwen2.5-Coder-14B-Instruct-q4f16_1-MLC', vram: 8700, name: 'AuraMind Pro Max' },
];

// Update tier mapping — only tier 4 Apple Silicon can run 14B
const TIER_MODELS: Record<GPUTier, string[]> = {
  1: ['SmolLM2-360M-Instruct-q4f16_1-MLC'],
  2: ['Llama-3.2-1B-Instruct-q4f16_1-MLC'],
  3: ['gemma-2-2b-it-q4f16_1-MLC'],
  4: ['Qwen2.5-Coder-14B-Instruct-q4f16_1-MLC'],  // Fine-tuned, or fall back to 8B
};
```

### 5.4 WebLLM Inference Code

The `AuraAiClient` automatically routes to local inference when `VITE_USE_LOCAL_AI=true`:

```typescript
// auraAiService.ts handles this:
if (useLocalAI) {
  return localInference.chatCompletion({ messages, temperature, max_tokens });
}
```

Or call the local inference engine directly:

```typescript
import { localInference } from './services/api/localInferenceService';

// Auto-detect GPU and load appropriate model
await localInference.ensureInitialized();

const response = await localInference.chatCompletion({
  messages: [
    { role: 'system', content: STUDY_AGENT_SYSTEM_PROMPT },
    { role: 'user', content: 'Explain closures in JavaScript using the Socratic method.' }
  ],
  temperature: 0.7,
  max_tokens: 2000,
});
```

### 5.5 Fallback Strategy

The production fallback chain in `auraAiService.ts`:

1. **WebLLM** (fine-tuned Qwen 14B in-browser) — best experience, full privacy
2. **Groq** (cloud, Llama-3.3-70B) — fast fallback if WebGPU unavailable
3. **Local LM Studio/Ollama** — alternative local option

On rate limit (429 from Groq), the service falls back to WebLLM automatically.

### 5.6 Alternative: Server-Side with vLLM

For a hosted version (optional, if you want a cloud endpoint):

```bash
# Serve fine-tuned model
vllm serve Qwen/Qwen2.5-Coder-14B-Instruct \
  --enable-lora \
  --lora-modules auramind=./outputs/checkpoint-200 \
  --port 8000

# API call
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auramind",
    "messages": [{"role": "user", "content": "Quiz me on TypeScript generics"}],
    "temperature": 0.7
  }'
```

---

## 6. Critical Fine-Tuning Tips

### Tokenizer Notes
- Set `tokenizer.pad_token = tokenizer.eos_token` — do NOT use `<|endoftext|>`
- The pad_token issue causes infinite generations; this is critical

### Chat Template
Qwen uses this template (already supported by `@mlc-ai/web-llm`):
```
<|im_start|>system
You are Aura, the AI study companion...<|im_end|>
<|im_start|>user
Generate flashcards about the water cycle<|im_end|>
<|im_start|>assistant
{"cards": [...]}<|im_end|>
```

### JSON Output Reliability
For tools (flashcard gen, quiz gen, app navigation), the model MUST output valid JSON only.
Recommended training augmentation: add 10% negative examples where the model must NOT output JSON (general chat).

### YaRN for Long Context
For processing full PDFs or PowerPoints, enable YaRN:
```json
{
  "rope_scaling": {
    "factor": 4.0,
    "original_max_position_embeddings": 32768,
    "type": "yarn"
  }
}
```

### Memory Optimization (for conversion/training)
| Technique | VRAM Savings | Trade-off |
|-----------|-------------|-----------|
| QLoRA (4-bit) | ~75% | Slight quality loss |
| Gradient checkpointing | ~40% | ~20% slower training |
| Flash Attention 2 | ~30% memory, 2x speed | Requires compatible GPU |
| Unsloth optimizations | 2x speed, 60% less memory vs FA2+HF | Custom kernels |

### Evaluation Metrics
| Metric | Purpose |
|--------|---------|
| **JSON validity** | Generated flashcard/quiz JSON parses correctly |
| **JSON schema match** | Output matches expected tool format (tool/explain_concept/app_action) |
| **Socratic method adherence** | Response uses guiding questions, not direct answers |
| **Persona consistency** | Never mentions Groq/OpenAI/model names; always "Aura" |
| **Boundary adherence** | Redirects to Generator for content creation; never creates cards directly |
| **Instruction following** | Respects difficulty, count, format constraints |
| **LLM-as-Judge** | Rubric: helpfulness, accuracy, safety, persona, teaching quality |

---

## 7. Training Data Categories for AuraMind

| # | Category | Weight | Example Instructions |
|---|----------|--------|---------------------|
| 1 | **Flashcard Generation** | 25% | "Make 10 cards about quantum computing", "Create flashcards from this PDF text..." |
| 2 | **Quiz Generation** | 15% | "Quiz me on the React lifecycle", "Generate 5 MCQs about Python decorators" |
| 3 | **Socratic Teaching** | 15% | "Explain recursion", "I don't understand closures", "Help me with Big O notation" |
| 4 | **Concept Explanation** | 15% | "What is the difference between var and let?", "Explain how databases work" |
| 5 | **Document Processing** | 10% | "Summarize this chapter", "Extract key concepts from this article" |
| 6 | **Card Enhancement** | 8% | "Make this card harder", "Add more examples to this flashcard", "Explain this answer better" |
| 7 | **App Navigation (Tool)** | 7% | "Go to the generator", "Take me to my study session", "Open flashcards" |
| 8 | **SRS & Study Advice** | 5% | "When should I review this?", "Why am I forgetting these cards?", "Explain spaced repetition" |

### Training Data Generation Pipeline

```
Step 1: Extract real content from codebase
  ├── premadeContent.ts → 20+ decks → flashcard pairs
  ├── learningPathsData.ts → 86 lessons → concept explanation pairs
  ├── srs.test.ts → algorithm logic → SRS explanation pairs
  └── system prompt → persona and boundary training

Step 2: Generate synthetic variations with teacher model (Groq/Llama-3.3-70B)
  ├── Difficulty variation: easy → medium → hard
  ├── Subject variation: JS, Python, Math, Science, Languages
  ├── Format variation: tool JSON vs conversational text
  └── Edge cases: empty input, off-topic, refusal scenarios

Step 3: Validation
  ├── JSON validity check (all tool outputs must parse)
  ├── Schema compliance (correct tool name, required fields)
  ├── Persona audit (no model name leaks)
  └── Boundary check (no direct content creation)
```

---

## 8. Resources

- **Qwen2.5-Coder on Hugging Face:** https://huggingface.co/Qwen/Qwen2.5-Coder-14B
- **MLC-WebLLM Docs:** https://github.com/mlc-ai/web-llm
- **Unsloth Colab (base):** https://colab.research.google.com/drive/18sN803sU23XuJV9Q8On2xgqHSer6UZF
- **Technical Report:** https://arxiv.org/abs/2409.12186
- **Your AuraMind Codebase:** `auraAiService.ts`, `localInferenceService.ts`, `STUDY_AGENT_SYSTEM_PROMPT`
- **Your Domain Docs:** `AURAMIND_TUTORIAL.md`, `AURAMIND_COMPREHENSIVE_GUIDE.md`, `TOP_EDUCATIONAL_APPS_RESEARCH.md`
- **Existing Tests:** `srs.test.ts`, `dbService.test.ts`, `auraAiService.test.ts`
- **Learning Path Content:** `src/data/learningPathsData.ts` (86 lessons across 6 courses)
