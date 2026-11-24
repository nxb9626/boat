////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

const to_rad = (deg) => { return deg / 57.29578; };
const to_deg = (deg) => { return deg * 57.29578; };

// Logging framework
let logging = true;
const dbg = (eh) => { if (logging) console.log(eh) };

// debugging
DEBUGGING = document.DEBUGGING;

////////////////////////////////////////////////////////////////////////////////
// Globals
////////////////////////////////////////////////////////////////////////////////

let TEXT_COLOR;
let BACKGROUND_COLOR;
let LINK_TEXT_COLOR;
let LINK_TEXT_HOVER_COLOR;
let DARK_CODE_BACKGROUND_COLOR;
let DARK_CODE_TEXT_COLOR;

let matchTheme = () => {
  const root = document.getElementById("root_html");
  const style = window.getComputedStyle(root);
  TEXT_COLOR = style.getPropertyValue("--text-color");
  BACKGROUND_COLOR = style.getPropertyValue("--background-color");
  LINK_TEXT_COLOR = style.getPropertyValue("--link-text-color");
  LINK_TEXT_HOVER_COLOR = style.getPropertyValue("--link-text-hover-color");
  DARK_CODE_BACKGROUND_COLOR = style.getPropertyValue("--dark-code-background-color");
  DARK_CODE_TEXT_COLOR = style.getPropertyValue("--dark-code-text-color");
}

// Call this right away to make sure first draw looks good
matchTheme();

const canvas = document.getElementById("draw");
const ctx = canvas.getContext("2d");
const parent = canvas.parentNode.parentNode.parentNode;

// set the size, need to figure out css side...
const size = () => {
  const big = true;
  if (big) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  else {
    canvas.width = parent.offsetWidth;
    canvas.height = 500;
  }
}


let GLOBAL_MOUSE_DOWN = false;

let GLOBAL_CURRENT_X;
let GLOBAL_CURRENT_Y;

let GLOBAL_WHITEBOARD = new Map();
let GLOBAL_WHITEBOARD_MARK_COUNT = 0;
let FLOOR_OFFSET = 0;

////////////////////////////////////////////////////////////////////////////////
// Debugging Stuff
////////////////////////////////////////////////////////////////////////////////

let GLOBAL_DEBUG_ITEMS = [];
let GLOBAL_ITERATION_RATE = 0;
let GLOBAL_ITERATION_COUNT = 0;
let GLOBAL_ITERATION_TIME = Date.now();


const init_ips = () => {
  if (!document.DEBUGGING) { return; }
  GLOBAL_WHITEBOARD.set(-1, [{ x: -1, y: -1 }]);
  setInterval(() => {
    let now = Date.now();
    let diff = now - GLOBAL_ITERATION_TIME;

    GLOBAL_ITERATION_RATE = (GLOBAL_ITERATION_COUNT / diff * 1000)

    GLOBAL_ITERATION_COUNT = 0;
    GLOBAL_ITERATION_TIME = now;
  }, 1000);
}
document.init_ips = init_ips;

const drawDebug = () => {
  if (!document.DEBUGGING) { return; }
  let offset = 0;
  let height = 24;
  GLOBAL_DEBUG_ITEMS.sort().map((a) => {
    ctx.font = "" + height + "px sans-serif";
    let rate = "" + a + " ips"
    ctx.fillText(rate, 10, 50 + offset);
    offset += height

  })

}

const update_debug_items = () => {
  GLOBAL_DEBUG_ITEMS = [Math.round(GLOBAL_ITERATION_RATE)];
}

const ips = () => {
  if (!document.DEBUGGING) { return; }
  GLOBAL_ITERATION_COUNT++;
}

const draw_ips = () => {
  if (!document.DEBUGGING) { return; }
  GLOBAL_ITERATION_COUNT++;
}

init_ips();
////////////////////////////////////////////////////////////////////////////////
// HelperFunctions
////////////////////////////////////////////////////////////////////////////////

