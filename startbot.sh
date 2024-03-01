SCRIPT_DIR="$( cd "$(dirname "$0")" ; pwd -P )"
cd "$SCRIPT_DIR"
npm install
node start.mjs
read -p "Press Enter to exit"