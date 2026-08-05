/**
 * VoiceStudyControls — hands‑free study toolbar for the StudyModePage.
 *
 * Drop into any study surface:
 *   - "Hands-Free" toggle: AI speaks each question, listens for the
 *     student's answer, then evaluates it aloud.
 *   - "Speak Question": TTS the current prompt.
 *   - "Answer Aloud": manual mic capture of the spoken answer.
 *
 * The component is presentational + self-contained: all Web Speech API
 * interactions live inside useVoiceStudy, and answer grading lives in
 * voiceEvaluationService. No coupling to the StudyModePage's state.
 */
import React, { useCallback, useRef, useState } from 'react';
import { Volume2, Mic, Square, MicOff, Headphones } from 'lucide-react';
import { useVoiceStudy } from '../../hooks/useVoiceStudy';
import { evaluateSpokenAnswer, type VoiceVerdict } from '../../services/study/voiceEvaluationService';

interface VoiceStudyControlsProps {
  question: string;
  answer: string;
  /** Called with (correct, spokenAnswer) when the student finishes an answer */
  onAnswerEvaluated?: (correct: boolean, spoken: string, verdict: VoiceVerdict) => void;
  /** When true, "Hands-Free" can trigger the next card via this callback */
  onRequestNextCard?: () => void;
}

export function VoiceStudyControls({
  question,
  answer,
  onAnswerEvaluated,
  onRequestNextCard,
}: VoiceStudyControlsProps) {
  const [handsFree, setHandsFree] = useState(false);
  const [verdict, setVerdict] = useState<VoiceVerdict | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const answerRef = useRef('');
  answerRef.current = answer;
  const nextRef = useRef(onRequestNextCard);
  nextRef.current = onRequestNextCard;

  const handleTranscript = useCallback(
    async (spoken: string) => {
      if (!spoken.trim()) return;
      setEvaluating(true);
      try {
        const v = await evaluateSpokenAnswer(question, answerRef.current, spoken);
        setVerdict(v);
        onAnswerEvaluated?.(v.correct, spoken, v);
        if (handsFree) {
          // Hands-free: announce verdict then auto-advance.
          voice.speak(v.correct ? 'Correct!' : 'Not quite.', () => {
            nextRef.current?.();
          });
        }
      } finally {
        setEvaluating(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question, handsFree, onAnswerEvaluated],
  );

  const voice = useVoiceStudy({
    onTranscript: handleTranscript,
    rate: 1,
  });

  const toggleHandsFree = () => {
    const next = !handsFree;
    setHandsFree(next);
    if (next) {
      // Kick off: speak the question, then listen.
      voice.speak(question, () => voice.startListening());
    } else {
      voice.cancelSpeech();
      voice.stopListening();
    }
  };

  const speakQuestion = () => {
    voice.cancelSpeech();
    voice.speak(question);
  };

  const toggleListen = () => {
    if (voice.listening) {
      voice.stopListening();
    } else {
      setVerdict(null);
      voice.startListening();
    }
  };

  const answeredText = verdict
    ? verdict.correct
      ? '✓ Correct — ' + verdict.feedback
      : '✗ ' + verdict.feedback
    : '';

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-2">
        {/* Hands-Free Mode */}
        <button
          onClick={toggleHandsFree}
          title="Hands-free: AI speaks each question, listens to your answer, then advances"
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-medium transition-colors ${
            handsFree
              ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#8B5CF6]'
              : 'bg-[#111118] border-[#2A2A3A] text-[#5A5A72] hover:text-[#F0EFFE] hover:border-[#7C3AED]/40'
          }`}
        >
          <Headphones size={13} className={handsFree ? 'animate-pulse' : ''} />
          {handsFree ? 'Hands-Free On' : 'Hands-Free'}
        </button>

        {/* Speak Question */}
        <button
          onClick={speakQuestion}
          disabled={voice.speaking}
          title="Read the question aloud"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#2A2A3A] bg-[#111118] text-[#5A5A72] hover:text-[#F0EFFE] hover:border-[#7C3AED]/40 transition-colors text-[11px] font-medium disabled:opacity-40"
        >
          <Volume2 size={13} className={voice.speaking ? 'animate-pulse text-[#8B5CF6]' : ''} />
          {voice.speaking ? 'Speaking…' : 'Speak Question'}
        </button>

        {/* Answer Aloud */}
        <button
          onClick={toggleListen}
          title="Answer aloud — your speech will be transcribed and graded"
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-medium transition-colors ${
            voice.listening
              ? 'bg-red-500/15 border-red-500/40 text-red-400'
              : 'bg-[#111118] border-[#2A2A3A] text-[#5A5A72] hover:text-[#F0EFFE] hover:border-[#7C3AED]/40'
          }`}
        >
          {voice.listening ? <MicOff size={13} className="animate-pulse" /> : <Mic size={13} />}
          {voice.listening ? 'Listening…' : evaluating ? 'Grading…' : 'Answer Aloud'}
        </button>
      </div>

      {/* Transcript + verdict */}
      {(voice.listening || voice.interimTranscript || voice.transcript || verdict) && (
        <div className="w-full max-w-md rounded-lg border border-[#2A2A3A] bg-[#0D0D14]/80 backdrop-blur-sm px-4 py-3 text-center">
          {voice.listening && (
            <div className="text-[11px] text-[#8B5CF6] mb-1 flex items-center justify-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B5CF6]" />
              </span>
              Listening — answer aloud
            </div>
          )}
          {(voice.interimTranscript || voice.transcript) && (
            <p className="text-xs text-[#F0EFFE] italic">
              “{voice.interimTranscript || voice.transcript}”
            </p>
          )}
          {!voice.listening && verdict && (
            <p
              className={`text-xs font-medium ${
                verdict.correct ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {answeredText}
            </p>
          )}
        </div>
      )}

      {!voice.supported && (
        <p className="text-[10px] text-[#5A5A72]">
          Voice study isn't available in this browser. Use Chrome, Edge or Safari.
        </p>
      )}
    </div>
  );
}
