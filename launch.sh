#!/bin/bash
# Launch VN Library in your default browser using Python's built-in server
# Works on macOS and Linux

cd "$(dirname "$0")"

# Find an available port
PORT=8765
while lsof -i:$PORT &>/dev/null; do
  PORT=$((PORT + 1))
done

echo "🌸 Starting VN Library on port $PORT..."

# Start the server in the background
python3 -m http.server $PORT &>/dev/null &
SERVER_PID=$!

# Give the server a moment to start
sleep 0.5

# Open in default browser
open "http://127.0.0.1:$PORT"

echo "✨ VN Library is running at http://127.0.0.1:$PORT"
echo "   Press Ctrl+C to stop."

# Keep running until Ctrl+C
trap "kill $SERVER_PID 2>/dev/null; echo ''; echo 'Goodbye! 🍂'" INT
wait $SERVER_PID
