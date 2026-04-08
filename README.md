# Math Carrom - Educational Game

## Overview
Math Carrom is an interactive educational game that teaches geometry concepts through carrom gameplay. Players learn about angles (acute, obtuse, right, reflex), complementary and supplementary angles, and angle ranges. Score as many points as you can within 200 seconds!

## Project Structure
```
wonderkids3/
├── index.html          # Main HTML structure
├── style.css           # All styling and responsive design
├── script.js           # Game logic and physics engine
├── README.md           # This documentation file
└── sounds/             # Audio assets folder
    ├── bg_music_n.mp3  # Background music (loops during gameplay)
    ├── congrats.mp3    # Success/congratulations sound
    ├── correct.mp3     # Correct answer feedback
    ├── wrong.mp3       # Wrong answer feedback
    ├── drop2.wav       # Coin pocket sound
    └── hit.wav         # Collision sound (fallback, uses synthetic audio)
```

## Game Workflow

### Initialization Flow
```
Page Load
    ↓
resizeCanvas() → Sets up canvas and board dimensions
    ↓
requestAnimationFrame(gameLoop) → Starts main game loop
    ↓
MENU State (waiting for player to click "Play")
```

### Game Start Flow
```
Player clicks "Play" button
    ↓
startGame()
    ↓
initLevel() → Initializes all game variables
    ↓
spawnCoins() → Creates 9 coins on board
    ↓
startNewChallenge()
    ↓
generateSmartChallenge() → Creates first challenge
    ↓
changePrompt() → Displays challenge instruction
    ↓
updateValidCoins() → Highlights valid target coins
    ↓
PLAYING State (game active)
```

### Shot Execution Flow
```
Player touches/clicks striker
    ↓
startInteraction() → Begins drag detection
    ↓
moveInteraction() → Determines if POSITION or AIM mode
    ↓
    ├─ POSITION mode: striker.x updated (horizontal movement)
    │   └─ updateValidCoins() → Recalculates valid targets
    │
    └─ AIM mode: dragCurrent updated (pull back)
        └─ drawTrajectoryAndAngles() → Shows aim line and angle
    ↓
endInteraction() → Shot fired
    ↓
    ├─ Calculates striker velocity (vx, vy)
    ├─ Calculates lastShotAngle
    └─ Sets shotTaken = true
```

### Physics Loop (During Shot)
```
gameLoop() runs continuously
    ↓
balls.forEach(b => b.update(dt)) → Updates positions
    ↓
handleCollisions()
    ↓
    ├─ Wall collisions → Bounces balls
    ├─ Ball-to-ball collisions
    │   └─ If striker hits coin: evaluateShot(hitCoin)
    └─ Pocket detection
        ├─ Striker in pocket: -10 pts penalty, reset position
        └─ Coin in pocket: coin.active = false, coinsPocketedThisShot++
    ↓
When all balls stop moving:
    ↓
    ├─ If board empty: spawnCoins() → +50 pts → startNewChallenge()
    ├─ If pendingFeedback exists: showFeedbackModal()
    └─ If no coin hit: -10 pts → Check disqualification
```

### Feedback Flow
```
showFeedbackModal()
    ↓
    ├─ If challenge successful:
    │   ├─ +10 pts (correct angle)
    │   ├─ +40 pts per pocketed coin
    │   ├─ Saves angle to challengeHistory[]
    │   └─ Check if playerScore >= 250 (WIN)
    │
    └─ If challenge failed:
        ├─ -10 pts (wrong angle)
        ├─ Check if playerScore <= -30 (DISQUALIFIED)
        └─ Continue playing
    ↓
Player clicks "Continue"
    ↓
resetStriker() → Repositions striker
    ↓
startNewChallenge() → New challenge generated
    ↓
PLAYING State resumes
```

### Game End Flow
```
Win Condition: playerScore >= 250
    OR
Loss Conditions: 
    - timeLeft <= 0
    - playerScore <= -30
    ↓
endGame(isWin, customMsg)
    ↓
GAMEOVER State → Shows results screen
```

