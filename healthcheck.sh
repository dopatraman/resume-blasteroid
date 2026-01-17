#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

URL="https://prakashvenkat.com"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}                    RESUME BLASTROID HEALTHCHECK${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GRAY}Checking: ${WHITE}$URL${NC}"
echo ""

# Perform health check
RESPONSE=$(curl -s -o /tmp/healthcheck.html -w "%{http_code}" --connect-timeout 10 "$URL" 2>/dev/null)
CONTENT=$(cat /tmp/healthcheck.html 2>/dev/null)

# Check for success: HTTP 200 + p5.js loaded + game scripts present
if [[ "$RESPONSE" == "200" ]] && \
   [[ "$CONTENT" == *"p5.js"* || "$CONTENT" == *"p5.min.js"* ]] && \
   [[ "$CONTENT" == *"Game.js"* ]] && \
   [[ "$CONTENT" == *"Ship.js"* ]]; then

    # SUCCESS - Bright yellow sun over mountain and lake
    echo -e "${YELLOW}                        \\       /${NC}"
    echo -e "${YELLOW}                         \\ | | /${NC}"
    echo -e "${YELLOW}                       '-.;;;.-'${NC}"
    echo -e "${YELLOW}                      -==;;;;;==-${NC}"
    echo -e "${YELLOW}                       .-';;;'-.${NC}"
    echo -e "${YELLOW}                         / | | \\${NC}"
    echo -e "${YELLOW}                        /       \\${NC}"
    echo ""
    echo -e "${WHITE}                            /\\${NC}"
    echo -e "${WHITE}                           /  \\${NC}"
    echo -e "${WHITE}                          / ** \\${NC}"
    echo -e "${GRAY}                         /      \\${NC}"
    echo -e "${GRAY}                        /   /\\   \\${NC}"
    echo -e "${GRAY}                       /   /  \\   \\${NC}"
    echo -e "${GRAY}                      /   /    \\   \\${NC}"
    echo -e "${GRAY}                     /___/______\\___\\${NC}"
    echo -e "${CYAN}                ~~~~/________________\\~~~~${NC}"
    echo -e "${CYAN}             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo -e "${BLUE}          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo -e "${BLUE}        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}                      ✓ HEALTHCHECK PASSED${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${WHITE}HTTP Status:${NC}  ${GREEN}$RESPONSE${NC}"
    echo -e "  ${WHITE}p5.js:${NC}        ${GREEN}✓ Loaded${NC}"
    echo -e "  ${WHITE}Game.js:${NC}      ${GREEN}✓ Found${NC}"
    echo -e "  ${WHITE}Ship.js:${NC}      ${GREEN}✓ Found${NC}"
    echo ""
    exit 0

else
    # FAILURE - Sad blue moon over mountain and lake
    echo -e "${BLUE}                          _..._${NC}"
    echo -e "${BLUE}                        .:::::::.${NC}"
    echo -e "${BLUE}                       :::::::::::${NC}"
    echo -e "${BLUE}                       :::::::::::${NC}"
    echo -e "${BLUE}                       '::::::::::${NC}"
    echo -e "${BLUE}                         ':::::::'${NC}"
    echo -e "${BLUE}                           '::::'${NC}"
    echo ""
    echo -e "${GRAY}                            /\\${NC}"
    echo -e "${GRAY}                           /  \\${NC}"
    echo -e "${GRAY}                          / ** \\${NC}"
    echo -e "${GRAY}                         /      \\${NC}"
    echo -e "${GRAY}                        /   /\\   \\${NC}"
    echo -e "${GRAY}                       /   /  \\   \\${NC}"
    echo -e "${GRAY}                      /   /    \\   \\${NC}"
    echo -e "${GRAY}                     /___/______\\___\\${NC}"
    echo -e "${GRAY}                ~~~~/________________\\~~~~${NC}"
    echo -e "${GRAY}             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo -e "${GRAY}          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo -e "${GRAY}        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}                      ✗ HEALTHCHECK FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Diagnose the failure
    if [[ "$RESPONSE" == "000" ]]; then
        echo -e "  ${WHITE}HTTP Status:${NC}  ${RED}Connection failed (DNS not propagated?)${NC}"
    else
        echo -e "  ${WHITE}HTTP Status:${NC}  ${RED}$RESPONSE${NC}"
    fi

    if [[ "$CONTENT" == *"p5.js"* || "$CONTENT" == *"p5.min.js"* ]]; then
        echo -e "  ${WHITE}p5.js:${NC}        ${GREEN}✓ Loaded${NC}"
    else
        echo -e "  ${WHITE}p5.js:${NC}        ${RED}✗ Not found${NC}"
    fi

    if [[ "$CONTENT" == *"Game.js"* ]]; then
        echo -e "  ${WHITE}Game.js:${NC}      ${GREEN}✓ Found${NC}"
    else
        echo -e "  ${WHITE}Game.js:${NC}      ${RED}✗ Not found${NC}"
    fi

    if [[ "$CONTENT" == *"Ship.js"* ]]; then
        echo -e "  ${WHITE}Ship.js:${NC}      ${GREEN}✓ Found${NC}"
    else
        echo -e "  ${WHITE}Ship.js:${NC}      ${RED}✗ Not found${NC}"
    fi
    echo ""
    exit 1
fi
