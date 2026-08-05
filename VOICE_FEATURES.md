# 🚀 AuraMind Voice-First Features - Implementation Guide

**Date:** August 5, 2026  
**Core Positioning:** Voice-powered flashcards for audio learners

---

## 🎯 CORE FEATURES TO BUILD

### **1. Voice Q&A Mode (Hands-Free Study)**

**User Flow:**
1. Start study session
2. AI speaks flashcard question aloud (TTS)
3. User answers verbally
4. AI transcribes answer (Speech-to-Text)
5. AI evaluates correctness
6. User rates retention (1-4)
7. FSRS schedules next review

**Tech Stack:**
- **Web:** Web Speech API (built-in browser)
- **Mobile:** Capacitor Voice Recorder plugin
- **TTS:** Browser SpeechSynthesis API or OpenAI TTS
- **STT:** Browser SpeechRecognition API or Groq Whisper

**Implementation Priority:** HIGH (this is your differentiator)

---

### **2. Audio Upload → Flashcards**

**User Flow:**
1. Upload audio file (lecture, meeting, podcast)
2. AI transcribes audio (Whisper)
3. AI extracts key concepts
4. AI generates flashcard deck
5. User reviews and saves

**Tech Stack:**
- **Transcription:** Groq Whisper API (fast + free tier)
- **Card Generation:** Existing Groq LLM service
- **File Upload:** Existing file upload infrastructure

**Implementation Priority:** HIGH (unique value prop)

---

### **3. Document → Study Materials**

**User Flow:**
1. Upload PDF/DOCX/PPTX
2. AI extracts text + structure
3. User chooses output:
   - Organized notes (markdown)
   - Presentation slides (HTML/PDF)
   - Flashcard deck (standard format)

**Tech Stack:**
- **PDF:** pdf-parse or pdf.js
- **DOCX:** mammoth.js
- **PPTX:** officegen or pptxgenjs
- **AI Processing:** Existing Groq service

**Implementation Priority:** MEDIUM (nice-to-have for launch)

---

## 📦 REQUIRED DEPENDENCIES

```bash
# Audio/Voice
npm install @capacitor/voice-recorder  # Mobile voice recording
npm install recordrtc                   # Web audio recording
npm install lamejs                      # MP3 encoding

# Document Processing
npm install pdf-parse                   # PDF text extraction
npm install mammoth                     # DOCX to HTML
npm install pptxgenjs                   # Generate PowerPoint

# Already have:
# - Groq API (Whisper for transcription)
# - Web Speech API (built-in browser)
```

---

## 🛠️ IMPLEMENTATION CHECKLIST

### **Phase 1: Voice Q&A Mode (Week 1)**

**Day 1-2: Text-to-Speech**
- [ ] Add TTS toggle to study session
- [ ] Read flashcard front aloud when shown
- [ ] Add voice speed controls (0.5x - 2x)
- [ ] Test on desktop + mobile browsers

**Day 3-4: Speech-to-Text**
- [ ] Add "Answer Aloud" button
- [ ] Capture user's spoken answer
- [ ] Transcribe using Web Speech API
- [ ] Display transcription for review

**Day 5: AI Evaluation**
- [ ] Send (question, answer) to Groq
- [ ] AI judges correctness
- [ ] Show "Correct" / "Incorrect" feedback
- [ ] Let user override rating

**Files to modify:**
- `src/pages/study/StudyMode.tsx`
- `src/services/study/voiceStudyService.ts` (create new)
- `src/hooks/useVoiceRecognition.ts` (create new)

---

### **Phase 2: Audio Upload (Week 2)**

**Day 1-2: File Upload + Transcription**
- [ ] Add "Upload Audio" to generator page
- [ ] Support MP3, WAV, M4A, OGG
- [ ] Integrate Groq Whisper API
- [ ] Show transcription progress

**Day 3: Flashcard Generation**
- [ ] Send transcript to Groq with prompt
- [ ] Parse AI response into flashcards
- [ ] Show preview before saving
- [ ] Save to new deck

**Day 4: Polish**
- [ ] Add audio length limits (Free: 10min, Pro: unlimited)
- [ ] Show estimated processing time
- [ ] Handle errors gracefully

**Files to modify:**
- `src/pages/generator/GeneratorPage.tsx`
- `src/services/api/groqService.ts` (add Whisper)
- `src/components/generator/AudioUploader.tsx` (create new)

---

### **Phase 3: Document Processing (Week 3)**

**Day 1: PDF Upload**
- [ ] Add "Upload Document" option
- [ ] Extract text from PDF
- [ ] Preserve headings/structure

