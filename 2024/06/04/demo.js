////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

const to_rad = (deg) => { return deg / 57.29578; };
const to_deg = (deg) => { return deg * 57.29578; };

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

const canvas = document.getElementById("demo_canvas");
const ctx = canvas.getContext("2d");
const parent = canvas.parentNode.parentNode.parentNode;

// Set the canvas dimensions
canvas.width = parent.offsetWidth;
canvas.height = 500;

let mouse_down = false;

let current_x;// = canvas.width / 2;
let current_y; //= canvas.height / 2;

let target_x = 300;
let target_y = 300;

let picked_up = false;

let target_tracking_timer;

let rocket = {
  // intrinsic to rocket
  acceleration: 0.0002,
  turn_rate: to_rad(1),
  targetX: canvas.width / 2, // rocket keeps track of where its going, but this is not const
  targetY: canvas.height / 2,

  dist: 0,
  engine: false, // true = on, false = off. result of rocket distance from target

  // result of physics
  speed: 0,
  angle: 0, // in radians
  last_update: Date.now(),
  x: (canvas.width / 2) * .9,
  y: (canvas.height / 2) * .9,
};

let affected_by_physics = [rocket];

////////////////////////////////////////////////////////////////////////////////
// HelperFunctions
////////////////////////////////////////////////////////////////////////////////

const distance = (x_old, y_old, x_new, y_new) => {
  let x_dist = Math.abs(x_new - x_old);
  let y_dist = Math.abs(y_new - y_old);

  let too_much = x_dist * x_dist + y_dist * y_dist;

  return Math.sqrt(too_much);
};

const shiftTowards = (x_source, x_targ, diff) => {
  let new_x_source = x_source + diff;
  if (x_source > x_targ) {
    new_x_source = x_source - diff;
  }

  return new_x_source;
};

////////////////////////////////////////////////////////////////////////////////
// Draw Functions
////////////////////////////////////////////////////////////////////////////////

const drawTarget = (x, y) => {
  ctx.strokeStyle = "red";
  let when = Date.now();

  size = (when - target_tracking_timer) / 10;

  if (size < 40) {
    size = 40;
  }

  if (size > 50) {
    size = 65;
    ctx.strokeStyle = "white";
  }

  // Draw a vertical line at the cursor's horizontal position
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x, y + size / 2);
  ctx.stroke();

  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.stroke();
};

const drawCrosshair = (x, y) => {
  ctx.strokeStyle = "white";
  // Draw a vertical line at the cursor's horizontal position
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();
};

const drawLine = (x_old, y_old, x_new, y_new, color, width) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x_old, y_old);
  ctx.lineTo(x_new, y_new);
  ctx.stroke();
};

const flyingRocket2 = (x, y) => {
  const dist = distance(x, y, target_x, target_y);
  const diff = 5;
  if (dist > 5) {
    let next_x = x + diff;
    if (x > target_x) next_x = x - diff;

    let next_y = y + diff;
    if (y > target_y) next_y = y - diff;

    // set rocket position
    rocket_x = next_x;
    rocket_y = next_y;
    setTimeout(() => {
      flyingRocket2(next_x, next_y);
    }, 1);
  }
};
const flyingRocket1 = (x, y) => {
  // console.log("flying1");
  // console.log(x, y);

  let next_x = shiftTowards(x, target_x, 3);
  let next_y = y;
  if (Math.abs(next_x - x) < 10) {
    next_y = shiftTowards(y, target_y, 3);
  }

  // console.log(rocket_x, rocket_y);

  // set rocket position
  // rocket_x = next_x;
  // rocket_y = next_y;

  if (distance(next_x, next_y, target_x, target_y) > 5) {
    setTimeout(() => {
      flyingRocket2(next_x, next_y);
    }, 1);
  }
};

const animateRocket = () => {
  // console.log("animating");
  // directRocket(rocket_x, rocket_y);
};


const angleRocket = () => {
  let diff_x = rocket.targetX - rocket.x;
  let diff_y = rocket.targetY - rocket.y;

  let angle_to_target = Math.atan2(diff_y, diff_x);

  rocket.angle = angle_to_target;

  if (rocket.angle > to_rad(360)) {
    rocket.angle -= to_rad(360);
  }
};
let lets_go = false;
const engineRocket = () => {
  // determine if the rocket should be trying to move
  const dist = distance(rocket.x, rocket.y, rocket.targetX, rocket.targetY);
  rocket.dist = dist;

  // if we're not at the target and we're not already powering the engine
  if (dist > 50 && !lets_go) {
    lets_go = false;
    // dist over 2 because we'll slow down at the same rate
    const power_on_for = Math.sqrt(2 * rocket.acceleration * (dist / 2)) / rocket.acceleration;
    rocket.engine = true;

    // turn off the engines in the time we need
    setTimeout(() => {
      rocket.engine = false;
      setTimeout(() => {
        const dist = distance(rocket.x, rocket.y, rocket.targetX, rocket.targetY);
        if (dist < 5) { lets_go = false }
      }, power_on_for)
    }, power_on_for)
  }
}


