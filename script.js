/**
 * MATH CARROM: Educational Physics & Game Logic
 * Designed to teach angles, estimation, and reflection.
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const promptEl = document.getElementById("prompt");
const scoreEl = document.getElementById("score-display");
const timeEl = document.getElementById("time-display");

// Game State
let gameState = "MENU"; // MENU, PLAYING, GAMEOVER
let score = 0;
let targetScore = 10;
let timeLeft = 60*5;
let timerInterval;
let boardSize = 0;
let lastTime = 0;
let shotTaken = false;

// Physics objects
let balls = [];
let striker;
let pockets = [];

// Input state
let isInteracting = false;
let interactionMode = "NONE"; // 'NONE', 'POSITION', 'AIM'
let dragStart = { x: 0, y: 0 };
let dragCurrent = { x: 0, y: 0 };
let laneGap = 0;
let laneLength = 0;

// Educational Prompts cycle
const teacherPrompts = [
  "Drag the striker sideways to find a good spot!",
  "Pull backwards from the striker to aim!",
  "Notice the angle of incidence (i) and reflection (r)?",
  "i = r! The bounce angle equals the hit angle!",
  "Use a wall bounce to reach tricky coins!",
  "Gentle power for close coins, strong for far ones.",
];
let promptIndex = 0;

// Resize canvas to be responsive and square
function resizeCanvas() {
  const container = document.getElementById("game-container");
  const containerRect = container.getBoundingClientRect();
  const topUiReserve = 105;
  const widthLimit = Math.min(containerRect.width * 0.94, window.innerWidth * 0.92, 760);
  const heightLimit = Math.min(containerRect.height - topUiReserve, window.innerHeight - topUiReserve);

  boardSize = Math.floor(Math.max(280, Math.min(widthLimit, heightLimit)));
  canvas.width = boardSize;
  canvas.height = boardSize;
  canvas.style.width = `${boardSize}px`;
  canvas.style.height = `${boardSize}px`;

  laneGap = boardSize * 0.17; // Distance from edge to lane center
  laneLength = boardSize * 0.48; // Total length of straight part

  // Set up pockets with padding so they are fully circular and inset from border
  const wallPadding = boardSize * 0.015;
  const pocketRadius = boardSize * 0.042; // Made holes a bit smaller
  const pocketOffset = wallPadding + pocketRadius;

  pockets = [
    { x: pocketOffset, y: pocketOffset, r: pocketRadius },
    { x: boardSize - pocketOffset, y: pocketOffset, r: pocketRadius },
    { x: pocketOffset, y: boardSize - pocketOffset, r: pocketRadius },
    {
      x: boardSize - pocketOffset,
      y: boardSize - pocketOffset,
      r: pocketRadius,
    },
  ];
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Entity Classes
class Ball {
  constructor(x, y, radius, mass, color, isStriker = false) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.mass = mass;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
    this.isStriker = isStriker;
    this.active = true;
  }

  draw(ctx) {
    if (!this.active) return;

    // Shadow
    ctx.beginPath();
    ctx.arc(this.x + 2, this.y + 2, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    // Ball body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    if (this.isStriker) {
      // Striker details (blue with inner rings like the image)
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = "#60a5fa"; // lighter blue
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#93c5fd"; // even lighter blue
      ctx.fill();

      // Target crosshair lightly drawn
      ctx.beginPath();
      ctx.moveTo(this.x - 5, this.y);
      ctx.lineTo(this.x + 5, this.y);
      ctx.moveTo(this.x, this.y - 5);
      ctx.lineTo(this.x, this.y + 5);
      ctx.strokeStyle = "#1e3a8a";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Inner detail for normal coins
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fill();
    }
  }

  update(dt) {
    if (!this.active) return;

    // Apply friction (slowdown) - Increased friction for the board
    const friction = 0.972;
    this.vx *= friction;
    this.vy *= friction;

    // Stop completely if moving very slow
    if (Math.abs(this.vx) < 0.1) this.vx = 0;
    if (Math.abs(this.vy) < 0.1) this.vy = 0;

    // Move
    this.x += this.vx * dt * 60; // scale for consistent speed
    this.y += this.vy * dt * 60;
  }
}

// Level Setup
function initLevel() {
  balls = [];
  score = 0;
  targetScore = 9; // Adjusted for the fewer number of coins
  timeLeft = 60*5;
  shotTaken = false;
  updateUI();

  const rBase = boardSize * 0.025; // Smaller coins for full set
  const centerX = boardSize / 2;
  const centerY = boardSize / 2;
  const baselineY = boardSize - laneGap; // Place exactly in the bottom lane

  // Striker (bottom center)
  striker = new Ball(centerX, baselineY, rBase * 1.6, 3, "#2563eb", true); // Blue, heavier
  balls.push(striker);

  // Coins (Carrom Formation - Reduced for simpler gameplay)
  // Queen (Red)
  balls.push(new Ball(centerX, centerY, rBase, 1, "#dc2626"));

  // Single Ring (8 coins: 4 white, 4 black)
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const x = centerX + Math.cos(angle) * (rBase * 2.3); // Spaced appropriately for 8 coins
    const y = centerY + Math.sin(angle) * (rBase * 2.3);
    balls.push(new Ball(x, y, rBase, 1, i % 2 === 0 ? "#f8fafc" : "#1e293b")); // White/Black
  }

  changePrompt("Drag the striker left or right to position it!");

  // Timer
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState !== "PLAYING") return;
    timeLeft--;
    updateUI();

    // Cycle educational prompts every 10 seconds
    if (timeLeft % 10 === 0 && timeLeft > 0) {
      promptIndex = (promptIndex + 1) % teacherPrompts.length;
      changePrompt(teacherPrompts[promptIndex]);
    }

    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);
}

// Educational UI Updates
function changePrompt(msg) {
  promptEl.textContent = msg;
  // Trigger CSS animation restart
  promptEl.style.animation = "none";
  promptEl.offsetHeight; /* trigger reflow */
  promptEl.style.animation = null;
}

