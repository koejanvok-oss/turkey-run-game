// All sound is synthesized with the Web Audio API: short oscillator blips, no audio files.
// The context is created on the first user gesture, so nothing plays before the player acts.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  /** One note: a sine or square wave sliding from `from` Hz to `to` Hz over `seconds`. */
  function tone(from, to, seconds, type, volume, delay) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + (delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, from), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    /** A quick rising chirp when the turkey leaves the ground. */
    jump() {
      tone(280, 620, 0.16, 'sine', 0.12);
    },
    /** Two-note gobble when a run starts. */
    gobble() {
      tone(520, 380, 0.09, 'square', 0.08);
      tone(640, 420, 0.09, 'square', 0.08, 0.1);
    },
    /** A bright ding for a corn cob, higher for a golden feather. */
    pickup(golden) {
      if (golden) {
        tone(880, 1320, 0.12, 'sine', 0.12);
        tone(1320, 1760, 0.14, 'sine', 0.1, 0.09);
      } else {
        tone(760, 1080, 0.1, 'sine', 0.1);
      }
    },
    /** A low buzz when the turkey stumbles and the farmer gains. */
    stumble() {
      tone(180, 70, 0.3, 'sawtooth', 0.16);
    },
    /** The farmer's shout when he spots the turkey up close. */
    alarm() {
      tone(300, 300, 0.1, 'square', 0.1);
      tone(380, 380, 0.1, 'square', 0.1, 0.12);
    },
    /** A soft rustle when the turkey slips into a haystack. */
    hide() {
      tone(900, 500, 0.18, 'triangle', 0.07);
    },
    /** A short fanfare when the turkey escapes. */
    fanfare() {
      [523, 659, 784, 1047].forEach((note, i) => tone(note, note, 0.22, 'triangle', 0.12, i * 0.13));
    },
    /** A descending slide when the farmer catches the turkey. */
    caught() {
      tone(420, 90, 0.7, 'sawtooth', 0.14);
    },
  };
}
