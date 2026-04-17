/**
 * Workout timer sounds using the Web Audio API.
 * No external audio files required – all tones are synthesised.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  // Resume in case browser suspended it (autoplay policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  volume = 0.3,
  type: OscillatorType = "sine",
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    // Fade out to avoid click
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently ignore – audio is non-critical
  }
}

/** Short tick during the 10-second prepare countdown */
export function playCountdownTick() {
  playTone(880, 0.1, 0.25, "sine");
}

/** Higher-pitch beep for the final "GO!" moment */
export function playGoBeep() {
  playTone(1320, 0.3, 0.4, "square");
}

/** Beep when a rep boundary is hit */
export function playRepBeep() {
  playTone(660, 0.25, 0.6, "sine");
}

/** Double-beep when the session is finished */
export function playFinishBeep() {
  playTone(1046, 0.2, 0.4, "sine");
  setTimeout(() => playTone(1318, 0.3, 0.4, "sine"), 250);
}