function updateUI() {
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
}

// Input Handling
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const style = window.getComputedStyle(canvas);
  const borderLeft = parseFloat(style.borderLeftWidth) || 0;
  const borderTop = parseFloat(style.borderTopWidth) || 0;
  const borderRight = parseFloat(style.borderRightWidth) || 0;
  const borderBottom = parseFloat(style.borderBottomWidth) || 0;

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  // Playable space on screen is rect.width minus borders
  const playableWidth = rect.width - borderLeft - borderRight;
  const playableHeight = rect.height - borderTop - borderBottom;

  const scaleX = canvas.width / playableWidth;
  const scaleY = canvas.height / playableHeight;

  return {
    x: (clientX - rect.left - borderLeft) * scaleX,
    y: (clientY - rect.top - borderTop) * scaleY,
  };
}

canvas.addEventListener("mousedown", startInteraction);
canvas.addEventListener("touchstart", startInteraction, { passive: false });

// Listen globally so dragging continues even when pointer leaves the board.
window.addEventListener("mousemove", moveInteraction);
window.addEventListener("touchmove", moveInteraction, { passive: false });

window.addEventListener("mouseup", endInteraction);
window.addEventListener("touchend", endInteraction, { passive: false });
window.addEventListener("touchcancel", endInteraction, { passive: false });

function isStrikerMoving() {
  return Math.abs(striker.vx) > 0.1 || Math.abs(striker.vy) > 0.1;
}

function startInteraction(e) {
  if (gameState !== "PLAYING" || isStrikerMoving() || !striker.active) return;
  if (e.cancelable) e.preventDefault();
  const pos = getMousePos(e);

  // Check if clicked near striker
  const dist = Math.hypot(pos.x - striker.x, pos.y - striker.y);
  if (dist < striker.radius * 3) {
    isInteracting = true;
    interactionMode = "NONE";
    dragStart = pos;
    dragCurrent = pos;
  }
}

