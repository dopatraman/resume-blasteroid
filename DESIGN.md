# Void Neon

A retro-futuristic terminal aesthetic combining deep void backgrounds with high-contrast neon accents.

---

## Philosophy

- **Minimal chrome** — No gradients, shadows, or decorative elements
- **Content-forward** — The game objects and data are the visual focus
- **Color as language** — State and meaning communicated through color alone
- **Terminal heritage** — Monospace typography, dark backgrounds, glowing elements

---

## Color Palette

### Core Tokens

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Void** | `#0a0a0a` | `10, 10, 10` | Background, negative space |
| **Neon Lime** | `#ADFF2F` | `173, 255, 47` | Primary accent, ship, headings |
| **Ember** | `#FF6B35` | `255, 107, 53` | Work category, thrust flame |
| **Aqua** | `#4ECDC4` | `78, 205, 196` | About category, secondary accent |
| **Sol** | `#FFE66D` | `255, 230, 109` | Resume category, warnings |
| **Slate** | `#888888` | `136, 136, 136` | Neutral elements, muted text |
| **Pure** | `#FFFFFF` | `255, 255, 255` | Bullets, primary text |

### State Colors

| State | Hex | Usage |
|-------|-----|-------|
| Success | `#4CAF50` | Passed tests, confirmations |
| Failure | `#f44336` | Failed tests, errors |
| Warning | `#FFE66D` | Running state, cautions |
| Pending | `#666666` | Inactive, queued items |

### Borders & Separators

| Element | Hex |
|---------|-----|
| Subtle border | `#333333` |
| Container background | `#111111` |

---

## Typography

### Font Stack
```css
font-family: 'Courier New', monospace;
```

### Treatment
- **Headers**: Uppercase, `letter-spacing: 2px`, 14-16px
- **Body**: Sentence case, 12-13px
- **Labels**: Uppercase, game objects use type labels (WORK, ABOUT, RESUME)

### Hierarchy
Minimal — rely on color and weight rather than size variation.

---

## Visual Principles

### Spacing
- Consistent padding: `20px` for panels
- Element gaps: `10-15px`
- Border radius: `4px` for containers

### Containers
- Dark fill (`#111`) with subtle border (`#333`)
- No shadows or elevation
- Rounded corners (`4px`)

### State Communication
Color alone indicates state — no icons required for status:
- Green text = success
- Red text = failure
- Yellow text = in progress
- Gray text = inactive

### Motion
- Minimal transitions (`0.3s ease`)
- Game elements move fluidly; UI elements stay static
- Progress bars animate smoothly

---

## Application

### Game UI
- Ship rendered in **Neon Lime** (`#ADFF2F`)
- Asteroids colored by category (Ember, Aqua, Sol, Slate)
- Bullets in **Pure** white with glow halos
- Background is solid **Void** (`#0a0a0a`)

### Test Runner
Extends the game's language to developer tooling:
- Split panel: canvas (left) + reporter (right)
- Suite names in **Aqua**
- Pass/fail in Success/Failure colors
- Progress bar matches game's neon palette

### Code Reference
Color definitions live in `js/Palette.js`:
```javascript
const PALETTE = {
  background: '#0a0a0a',
  ship: '#ADFF2F',
  shipThrust: '#FF6B35',
  asteroids: {
    work: '#FF6B35',
    about: '#4ECDC4',
    resume: '#FFE66D',
    neutral: '#888888'
  },
  bullet: '#FFFFFF',
  text: '#FFFFFF',
  textDim: '#666666'
};
```

---

## Inspirations

- Classic arcade games (Asteroids, Tempest)
- Terminal/CLI interfaces
- Synthwave and retrowave aesthetics
- Tron Legacy UI design
