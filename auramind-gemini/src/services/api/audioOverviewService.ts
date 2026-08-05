import { getDeepSeekClient } from './groqService';

export interface AudioOverviewHost {
  name: string;
  voice: string;
  personality: string;
}

export interface AudioOverviewSegment {
  speaker: 'host1' | 'host2' | 'narration';
  text: string;
}

export interface AudioOverviewScript {
  title: string;
  hosts: [AudioOverviewHost, AudioOverviewHost];
  segments: AudioOverviewSegment[];
  summary: string;
}

interface SpeechState {
  utterance: SpeechSynthesisUtterance | null;
  isPaused: boolean;
  isActive: boolean;
  currentSegment: number;
  segments: AudioOverviewSegment[];
  currentCharIndex: number;
  callbacks: Required<SpeechCallbacks>;
  speed: number;
}

type SpeechCallbacks = {
  onSegmentStart?: (index: number) => void;
  onSegmentEnd?: (index: number) => void;
  onDone?: () => void;
  onPause?: () => void;
  onResume?: () => void;
};

let speechState: SpeechState | null = null;

export async function generateAudioOverview(
  content: string,
  title: string,
  options?: { difficulty?: 'beginner' | 'intermediate' | 'advanced'; duration?: 'short' | 'medium' | 'long' }
): Promise<AudioOverviewScript> {
  const client = getDeepSeekClient();

  const difficulty = options?.difficulty || 'intermediate';
  const duration = options?.duration || 'medium';

  const segmentCount = duration === 'short' ? 6 : duration === 'long' ? 16 : 10;
  const difficultyGuidance = {
    beginner: 'Use very simple language, explain all jargon, and use relatable analogies.',
    intermediate: 'Assume some familiarity with the topic. Use standard academic vocabulary.',
    advanced: 'Use technical language, dive into nuance, and challenge assumptions.',
  }[difficulty];

  const prompt = `You are a podcast script writer creating an engaging, conversational audio overview of study content.

Create a podcast script between two hosts discussing the topic "${title}" based on the source content below.

## Host Personalities:
- **Host 1 (Alex)**: Enthusiastic explainer who loves breaking down complex ideas. Curious, upbeat, and great at simplifying concepts with analogies.
- **Host 2 (Jordan)**: Skeptical questioner who plays devil's advocate. Asks clarifying questions, challenges assumptions, and ensures nothing is taken at face value.

## Style Guidelines:
- Make it sound like a real conversation, not a lecture — use natural speech patterns, interjections, and back-and-forth
- Host 1 introduces concepts excitedly and explains them clearly
- Host 2 pushes back, asks "why does that matter?", "how does that work?", "what does that mean in practice?"
- Include moments of humor, surprise, and genuine curiosity
- ${difficultyGuidance}
- Generate approximately ${segmentCount} segments
- End with a concise summary segment where both hosts recap the key takeaways

## Source Content:
${content.slice(0, 25000)}

## Response Format:
Respond with ONLY a valid JSON object. No conversational text, no markdown code blocks.

{
  "title": "Audio Overview: [Topic]",
  "hosts": [
    { "name": "Alex", "voice": "Google US English", "personality": "Enthusiastic explainer" },
    { "name": "Jordan", "voice": "Samantha", "personality": "Skeptical questioner" }
  ],
  "segments": [
    { "speaker": "host1", "text": "Spoken line for host 1..." },
    { "speaker": "host2", "text": "Spoken line for host 2..." },
    { "speaker": "narration", "text": "Narration if needed..." }
  ],
  "summary": "A 2-3 sentence summary of the entire conversation."
}`;

  try {
    const response = await client.chat([
      { role: 'user', content: prompt }
    ]);

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) throw new Error('No response from AI');

    let jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonMatch = [jsonMatch[1]];
      }
    }

    if (!jsonMatch) throw new Error('Invalid JSON response from AI');

    const script = JSON.parse(jsonMatch[0]) as AudioOverviewScript;

    if (!script.segments || !Array.isArray(script.segments) || script.segments.length === 0) {
      throw new Error('Generated script has no segments');
    }

    return script;
  } catch (error) {
    console.error('Error generating audio overview:', error);
    throw error;
  }
}