const physicsRocket = (passed_time) => {
  // console.log("starting: rocket physics")
  // Iterate the x an y of the rocket (todo should happen elsewhere and regardless of the rocket)
  if (rocket.engine) {
    rocket.speed = rocket.speed + rocket.acceleration * passed_time
  }
  else {

    rocket.speed = rocket.speed - rocket.acceleration * passed_time

    if (rocket.speed < 1) { rocket.speed = 0 }
  }

  const amt_x = Math.cos(rocket.angle) * rocket.speed * passed_time;
  const amt_y = Math.sin(rocket.angle) * rocket.speed * passed_time;

  rocket.x = amt_x + rocket.x;
  rocket.y = amt_y + rocket.y;

  // update global rendering ( should probably happen elsewhere (todo))
  // rocket_x = rocket.x;
  // rocket_y = rocket.y;
}

const rocketTrackTarget = () => {
  rocket.targetX = target_x
  rocket.targetY = target_y
}

const sailRocket = () => {
  // console.log("starting: rocket sail")
  // doctor who crap
  const this_time = Date.now();
  if (this_time < rocket.last_update) return;
  const passed_time = this_time - rocket.last_update;
  rocket.last_update = this_time;

  engineRocket();
  angleRocket();
  rocketTrackTarget();
  physicsRocket(passed_time)

  // console.log("completed: rocket sail")
};

const drawRocket = () => {

  let amt_x = Math.cos(rocket.angle) * 50;
  let amt_y = Math.sin(rocket.angle) * 50;

  ctx.beginPath();
  ctx.arc(rocket.x, rocket.y, 20, 0, 2 * Math.PI);
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = BACKGROUND_COLOR;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(rocket.x, rocket.y, 20, rocket.angle - .75 * Math.PI, rocket.angle + .75 * Math.PI);
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = LINK_TEXT_COLOR;
  ctx.stroke();

  // "rocket trail"
  drawLine(rocket.x, rocket.y, rocket.x - amt_x, rocket.y - amt_y, LINK_TEXT_HOVER_COLOR, 5);


};

////////////////////////////////////////////////////////////////////////////////
// Tracking functions
////////////////////////////////////////////////////////////////////////////////

const trackReleaseMouse = (e) => {
  const currMouseX = e.offsetX;
  const currMouseY = e.offsetY;
  if (mouse_down) {
    target_x = currMouseX;
    target_y = currMouseY;
  }
};

const trackCurrentMousePosition = (e) => {
  current_x = e.offsetX;
  current_y = e.offsetY;
};

// const pickUpTarget = () => {
//   let maybe_close_enough = distance(current_x, current_y, rocket_x, rocket_y);
//   if (maybe_close_enough > 20) {
//     return;
//   }
//   if (!picked_up) {
//     picked_up = true;
//   }
// };

const trackPickedUpTarget = () => {
  if (picked_up) {
    target_tracking_timer = Date.now();
    target_x = current_x;
    target_y = current_y;
  }
};

const dropRocketTarget = () => {
  // set end position
  if (picked_up) {
    target_x = current_x;
    target_y = current_y;
    picked_up = false;
  }
};

////////////////////////////////////////////////////////////////////////////////
// Listeners
////////////////////////////////////////////////////////////////////////////////

canvas.addEventListener("mousedown", (e) => {
  mouse_down = true;
  // pickUpTarget();
  trackPickedUpTarget();
  trackCurrentMousePosition(e);
});

canvas.addEventListener("mouseup", (e) => {
  trackReleaseMouse(e);

  dropRocketTarget();
  mouse_down = false;
  picked_up = false;

});

canvas.addEventListener("mousemove", (e) => {
  trackCurrentMousePosition(e);
  trackPickedUpTarget();

});

////////////////////////////////////////////////////////////////////////////////
// Core Frame Loop
////////////////////////////////////////////////////////////////////////////////

const frame = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  matchTheme();

  drawLine(rocket.x, rocket.y, current_x, current_y, TEXT_COLOR, 2);

  if (picked_up) {
    drawTarget(target_x, target_y);
  }

  sailRocket();
  drawRocket();
  // we always want another frame
  requestAnimationFrame(frame);
};

requestAnimationFrame(frame);