---

## Function Reference

### Core Game Functions

#### `resizeCanvas()`
**Purpose:** Adjusts canvas dimensions based on screen size and device pixel ratio.  
**Called by:** Window resize event, initial page load  
**Calls:** None  
**Details:** Calculates boardSize, sets up pockets[], laneGap, and laneLength. Ensures responsive design for mobile and desktop.

#### `gameLoop(timestamp)`
**Purpose:** Main game loop running at 60 FPS using requestAnimationFrame.  
**Called by:** requestAnimationFrame (recursive)  
**Calls:** 
- `balls[].update()`
- `handleCollisions()`
- `drawBoard()`
- `drawChallengeHighlights()`
- `balls[].draw()`
- `drawTrajectoryAndAngles()`
- `showFeedbackModal()` (conditionally)
- `spawnCoins()` (conditionally)
- `startNewChallenge()` (conditionally)
- `endGame()` (conditionally)

**Details:** Handles all game state updates, physics calculations, and rendering. Detects when balls stop moving to trigger feedback.

#### `startGame()`
**Purpose:** Initializes a new game session.  
**Called by:** "Play" and "Play Again" button clicks  
**Calls:** 
- `initLevel()`
- `startNewChallenge()`

**Details:** Hides menu/game-over screens, sets gameState to "PLAYING".

#### `initLevel()`
**Purpose:** Resets all game variables to starting state.  
**Called by:** `startGame()`  
**Calls:** 
- `spawnCoins()`
- `updateScoreUI()`

**Details:** Creates striker object, initializes score/timer, starts countdown timer interval. Resets balls array and challenge history.

#### `endGame(isWin, customMsg = null)`
**Purpose:** Displays game over screen with results.  
**Called by:** Various conditions (timer end, win condition, disqualification)  
**Calls:** None  
**Details:** Shows appropriate victory/defeat message. Sets gameState to "GAMEOVER" and stops timer.

---

### Challenge System

#### `generateSmartChallenge()`
**Purpose:** Creates dynamic, physically-solvable math challenges.  
**Called by:** `startNewChallenge()`  
**Calls:** None  
**Returns:** Challenge object with `{instruction, validate()}` properties  
**Details:** 
- Picks a random active coin
- Calculates angle from striker to coin
- Generates 8-12 possible challenge types based on coin position:
  - **Vocabulary Rules:** Acute (<90°), Right (90°±4°), Obtuse (>90°), Reflex (>180°)
  - **Range Rules:** Between X° and Y°, Less than X°, Greater than Y°
  - **Complementary:** Current angle + last angle = 90° (±5°)
  - **Supplementary:** Current angle + last angle = 180° (±5°)
- Returns one randomly selected rule from valid options

#### `startNewChallenge()`
**Purpose:** Initiates a new challenge round.  
**Called by:** Game start, after feedback modal closes, board clear  
**Calls:** 
- `generateSmartChallenge()`
- `changePrompt()`
- `updateValidCoins()`

**Details:** Generates new challenge and updates UI with instruction.

#### `updateValidCoins()`
**Purpose:** Identifies which coins satisfy the current challenge.  
**Called by:** `startNewChallenge()`, striker position changes  
**Calls:** 
- `calculateCoinAngles()`

**Details:** Populates validCoins[] array using challenge.validate() function. Used for visual highlighting.

#### `calculateCoinAngles()`
**Purpose:** Calculates angles from striker to all active coins.  
**Called by:** `updateValidCoins()`  
**Returns:** Array of `{ball, angle}` objects  
**Details:** Uses Math.atan2() to compute angles in degrees (0-360°).

#### `evaluateShot(hitBall)`
**Purpose:** Checks if shot angle satisfies current challenge.  
**Called by:** `handleCollisions()` when striker hits a coin  
**Calls:** `challenge.validate(hitBall, lastShotAngle)`  
**Details:** Creates pendingFeedback object with isSuccess, angle, and challenge data.