function pickVoice(preferredName: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.find(v => v.name === preferredName);
  if (exact) return exact;
  const partial = voices.find(v => v.name.includes(preferredName.split(' ')[0]));
  if (partial) return partial;
  const english = voices.find(v => v.lang.startsWith('en'));
  return english || voices[0] || null;
}

function createUtterance(text: string, voiceName: string, speed: number): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(voiceName);
  if (voice) utterance.voice = voice;
  utterance.rate = speed;
  utterance.pitch = 1;
  utterance.volume = 1;
  return utterance;
}

export function speakOverview(
  script: AudioOverviewScript,
  callbacks: SpeechCallbacks = {}
): { play: () => void; pause: () => void; resume: () => void; stop: () => void; isPlaying: () => boolean; getCurrentSegment: () => number } {
  const resolvedCallbacks = {
    onSegmentStart: callbacks.onSegmentStart || (() => {}),
    onSegmentEnd: callbacks.onSegmentEnd || (() => {}),
    onDone: callbacks.onDone || (() => {}),
    onPause: callbacks.onPause || (() => {}),
    onResume: callbacks.onResume || (() => {}),
  };

  if (speechState) {
    window.speechSynthesis.cancel();
    speechState = null;
  }

  const hostVoiceMap: Record<string, string> = {
    host1: script.hosts[0].voice,
    host2: script.hosts[1].voice,
    narration: 'Google US English',
  };

  speechState = {
    utterance: null,
    isPaused: false,
    isActive: false,
    currentSegment: 0,
    segments: script.segments,
    currentCharIndex: 0,
    callbacks: resolvedCallbacks,
    speed: 1,
  };

  function playSegment(index: number) {
    if (!speechState || index >= speechState.segments.length) {
      speechState?.callbacks.onDone();
      speechState = null;
      return;
    }

    const segment = speechState.segments[index];
    const voiceName = hostVoiceMap[segment.speaker] || 'Google US English';
    const utterance = createUtterance(segment.text, voiceName, speechState.speed);

    speechState.currentSegment = index;
    speechState.isActive = true;
    speechState.isPaused = false;
    speechState.callbacks.onSegmentStart(index);

    utterance.onend = () => {
      if (!speechState) return;
      speechState.callbacks.onSegmentEnd(index);
      playSegment(index + 1);
    };

    utterance.onerror = () => {
      if (!speechState) return;
      speechState.callbacks.onSegmentEnd(index);
      playSegment(index + 1);
    };

    speechState.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  return {
    play: () => {
      if (speechState && speechState.isPaused) {
        window.speechSynthesis.resume();
        speechState.isPaused = false;
        speechState.isActive = true;
        speechState.callbacks.onResume();
        return;
      }
      playSegment(0);
    },
    pause: () => {
      if (!speechState || !speechState.isActive) return;
      window.speechSynthesis.pause();
      speechState.isPaused = true;
      speechState.isActive = false;
      speechState.callbacks.onPause();
    },
    resume: () => {
      if (!speechState || !speechState.isPaused) return;
      window.speechSynthesis.resume();
      speechState.isPaused = false;
      speechState.isActive = true;
      speechState.callbacks.onResume();
    },
    stop: () => {
      if (!speechState) return;
      window.speechSynthesis.cancel();
      speechState = null;
    },
    isPlaying: () => {
      return speechState !== null && speechState.isActive && !speechState.isPaused;
    },
    getCurrentSegment: () => {
      return speechState?.currentSegment ?? 0;
    },
  };
}

export function cancelOverview(): void {
  if (speechState) {
    window.speechSynthesis.cancel();
    speechState = null;
  }
}

export function setSpeechSpeed(speed: number): void {
  if (speechState) {
    speechState.speed = speed;
  }
}
