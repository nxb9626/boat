////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

const to_rad = (deg) => { return deg / 57.29578; };
const to_deg = (deg) => { return deg * 57.29578; };

// Logging framework
let logging = true;
const dbg = (eh) => { if (logging) console.log(eh) };

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

const canvas = document.getElementById("life");
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
  let size = 3;

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

const drawCell = (x, y) => {
  let rouneded_x = Math.round(x / 60) * 60
  let rouneded_y = Math.round(y / 60) * 60

  ctx.fillRect(rouneded_x - 30, rouneded_y - 30, 60, 60);
  console.log(rouneded_x)
}
const drawGrid = () => {
  let i = 0;
  let cell_size = 30;
  let cell_count_x = 3000;

  dbg("ahhh")

  while (i < cell_count_x) {
    if (!(i % cell_size)) {
      drawLine(i, 10000, i, 0, 1, TEXT_COLOR, 10)
      drawLine(0, i, 10000, i, 1, TEXT_COLOR, 10)
    }
    i++;
  }

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

const drawEverything = () => {
  drawGrid()
  drawCell(GLOBAL_CURRENT_X,GLOBAL_CURRENT_Y)
}

////////////////////////////////////////////////////////////////////////////////
// Core Frame Loop
////////////////////////////////////////////////////////////////////////////////

size(); //need to fix scaling before re-enabling auto re-scaling. better to be jank and not for now

let frame_count = 0;
const frame = () => {
  ctx.clearRect(0, 0, canvas.width * 2, canvas.height * 2);
  matchTheme();
  trackEverything();
  drawEverything()
  requestAnimationFrame(frame);
  frame_count++;
};


requestAnimationFrame(frame);
