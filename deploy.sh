#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# =============================================================================
# CONFIGURATION
# =============================================================================

# Parse command line args or prompt
DROPLET_IP="${1:-}"
DOMAIN="${2:-}"
SSH_USER="${3:-root}"

if [ -z "$DROPLET_IP" ]; then
    read -p "Droplet IP address: " DROPLET_IP
fi

if [ -z "$DOMAIN" ]; then
    read -p "Domain name (e.g., game.example.com): " DOMAIN
fi

if [ -z "$DROPLET_IP" ] || [ -z "$DOMAIN" ]; then
    error "Droplet IP and domain are required"
fi

REMOTE="$SSH_USER@$DROPLET_IP"
REMOTE_DIR="/var/www/game"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

log "Deploying to $REMOTE"
log "Domain: $DOMAIN"

# =============================================================================
# 1. TEST SSH CONNECTIVITY
# =============================================================================

log "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE" "echo 'SSH OK'" &>/dev/null; then
    error "Cannot connect to $REMOTE. Check your SSH key and droplet IP."
fi
log "SSH connection successful"

# =============================================================================
# 2. INSTALL CADDY (IDEMPOTENT)
# =============================================================================

log "Checking Caddy installation..."
ssh "$REMOTE" 'command -v caddy &>/dev/null || {
    echo "Installing Caddy..."
    apt-get update -qq
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || true
    curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
    apt-get update -qq
    apt-get install -y -qq caddy
    systemctl enable caddy
    echo "Caddy installed"
}'
log "Caddy ready"

# =============================================================================
# 3. SYNC GAME FILES
# =============================================================================

log "Syncing game files..."
ssh "$REMOTE" "mkdir -p $REMOTE_DIR"
rsync -avz --delete \
    --exclude '.git' \
    --exclude 'deploy.sh' \
    --exclude '*.md' \
    --exclude '.DS_Store' \
    "$SCRIPT_DIR/" "$REMOTE:$REMOTE_DIR/"
log "Files synced to $REMOTE_DIR"

# =============================================================================
# 4. CONFIGURE CADDY (IDEMPOTENT)
# =============================================================================

log "Configuring Caddy..."
CADDYFILE=$(cat <<EOF
$DOMAIN {
    root * $REMOTE_DIR
    file_server
    encode gzip
}
EOF
)

# Only update if changed
ssh "$REMOTE" "
    echo '$CADDYFILE' > /tmp/Caddyfile.new
    if ! cmp -s /tmp/Caddyfile.new /etc/caddy/Caddyfile 2>/dev/null; then
        mv /tmp/Caddyfile.new /etc/caddy/Caddyfile
        echo 'Caddyfile updated'
    else
        rm /tmp/Caddyfile.new
        echo 'Caddyfile unchanged'
    fi
"

# =============================================================================
# 5. RELOAD CADDY
# =============================================================================

log "Reloading Caddy..."
ssh "$REMOTE" "systemctl reload caddy"
log "Caddy reloaded"

# =============================================================================
# DONE
# =============================================================================

echo ""
log "Deployment complete!"
echo -e "  ${GREEN}→${NC} https://$DOMAIN"
echo ""
echo -e "${YELLOW}Note:${NC} Make sure your domain's DNS A record points to $DROPLET_IP"
echo -e "${YELLOW}Note:${NC} First HTTPS request may take a moment while Caddy obtains the SSL certificate"
