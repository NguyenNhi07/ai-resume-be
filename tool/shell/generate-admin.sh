#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

if [ -d "./src" ]; then
  node -r ts-node/register tools/executor.command.ts run admin "$@"
else
  node dist/tools/executor.command.js run admin "$@"
fi