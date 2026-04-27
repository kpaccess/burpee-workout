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

/** Louder warning beep at 3, 2, 1 seconds left in prepare */
export function playPrepareWarningBeep() {
  playTone(1100, 0.15, 0.65, "square");
}

/** Warning beep 4–1 seconds before a rep boundary */
export function playRepWarningBeep() {
  playTone(880, 0.15, 0.5, "square");
}

/** Loud whistle: pea whistle with warbling/trilling effect */
export function playWhistle() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfoGain = ctx.createGain();

    // Main oscillator - high pitched whistle
    osc.type = "sine";
    osc.frequency.setValueAtTime(2800, ctx.currentTime);

    // LFO for warble/trill effect (rapid frequency modulation)
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(6, ctx.currentTime); // 6 Hz warble

    // LFO gain to control depth of wobble
    lfoGain.gain.setValueAtTime(350, ctx.currentTime); // 350 Hz depth

    // Main volume envelope
    gain.gain.setValueAtTime(0.85, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    // Connect LFO to frequency for warble effect
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Connect oscillator to gain
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    lfo.start(ctx.currentTime);

    osc.stop(ctx.currentTime + 0.7);
    lfo.stop(ctx.currentTime + 0.7);
  } catch {
    // Silently ignore – audio is non-critical
  }
}

/** Triple-blast whistle for workout completion */
export function playFinishWhistle() {
  try {
    const ctx = getAudioContext();

    const playBlast = (delay: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(3200, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.9, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + duration,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    // Three quick blasts
    playBlast(0, 0.3);
    playBlast(0.4, 0.3);
    playBlast(0.8, 0.4);
  } catch {
    // Silently ignore – audio is non-critical
  }
}
