type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
};

const playTone = (frequencies: [number, number][], volume: number, duration: number, ramp = true) => {
  try {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);

    const [[firstFrequency], ...rest] = frequencies;
    oscillator.frequency.setValueAtTime(firstFrequency, now);
    for (const [frequency, at] of rest) {
      if (ramp) oscillator.frequency.exponentialRampToValueAtTime(frequency, now + at);
      else oscillator.frequency.setValueAtTime(frequency, now + at);
    }

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (error) {
    console.warn('Audio not supported or blocked:', error);
  }
};

export const playMoveSound = () => playTone([[800, 0], [400, 0.1]], 0.1, 0.1);

export const playCaptureSound = () => playTone([[600, 0], [200, 0.15]], 0.15, 0.15);

export const playCheckSound = () => playTone([[1000, 0], [800, 0.1], [1000, 0.2]], 0.12, 0.3, false);
