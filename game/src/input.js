// Keyboard and pointer input. Held keys give held states (slide, move); one-shot presses
// (jump, start or restart, pause, mute) are queued as bit flags and taken once by the loop,
// so a press between two frames is never lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_JUMP = 4;
export const ACTION_MUTE = 8;

const JUMP = new Set(['Space', 'ArrowUp', 'KeyW']);
const SLIDE = new Set(['ArrowDown', 'KeyS']);
const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);

export function createInput(target) {
  let down = false;
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (JUMP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_JUMP;
    } else if (SLIDE.has(event.code)) {
      down = true;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (SLIDE.has(event.code)) down = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    down = false;
  });
  // Clicking (or tapping) jumps while running and starts or restarts on the menus.
  target.addEventListener('pointerdown', () => {
    actions |= ACTION_JUMP | ACTION_CONFIRM;
  });

  return {
    /** True while the slide key is held down. */
    slideHeld() {
      return down;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
