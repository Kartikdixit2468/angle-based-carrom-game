# Angle Challenge Game - Implementation Plan

## Project Overview
Transform the existing carrom game into an **angle-based challenge system** where kids complete 7-8 instructional challenges to learn geometry concepts.

---

## Current Codebase Analysis

### ✅ What's Already Working
1. **Complete Physics Engine**
   - Ball-to-ball collisions with proper momentum transfer
   - Wall bounce physics
   - Friction and damping
   - Pocket detection

2. **Visual Systems**
   - Beautiful carrom board rendering
   - Striker and coin drawing with shadows
   - Trajectory prediction with ghost ball
   - Angle measurement and display

3. **Input Handling**
   - Mouse/touch drag for positioning
   - Pull-back aiming mechanic
   - Power control

4. **UI Framework**
   - Menu system
   - Game over screen
   - Score and timer display
   - Prompt messaging system

### 🎯 What Needs to Be Added
- Challenge generation system
- Angle calculation from striker to each coin
- Coin highlighting for valid targets
- Challenge validation logic
- Progressive difficulty system

---

## Game Flow Design

### Current Flow
```
MENU → PLAYING → GAMEOVER
```

### New Flow
```
MENU → CHALLENGE_1 → CHALLENGE_2 → ... → CHALLENGE_7 → WIN_SCREEN
```

---

## Challenge System Architecture

### 1. Challenge Structure
```javascript
{
  id: 1,
  instruction: "Hit the WHITE coin at an acute angle less than 45°",
  validate: (hitCoin, angle) => {
    return hitCoin.color === "#f8fafc" && angle < 45 && angle > 5;
  },
  hint: "Look for white coins positioned close to the horizontal"
}
```

### 2. Challenge Categories

#### **Level 1: Basic Angles (Challenges 1-3)**
- "Hit ANY coin at exactly 45 degrees (±3°)"
- "Hit a coin at a right angle (90° ±3°)"  
- "Hit the RED coin at any acute angle (< 90°)"

#### **Level 2: Angle Ranges (Challenges 4-5)**
- "Hit a WHITE coin between 60° and 80°"
- "Hit a BLACK coin at an obtuse angle (> 90° and < 120°)"

#### **Level 3: Advanced (Challenges 6-7)**
- "Hit a coin at an angle greater than 135°"
- "Hit the RED coin at exactly double 45° (90° ±3°)"