function moveInteraction(e) {
  if (!isInteracting) return;
  if (e.cancelable) e.preventDefault();
  const pos = getMousePos(e);

  // Decide mode based on initial movement direction
  if (interactionMode === "NONE") {
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      // If dragging mostly horizontally -> Position
      if (Math.abs(dx) > Math.abs(dy)) {
        interactionMode = "POSITION";
      } else {
        // If dragging vertically -> Aim
        interactionMode = "AIM";
        dragStart = pos; // Reset aim anchor so it pulls exactly from where they pulled down
      }
    }
  }

  if (interactionMode === "POSITION") {
    const laneLeft = boardSize / 2 - laneLength / 2;
    const laneRight = boardSize / 2 + laneLength / 2;
    striker.x = Math.max(laneLeft, Math.min(laneRight, pos.x));
    dragCurrent = pos;
  } else if (interactionMode === "AIM") {
    dragCurrent = pos;
  }
}

function endInteraction(e) {
  if (!isInteracting) return;
  if (e.cancelable) e.preventDefault();

  if (interactionMode === "AIM") {
    // Calculate aim vector (opposite of drag)
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;

    // Power constraints
    const powerLimiter = 0.25; // Slightly reduced for gentler striker speed
    const maxSpeed = 60; // Increased max speed limit

    striker.vx = Math.max(-maxSpeed, Math.min(maxSpeed, dx * powerLimiter));
    striker.vy = Math.max(-maxSpeed, Math.min(maxSpeed, dy * powerLimiter));

    if (Math.abs(striker.vx) > 0 || Math.abs(striker.vy) > 0) {
      shotTaken = true;
    }

    // Encourage prediction
    if (Math.hypot(dx, dy) > 20) {
      changePrompt("Great shot! Watch how it travels.");
    }
  } else if (interactionMode === "POSITION") {
    changePrompt("Position set! Now pull backward to aim.");
  }

  isInteracting = false;
  interactionMode = "NONE";
}

