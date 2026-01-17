# Resume Blastroid

An interactive portfolio site built as an Asteroids-style game using p5.js.

## Play

Navigate your ship through space and shoot asteroids to reveal portals to different sections of the portfolio (Work, About, Resume).

### Controls

- **Arrow Keys** - Rotate and thrust
- **Spacebar** - Fire
- **Double-tap UP** - Activate Surge Mode (when Boost powerup is active)

### Powerups

Shoot the floating powerup orbs to collect them:

- **Homing** (Green) - Bullets track nearby asteroids
- **Spread** (Orange) - Fire multiple bullets at once
- **Beam** (Purple) - Continuous laser beam
- **Boost** (Cyan) - Enhanced thrust with special abilities

Each powerup has 3 tiers with escalating effects.

## Development

Open `index.html` in a browser, or run a local server:

```bash
python3 server.py
```

Then visit `http://localhost:8000`

## Deployment

### Manual Deploy

```bash
./deploy.sh <DROPLET_IP> <DOMAIN>
```

### Auto-Deploy (GitHub Actions)

Pushes to `master` automatically deploy to the server.

Required GitHub Secrets:
- `DROPLET_IP` - Server IP address
- `SSH_PRIVATE_KEY` - Deploy key (see below)
- `DOMAIN` - Your domain name

#### Setup Deploy Key

```bash
# Generate key pair
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "github-actions-deploy" -N ""

# Add public key to server
ssh-copy-id -i ~/.ssh/deploy_key.pub root@YOUR_DROPLET_IP

# Copy private key to GitHub Secrets
cat ~/.ssh/deploy_key
```

## Project Structure

```
├── index.html          # Entry point
├── css/styles.css      # Styles for overlays
├── js/
│   ├── sketch.js       # p5.js setup
│   ├── Game.js         # Main game logic
│   ├── Ship.js         # Player ship
│   ├── Asteroid.js     # Asteroids
│   ├── Bullet.js       # Projectiles
│   ├── Powerup.js      # Powerup orbs
│   ├── PowerupDrop.js  # Collected powerups
│   ├── Echo.js         # Boost III projectile
│   ├── CollisionManager.js
│   ├── ParticleSystem.js
│   ├── UIRenderer.js
│   ├── Palette.js      # Color definitions
│   ├── Shapes.js       # Game constants
│   └── sections/       # Portfolio content
│       ├── WorkSection.js
│       ├── AboutSection.js
│       └── ResumeSection.js
├── deploy.sh           # Manual deployment script
└── .github/workflows/  # CI/CD
    └── deploy.yml
```