### 3. Coin Colors in Game
From the codebase:
- **RED (#dc2626)** - Queen (center coin)
- **WHITE (#f8fafc)** - 4 white coins
- **BLACK (#1e293b)** - 4 black coins
- **BLUE (#2563eb)** - Striker

---

## Implementation Steps

### Phase 1: Add Challenge System Variables
**File:** `script.js` (after line 33)
```javascript
// Challenge System
let currentChallengeIndex = 0;
let validCoins = [];
let challengeHistory = [];

const challenges = [
  // Array of 7 challenge objects
];
```

### Phase 2: Add Angle Calculation Function
**Location:** After Ball class definition
```javascript
function calculateCoinAngles() {
  balls.forEach(ball => {
    if (!ball.isStriker && ball.active) {
      const dx = ball.x - striker.x;
      const dy = ball.y - striker.y;
      let angle = Math.atan2(-dy, dx) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      ball.angle = angle;
    }
  });
}
```

### Phase 3: Create Challenge Management Functions
```javascript
function startChallenge(index) {
  currentChallengeIndex = index;
  const challenge = challenges[index];
  
  // Calculate angles
  calculateCoinAngles();
  
  // Find valid coins
  validCoins = balls.filter(ball => 
    !ball.isStriker && 
    ball.active && 
    challenge.validate(ball, ball.angle)
  );
  
  // Update UI
  changePrompt(challenge.instruction);
  updateChallengeDisplay();
}

function checkChallengeSuccess(hitBall) {
  const challenge = challenges[currentChallengeIndex];
  
  if (validCoins.includes(hitBall)) {
    // Success!
    challengeHistory.push({
      challenge: currentChallengeIndex,
      success: true,
      angle: Math.round(hitBall.angle)
    });
    
    score++;
    
    if (currentChallengeIndex < challenges.length - 1) {
      // Next challenge
      setTimeout(() => {
        resetStriker();
        startChallenge(currentChallengeIndex + 1);
      }, 2000);
    } else {
      // All challenges complete!
      endGame(true);
    }
    
    return true;
  } else {
    // Wrong coin
    changePrompt(`❌ Wrong! That was ${Math.round(hitBall.angle)}°. ${challenge.hint}`);
    setTimeout(() => {
      changePrompt(challenge.instruction);
      resetStriker();
    }, 3000);
    
    return false;
  }
}
```

### Phase 4: Modify Collision Detection
**Location:** In `handleCollisions()` function, after ball-to-ball collision
```javascript
// After collision detection, check if striker hit a coin
if (b1.isStriker && !b2.isStriker && gameState === "PLAYING") {
  // Striker hit a coin - check if it matches challenge
  const hitSpeed = Math.hypot(b1.vx + b2.vx, b1.vy + b2.vy);
  if (hitSpeed > 2) { // Only count solid hits
    checkChallengeSuccess(b2);
  }
}
```

### Phase 5: Visual Highlighting System
**Location:** New function to draw highlights
```javascript
function drawChallengeHighlights(ctx) {
  if (gameState !== "PLAYING") return;
  
  validCoins.forEach(coin => {
    if (!coin.active) return;
    
    // Pulsing golden ring
    const pulseSize = 8 + 4 * Math.sin(Date.now() / 300);
    
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.radius + pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Angle label
    ctx.fillStyle = "#000";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(coin.angle)}°`, coin.x, coin.y - coin.radius - 20);
  });
}
```

**Call in game loop before drawing balls:**
```javascript
drawChallengeHighlights(ctx);
balls.forEach(b => b.draw(ctx));
```

### Phase 6: Update UI Elements
**HTML Changes:**
1. Change score display to show challenge progress:
   ```html
   Challenge: <span id="score-display">1/7</span>
   ```

2. Make prompt area more prominent for instructions

**No other HTML changes needed** - use existing structure!

### Phase 7: Modify Game Start
**In `startGame()` function:**
```javascript
function startGame() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game-over").classList.add("hidden");
  
  resizeCanvas();
  initLevel();
  
  // Start challenge system
  currentChallengeIndex = 0;
  score = 0;
  challengeHistory = [];
  validCoins = [];
  
  gameState = "PLAYING";
  startTimer();
  startChallenge(0); // Start first challenge
  
  requestAnimationFrame(gameLoop);
}
```

### Phase 8: Update Striker Position Tracking
**Add to game loop when balls stop moving:**
```javascript
if (!areBallsMoving() && gameState === "PLAYING") {
  calculateCoinAngles(); // Recalculate when striker moves
  
  // Update valid coins for current challenge
  const challenge = challenges[currentChallengeIndex];
  validCoins = balls.filter(ball => 
    !ball.isStriker && 
    ball.active && 
    challenge.validate(ball, ball.angle)
  );
}
```

---

## Challenge Definitions

```javascript
const challenges = [
  // Challenge 1: Easy starter
  {
    id: 1,
    instruction: "🎯 Hit ANY coin at exactly 45 degrees (±3°)",
    hint: "Look for coins on the diagonal",
    validate: (ball, angle) => Math.abs(angle - 45) < 3
  },
  
  // Challenge 2: Right angle
  {
    id: 2,
    instruction: "📐 Hit ANY coin at a right angle (90° ±3°)",
    hint: "Look for coins directly above the striker",
    validate: (ball, angle) => Math.abs(angle - 90) < 3
  },
  
  // Challenge 3: Color + angle type
  {
    id: 3,
    instruction: "⚪ Hit a WHITE coin at an acute angle (< 90°)",
    hint: "Acute means less than 90 degrees",
    validate: (ball, angle) => ball.color === "#f8fafc" && angle < 90 && angle > 5
  },
  
  // Challenge 4: Range challenge
  {
    id: 4,
    instruction: "🎲 Hit ANY coin between 60° and 80°",
    hint: "Find a coin in this moderate angle range",
    validate: (ball, angle) => angle >= 60 && angle <= 80
  },
  
  // Challenge 5: Color + obtuse
  {
    id: 5,
    instruction: "⚫ Hit a BLACK coin at an obtuse angle (90° to 120°)",
    hint: "Obtuse means more than 90° but less than 180°",
    validate: (ball, angle) => ball.color === "#1e293b" && angle > 90 && angle <= 120
  },
  
  // Challenge 6: Specific color
  {
    id: 6,
    instruction: "🔴 Hit the RED coin at any angle",
    hint: "The red coin is the queen in the center",
    validate: (ball, angle) => ball.color === "#dc2626"
  },
  
  // Challenge 7: Final challenge
  {
    id: 7,
    instruction: "⭐ Hit ANY coin at exactly double 45° (90° ±3°)",
    hint: "Double of 45° equals 90°",
    validate: (ball, angle) => Math.abs(angle - 90) < 3
  }
];
```

---

## Testing Checklist

- [ ] Angles calculate correctly when striker moves
- [ ] Valid coins highlight with golden pulse
- [ ] Wrong coin shows error message with actual angle
- [ ] Correct coin advances to next challenge
- [ ] Challenge counter updates (1/7, 2/7, etc.)
- [ ] Final challenge shows win screen
- [ ] Striker resets to center after each challenge
- [ ] Timer counts down correctly
- [ ] Restart button works properly

---

## Key Benefits of This Approach

1. **Minimal Code Changes** - Only adding new functions, not breaking existing code
2. **Uses Existing Systems** - Leverages working physics, rendering, input handling
3. **Progressive Difficulty** - Starts simple, adds constraints gradually
4. **Educational Value** - Teaches angle types, color recognition, precision
5. **Visual Feedback** - Golden highlights show valid targets clearly
6. **Rewarding** - Each success feels like an achievement

---

## Files to Modify

1. **script.js** - Add ~150 lines of new code (challenge system)
2. **index.html** - Change 1 line (score display format)
3. **style.css** - No changes needed!

---

## Estimated Implementation Time

- Challenge system setup: 30 minutes
- Angle calculation: 15 minutes
- Highlighting system: 20 minutes
- Testing & polish: 25 minutes

**Total: ~90 minutes** for a complete working game

---

## Next Steps

1. **Review this plan** - Make sure logic is sound
2. **Implement in order** - Follow phases 1-8 sequentially
3. **Test after each phase** - Ensure nothing breaks
4. **Polish** - Add smooth transitions and feedback