#### `showFeedbackModal()`
**Purpose:** Displays feedback after shot completes.  
**Called by:** `gameLoop()` when balls stop moving and pendingFeedback exists  
**Calls:** 
- `updateScoreUI()`
- `resetStriker()` (via button onclick)
- `startNewChallenge()` (via button onclick)
- `endGame()` (conditionally)

**Details:** Shows success/failure message, updates score, checks win/loss conditions. Awards +10 pts for correct angles, +40 pts per pocketed coin. Penalizes -10 pts for wrong angles or missed shots.

---

### Game State Management

#### `changePrompt(msg)`
**Purpose:** Updates the instruction banner with animation.  
**Called by:** Various functions to display instructions  
**Details:** Resets CSS animation by removing and re-adding it (forces bounceIn animation to replay).

#### `updateScoreUI()`
**Purpose:** Updates the score display element.  
**Called by:** Any function that modifies playerScore  
**Details:** Simple DOM update of `playerScoreEl.textContent`.

---

### Physics & Collision Detection

#### `Ball.update(dt)`
**Purpose:** Updates ball position and applies friction.  
**Called by:** `gameLoop()` for each ball  
**Details:** Moves ball based on velocity, applies 2.8% friction per frame. Stops movement when velocity < 0.1.

#### `handleCollisions()`
**Purpose:** Detects and resolves all collisions.  
**Called by:** `gameLoop()` during PLAYING state  
**Calls:** 
- `evaluateShot()` (when striker hits coin)
- `updateScoreUI()` (on scratches/penalties)
- `endGame()` (if disqualified by scratches)

**Details:** Handles three collision types:
1. **Wall collisions:** Bounces balls off boundaries
2. **Ball-to-ball:** Elastic collision with momentum transfer
3. **Pocket detection:** Removes coins or penalizes striker

---

### Coin Management

#### `spawnCoins()`
**Purpose:** Creates 9 coins in carrom formation.  
**Called by:** `initLevel()`, board clear detection in `gameLoop()`  
**Details:** Places 1 red "queen" in center, 8 alternating white/black coins in octagon formation. Preserves striker in balls array.

#### `resetStriker()`
**Purpose:** Returns striker to starting position.  
**Called by:** After feedback modal closes, during penalties  
**Calls:** `updateValidCoins()`  
**Details:** Resets striker to center baseline, clears velocity, sets active=true.

---

### Input Handling

#### `startInteraction(e)`
**Purpose:** Begins touch/mouse interaction with striker.  
**Called by:** mousedown/touchstart events on canvas  
**Calls:** `getMousePos()`  
**Details:** Checks if click is within 3x striker radius. Sets isInteracting=true and records dragStart position.

#### `moveInteraction(e)`
**Purpose:** Tracks drag movement and determines interaction mode.  
**Called by:** mousemove/touchmove window events  
**Calls:** 
- `getMousePos()`
- `updateValidCoins()` (in POSITION mode)

**Details:** Distinguishes between horizontal drag (POSITION mode - moves striker left/right) and vertical drag (AIM mode - pulls back to shoot). Updates dragCurrent continuously.

#### `endInteraction(e)`
**Purpose:** Fires the striker when drag ends.  
**Called by:** mouseup/touchend window events  
**Details:** 
- In AIM mode: Calculates striker velocity from drag distance
- Caps maximum speed at 60
- Calculates lastShotAngle for evaluation
- Sets shotTaken=true to trigger physics

#### `getMousePos(e)`
**Purpose:** Converts screen coordinates to canvas coordinates.  
**Called by:** All interaction handlers  
**Returns:** `{x, y}` in canvas space  
**Details:** Accounts for canvas borders, scaling, and device pixel ratio. Handles both mouse and touch events.

