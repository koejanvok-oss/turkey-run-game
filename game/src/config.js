// Every tuning number and colour for Gobble Dash in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the size of the screen it is played on.

export const FIELD = { width: 1280, height: 720, groundY: 622 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** How far the turkey must run, in metres, to reach the woods and escape. */
export const ESCAPE_DISTANCE = 1000;

/** Metres per stage: farmyard, then the barn, then the kitchen. */
export const STAGE_LENGTH = 350;

export const TURKEY = {
  x: 300,
  width: 58,
  height: 66,
  slideHeight: 30,
  jumpVelocity: -950,
  gravity: 2200,
  invulnerable: 1.4,
};

export const HEARTS = 3;

/** The farmer starts this many metres behind the turkey. A stumble costs metres. */
export const FARMER = {
  startGap: 60,
  maxGap: 80,
  stumbleCost: 22,
  stageSurge: 10,
  cleanGain: 2.2,
  hideGain: 24,
};

/** World scroll speed, in metres per second, from the first step to the last. */
export const SPEED = { start: 7, end: 12.5 };

export const SPAWN = {
  firstGap: 1.1,
  interval: 1.35,
  intervalMin: 1.0,
  cornChance: 0.55,
  featherChance: 0.12,
  haystackChance: 0.16,
};

export const SCORE = { corn: 10, feather: 50, hide: 25, stage: 100 };

export const PALETTE = {
  farmSkyTop: '#f7b733',
  farmSkyBottom: '#fde8b0',
  barnSkyTop: '#e8873a',
  barnSkyBottom: '#f9d976',
  kitchenSkyTop: '#8e3b2f',
  kitchenSkyBottom: '#d97b4f',
  groundFarm: '#7a9a4d',
  groundBarn: '#8a6b3f',
  groundKitchen: '#6e4a35',
  turkeyBody: '#8a5230',
  turkeyDark: '#5f3018',
  turkeyTail: ['#a0522d', '#c96a2e', '#e8a33c', '#7a3b1e', '#d2691e'],
  turkeyHead: '#e8e0d0',
  wattle: '#e5534b',
  beak: '#f2a541',
  farmerShirt: '#3e6b8e',
  farmerOveralls: '#2f4d6d',
  farmerHat: '#d9b96a',
  farmerSkin: '#e8b98a',
  ovenBody: '#4a4a52',
  ovenFire: '#ff7a1a',
  knifeBlade: '#d7dce3',
  knifeHandle: '#5b3a1e',
  corn: '#f2c94c',
  feather: '#ffd94d',
  panel: 'rgba(20, 12, 8, 0.72)',
  text: '#fff6e0',
  muted: '#e8c98a',
  danger: '#ff4d3d',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-dash.best';
