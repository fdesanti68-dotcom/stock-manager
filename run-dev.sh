#!/bin/bash
# Script to run the development server with the correct Node version

NODE_BIN="/home/fsanti/.config/nvm/versions/node/v24.11.0/bin/node"

if [ ! -f "$NODE_BIN" ]; then
    echo "Node.js v24.11.0 not found. Using system node."
    npm start
else
    echo "Using Node.js v24.11.0"
    $NODE_BIN node_modules/@angular/cli/bin/ng serve --port 4300
fi