#### `isStrikerMoving()`
**Purpose:** Checks if striker is currently in motion.  
**Called by:** `startInteraction()`  
**Returns:** Boolean  
**Details:** Prevents new shots while striker is moving (velocity > 0.1).

---

### Visual Rendering

#### `drawBoard()`
**Purpose:** Renders the carrom board background.  
**Called by:** `gameLoop()` every frame  
**Calls:** `drawCapsuleLane()` (internal helper)  
**Details:** Draws center circles, four striker lanes, pockets, and decorative lines.

#### `Ball.draw(ctx)`
**Purpose:** Renders a single ball with shadow and styling.  
**Called by:** `gameLoop()` for each ball  
**Details:** Striker has crosshair design; coins have glossy highlight effect.

#### `drawChallengeHighlights(ctx)`
**Purpose:** Pulses golden rings around valid target coins.  
**Called by:** `gameLoop()` during PLAYING state  
**Details:** Uses sine wave for pulsing animation, only highlights coins in validCoins[].

#### `drawTrajectoryAndAngles(ctx)`
**Purpose:** Shows aim prediction line, angle arc, and collision preview.  
**Called by:** `gameLoop()` during AIM interaction mode  
**Calls:** 
- `findFirstCoinOnTrajectory()`
- `getWallRayDistance()` (inline logic)

**Details:** 
- Draws horizontal reference line and angle arc
- Shows dashed trajectory line to first collision point
- Displays angle in degrees
- Previews post-collision trajectories for striker and hit coin
- Shows predicted coin deflection angle (θx)

---

### Helper Functions

#### `findFirstCoinOnTrajectory(originX, originY, dirX, dirY, maxDistance)`
**Purpose:** Ray-casts to find first coin along shot trajectory.  
**Called by:** `drawTrajectoryAndAngles()`  
**Returns:** Object with `{ball, t, hitX, hitY, normalX, normalY}` or null  
**Details:** Uses geometric ray-sphere intersection. Returns collision point and surface normal for physics calculations.

#### `getWallRayDistance(originX, originY, dirX, dirY, movingRadius)`
**Purpose:** Calculates distance to nearest wall along a direction.  
**Called by:** `drawTrajectoryAndAngles()` (inline)  
**Returns:** Distance value  
**Details:** Checks all four walls, accounts for ball radius.

---

## Key Game Mechanics

### Scoring System
- **+10 points:** Hitting a coin with correct angle
- **+40 points:** Pocketing a coin with correct angle
- **+50 points:** Clearing all coins from board (triggers respawn)
- **-10 points:** Wrong angle, missing all coins, or striker scratch
- **Disqualification:** Score drops to ≤ -30
- **Coin Respawn:** Coins pocketed with wrong angle respawn at center

### Win/Loss Conditions
- **Congratulations:** Score > 0 when time expires (200 seconds)
- **Better Luck:** Score ≤ 0 when time expires
- **Disqualification:** Score drops to ≤ -30 during gameplay

### Challenge Types
1. **Angle Vocabulary:** Acute, Right, Obtuse, Reflex angles
2. **Range Challenges:** Shoot between X° and Y°
3. **Inequality Challenges:** Greater than or less than specific angles
4. **Complementary:** Sum with last shot = 90°
5. **Supplementary:** Sum with last shot = 180°
6. **Color Targeting:** Hit specific color with specific angle type

### Physics Details
- **Friction:** 2.8% velocity reduction per frame
- **Collision:** Elastic collisions with 85% energy retention
- **Mass ratio:** Striker mass = 3, Coin mass = 1
- **Maximum striker speed:** 40 units/frame (reduced for kid-friendly gameplay)
- **Power limiter:** 0.15 multiplier (controls shot strength)

---

## Event Flow Summary

```
Window Resize → resizeCanvas()
"Play" Button → startGame() → initLevel() → startNewChallenge()
Canvas Touch → startInteraction() → moveInteraction() → endInteraction()
Each Frame → gameLoop() → update() → handleCollisions() → draw()
Collision Detected → evaluateShot() → pendingFeedback set
Balls Stop → showFeedbackModal() → User clicks Continue → resetStriker() → startNewChallenge()
Win/Loss → endGame() → GAMEOVER State
```

