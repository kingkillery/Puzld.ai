#!/bin/bash
# init-state.sh - Initialize campaign state directory
# Usage: init-state.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
STATE_DIR="$PLUGIN_ROOT/state"

echo "=== Campaign State Initialization ==="
echo "Plugin root: $PLUGIN_ROOT"
echo "State directory: $STATE_DIR"
echo "====================================="

# Create state directory structure
mkdir -p "$STATE_DIR/campaigns"

# Create .gitignore to exclude state from version control
cat > "$STATE_DIR/.gitignore" << 'EOF'
# Campaign state is local and should not be committed
campaigns/
*.log
*.jsonl
EOF

echo "State directory initialized at: $STATE_DIR"
echo ""
echo "Campaign data will be stored in: $STATE_DIR/campaigns/<campaign-id>/"
echo ""
echo "Structure per campaign:"
echo "  - campaign.json  (campaign metadata)"
echo "  - tasks.json     (task board)"
echo "  - logs/          (session logs)"
