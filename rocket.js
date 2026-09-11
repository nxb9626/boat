////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

const to_rad = (deg) => { return deg / 57.29578; };
const to_deg = (deg) => { return deg * 57.29578; };

// Logging framework
let logging = true;
const dbg = (eh) => { if (logging) console.log(eh) };

// Debugging framework
const setDebugInfo = () => {
  let rocket_stats_display = document.getElementById("rocket_stats");
  rocket_stats_display.textContent = '';//JSON.stringify(rocket, null, 55)
  let keys = [
    // "acceleration",
    // "rotation_acceleration",
    // "targetX",
    // "targetY",
    "target_angle_rad",
    // "engine", ,
    // "left_boost",
    // "right_boost",
    "angle",
    // "dist",
    // "last_update",
    // "maxSpeed",
    "rotation_speed",
    // "maxRotation_speed",
    // "speed",
    // "x",
    // "y"
  ];
  keys.forEach((a) => {
    rocket_stats_display.textContent += a
    rocket_stats_display.textContent += ':'
    rocket_stats_display.textContent += ("" + rocket[a])
    rocket_stats_display.textContent += "\n"
  })

  rocket_stats_display.textContent += "angel_to_target_angle"
  rocket_stats_display.textContent += ':'
  rocket_stats_display.textContent += ("" + to_deg(rocket.target_angle_rad - rocket.angle))
  rocket_stats_display.textContent += "\n"
}


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

const canvas = document.getElementById("rocket");
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

size();

let mouse_down = false;

let current_x; // = canvas.width / 2;
let current_y; //= canvas.height / 2;

let target_x = 300;
let target_y = 300;

let picked_up = false;

let target_tracking_timer;
let rocket = {
  // intrinsic to rocket
  acceleration: 0.0002,
  rotation_acceleration: to_rad(.001),
  targetX: canvas.width / 2, // rocket keeps track of where its going, but this is not const
  targetY: canvas.height / 2,
  target_angle_rad: 0,

  // engines
  engine: false, // true = on, false = off. result of rocket distance from target
  left_boost: false, // true = on, false = off. result of rocket distance from target
  right_boost: false, // true = on, false = off. result of rocket distance from target

  // result of physics
  angle: 0, // in radians
  dist: 0,
  last_update: Date.now(),
  maxSpeed: 100,
  rotation_speed: 0,
  maxRotation_speed: to_rad(2),
  speed: 0,
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

////////////////////////////////////////////////////////////////////////////////
// Draw Functions
////////////////////////////////////////////////////////////////////////////////

const drawTarget = (x, y) => {
  ctx.strokeStyle = "red";
  // let when = Date.now();
  // let size = (when - target_tracking_timer) / 10;
  // if (size < 40) {
  let size = 40;
  // }

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

const calcAngle = (x1, y1, x2, y2) => {

  let diff_x = x1 - x2;
  let diff_y = y1 - y2;

  let angle_to_target = Math.atan2(diff_y, diff_x);
  return angle_to_target
}

const physicsRocketAngle = (passed_time) => {
  if (rocket.left_boost) {
    rocket.rotation_speed = rocket.rotation_speed + rocket.rotation_acceleration * passed_time;
  }
  if (rocket.right_boost) {
    rocket.rotation_speed = rocket.rotation_speed - rocket.rotation_acceleration * passed_time;
  }


  if (rocket.rotation_speed < -rocket.maxRotation_speed) { rocket.rotation_speed = -rocket.maxRotation_speed }
  if (rocket.rotation_speed > rocket.maxRotation_speed) { rocket.rotation_speed = rocket.maxRotation_speed }

  rocket.angle = rocket.angle + rocket.rotation_speed * passed_time

  // keep within bounds
  if (rocket.angle > to_rad(360)) {
    rocket.angle = rocket.angle - to_rad(360);
  }
  if (rocket.angle < 0) {
    rocket.angle = rocket.angle + to_rad(360);
  }
}

let already_changing_angle = false;

const decideRocketAngle = () => {
  const dist = distance(rocket.x, rocket.y, rocket.targetX, rocket.targetY);
  if (dist < 50) { return }
  let angle_to_target = calcAngle(rocket.targetX, rocket.targetY, rocket.x, rocket.y)
  let diff_between_rocket_angle_and_target_in_deg = to_deg(angle_to_target - rocket.angle)

  // half the time, which in this case might not work remove '/2' if not
  const power_on_for = Math.sqrt(2 * rocket.acceleration * (Math.abs(diff_between_rocket_angle_and_target_in_deg) / 2)) / rocket.acceleration;

  if (!already_changing_angle) {
    already_changing_angle = true
    dbg("ANGLE: trying to change angle")
    if (Math.abs(diff_between_rocket_angle_and_target_in_deg) < to_rad(10)) {
      // shouldnt need to timeout this
      // need to set these then unset these after a certain amount of time, determiend by the same math as the other stuff
      rocket.left_boost = false;
      rocket.right_boost = false;
      already_changing_angle = false
    }

    rocket.target_angle_rad = angle_to_target;

    // clockwise
    if ((angle_to_target - rocket.angle) > 0) {
      dbg("ANGLE: Speeding up left")
      rocket.left_boost = true;
      rocket.right_boost = false;

      setTimeout(() => {
        dbg("ANGLE: slowing down left")
        rocket.left_boost = false;
        rocket.right_boost = true;
        setTimeout(() => {
          dbg("ANGLE: stopping boost left")
          rocket.left_boost = false;
          rocket.right_boost = false;
          already_changing_angle = false;
        }, power_on_for)
      }, power_on_for);
    };
    // counterclockwise
    if ((angle_to_target - rocket.angle) < 0) {
      dbg("ANGLE: speeing up right")
      rocket.left_boost = false;
      rocket.right_boost = true;
      setTimeout(() => {
        dbg("ANGLE: slowing down right")
        rocket.left_boost = true;
        rocket.right_boost = false;
        setTimeout(() => {
          dbg("ANGLE: stopping boost right")
          rocket.left_boost = false;
          rocket.right_boost = false;
          already_changing_angle = false;
        }, power_on_for)
      }, power_on_for);
    }
  }
};

let lets_go = false;
const decideRocketEngine = () => {
  if (rocket.angle - rocket.target_angle_rad > to_rad(5)) { return }
  // determine if the rocket should be trying to move
  const dist = distance(rocket.x, rocket.y, rocket.targetX, rocket.targetY);
  rocket.dist = dist;
  if (!already_changing_angle) {

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

  decideRocketAngle();
  decideRocketEngine();
  rocketTrackTarget();
  physicsRocketAngle(passed_time);
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
const physics = () => {
  sailRocket();
}
////////////////////////////////////////////////////////////////////////////////
// Core Frame Loop
////////////////////////////////////////////////////////////////////////////////


const frame = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  matchTheme();

  drawLine(rocket.x, rocket.y, current_x, current_y, TEXT_COLOR, 2);

  drawTarget(rocket.targetX, rocket.targetY);

  if (picked_up) {
    drawTarget(target_x, target_y);
  }
  // sailRocket()
  drawRocket();
  requestAnimationFrame(frame);


  physics()
  setDebugInfo()
};

// setInterval(() => {
// }, 50)

requestAnimationFrame(frame);