// Helper to draw clean arcs for angles
function drawAngleArc(ctx, cx, cy, r, angle1, angle2, color) {
  let diff = angle2 - angle1;
  while (diff <= -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, angle1, angle1 + diff, diff < 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function getMidAngle(a1, a2) {
  let diff = a2 - a1;
  while (diff <= -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return a1 + diff / 2;
}

function getWallRayDistance(originX, originY, dirX, dirY, movingRadius = 0) {
  const wallPadding = boardSize * 0.015;
  const minPos = wallPadding + movingRadius;
  const maxPos = boardSize - wallPadding - movingRadius;
  let tMin = Infinity;

  if (dirX < 0) {
    const t = (minPos - originX) / dirX;
    if (t > 0) tMin = Math.min(tMin, t);
  } else if (dirX > 0) {
    const t = (maxPos - originX) / dirX;
    if (t > 0) tMin = Math.min(tMin, t);
  }

  if (dirY < 0) {
    const t = (minPos - originY) / dirY;
    if (t > 0) tMin = Math.min(tMin, t);
  } else if (dirY > 0) {
    const t = (maxPos - originY) / dirY;
    if (t > 0) tMin = Math.min(tMin, t);
  }

  return tMin;
}

function findFirstCoinOnTrajectory(originX, originY, dirX, dirY, maxDistance) {
  let nearestHit = null;

  for (const ball of balls) {
    if (!ball.active || ball.isStriker) continue;

    const toBallX = ball.x - originX;
    const toBallY = ball.y - originY;
    const projection = toBallX * dirX + toBallY * dirY;
    if (projection <= 0 || projection > maxDistance) continue;

    const distSqFromRay = toBallX * toBallX + toBallY * toBallY - projection * projection;
    const hitRadius = striker.radius + ball.radius;
    const hitRadiusSq = hitRadius * hitRadius;
    if (distSqFromRay > hitRadiusSq) continue;

    const offset = Math.sqrt(hitRadiusSq - distSqFromRay);
    let tHit = projection - offset;
    if (tHit <= 0) tHit = projection + offset;
    if (tHit <= 0 || tHit > maxDistance) continue;

    if (!nearestHit || tHit < nearestHit.t) {
      const hitX = originX + dirX * tHit;
      const hitY = originY + dirY * tHit;
      const normalVecX = hitX - ball.x;
      const normalVecY = hitY - ball.y;
      const normalLen = Math.hypot(normalVecX, normalVecY) || 1;

      nearestHit = {
        ball,
        t: tHit,
        hitX,
        hitY,
        normalX: normalVecX / normalLen,
        normalY: normalVecY / normalLen,
      };
    }
  }

  return nearestHit;
}

// --- CORE TEACHING FEATURE: Educational Trajectory & Angles ---
function drawTrajectoryAndAngles(ctx) {
  if (interactionMode !== "AIM") return;

  const dx = dragStart.x - dragCurrent.x;
  const dy = dragStart.y - dragCurrent.y;
  const pullDistance = Math.hypot(dx, dy);

  if (pullDistance < 10) return; // Too small to aim

  // 1. Draw Angle Protractor at Striker
  const physicalAimRad = Math.atan2(dy, dx); // Angle of aim for canvas drawing
  const mathAimRad = Math.atan2(-dy, dx); // Mathematical angle (anti-clockwise)
  let aimAngleDeg = Math.round((mathAimRad * 180) / Math.PI);
  if (aimAngleDeg < 0) aimAngleDeg += 360; // Keep 0-360

  // Draw horizontal reference line
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(striker.x - 40, striker.y);
  ctx.lineTo(striker.x + 40, striker.y);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw Protractor Arc
  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.arc(striker.x, striker.y, 45, 0, physicalAimRad, physicalAimRad < 0);
  ctx.strokeStyle = "#2563eb"; // strong blue
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw Angle Text
  ctx.fillStyle = "#000000"; // Changed to black
  ctx.font = "900 18px Quicksand"; // Extra bold font
  ctx.fillText(`${aimAngleDeg}°`, striker.x + 50, striker.y - 10);

  // 2. Trajectory Prediction (Raycast)
  let simX = striker.x;
  let simY = striker.y;

  // Normalize direction
  const dirX = dx / pullDistance;
  const dirY = dy / pullDistance;

  // Find intersection with inner walls (accounting for corner padding)
  let tMin = Infinity;
  let hitNormalX = 0;
  let hitNormalY = 0;
  const r = striker.radius;
  const minPos = boardSize * 0.015;
  const maxPos = boardSize - minPos;

  // Check bounds (Left, Right, Top, Bottom) against padded walls
  if (dirX < 0) {
    const t = (minPos + r - simX) / dirX;
    if (t > 0 && t < tMin) {
      tMin = t;
      hitNormalX = 1;
      hitNormalY = 0;
    }
  } else if (dirX > 0) {
    const t = (maxPos - r - simX) / dirX;
    if (t > 0 && t < tMin) {
      tMin = t;
      hitNormalX = -1;
      hitNormalY = 0;
    }
  }

  if (dirY < 0) {
    const t = (minPos + r - simY) / dirY;
    if (t > 0 && t < tMin) {
      tMin = t;
      hitNormalX = 0;
      hitNormalY = 1;
    }
  } else if (dirY > 0) {
    const t = (maxPos - r - simY) / dirY;
    if (t > 0 && t < tMin) {
      tMin = t;
      hitNormalX = 0;
      hitNormalY = -1;
    }
  }

  // Limit trajectory length visually based on pull power
  const visualPowerLimit = Math.min(pullDistance * 4, tMin);
  const coinHit = findFirstCoinOnTrajectory(simX, simY, dirX, dirY, visualPowerLimit);

  let endX = simX + dirX * visualPowerLimit;
  let endY = simY + dirY * visualPowerLimit;
  if (coinHit) {
    // Stop at the first actual striker-coin contact point.
    endX = coinHit.hitX;
    endY = coinHit.hitY;
  }

  // Draw main aim line
  ctx.beginPath();
  ctx.setLineDash([8, 8]);
  ctx.moveTo(simX, simY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = "#ef4444"; // red dashed
  ctx.lineWidth = 3;
  ctx.stroke();

  // 3. Coin Collision Prediction (if a coin is in the striker's path)
  if (coinHit) {
    // Continue striker trajectory after impact (tangent component for equal-mass collision).
    const approachDot = dirX * coinHit.normalX + dirY * coinHit.normalY;
    let strikerPostX = dirX - approachDot * coinHit.normalX;
    let strikerPostY = dirY - approachDot * coinHit.normalY;
    let strikerPostMag = Math.hypot(strikerPostX, strikerPostY);

    // Near head-on hits make tangent tiny; keep a short forward guide instead of disappearing.
    if (strikerPostMag < 0.08) {
      strikerPostX = dirX;
      strikerPostY = dirY;
      strikerPostMag = 1;
    }

    strikerPostX /= strikerPostMag;
    strikerPostY /= strikerPostMag;

    let strikerTWall = getWallRayDistance(
      coinHit.hitX,
      coinHit.hitY,
      strikerPostX,
      strikerPostY,
      striker.radius
    );
    if (!Number.isFinite(strikerTWall) || strikerTWall <= 0) {
      strikerTWall = boardSize * 0.22;
    }

    const strikerPreviewLen = Math.max(56, Math.min(strikerTWall, boardSize * 0.34));
    const strikerEndX = coinHit.hitX + strikerPostX * strikerPreviewLen;
    const strikerEndY = coinHit.hitY + strikerPostY * strikerPreviewLen;

    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.moveTo(coinHit.hitX, coinHit.hitY);
    ctx.lineTo(strikerEndX, strikerEndY);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";

    const strikerArrowSize = Math.max(7, boardSize * 0.013);
    const strikerArrowAngle = Math.atan2(strikerPostY, strikerPostX);
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(strikerEndX, strikerEndY);
    ctx.lineTo(
      strikerEndX - strikerArrowSize * Math.cos(strikerArrowAngle - Math.PI / 6),
      strikerEndY - strikerArrowSize * Math.sin(strikerArrowAngle - Math.PI / 6)
    );
    ctx.lineTo(
      strikerEndX - strikerArrowSize * Math.cos(strikerArrowAngle + Math.PI / 6),
      strikerEndY - strikerArrowSize * Math.sin(strikerArrowAngle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
    ctx.fill();

    // Use real collision normal so coin direction/angle changes with where the striker hits.
    const coinDirX = -coinHit.normalX;
    const coinDirY = -coinHit.normalY;
    let angleFromXDeg = Math.round((Math.atan2(-coinDirY, coinDirX) * 180) / Math.PI);
    if (angleFromXDeg < 0) angleFromXDeg += 360;

    // Local reference: dotted X-axis passing through the coin center.
    const axisLen = Math.max(78, boardSize * 0.15);
    ctx.beginPath();
    ctx.setLineDash([7, 6]);
    ctx.moveTo(coinHit.ball.x - axisLen, coinHit.ball.y);
    ctx.lineTo(coinHit.ball.x + axisLen, coinHit.ball.y);
    ctx.strokeStyle = "rgba(17, 24, 39, 0.86)";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineCap = "butt";

    // Simple target marker on coin center.
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.arc(coinHit.ball.x, coinHit.ball.y, Math.max(4, coinHit.ball.radius * 0.3), 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();

    // Predicted coin trajectory (first segment) after the striker hit.
    if (Math.hypot(coinDirX, coinDirY) > 1e-6) {
      let coinTWall = getWallRayDistance(
        coinHit.ball.x,
        coinHit.ball.y,
        coinDirX,
        coinDirY,
        coinHit.ball.radius
      );

      if (!Number.isFinite(coinTWall) || coinTWall <= 0) {
        coinTWall = boardSize * 0.2;
      }

      const coinPreviewLen = Math.max(26, Math.min(coinTWall, boardSize * 0.24));
      const coinEndX = coinHit.ball.x + coinDirX * coinPreviewLen;
      const coinEndY = coinHit.ball.y + coinDirY * coinPreviewLen;

      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.moveTo(coinHit.ball.x, coinHit.ball.y);
      ctx.lineTo(coinEndX, coinEndY);
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 2.8;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.lineCap = "butt";

      const arrowSize = Math.max(6, boardSize * 0.012);
      const arrowAngle = Math.atan2(coinDirY, coinDirX);
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(coinEndX, coinEndY);
      ctx.lineTo(
        coinEndX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        coinEndY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      );
      ctx.lineTo(
        coinEndX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        coinEndY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = "#16a34a";
      ctx.fill();
    }

    const labelOnLeft = coinHit.ball.x > boardSize * 0.62;
    const labelX = labelOnLeft ? coinHit.ball.x - 16 : coinHit.ball.x + 16;
    ctx.textAlign = labelOnLeft ? "right" : "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#111827";
    ctx.font = "700 16px Quicksand";
    ctx.fillText(`θx = ${angleFromXDeg}°`, labelX, coinHit.ball.y - 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    return;
  }

  // 4. Bounce Visualization (The Teacher Moment)
  if (visualPowerLimit === tMin) {
    // We hit a wall visually
    // Draw normal line (perpendicular to wall)
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX + hitNormalX * 50, endY + hitNormalY * 50);
    ctx.strokeStyle = "#10b981"; // green normal
    ctx.stroke();

    // Calculate bounce vector
    const dot = dirX * hitNormalX + dirY * hitNormalY;
    const refX = dirX - 2 * dot * hitNormalX;
    const refY = dirY - 2 * dot * hitNormalY;

    // Draw bounce path
    const bounceLen = pullDistance * 2; // length of reflection preview
    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX + refX * bounceLen, endY + refY * bounceLen);
    ctx.strokeStyle = "#0ea5e9"; // bright cyan reflection
    ctx.stroke();

    // Wall-hit angle from global horizontal (+X) edge.
    let wallAngleDeg = Math.round((Math.atan2(-dirY, dirX) * 180) / Math.PI);
    if (wallAngleDeg < 0) wallAngleDeg += 360;

    const wallAxisLen = Math.max(72, boardSize * 0.14);
    ctx.beginPath();
    ctx.setLineDash([7, 6]);
    ctx.moveTo(endX - wallAxisLen, endY);
    ctx.lineTo(endX + wallAxisLen, endY);
    ctx.strokeStyle = "rgba(17, 24, 39, 0.86)";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";

    const wallLabelOnLeft = endX > boardSize * 0.62;
    const wallLabelX = wallLabelOnLeft ? endX - 14 : endX + 14;
    ctx.setLineDash([]);
    ctx.textAlign = wallLabelOnLeft ? "right" : "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#111827";
    ctx.font = "700 15px Quicksand";
    ctx.fillText(`wall θx = ${wallAngleDeg}°`, wallLabelX, endY - 4);
    ctx.textAlign = "left";

    ctx.setLineDash([]);
  }

  ctx.setLineDash([]); // reset
}

// Physics Step
function handleCollisions() {
  const minPos = boardSize * 0.015; // Wall padding (physics inner border)
  const maxPos = boardSize - minPos;

  // Wall Collisions
  balls.forEach((b) => {
    if (!b.active) return;

    let hitWall = false;
    if (b.x - b.radius < minPos) {
      b.x = minPos + b.radius;
      b.vx *= -1;
      hitWall = true;
    } else if (b.x + b.radius > maxPos) {
      b.x = maxPos - b.radius;
      b.vx *= -1;
      hitWall = true;
    }

    if (b.y - b.radius < minPos) {
      b.y = minPos + b.radius;
      b.vy *= -1;
      hitWall = true;
    } else if (b.y + b.radius > maxPos) {
      b.y = maxPos - b.radius;
      b.vy *= -1;
      hitWall = true;
    }
  });

  // Ball to Ball Collisions (Elastic)
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const b1 = balls[i];
      const b2 = balls[j];

      if (!b1.active || !b2.active) continue;

      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = b1.radius + b2.radius;

      if (dist < minDist) {
        // Prevent sticking (resolve overlap)
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        b1.x -= nx * overlap * 0.5;
        b2.x += nx * overlap * 0.5;

        // Momentum Exchange
        const kx = b1.vx - b2.vx;
        const ky = b1.vy - b2.vy;
        const p = (2 * (nx * kx + ny * ky)) / (b1.mass + b2.mass);

        // Elasticity (bounciness)
        const restitution = 0.85;

        b1.vx -= p * b2.mass * nx * restitution;
        b1.vy -= p * b2.mass * ny * restitution;
        b2.vx += p * b1.mass * nx * restitution;
        b2.vy += p * b1.mass * ny * restitution;
      }
    }
  }

  // Pocket checking
  balls.forEach((b) => {
    if (!b.active) return;
    for (let p of pockets) {
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.r) {
        b.active = false;
        if (b.isStriker) {
          // Oops! Striker foul. Deactivate it, gameLoop will reset it.
          changePrompt("Oops! The striker fell in. Careful with power!");
          b.vx = 0;
          b.vy = 0;
        } else {
          // Scored a coin
          score++;
          updateUI();
          changePrompt("Awesome geometry! 🌟");
          if (score >= targetScore) {
            endGame(true);
          }
        }
        break;
      }
    }
  });
}

// Rendering
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const center = boardSize / 2;
  const boardLineColor = "#8b4513"; // Richer dark wood line color

  // 1. Center Motif
  ctx.strokeStyle = boardLineColor;
  ctx.lineWidth = 2;

  // Outer big circle
  ctx.beginPath();
  ctx.arc(center, center, boardSize * 0.18, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(center, center, boardSize * 0.15, 0, Math.PI * 2);
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(center, center, boardSize * 0.02, 0, Math.PI * 2);
  ctx.fillStyle = "#dc2626";
  ctx.fill();

  // 2. The Lanes (Capsule style)
  const laneRadius = boardSize * 0.035;

  function drawCapsuleLane(cx, cy, isHoriz) {
    ctx.strokeStyle = boardLineColor;
    ctx.lineWidth = 2.5;

    // Capsule Outline
    ctx.beginPath();
    if (isHoriz) {
      ctx.arc(cx - laneLength / 2, cy, laneRadius, Math.PI / 2, Math.PI * 1.5);
      ctx.lineTo(cx + laneLength / 2, cy - laneRadius);
      ctx.arc(cx + laneLength / 2, cy, laneRadius, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
    } else {
      ctx.arc(cx, cy - laneLength / 2, laneRadius, Math.PI, 0);
      ctx.lineTo(cx + laneRadius, cy + laneLength / 2);
      ctx.arc(cx, cy + laneLength / 2, laneRadius, 0, Math.PI);
      ctx.closePath();
    }
    ctx.stroke();

    // 2 Cream End Circles, with 1 smaller filled yellow circle inside
    const creamR = laneRadius * 0.85;
    const yellowR = creamR * 0.7; // Increased radius of yellow circle

    const drawEndCircle = (px, py) => {
      // Cream circle
      ctx.beginPath();
      ctx.arc(px, py, creamR, 0, Math.PI * 2);
      ctx.fillStyle = "#fef3c7"; // amber-50 (cream)
      ctx.fill();

      // Restore line width/color for the boundary stroke
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = boardLineColor;
      ctx.stroke();

      // Yellow inner filled circle
      ctx.beginPath();
      ctx.arc(px, py, yellowR, 0, Math.PI * 2);
      ctx.fillStyle = "#eab308"; // yellow-500
      ctx.fill();
    };

    if (isHoriz) {
      drawEndCircle(cx - laneLength / 2, cy);
      drawEndCircle(cx + laneLength / 2, cy);
    } else {
      drawEndCircle(cx, cy - laneLength / 2);
      drawEndCircle(cx, cy + laneLength / 2);
    }
  }

  // Draw all 4 lanes
  drawCapsuleLane(center, laneGap, true); // Top
  drawCapsuleLane(center, boardSize - laneGap, true); // Bottom
  drawCapsuleLane(laneGap, center, false); // Left
  drawCapsuleLane(boardSize - laneGap, center, false); // Right

  // 4. Pockets and Corner Decorations
  pockets.forEach((p) => {
    // Diagonal arrow lines towards center
    const angle = Math.atan2(center - p.y, center - p.x);
    const startX = p.x + Math.cos(angle) * (p.r + boardSize * 0.02);
    const startY = p.y + Math.sin(angle) * (p.r + boardSize * 0.02);
    const endX = p.x + Math.cos(angle) * (p.r + boardSize * 0.12);
    const endY = p.y + Math.sin(angle) * (p.r + boardSize * 0.12);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = boardLineColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Arrow end dot
    ctx.beginPath();
    ctx.arc(endX, endY, boardSize * 0.008, 0, Math.PI * 2);
    ctx.fillStyle = boardLineColor;
    ctx.fill();

    // Pocket hole
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "#111827"; // Darker hole
    ctx.fill();

    // Subtle wooden rim around pocket
    ctx.lineWidth = 2;
    ctx.strokeStyle = boardLineColor;
    ctx.stroke();
  });
}

function areBallsMoving() {
  return balls.some(
    (b) => b.active && (Math.abs(b.vx) > 0.05 || Math.abs(b.vy) > 0.05),
  );
}

function resetStriker() {
  if (!striker.active) striker.active = true;
  striker.x = boardSize / 2;
  striker.y = boardSize - laneGap; // Back directly to bottom lane center
  striker.vx = 0;
  striker.vy = 0;
}

// Main Game Loop
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.03); // Cap dt to prevent massive physics spikes
  lastTime = timestamp;

  if (gameState === "PLAYING") {
    balls.forEach((b) => b.update(dt));
    handleCollisions();

    // Check if turn ended and reset striker to baseline
    if (shotTaken && !areBallsMoving()) {
      resetStriker();
      shotTaken = false;
      changePrompt("Striker returned! Position it, then aim your next shot.");
    }
  }

  drawBoard();
  drawTrajectoryAndAngles(ctx);
  balls.forEach((b) => b.draw(ctx));

  requestAnimationFrame(gameLoop);
}

// Game Flow Managers
function startGame() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game-over").classList.add("hidden");
  gameState = "PLAYING";
  initLevel();
}

function endGame(isWin) {
  gameState = "GAMEOVER";
  clearInterval(timerInterval);
  const gameOverScreen = document.getElementById("game-over");
  const title = document.getElementById("end-title");
  const msg = document.getElementById("end-msg");

  gameOverScreen.classList.remove("hidden");
  if (isWin) {
    title.textContent = "Math Master!";
    title.className = "text-3xl font-bold mb-2 text-green-500";
    msg.textContent = `You cleared the board with ${timeLeft} seconds left!`;
  } else {
    title.textContent = "Time's Up!";
    title.className = "text-3xl font-bold mb-2 text-red-500";
    msg.textContent = `You pocketed ${score} coins. Good try!`;
  }
}

// Listeners
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);

// Start Loop
requestAnimationFrame(gameLoop);