const distance = (x_old, y_old, x_new, y_new) => {
  let x_dist = Math.abs(x_new - x_old);
  let y_dist = Math.abs(y_new - y_old);

  let too_much = x_dist * x_dist + y_dist * y_dist;

  return Math.sqrt(too_much);
};

////////////////////////////////////////////////////////////////////////////////
// Draw Functions
////////////////////////////////////////////////////////////////////////////////
const drawLine = (x_old, y_old, x_new, y_new, color, width) => {
  x_old = getRelativeDrawX(x_old);
  y_old = getRelativeDrawY(y_old);

  x_new = getRelativeDrawX(x_new);
  y_new = getRelativeDrawY(y_new);

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x_old, y_old);
  ctx.lineTo(x_new, y_new);
  ctx.stroke();
};

const getRelativeDrawX = (x) => {
  return x - window.scrollX;
}

const getRelativeDrawY = (y) => {
  return y - window.scrollY;
}

const drawCircle = (old_x, old_y, size) => {
  old_x = getRelativeDrawX(old_x);
  old_y = getRelativeDrawY(old_y);

  let radi = size / 2;

  ctx.beginPath();
  ctx.arc(old_x, old_y, radi, 0, 2 * Math.PI);
  ctx.fillStyle = LINK_TEXT_COLOR;
  ctx.fill();
  ctx.lineWidth = radi;
  ctx.strokeStyle = LINK_TEXT_COLOR;
  ctx.stroke();
}

////////////////////////////////////////////////////////////////////////////////
// Physics functions
////////////////////////////////////////////////////////////////////////////////

let GLOBAL_GRAVITY_SPEED = 1;

const gravity = () => {
  if (!document.GRAVITY) return;
  let all_points = [];
  GLOBAL_WHITEBOARD.forEach((line) => {
    line.forEach((point) => {
      all_points.push(point)
    })
  })
  let xes = {};

  // 0 it all out
  all_points.forEach((point) => {
    xes[point.x] = 0;
  });

  all_points.forEach((point) => {
    let baseline = canvas.height + FLOOR_OFFSET - xes[point.x];
    if (baseline > point.y) {
      point.y += GLOBAL_GRAVITY_SPEED;
    }
    if (baseline <= point.y) {
      xes[point.x] += GLOBAL_GRAVITY_SPEED;
    }

    else {

    }
  })
}
////////////////////////////////////////////////////////////////////////////////
// Tracking functions
////////////////////////////////////////////////////////////////////////////////

const trackCurrentMousePosition = (e) => {
  GLOBAL_CURRENT_X = e.offsetX + window.scrollX;
  GLOBAL_CURRENT_Y = e.offsetY + window.scrollY;
};

////////////////////////////////////////////////////////////////////////////////
// Listeners
////////////////////////////////////////////////////////////////////////////////

canvas.addEventListener("mousedown", (e) => {
  GLOBAL_MOUSE_DOWN = true;
  trackCurrentMousePosition(e);
});

canvas.addEventListener("mouseup", (e) => {
  GLOBAL_MOUSE_DOWN = false;
});

canvas.addEventListener("mousemove", (e) => {
  trackCurrentMousePosition(e);
});

const drawMark = (mark) => {
  let old_x = mark[0].x;
  let old_y = mark[0].y;
  let size = 4;

  if (mark.length == 1) {
    drawCircle(old_x, old_y, size)
  }
  else {
    mark.map((pt) => {
      drawLine(old_x, old_y, pt.x, pt.y, LINK_TEXT_COLOR, size)
      old_x = pt.x;
      old_y = pt.y;
    })
  }
}

const drawWhiteboard = () => {
  Array.from(GLOBAL_WHITEBOARD.values()).map((value) => drawMark(value))
}

const point = (x_val, y_val) => { return { x: x_val, y: y_val } }

