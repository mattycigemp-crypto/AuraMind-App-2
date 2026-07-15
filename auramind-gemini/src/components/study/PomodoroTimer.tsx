import React, { useState, useEffect, useRef } from 'react';
import { TimerIcon as Timer, PlayIcon as Play, PauseIcon as Pause, RotateCcwIcon as RotateCcw, CoffeeIcon as Coffee, BrainIcon as Brain, Volume2Icon as Volume2, VolumeXIcon as VolumeX, Settings2Icon as Settings2, XIcon as X } from '../icons/CustomIcons';

interface PomodoroTimerProps {
    onSessionComplete?: (type: 'work' | 'break') => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onSessionComplete }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [workTime, setWorkTime] = useState(25);
    const [breakTime, setBreakTime] = useState(5);
    const [isMuted, setIsMuted] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleSessionEnd();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleSessionEnd = () => {
        setIsActive(false);
        if (!isMuted) {
            // Simple beep or notification sound
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
        }

        if (mode === 'work') {
            onSessionComplete?.('work');
            setMode('break');
            setTimeLeft(breakTime * 60);
        } else {
            onSessionComplete?.('break');
            setMode('work');
            setTimeLeft(workTime * 60);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft((mode === 'work' ? workTime : breakTime) * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const updateSettings = () => {
        setTimeLeft((mode === 'work' ? workTime : breakTime) * 60);
        setShowSettings(false);
    };

    return (
        <div className="glass-card rounded-3xl p-6 border dark:border-white/10 border-black/10 relative overflow-hidden group">
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full transition-colors duration-1000 ${isActive ? 'bg-purple-500/20' : 'bg-blue-500/10'}`} />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border dark:border-white/5 border-black/5 ${mode === 'work' ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'}`}>
                        {mode === 'work' ? <Brain size={20} /> : <Coffee size={20} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest dark:text-white/80 text-black/80">{mode === 'work' ? 'Deep Focus' : 'Short Break'}</h3>
                        <p className="text-[10px] dark:text-white/40 text-black/40 font-medium">Session Progress</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-zinc-900/5 hover:bg-zinc-900/10 dark:text-white/40 text-zinc-300 hover:text-white transition-all">
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-zinc-900/5 hover:bg-zinc-900/10 dark:text-white/40 text-zinc-300 hover:text-white transition-all">
                        <Settings2 size={18} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
                <div className="relative">
                    <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                            cx="96" cy="96" r="88"
                            stroke="currentColor" strokeWidth="4" fill="transparent"
                            className="text-black/ dark:text-white/"
                        />
                        <circle
                            cx="96" cy="96" r="88"
                            stroke="currentColor" strokeWidth="4" fill="transparent"
                            strokeDasharray={2 * Math.PI * 88}
                            strokeDashoffset={2 * Math.PI * 88 * (1 - timeLeft / ((mode === 'work' ? workTime : breakTime) * 60))}
                            strokeLinecap="round"
                            className={`transition-all duration-1000 ${mode === 'work' ? 'text-purple-500' : 'text-emerald-500'}`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-display font-bold dark:text-white text-black tracking-tighter">
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-[10px] font-bold dark:text-white/30 text-black/30 uppercase tracking-[0.2em] mt-1">
                            {isActive ? 'Flowing' : 'Paused'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8">
                <button
                    onClick={resetTimer}
                    className="p-3 dark:text-white/40 text-zinc-300 hover:text-white bg-zinc-900/5 hover:bg-zinc-900/10 rounded-2xl transition-all active:scale-90"
                >
                    <RotateCcw size={22} />
                </button>
                <button
                    onClick={toggleTimer}
                    className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-xl active:scale-95 ${isActive
                        ? 'bg-zinc-900/5 border border-zinc-700/10 text-zinc-300'
                        : 'bg-zinc-800 text-white'
                        }`}
                >
                    {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                <div className="w-10" /> {/* Spacer to balance */}
            </div>

            {showSettings && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-xl z-10 p-6 flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-sm font-bold uppercase tracking-widest">Timer Config</h4>
                        <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-900/10 rounded-lg"><X size={18} /></button>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                            <div className="flex justify-between text-[11px] font-bold text-black/ dark:text-white/ uppercase tracking-widest">
                                <span>Focus Minutes</span>
                                <span>{workTime}m</span>
                            </div>
                            <input
                                type="range" min="1" max="60"
                                value={workTime}
                                onChange={(e) => setWorkTime(parseInt(e.target.value))}
                                className="w-full accent-purple-500 bg-zinc-900/5 h-1 rounded-lg appearance-none"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-[11px] font-bold text-black/ dark:text-white/ uppercase tracking-widest">
                                <span>Break Minutes</span>
                                <span>{breakTime}m</span>
                            </div>
                            <input
                                type="range" min="1" max="30"
                                value={breakTime}
                                onChange={(e) => setBreakTime(parseInt(e.target.value))}
                                className="w-full accent-emerald-500 bg-zinc-900/5 h-1 rounded-lg appearance-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={updateSettings}
                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs mt-4"
                    >
                        Apply Settings
                    </button>
                </div>
            )}
        </div>
    );
};

export default PomodoroTimer;