---

## Technical Details

### Game States
- **MENU:** Initial screen, waiting to start
- **PLAYING:** Active gameplay
- **FEEDBACK:** Modal showing shot results
- **GAMEOVER:** Final results screen

### Global Variables
- `gameState`: Current game state
- `playerScore`: Player's current score
- `timeLeft`: Remaining seconds
- `balls[]`: Array of all game objects (striker + coins)
- `striker`: Reference to player's striker ball
- `pockets[]`: Four corner pocket positions
- `currentChallenge`: Active challenge object
- `validCoins[]`: Coins that satisfy current challenge
- `challengeHistory[]`: Record of successful shot angles

### Canvas Setup
- Responsive sizing (280px - 760px)
- Device pixel ratio scaling for crisp rendering
- 1:1 aspect ratio (square board)

---

## Audio System

### Audio Features
The game includes a comprehensive audio system for enhanced user experience:

1. **Collision Sounds** (Synthetic Web Audio API)
   - Zero-latency hit sounds using oscillator synthesis
   - Plays on: striker-coin, coin-coin, striker-wall, coin-wall collisions
   - Uses dual-tone sine wave (1000Hz → 200Hz, 25ms duration)
   - Smart collision tracking prevents sound spam during continuous contact

2. **Feedback Sounds** (from `sounds/` folder)
   - `correct.mp3` - Plays when angle challenge is solved correctly
   - `wrong.mp3` - Plays on wrong angle or missed shot
   - `congrats.mp3` - Plays when coin successfully pocketed
   - `drop2.wav` - Plays when coin falls into pocket

3. **Background Music**
   - `bg_music_n.mp3` - Loops during gameplay at 30% volume
   - Starts when "Play" button clicked
   - Stops on game over

### Audio Implementation
- **Web Audio API** for synthetic collision sounds (instant playback)
- **HTML5 Audio** with cloning for overlapping sound effects
- **AudioContext.resume()** called to prevent browser suspension
- Audio files loaded with preload="auto" for minimal latency

---

## Kid-Friendly Features

### 8-Second Hint System
- Game waits for 8 seconds after challenge starts
- No immediate highlighting to encourage independent thinking
- After 8 seconds of inactivity:
  - Valid coins get highlighted with golden pulses
  - Prompt updates to "💡 Hint: Try hitting the highlighted coins!"
- Resets on shot taken or new challenge

### Responsive Design
- **Desktop:** Clear spacing, larger text, 88px top margin
- **Mobile:** Compact layout, smaller fonts (0.7rem), 90px top margin
- **Notification bar:** Full-width on mobile, proper vertical spacing
- **Canvas positioning:** Dynamic margins to prevent UI overlap

### Smart Coin Pockets
- **Correct angle + pocket:** Coin removed permanently, congrats sound plays
- **Wrong angle + pocket:** Coin respawns at center, wrong sound plays
- Prevents frustration from accidental pockets

---

## Browser Compatibility
- Requires Canvas 2D API
- Web Audio API for sound synthesis
- Touch and mouse input supported
- Responsive design for mobile and desktop
- Uses modern ES6 JavaScript features

---

## Educational Value
This game teaches:
- **Angle measurement** and the unit circle (0-360°)
- **Angle types:** Acute, right, obtuse, reflex
- **Complementary angles** (sum to 90°)
- **Supplementary angles** (sum to 180°)
- **Inequalities** and range comparisons
- **Trajectory prediction** and physics intuition
- **Independent problem-solving** with scaffolded hints

---

## How to Run
1. Open `index.html` in a modern web browser
2. Click "Play" to start the game
3. Background music begins playing
4. Drag the striker to aim and shoot at the highlighted coins
5. Score points by following the angle instructions
6. Try to maximize your score within 200 seconds!