let lastthinghere = false
const trackWhiteboard = () => {
  if (!GLOBAL_MOUSE_DOWN) {
    if (lastthinghere) GLOBAL_WHITEBOARD_MARK_COUNT += 1;
    lastthinghere = false;
    return
  }

  let mark_continuation = [point(GLOBAL_CURRENT_X, GLOBAL_CURRENT_Y)];

  let old_mark = GLOBAL_WHITEBOARD.get(GLOBAL_WHITEBOARD_MARK_COUNT);
  if (old_mark) {
    if (distance(old_mark[0].x, old_mark[0].y, mark_continuation[0].x, mark_continuation[0].y) > 0)
      mark_continuation = [...old_mark, ...mark_continuation]
  }

  GLOBAL_WHITEBOARD.set(GLOBAL_WHITEBOARD_MARK_COUNT, mark_continuation);

  lastthinghere = true;
}

const trackEverything = () => {
  trackWhiteboard()
}

const trackWindow = () => {
  if (FLOOR_OFFSET < window.scrollY) {
    FLOOR_OFFSET = window.scrollY;
  }
}

const drawEverything = () => {
  drawWhiteboard()
}

  ////////////////////////////////////////////////////////////////////////////////
  // Core Frame Loop
  ////////////////////////////////////////////////////////////////////////////////

  ; //need to fix scaling before re-enabling auto re-scaling. better to be jank and not for now

let frame_count = 0;

const simuluation = () => {
  update_debug_items()
  matchTheme();
  trackEverything();
  gravity();
  ips();
  trackWindow();
  song()
  setTimeout(() => {
    simuluation();
  }, 1)
}

const frame = () => {
  size()
  ctx.clearRect(0, 0, canvas.width * 2, canvas.height * 2);
  drawEverything()
  requestAnimationFrame(frame);
  drawDebug();
  frame_count++;
};

setTimeout(() => {
  simuluation();
}, 100);


requestAnimationFrame(frame);

////////////////////////////////////////////////////////////////////////////////
// December Special
////////////////////////////////////////////////////////////////////////////////

document.PRESSED_START = 0;
const song = () => {
  if (document.PRESSED_START === 1) {
    document.PRESSED_START += 1;
    play_song()
  };

  if (!document.SONG) { return }
}

const play_song = () => {
  let audio = new Audio('/2024/12/10/cloud.mp3');
  audio.volume = .25;
  audio.play();
  iterate_song();
};

let s = 0;
const iterate_song = () => {
  if (s > 1000) { return }
  s += 1;

  if (s % 6) {
    GLOBAL_GRAVITY_SPEED += .01
  }

  spawn_rain();
  if (s > 200) {
    spawn_rain();
  }
  if (s > 300) {
    spawn_rain();
  }
  if (s > 400) {
    spawn_rain();
    spawn_rain();
    spawn_rain();
    spawn_rain();
    spawn_rain();
  }

  setTimeout(() => {
    iterate_song();
  }, 1000 / 6);
}

let GLOBAL_RAIN_COUNT = 10000;

const spawn_rain = () => {

  if (s < 75) {
    const target_x = canvas.width / 2;
    let all_rain = [point(target_x, -5), point(target_x, -6), point(target_x + 1, -5 - s / 10)];

    GLOBAL_WHITEBOARD.set(GLOBAL_WHITEBOARD_MARK_COUNT, all_rain);
    GLOBAL_WHITEBOARD_MARK_COUNT += 1;
  }
  else {
    const target_x = Math.floor(Math.random() * canvas.width);

    let all_rain = [point(target_x, -5), point(target_x, -6), point(target_x, -5 - s / 7)];

    GLOBAL_WHITEBOARD.set(GLOBAL_WHITEBOARD_MARK_COUNT, all_rain);
    GLOBAL_WHITEBOARD_MARK_COUNT += 1;
  }

  GLOBAL_RAIN_COUNT += 1;
}
