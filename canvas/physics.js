////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

const to_rad = (deg) => { return deg / 57.29578; };
const to_deg = (deg) => { return deg * 57.29578; };

const GRAVITATIONAL_CONSTANT = 6.67408 * (10 ** -11);
const MASS_OF_EARTH = 5.9722 * (10 ** 24);
const MASS_OF_SUN = 1.989 * (10 ** 24);

// Logging framework
let logging = true;
const dbg = (eh) => { if (logging) console.log(eh) };

// Debugging framework
const setDebugInfo = () => {
  let stats = document.getElementById("debug_stats");
  stats.textContent = '';

  affected_by_physics.forEach((obj) => {
    let i = 0;
    stats.textContent += '{'
    Object.keys(obj).forEach((a) => {
      stats.textContent += a
      stats.textContent += ':'
      stats.textContent += JSON.stringify(obj[a])
      if (i < Object.keys(obj).length - 1) {
        stats.textContent += ', '
        i++;
      }
    });
    stats.textContent += "}"
    stats.textContent += ' ----------------------------------------------------------------- ';
  });
}

////////////////////////////////////////////////////////////////////////////////
// Global/Setup
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
matchTheme();

const size = () => {
  const canvas = document.getElementById("physics");
  const parent = canvas.parentNode.parentNode.parentNode;
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

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

const canvas = document.getElementById("physics");
const ctx = canvas.getContext("2d");
const parent = canvas.parentNode.parentNode.parentNode;

// set the size, need to figure out css side...

let mouse_x; // = canvas.width / 2;
let mouse_y; //= canvas.height / 2;

let picked_up = false;

let target_tracking_timer;

let global_gravity = () => {
  affected_by_physics.forEach((a) => {
    affected_by_physics.forEach((b) => {
      if (a != b) {
        const angle_from_a_to_b = calcAngle(a, b)
        const r = distance(a.x, a.y, b.x, b.y)
        let force_of_gravity = GRAVITATIONAL_CONSTANT * a.mass * b.mass / (r ** 2)
        a.forces.gravity = { amt: -force_of_gravity, angle: angle_from_a_to_b };
      };

    })
  });
}

/// creates an object with provided offset from center
const new_obj = (offset_x, offset_y, mass, viy, vix) => {
  return {
    angle: 0,
    radius: 20,
    mass: mass,
    vi_x: vix,
    vi_y: viy,
    forces: {},
    x: Math.round((canvas.width / 2)) + offset_x,
    y: Math.round((canvas.height / 2)) + offset_y,
  }
}


let affected_by_physics = [new_obj(0, 0, MASS_OF_SUN, 0, 0), new_obj(0, 100, 1, 0, 1)];
let drawn_objects = [...affected_by_physics];

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
  let size = 40;

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
// calc angle from obj1 to obj 2
const calcAngle = (obj1, obj2) => {
  let diff_x = obj1.x - obj2.x;
  let diff_y = obj1.y - obj2.y;

  let angle_calced = Math.atan2(diff_y, diff_x);
  // dbg(to_deg(angle_calced))
  return angle_calced
}

let already_changing_angle = false;


const drawObject = (obj) => {
  // let amt_x = Math.cos(a.angle) * 50;
  // let amt_y = Math.sin(a.angle) * 50;

  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = BACKGROUND_COLOR;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = LINK_TEXT_COLOR;
  ctx.stroke();
  Object.keys(obj.forces).forEach((f_key) => {
    let force = obj.forces[f_key]
    let target_point = vector_viz_points(obj, force.amt, force.angle)
    drawLine(obj.x, obj.y, target_point.x, target_point.y)

  })

};

const vector_viz_points = (obj, amt, angle) => {
  let amt_x = Math.cos(angle) * amt;
  let amt_y = Math.sin(angle) * amt;
  return ({
    x: obj.x + amt_x, y: obj.y + amt_y
  })

}
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


}
////////////////////////////////////////////////////////////////////////////////
// Mouse Tracking functions
////////////////////////////////////////////////////////////////////////////////

let mouse_down = false;
const trackReleaseMouse = (e) => {
  const currMouseX = e.offsetX;
  const currMouseY = e.offsetY;
  if (mouse_down) {
    target_x = currMouseX;
    target_y = currMouseY;
  }
};

const trackCurrentMousePosition = (e) => {
  mouse_x = e.offsetX;
  mouse_y = e.offsetY;
};

const trackPickedUpTarget = () => {
  if (picked_up) {
    target_tracking_timer = Date.now();
    target_x = mouse_x;
    target_y = mouse_y;
  }
};

const dropRocketTarget = () => {
  // set end position
  if (picked_up) {
    target_x = mouse_x;
    target_y = mouse_y;
    picked_up = false;
  }
};

////////////////////////////////////////////////////////////////////////////////
// Listeners
////////////////////////////////////////////////////////////////////////////////

canvas.addEventListener("mousedown", (e) => {
  mouse_down = true;
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

let physics_object = (obj, t) => {
  let net_force_x = 0;
  let net_force_y = 0;
  Object.values(obj.forces).forEach((f) => {
    // scale
    const amt_x_scalar = Math.cos(f.angle);
    const amt_y_scalar = Math.sin(f.angle);

    net_force_x += amt_x_scalar * f.amt;
    net_force_y += amt_y_scalar * f.amt;
  })
  let accelleration_x = net_force_x / obj.mass;
  let accelleration_y = net_force_y / obj.mass;

  // update velocities
  obj.vi_x = obj.vi_x + accelleration_x * t;
  obj.vi_y = obj.vi_y + accelleration_y * t;

  // update locations
  obj.x = obj.x + obj.vi_x * t;
  obj.y = obj.y + obj.vi_y * t;
}
// https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection#separating_axis_theorem
const check_for_collision = (obj, new_x, new_y) => {
  // need the
  const movement_box = {
    min_x: obj.y - obj.radius,
    min_y: obj.x - obj.radius,
    max_x: new_x + obj.radius,
    max_y: new_y + obj.radius,
  }

  affected_by_physics.forEach((phys)=>{
    const possibly_collision_bounds = {
       min_x: phys.y - phys.radius,
       min_y: phys.x - phys.radius,
       max_x: new_x + phys.radius,
       max_y: new_y + phys.radius,
     };
    if


  })

}

const physics = (t) => {
  affected_by_physics.forEach((a) => {
    physics_object(a, t);
  })
}

////////////////////////////////////////////////////////////////////////////////
// Core Frame Loop
////////////////////////////////////////////////////////////////////////////////


const frame = () => {
  requestAnimationFrame(frame);
  size();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  matchTheme();

  // drawLine(physics.x, physics.y, mouse_x, mouse_y, TEXT_COLOR, 2);

  // drawTarget(physics.targetX, physics.targetY);

  if (picked_up) {
    drawTarget(target_x, target_y);
  }


  drawn_objects.forEach((a) => {
    drawObject(a);
  })

  setDebugInfo()
};

/// physics loop
let last_time = Date.now();
setInterval(() => {
  let now = Date.now();
  let time_delta = now - last_time;
  last_time = now;

  // update global physics
  global_gravity()

  physics(time_delta);
}, 1)


requestAnimationFrame(frame);
