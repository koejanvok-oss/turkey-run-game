// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The
// game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the run's random pattern. ?shot=start|play|kitchen|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady for a
// screenshot.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_ALARM, EVENT_ESCAPED, EVENT_HIDE, EVENT_HIT, EVENT_OVER, EVENT_PICKUP } from './world.js';
import { ACTION_CONFIRM, ACTION_JUMP, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.gobble();
    announce('Playing. Three hearts. Run 1000 metres to the woods.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (world.state.escaped) {
      audio.fanfare();
      announce(`Escaped! Score ${world.state.score}. Best ${best}.`);
    } else {
      audio.caught();
      announce(`Caught at ${Math.floor(world.state.distance)} metres. Score ${world.state.score}. Best ${best}.`);
    }
  }

  function handleActions(actions) {
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & (ACTION_CONFIRM | ACTION_JUMP) && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM | ACTION_JUMP) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step(actions, firstStep) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { jump: false, down: false }, true);
      return;
    }
    // The jump edge counts on the first sub-step of the frame only.
    const jumpEdge = firstStep && Boolean(actions & ACTION_JUMP);
    const control = { jump: jumpEdge, down: input.slideHeld() };
    if (jumpEdge && world.state.turkeyY >= FIELD.groundY) audio.jump();
    const events = world.step(STEP, control, false);
    if (events & EVENT_HIT) {
      audio.stumble();
      announce(world.state.hearts === 1 ? 'Hit. 1 heart left. The farmer is closing in!' : `Hit. ${world.state.hearts} hearts left.`);
    }
    if (events & EVENT_PICKUP) audio.pickup(false);
    if (events & EVENT_HIDE) {
      audio.hide();
      announce('Hidden in the haystack. The farmer lost your trail.');
    }
    if (events & EVENT_ALARM) {
      audio.alarm();
      announce('The farmer is right behind you!');
    }
    if (events & EVENT_ESCAPED) announce('Escaped!');
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      let firstStep = true;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(actions, firstStep);
        firstStep = false;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the farmer catch the turkey unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gobble Dash. Press Space or click to run from the farmer.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