**Day 2: Notes Generation**
- [ ] AI summarizes document
- [ ] Create markdown notes
- [ ] Add table of contents

**Day 3: Slides Generation**
- [ ] AI creates slide outline
- [ ] Generate HTML slides
- [ ] Export to PDF option

**Day 4: Flashcard Generation from Docs**
- [ ] Extract key concepts
- [ ] Generate Q&A pairs
- [ ] Create deck

**Files to modify:**
- `src/components/generator/DocumentUploader.tsx` (create new)
- `src/services/document/documentProcessor.ts` (create new)
- `src/services/document/slideGenerator.ts` (create new)

---

## 🎨 UI/UX ADDITIONS

### **Study Mode Enhancements**

**New Controls:**
```tsx
<div className="voice-controls">
  <button onClick={speakQuestion}>
    🔊 Speak Question
  </button>
  
  <button onClick={startListening}>
    🎤 Answer Aloud
  </button>
  
  <div className="transcription">
    {listening && <span className="pulse">Listening...</span>}
    {transcript && <p>You said: "{transcript}"</p>}
  </div>
</div>
```

**Settings:**
- Voice speed slider (0.5x - 2x)
- Auto-play toggle (speak next question automatically)
- Voice selection (if available)

---

### **Generator Page Tabs**

**New Layout:**
```tsx
<Tabs>
  <Tab name="text">Text Input</Tab>
  <Tab name="audio">Audio Upload 🎤</Tab>
  <Tab name="document">Document Upload 📄</Tab>
</Tabs>
```

---

## 🧪 TESTING CHECKLIST

**Voice Q&A:**
- [ ] TTS works on Chrome/Safari/Firefox
- [ ] STT captures answer correctly
- [ ] AI evaluation makes sense
- [ ] Works on mobile browsers
- [ ] Handles background noise

**Audio Upload:**
- [ ] 5min lecture → accurate transcription
- [ ] Generated flashcards are relevant
- [ ] Handles accents/audio quality
- [ ] Shows progress during processing
- [ ] Free tier limits enforced

**Document Upload:**
- [ ] PDF with images extracts text correctly
- [ ] DOCX preserves formatting
- [ ] Generated notes are coherent
- [ ] Slides look professional

---

## 📊 SUCCESS METRICS

**Week 1:**
- [ ] Voice Q&A working on desktop
- [ ] 10 beta testers try it
- [ ] 80% say "this is useful"

**Week 2:**
- [ ] Audio upload live
- [ ] 50 users upload audio
- [ ] Generate 500+ flashcards from audio

**Week 3:**
- [ ] Document processing live
- [ ] 100 users upload docs
- [ ] 50% conversion to paid (unlimited audio)

---

## 💡 LAUNCH MESSAGING

**Reddit Post:**
```
Title: Built a flashcard app that speaks questions aloud (for commuters)

I was frustrated studying Anki while driving (unsafe!).

Built AuraMind: voice-powered flashcards.
- AI asks questions aloud, you answer verbally
- Upload lecture recordings → auto-generate cards
- FSRS v5 algorithm (30% better retention)

Perfect for commutes, workouts, chores.

Free tier: [link]
```

**Product Hunt:**
```
Tagline: The flashcard app that talks back

First comment:
"As a med student with a 2-hour commute, I've wasted 500+ hours that I could've been studying. Built AuraMind to solve this.

Voice Q&A mode lets you study hands-free. Just hit play, AI asks questions, you answer aloud.

Also: upload any lecture → instant flashcards. Never manually create cards again."
```

---

## 🚀 3-WEEK SPRINT PLAN

**Week 1: Voice Q&A (Aug 5-11)**
- Mon-Tue: TTS integration
- Wed-Thu: STT integration
- Fri: AI evaluation
- Sat-Sun: Testing + polish

**Week 2: Audio Upload (Aug 12-18)**
- Mon-Tue: Whisper integration
- Wed: Card generation from transcript
- Thu: Polish + limits
- Fri: Deploy
- Sat-Sun: Beta testing

**Week 3: Launch (Aug 19-25)**
- Mon: Final testing
- Tue: Reddit launch
- Wed: Product Hunt
- Thu-Fri: Direct outreach
- Sat-Sun: User interviews

**Target: 50 paying users by Aug 25**

---

## 🔗 RELATED FILES

- `POSITIONING.md` - Market positioning
- `MVP_EXECUTION_PLAN.md` - Overall roadmap
- `QUICK_START.md` - Setup guide

---

**This is your competitive moat. Anki can't do this. Quizlet can't do this.**

**Build voice features FIRST. Everything else is secondary.** 🎯
