# Angle Striker - Educational Carrom Game

## 🎯 Game Concept

An educational carrom game where kids learn geometry by completing **7 progressive angle challenges**.

### How It Works
1. Player sees an instruction: *"Hit a WHITE coin at an acute angle less than 45°"*
2. **Golden coins glow** - showing which coins match the challenge
3. Player **positions striker** (drag left/right) and **aims** (pull back)
4. If they hit a **correct coin** → Next challenge!
5. If they hit a **wrong coin** → Try again with hints
6. Complete all 7 challenges to win!

---

## 🎮 Challenge Examples

### Challenge 1 (Easy)
**"Hit ANY coin at exactly 45 degrees (±3°)"**
- Valid: Any coin positioned at 42°-48° from striker
- Teaches: Basic diagonal angles

### Challenge 3 (Medium)
**"Hit a WHITE coin at an acute angle (< 90°)"**
- Valid: Only white coins below 90°
- Teaches: Angle types + color recognition

### Challenge 7 (Hard)
**"Hit ANY coin at exactly double 45° (90° ±3°)"**
- Valid: Any coin at 87°-93°
- Teaches: Angle arithmetic

---

## 📋 Implementation Strategy

### ✅ What We're Keeping (Already Works)
- Complete physics engine (collisions, bouncing, friction)
- Beautiful carrom board rendering
- Trajectory prediction with ghost ball
- Input handling (drag positioning, pull-back aiming)
- UI framework (menu, game over, score display)

### ➕ What We're Adding (New Code)
1. **Challenge System** (~50 lines)
   - Array of 7 challenge objects
   - Challenge progression logic
   
2. **Angle Calculator** (~15 lines)
   - Calculates angle from striker to each coin
   - Updates when striker moves

3. **Validation Logic** (~40 lines)
   - Checks if hit coin matches challenge
   - Shows success/error feedback
   
4. **Visual Highlighting** (~30 lines)
   - Golden pulsing glow on valid coins
   - Angle numbers displayed above coins

5. **Game Flow Updates** (~20 lines)
   - Modified startGame() to init challenges
   - Modified collision detection to validate hits
   - Recalculate angles when striker moves

**Total: ~155 lines of new code**

---

## 🔧 Technical Approach

### Angle Calculation
```javascript
const dx = coin.x - striker.x;
const dy = coin.y - striker.y;
let angle = Math.atan2(-dy, dx) * 180 / Math.PI;
if (angle < 0) angle += 360;
coin.angle = angle;
```

### Challenge Validation
```javascript
const challenge = challenges[currentIndex];
const validCoins = balls.filter(ball => 
  !ball.isStriker && 
  ball.active && 
  challenge.validate(ball, ball.angle)
);
```

### Visual Feedback
```javascript
// Golden pulsing ring around valid coins
validCoins.forEach(coin => {
  const pulseSize = 8 + 4 * Math.sin(Date.now() / 300);
  ctx.arc(coin.x, coin.y, coin.radius + pulseSize, 0, Math.PI * 2);
  ctx.strokeStyle = "#fbbf24";
  ctx.stroke();
});
```

---

## 📁 File Structure

```
wonderkids3/
├── index.html          (Change 1 line: score display)
├── script.js           (Add ~155 lines: challenge system)
├── style.css           (No changes needed)
├── IMPLEMENTATION_PLAN.md  (Detailed step-by-step guide)
└── README.md           (This file)
```

---

## 🚀 Implementation Phases

### Phase 1: Setup (Lines 34-80 in script.js)
- Add challenge variables
- Define 7 challenge objects

### Phase 2: Angle System (After Ball class)
- Add `calculateCoinAngles()` function
- Call when striker moves

### Phase 3: Challenge Logic (Lines 300-400)
- Add `startChallenge(index)` function
- Add `checkChallengeSuccess(hitBall)` function

### Phase 4: Collision Hook (In handleCollisions)
- Detect striker-coin hits
- Call validation function

### Phase 5: Visual Feedback (New function)
- Add `drawChallengeHighlights(ctx)` function
- Call in game loop before drawing balls

### Phase 6: UI Updates (index.html line 29)
- Change `Coins: 0/5` to `Challenge: 1/7`

### Phase 7: Game Flow (In startGame)
- Initialize challenge system
- Start challenge #1

### Phase 8: Dynamic Updates (In game loop)
- Recalculate angles when balls stop
- Update valid coins list

---

## 🎨 Coin Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| 🔴 Red | #dc2626 | Queen (center coin) |
| ⚪ White | #f8fafc | 4 white coins |
| ⚫ Black | #1e293b | 4 black coins |
| 🔵 Blue | #2563eb | Striker |

---

## ✨ Key Features

### Educational Value
- ✅ Teaches angle measurement (degrees)
- ✅ Introduces angle types (acute, right, obtuse)
- ✅ Practices angle arithmetic (double 45° = 90°)
- ✅ Develops spatial reasoning
- ✅ Reinforces color recognition

### User Experience
- ✅ Clear visual feedback (golden highlights)
- ✅ Helpful hints on errors
- ✅ Progressive difficulty
- ✅ Immediate validation
- ✅ Satisfying progression

### Technical Excellence
- ✅ Minimal changes to working code
- ✅ No breaking of existing features
- ✅ Clean, maintainable code structure
- ✅ Performance-optimized
- ✅ Mobile-friendly (touch support)

---

## 🧪 Testing Plan

- [ ] Load game - menu appears correctly
- [ ] Click "Play Game" - first challenge displays
- [ ] Valid coins glow golden
- [ ] Striker can be positioned
- [ ] Aiming works (trajectory line shows)
- [ ] Hit correct coin → success message → next challenge
- [ ] Hit wrong coin → error message → retry
- [ ] Angles update when striker moves
- [ ] Challenge counter shows progress (1/7, 2/7, etc.)
- [ ] Complete all 7 challenges → win screen
- [ ] Restart button works

---

## 📊 Expected Results

### Before Implementation
- Simple carrom game with pocketing mechanic
- Limited educational value
- No structured progression

### After Implementation
- 7 structured angle challenges
- Clear learning objectives
- Progressive difficulty curve
- Immediate educational feedback
- Engaging, game-based learning

---

## 🎓 Learning Outcomes

Kids will learn:
1. **Angle Measurement** - Reading degrees (45°, 90°, etc.)
2. **Angle Types** - Acute (< 90°), Right (90°), Obtuse (> 90°)
3. **Angle Arithmetic** - "Double 45° = 90°"
4. **Spatial Reasoning** - Visualizing angles in 2D space
5. **Precision** - Understanding tolerance (±3°)
6. **Color Recognition** - Matching instructions to visuals

---

## 🔮 Future Enhancements

Possible additions after core implementation:
- More challenges (expand to 10-15)
- Difficulty levels (Easy/Medium/Hard)
- Angle range challenges ("between 120° and 150°")
- Multiple coin targets ("Hit 2 white coins in a row")
- Time bonuses for speed
- Star ratings based on accuracy
- Sound effects and animations

---

## 📞 Support

For implementation questions, refer to:
- **IMPLEMENTATION_PLAN.md** - Detailed step-by-step guide with code examples
- Existing comments in script.js
- Console logs for debugging

---

## ⚡ Quick Start

1. Review IMPLEMENTATION_PLAN.md
2. Follow Phases 1-8 in order
3. Test after each phase
4. Don't skip steps!
5. Keep existing code working

**Estimated time:** 90 minutes for full implementation
