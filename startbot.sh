SCRIPT_DIR="$( cd "$(dirname "$0")" ; pwd -P )"
cd "$SCRIPT_DIR"
npm install -g pnpm
pnpm install
node start.mjs
read -p "Press Enter to exit"