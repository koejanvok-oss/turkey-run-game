// The run itself: the turkey, the farmer behind it, the hazards and treats ahead, and the
// three stages from farmyard to kitchen. The world scrolls left past a turkey that runs in
// place; distance is metres, the screen is pixels, and 1 metre is 26 pixels of scroll.
//
// Events are bit flags the loop reads each step: a hit, a pickup, a hide, a stage change,
// an escape, or the run ending because the farmer caught the turkey.

import {
  ESCAPE_DISTANCE,
  FARMER,
  FIELD,
  HEARTS,
  SCORE,
  SPAWN,
  SPEED,
  STAGE_LENGTH,
  TURKEY,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_PICKUP = 4;
export const EVENT_HIDE = 8;
export const EVENT_STAGE = 16;
export const EVENT_ESCAPED = 32;
export const EVENT_ALARM = 64;

export const KIND_FENCE = 'fence';
export const KIND_PUMPKIN = 'pumpkin';
export const KIND_BRANCH = 'branch';
export const KIND_KNIFE = 'knife';
export const KIND_OVEN = 'oven';
export const KIND_ROLLING_PIN = 'pin';
export const KIND_CORN = 'corn';
export const KIND_FEATHER = 'feather';
export const KIND_HAYSTACK = 'haystack';

const PX_PER_METRE = 26;
const GROUND = FIELD.groundY;
const TURKEY_X = TURKEY.x;

/** Which obstacles each stage throws at the turkey. */
const STAGE_OBSTACLES = [
  [KIND_FENCE, KIND_PUMPKIN, KIND_BRANCH],
  [KIND_FENCE, KIND_PUMPKIN, KIND_BRANCH, KIND_ROLLING_PIN],
  [KIND_OVEN, KIND_KNIFE, KIND_ROLLING_PIN, KIND_FENCE],
];

/** Height, in pixels, of each obstacle kind; the branch hangs from above instead. */
const OBSTACLE_HEIGHT = {
  [KIND_FENCE]: 62,
  [KIND_PUMPKIN]: 44,
  [KIND_ROLLING_PIN]: 30,
  [KIND_OVEN]: 118,
  [KIND_KNIFE]: 96,
  [KIND_BRANCH]: 66,
};

export function createWorld(random) {
  const state = {
    time: 0,
    distance: 0,
    score: 0,
    scoreBonus: 0,
    hearts: HEARTS,
    farmerGap: FARMER.startGap,
    stage: 0,
    speed: SPEED.start,
    over: false,
    escaped: false,
    caught: false,
    // The turkey's vertical state: y is its feet, vy its upward speed.
    turkeyY: GROUND,
    turkeyVy: 0,
    sliding: false,
    hidden: false,
    hideTime: 0,
    hideCooldown: 0,
    invulnerable: 0,
    runCycle: 0,
    stumbleFlash: 0,
    stageBanner: 0,
    bannerText: '',
    alarm: false,
    obstacles: [],
    pickups: [],
    haystacks: [],
    spawnTimer: SPAWN.firstGap,
    scroll: 0,
  };

  function stageName(index) {
    return ['THE FARMYARD', 'THE BARN', 'THE KITCHEN'][index] ?? 'THE WOODS';
  }

  function reset() {
    state.time = 0;
    state.distance = 0;
    state.score = 0;
    state.scoreBonus = 0;
    state.hearts = HEARTS;
    state.farmerGap = FARMER.startGap;
    state.stage = 0;
    state.speed = SPEED.start;
    state.over = false;
    state.escaped = false;
    state.caught = false;
    state.turkeyY = GROUND;
    state.turkeyVy = 0;
    state.sliding = false;
    state.hidden = false;
    state.hideTime = 0;
    state.hideCooldown = 0;
    state.invulnerable = 0;
    state.runCycle = 0;
    state.stumbleFlash = 0;
    state.stageBanner = 2.2;
    state.bannerText = 'THE FARMYARD — RUN!';
    state.alarm = false;
    state.obstacles.length = 0;
    state.pickups.length = 0;
    state.haystacks.length = 0;
    state.spawnTimer = SPAWN.firstGap;
    state.scroll = 0;
  }

  function spawnObstacle() {
    const kinds = STAGE_OBSTACLES[state.stage];
    const kind = kinds[Math.floor(random() * kinds.length)];
    const height = OBSTACLE_HEIGHT[kind];
    const obstacle = {
      kind,
      x: FIELD.width + 60,
      width: kind === KIND_OVEN ? 116 : kind === KIND_KNIFE ? 34 : 54,
      height,
      // The swinging knife's blade rides up and down on its rope.
      swing: kind === KIND_KNIFE ? random() * Math.PI * 2 : 0,
      passed: false,
    };
    state.obstacles.push(obstacle);
    // A treat often rides just past an obstacle, rewarding a clean jump.
    if (random() < SPAWN.cornChance) {
      state.pickups.push({
        kind: random() < SPAWN.featherChance ? KIND_FEATHER : KIND_CORN,
        x: obstacle.x + 130 + random() * 90,
        y: random() < 0.5 ? GROUND - 34 : GROUND - 150,
      });
    }
    // Haystacks are the turkey's hiding places, never in the kitchen.
    if (state.stage < 2 && random() < SPAWN.haystackChance) {
      state.haystacks.push({ kind: KIND_HAYSTACK, x: obstacle.x + 260 + random() * 120, width: 92, height: 78 });
    }
    return kind;
  }

  function turkeyBox() {
    const height = state.sliding ? TURKEY.slideHeight : TURKEY.height;
    return {
      x: TURKEY_X,
      y: state.turkeyY - height,
      width: TURKEY.width,
      height,
    };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  /** The knife blade's danger box this step: it sweeps from knee height to head height.
   *  Its tip never drops below 30 px above the ground, so a sliding turkey slips under it. */
  function knifeBox(obstacle) {
    const lift = (Math.sin(obstacle.swing) + 1) / 2;
    const top = GROUND - 100 - lift * 120;
    return { x: obstacle.x, y: top, width: obstacle.width, height: 70 };
  }

  /** The ground under the turkey's feet: the field, or an oven top it stands on. */
  function supportY() {
    let ground = GROUND;
    for (const obstacle of state.obstacles) {
      if (obstacle.kind !== KIND_OVEN) continue;
      if (TURKEY_X + TURKEY.width <= obstacle.x || TURKEY_X >= obstacle.x + obstacle.width) continue;
      const top = GROUND - obstacle.height;
      if (state.turkeyY <= top) ground = Math.min(ground, top);
    }
    return ground;
  }

  function stumble(events) {
    if (state.invulnerable > 0) return events;
    state.hearts -= 1;
    state.farmerGap -= FARMER.stumbleCost;
    state.invulnerable = TURKEY.invulnerable;
    state.stumbleFlash = 0.5;
    events |= EVENT_HIT;
    if (state.hearts <= 0 || state.farmerGap <= 0) {
      state.over = true;
      state.caught = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  /**
   * Advance the world one fixed step. `control` carries this step's jump edge and whether
   * the slide key is held; `attract` runs the farmyard as a backdrop with no danger.
   */
  function step(dt, control, attract) {
    if (state.over) return EVENT_NONE;
    let events = EVENT_NONE;
    state.time += dt;
    state.runCycle += dt * (attract ? 7 : 11);
    if (state.stageBanner > 0) state.stageBanner -= dt;
    if (state.stumbleFlash > 0) state.stumbleFlash -= dt;
    if (state.invulnerable > 0) state.invulnerable -= dt;
    if (state.hideCooldown > 0) state.hideCooldown -= dt;

    // The world scrolls; the turkey's distance and score grow with it.
    const progress = Math.min(1, state.distance / ESCAPE_DISTANCE);
    state.speed = SPEED.start + (SPEED.end - SPEED.start) * progress;
    const scrollPx = state.speed * PX_PER_METRE * dt;
    state.scroll += scrollPx;
    if (!attract) {
      state.distance += state.speed * dt;
      state.score = Math.floor(state.distance) + state.scoreBonus;
    }

    // Stages: the barn at 350 m, the kitchen at 700 m, the woods at 1000 m.
    const stage = Math.min(2, Math.floor(state.distance / STAGE_LENGTH));
    if (!attract && stage !== state.stage) {
      state.stage = stage;
      state.bannerText = stage === 1 ? 'THE BARN — MIND THE PINS!' : 'THE KITCHEN — THE OVEN IS HOT!';
      state.stageBanner = 2.4;
      state.scoreBonus += SCORE.stage;
      state.farmerGap -= FARMER.stageSurge;
      events |= EVENT_STAGE;
    }
    if (!attract && state.distance >= ESCAPE_DISTANCE) {
      state.over = true;
      state.escaped = true;
      return events | EVENT_ESCAPED | EVENT_OVER;
    }

    // The turkey: jump on the edge, slide while held, fall back to the ground or an oven top.
    const grounded = state.turkeyY >= supportY();
    if (!attract && control.jump && grounded && !state.sliding && !state.hidden) {
      state.turkeyVy = TURKEY.jumpVelocity;
    }
    state.sliding = !attract && control.down && grounded && !state.hidden;
    const prevY = state.turkeyY;
    if (!grounded || state.turkeyVy !== 0) {
      state.turkeyVy += TURKEY.gravity * dt;
      state.turkeyY += state.turkeyVy * dt;
    }
    // Land on the field, or on an oven top the turkey fell onto while over it.
    let ground = GROUND;
    for (const obstacle of state.obstacles) {
      if (obstacle.kind !== KIND_OVEN) continue;
      if (TURKEY_X + TURKEY.width <= obstacle.x + 2 || TURKEY_X >= obstacle.x + obstacle.width - 2) continue;
      const top = GROUND - obstacle.height;
      if ((prevY <= top && state.turkeyY >= top) || state.turkeyY === top) ground = Math.min(ground, top);
    }
    if (state.turkeyY >= ground) {
      state.turkeyY = ground;
      state.turkeyVy = 0;
    }

    // Hiding: hold Down inside a haystack and the farmer loses the trail. It only
    // counts as hiding when the farmer is close — holding Down near hay is otherwise
    // just a slide, and a slide must never turn into a hide by accident.
    if (!attract && !state.hidden && state.hideCooldown <= 0) {
      for (const stack of state.haystacks) {
        if (control.down && grounded && state.farmerGap < 40 && TURKEY_X + TURKEY.width > stack.x && TURKEY_X < stack.x + stack.width) {
          state.hidden = true;
          state.hideTime = 0;
          state.scoreBonus += SCORE.hide;
          state.farmerGap = Math.min(FARMER.maxGap, state.farmerGap + FARMER.hideGain);
          events |= EVENT_HIDE;
          break;
        }
      }
    }
    if (state.hidden) {
      state.hideTime += dt;
      // The cover only lasts while a haystack is actually over the turkey.
      let stillCovered = false;
      for (const stack of state.haystacks) {
        if (TURKEY_X + TURKEY.width > stack.x && TURKEY_X < stack.x + stack.width) {
          stillCovered = true;
          break;
        }
      }
      if (state.hideTime > 2.5 || control.jump || !control.down || !stillCovered) {
        state.hidden = false;
        state.hideCooldown = 4;
        // A breath of cover as the turkey slips back out: the haystack has scrolled on.
        state.invulnerable = Math.max(state.invulnerable, 0.5);
      }
    }

    // The farmer: clean running opens the gap, stumbles close it, hiding opens it wide.
    if (!attract) {
      if (state.hidden) state.farmerGap = Math.min(FARMER.maxGap, state.farmerGap + 6 * dt);
      else state.farmerGap = Math.min(FARMER.maxGap, state.farmerGap + FARMER.cleanGain * dt);
      const wasAlarmed = state.alarm;
      state.alarm = state.farmerGap < 16;
      if (state.alarm && !wasAlarmed) events |= EVENT_ALARM;
      if (state.farmerGap <= 0) {
        state.over = true;
        state.caught = true;
        return events | EVENT_OVER;
      }
    }

    if (attract) {
      // The title screen's backdrop: drift the scenery, spawn nothing dangerous.
      return events;
    }

    // Spawn the next hazard, faster as the run goes on, but never closer than a jump's
    // own cycle: a hazard must not arrive while the turkey is still landing from the last.
    // An oven takes longer to cross (jump on, run across, hop off), so it buys extra room.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const kind = spawnObstacle();
      const interval = Math.max(SPAWN.intervalMin, SPAWN.interval - progress * 0.3);
      state.spawnTimer = interval * (0.9 + random() * 0.3) + (kind === KIND_OVEN ? 0.7 : 0);
    }

    // Move everything left, and drop what has passed.
    for (const list of [state.obstacles, state.pickups, state.haystacks]) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        list[i].x -= scrollPx;
        if (list[i].x + (list[i].width ?? 40) < -80) list.splice(i, 1);
      }
    }
    for (const obstacle of state.obstacles) {
      if (obstacle.kind === KIND_KNIFE) obstacle.swing += dt * 1.4;
    }

    // Pickups: corn and feathers, caught by running through them.
    const box = turkeyBox();
    for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = state.pickups[i];
      const pickupBox = { x: pickup.x, y: pickup.y - 20, width: 36, height: 40 };
      if (!state.hidden && overlaps(box, pickupBox)) {
        state.scoreBonus += pickup.kind === KIND_FEATHER ? SCORE.feather : SCORE.corn;
        state.pickups.splice(i, 1);
        events |= EVENT_PICKUP;
      }
    }

    // Hazards: a hit costs a heart and the farmer gains ground.
    if (!state.hidden && state.invulnerable <= 0) {
      for (const obstacle of state.obstacles) {
        let hitBox;
        if (obstacle.kind === KIND_KNIFE) hitBox = knifeBox(obstacle);
        else if (obstacle.kind === KIND_BRANCH) {
          // The branch hangs at head height: only a sliding turkey slips under it.
          hitBox = { x: obstacle.x, y: GROUND - 118, width: obstacle.width, height: 56 };
        } else {
          hitBox = { x: obstacle.x, y: GROUND - obstacle.height, width: obstacle.width, height: obstacle.height };
        }
        if (overlaps(box, hitBox)) {
          events = stumble(events);
          break;
        }
      }
    }
    return events;
  }

  reset();
  return {
    state,
    reset,
    step,
    stageName,
    /** Bonus points beyond distance, kept apart so the score line stays readable. */
    get scoreBonus() {
      return state.scoreBonus;
    },
  };
}
